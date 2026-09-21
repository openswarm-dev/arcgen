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
  ensureWalletProfile,
  upsertProfile,
} from './lib/profiles.js';
import { getProfileSources } from './lib/sources.js';
import { getWalletBalance, isValidSolanaAddress } from './wallet.js';
import { startKeepalive } from './lib/keepalive.js';
import {
  createCreation,
  creationStoreMode,
  getCreationById,
  listExploreCreations,
  listWalletCreations,
  readLocalCreationVideo,
  readLocalCreationReference,
  readLocalCreationReferenceVideo,
  readLocalCreationReferenceImage,
} from './lib/creations.js';
import { isDashScopeConfigured } from './lib/dashscope.js';
import { isOpenRouterConfigured } from './lib/openrouter.js';
import { queueCreationGeneration } from './lib/generationWorker.js';
import { readPresetReferenceVideo } from './lib/presets.js';
import { getPublicApiBase, isLocalhostUrl } from './lib/publicUrl.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '110mb' }));

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
    openrouter: {
      configured: isOpenRouterConfigured(),
    },
    dashscope: {
      configured: isDashScopeConfigured(),
    },
    creations: {
      store: creationStoreMode(),
    },
    publicApi: {
      base: getPublicApiBase(),
      localhost: isLocalhostUrl(getPublicApiBase()),
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

app.post('/api/profile/wallet', async (req, res) => {
  try {
    const wallet = req.body?.wallet;
    if (!isValidSolanaAddress(wallet)) {
      return res.status(400).json({ error: 'Invalid Solana address' });
    }

    const profile = await ensureWalletProfile(wallet);
    return res.json(profile);
  } catch (error) {
    console.error('Wallet profile ensure failed:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Failed to create profile' });
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

app.post('/api/creations', async (req, res) => {
  try {
    if (!isOpenRouterConfigured() && !isDashScopeConfigured()) {
      return res.status(503).json({ error: 'Video generation is not configured yet' });
    }

    const inputMode = req.body?.inputMode || 'simple';
    if (inputMode === 'swap' && !isDashScopeConfigured()) {
      return res.status(503).json({
        error: 'Character swap requires DashScope. Add DASHSCOPE_API_KEY on the server.',
      });
    }
    if (inputMode !== 'swap' && !isOpenRouterConfigured()) {
      return res.status(503).json({ error: 'Video generation is not configured yet' });
    }

    const creation = await createCreation({
      wallet: req.body?.wallet,
      prompt: req.body?.prompt,
      title: req.body?.title,
      duration: req.body?.duration,
      resolution: req.body?.resolution,
      aspectRatio: req.body?.aspectRatio,
      model: req.body?.model,
      inputMode,
      characterImage: req.body?.characterImage,
      characterImageA: req.body?.characterImageA,
      characterImageB: req.body?.characterImageB,
      referenceVideo: req.body?.referenceVideo,
      presetId: req.body?.presetId,
    });

    queueCreationGeneration(creation.id);
    return res.status(202).json(creation);
  } catch (error) {
    console.error('Create generation failed:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Could not start generation' });
  }
});

app.get('/api/creations', async (req, res) => {
  try {
    const scope = req.query.scope || 'explore';
    const limit = Math.min(Number(req.query.limit) || 24, 48);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    if (scope === 'mine') {
      const wallet = req.query.wallet;
      if (!isValidSolanaAddress(wallet)) {
        return res.status(400).json({ error: 'Connect your wallet to view your creations' });
      }

      const items = await listWalletCreations(wallet, { limit });
      return res.json({ items });
    }

    const items = await listExploreCreations({ limit, offset });
    return res.json({ items });
  } catch (error) {
    console.error('List creations failed:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Failed to load creations' });
  }
});

app.get('/api/creations/:id', async (req, res) => {
  try {
    const creation = await getCreationById(req.params.id);
    if (!creation) {
      return res.status(404).json({ error: 'Creation not found' });
    }

    return res.json(creation);
  } catch (error) {
    console.error('Get creation failed:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Failed to load creation' });
  }
});

app.get('/api/creations/:id/video', async (req, res) => {
  try {
    const creation = await getCreationById(req.params.id);
    if (!creation?.videoUrl) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (!creation.videoUrl.startsWith('/api/creations/')) {
      return res.redirect(creation.videoUrl);
    }

    const buffer = await readLocalCreationVideo(req.params.id);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(buffer);
  } catch (error) {
    console.error('Serve creation video failed:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Failed to load video' });
  }
});

app.get('/api/creations/:id/reference/video', async (req, res) => {
  try {
    const { buffer, contentType } = await readLocalCreationReferenceVideo(req.params.id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(buffer);
  } catch (error) {
    console.error('Serve creation reference video failed:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Failed to load reference video' });
  }
});

app.get('/api/creations/:id/reference/image/:index', async (req, res) => {
  try {
    const index = Math.max(Number(req.params.index) || 1, 1);
    const { buffer, contentType } = await readLocalCreationReferenceImage(req.params.id, index);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(buffer);
  } catch (error) {
    console.error('Serve creation reference image failed:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Failed to load reference image' });
  }
});

app.get('/api/creations/:id/reference', async (req, res) => {
  try {
    const { buffer, contentType } = await readLocalCreationReference(req.params.id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(buffer);
  } catch (error) {
    console.error('Serve creation reference failed:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Failed to load reference image' });
  }
});

app.get('/api/presets/:id/reference', async (req, res) => {
  try {
    const { buffer, contentType } = await readPresetReferenceVideo(req.params.id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(buffer);
  } catch (error) {
    console.error('Serve preset reference failed:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Failed to load preset reference' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Public API base: ${getPublicApiBase()}`);

  if (process.env.RENDER && isLocalhostUrl(getPublicApiBase())) {
    console.warn('Public API base is localhost on Render. OpenRouter cannot fetch reference media.');
  }

  if (process.env.RENDER) {
    startKeepalive();
  }
});
