import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getSupabaseAdmin, isSupabaseConfigured } from './lib/supabase.js';
import { getWalletBalance, isValidSolanaAddress } from './wallet.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  const health = {
    status: 'ok',
    message: 'Server is running',
    supabase: {
      configured: isSupabaseConfigured(),
      connected: false,
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
