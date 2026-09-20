import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getSupabaseAdmin, isSupabaseConfigured } from './lib/supabase.js';
import { getUserFromRequest, issueVerificationPin, registerWithEmail, verifyEmailPin } from './lib/auth.js';
import {
  getProfileByUserId,
  getProfileByWallet,
  getPublicProfile,
  profileStoreMode,
  upsertProfile,
} from './lib/profiles.js';
import { getProfileSources } from './lib/sources.js';
import { getWalletBalance, isValidSolanaAddress } from './wallet.js';
import { startKeepalive } from './lib/keepalive.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '6mb' }));

app.get('/api/health', async (_req, res) => {
  const health = {
    status: 'ok',
    message: 'Server is running',
    supabase: {
      configured: isSupabaseConfigured(),
      connected: false,
    },
    profiles: {
      store: profileStoreMode(),
    },
    resend: {
      configured: Boolean(process.env.RESEND_API_KEY),
    },
  };

  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      const { error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
      health.supabase.connected = !error;
      if (error) {
        health.supabase.error = error.message;
      }
    } catch (error) {
      health.supabase.error = error.message;
    }
  }

  res.json(health);
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const result = await registerWithEmail({
      email: req.body?.email,
      password: req.body?.password,
      displayName: req.body?.displayName,
    });
    return res.json(result);
  } catch (error) {
    console.error('Register failed:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Could not create account' });
  }
});

app.post('/api/auth/send-pin', async (req, res) => {
  try {
    const result = await issueVerificationPin(req.body?.email, req.body?.purpose || 'signin');
    return res.json(result);
  } catch (error) {
    console.error('Send pin failed:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Could not send code' });
  }
});

app.post('/api/auth/verify-pin', async (req, res) => {
  try {
    const result = await verifyEmailPin({
      email: req.body?.email,
      pin: req.body?.pin,
    });
    return res.json(result);
  } catch (error) {
    console.error('Verify pin failed:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Could not verify code' });
  }
});

app.get('/api/wallet/balance', async (req, res) => {
  const address = req.query.address;

  if (!isValidSolanaAddress(address)) {
    return res.status(400).json({ error: 'Invalid Solana address' });
  }

  if (!process.env.HELIUS_RPC_URL) {
    return res.status(500).json({ error: 'Helius RPC is not configured' });
  }

  try {
    const balance = await getWalletBalance(address);
    return res.json(balance);
  } catch (error) {
    console.error('Balance fetch failed:', error);
    return res.status(502).json({ error: 'Failed to fetch wallet balance' });
  }
});

app.get('/api/profile/me', async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Sign in to continue' });
    }

    const profile = await getProfileByUserId(user.id);
    return res.json(profile);
  } catch (error) {
    console.error('Profile me failed:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Failed to load profile' });
  }
});

app.get('/api/profile', async (req, res) => {
  const wallet = req.query.wallet;
  const userId = req.query.userId;

  try {
    if (userId) {
      return res.json(await getProfileByUserId(userId));
    }

    if (!wallet) {
      const profile = await getPublicProfile();
      if (!profile) {
        return res.status(404).json({ error: 'No public profile' });
      }
      return res.json(profile);
    }

    if (!isValidSolanaAddress(wallet)) {
      return res.status(400).json({ error: 'Invalid Solana address' });
    }

    const profile = await getProfileByWallet(wallet);
    return res.json(profile);
  } catch (error) {
    console.error('Profile fetch failed:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Failed to load profile' });
  }
});

app.put('/api/profile', async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Sign in to continue' });
    }

    const profile = await upsertProfile({
      userId: user.id,
      wallet: req.body?.wallet,
      displayName: req.body?.displayName,
      bio: req.body?.bio,
      handles: req.body?.handles,
      avatarUrl: req.body?.avatarUrl,
      bannerUrl: req.body?.bannerUrl,
    });
    return res.json(profile);
  } catch (error) {
    console.error('Profile save failed:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Failed to save profile' });
  }
});

app.get('/api/profile/sources', async (req, res) => {
  const wallet = req.query.wallet;
  const userId = req.query.userId;

  try {
    if (wallet && !isValidSolanaAddress(wallet)) {
      return res.status(400).json({ error: 'Invalid Solana address' });
    }

    const profile = userId
      ? await getProfileByUserId(userId)
      : wallet
        ? await getProfileByWallet(wallet)
        : await getPublicProfile();

    if (!profile) {
      return res.status(404).json({ error: 'No public profile' });
    }

    const sources = await getProfileSources(profile.handles);
    return res.json({ id: profile.id, wallet: profile.wallet, sources });
  } catch (error) {
    console.error('Profile sources fetch failed:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Failed to load sources' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  if (process.env.RENDER) {
    startKeepalive();
  }
});
