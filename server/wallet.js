const LAMPORTS_PER_SOL = 1_000_000_000;
const BASE58_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

let cachedSolPrice = null;
let cachedSolPriceAt = 0;
const PRICE_TTL_MS = 60_000;

async function heliusRpc(method, params) {
  const url = process.env.HELIUS_RPC_URL;
  if (!url) {
    throw new Error('HELIUS_RPC_URL is not configured');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `Helius RPC failed (${response.status})`);
  }

  return data.result;
}

async function getSolPriceUsd() {
  const now = Date.now();
  if (cachedSolPrice && now - cachedSolPriceAt < PRICE_TTL_MS) {
    return cachedSolPrice;
  }

  const response = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
    { headers: { Accept: 'application/json' } }
  );

  if (!response.ok) {
    throw new Error(`Price fetch failed (${response.status})`);
  }

  const data = await response.json();
  const price = data?.solana?.usd;
  if (typeof price !== 'number') {
    throw new Error('Invalid SOL price response');
  }

  cachedSolPrice = price;
  cachedSolPriceAt = now;
  return price;
}

export function isValidSolanaAddress(address) {
  return typeof address === 'string' && BASE58_ADDRESS.test(address);
}

export async function getWalletBalance(address) {
  const result = await heliusRpc('getBalance', [address]);
  const lamports = typeof result === 'number' ? result : result?.value ?? 0;
  const sol = lamports / LAMPORTS_PER_SOL;

  let usdValue = null;
  let solPriceUsd = null;

  try {
    solPriceUsd = await getSolPriceUsd();
    usdValue = sol * solPriceUsd;
  } catch {
    // Balance still useful without USD quote
  }

  return {
    address,
    lamports,
    sol,
    solFormatted: formatSol(sol),
    usdValue,
    usdFormatted: usdValue == null ? null : formatUsd(usdValue),
    solPriceUsd,
  };
}

function formatSol(sol) {
  if (sol === 0) return '0 SOL';
  if (sol < 0.0001) return '<0.0001 SOL';
  if (sol < 1) return `${sol.toFixed(4)} SOL`;
  if (sol < 100) return `${sol.toFixed(3)} SOL`;
  return `${sol.toFixed(2)} SOL`;
}

function formatUsd(usd) {
  if (usd < 0.01) return '<$0.01';
  if (usd < 1000) return `$${usd.toFixed(2)}`;
  return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
