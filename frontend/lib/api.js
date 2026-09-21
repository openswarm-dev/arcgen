const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function api(path, options = {}) {
  const { accessToken, ...rest } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...rest.headers,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }

  return response.json();
}

export async function fetchWalletBalance(address) {
  return api(`/api/wallet/balance?address=${encodeURIComponent(address)}`);
}

export async function createVideoCreation(payload) {
  return api('/api/creations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchCreation(id) {
  return api(`/api/creations/${encodeURIComponent(id)}`);
}

export async function fetchExploreCreations({ limit = 24, offset = 0 } = {}) {
  const params = new URLSearchParams({ scope: 'explore', limit: String(limit), offset: String(offset) });
  return api(`/api/creations?${params}`);
}

export async function fetchMyCreations(wallet, { limit = 12 } = {}) {
  const params = new URLSearchParams({
    scope: 'mine',
    wallet,
    limit: String(limit),
  });
  return api(`/api/creations?${params}`);
}

export async function registerAccount({ email, password, displayName }) {
  return api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  });
}

export async function sendAuthPin({ email, purpose }) {
  return api('/api/auth/send-pin', {
    method: 'POST',
    body: JSON.stringify({ email, purpose }),
  });
}

export async function verifyAuthPin({ email, pin }) {
  return api('/api/auth/verify-pin', {
    method: 'POST',
    body: JSON.stringify({ email, pin }),
  });
}
