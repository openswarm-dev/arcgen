import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getSupabaseAdmin, isSupabaseConfigured } from './lib/supabase.js';
import { getProfileByWallet, getPublicProfile, profileStoreMode, upsertProfile } from './lib/profiles.js';
import { getProfileSources } from './lib/sources.js';
import { getWalletBalance, isValidSolanaAddress } from './wallet.js';

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

app.get('/api/profile', async (req, res) => {
  const wallet = req.query.wallet;

  try {
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
  const wallet = req.body?.wallet;
  const displayName = req.body?.displayName;
  const bio = req.body?.bio;
  const handles = req.body?.handles;
  const avatarUrl = req.body?.avatarUrl;
  const bannerUrl = req.body?.bannerUrl;

  if (!isValidSolanaAddress(wallet)) {
    return res.status(400).json({ error: 'Invalid Solana address' });
  }

  try {
    const profile = await upsertProfile({ wallet, displayName, bio, handles, avatarUrl, bannerUrl });
    return res.json(profile);
  } catch (error) {
    console.error('Profile save failed:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Failed to save profile' });
  }
});

app.get('/api/profile/sources', async (req, res) => {
  const wallet = req.query.wallet;

  try {
    if (wallet && !isValidSolanaAddress(wallet)) {
      return res.status(400).json({ error: 'Invalid Solana address' });
    }

    const profile = wallet
      ? await getProfileByWallet(wallet)
      : await getPublicProfile();

    if (!profile) {
      return res.status(404).json({ error: 'No public profile' });
    }

    const sources = await getProfileSources(profile.handles);
    return res.json({ wallet: profile.wallet, sources });
  } catch (error) {
    console.error('Profile sources fetch failed:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Failed to load sources' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
