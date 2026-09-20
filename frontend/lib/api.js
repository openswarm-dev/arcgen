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

export async function fetchProfile(query = {}) {
  if (query.me && query.accessToken) {
    return api('/api/profile/me', { accessToken: query.accessToken });
  }

  const params = new URLSearchParams();
  if (query.wallet) params.set('wallet', query.wallet);
  if (query.userId) params.set('userId', query.userId);
  const suffix = params.toString() ? `?${params}` : '';
  return api(`/api/profile${suffix}`);
}

export async function saveProfile(payload, accessToken) {
  return api('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
    accessToken,
  });
}

export async function fetchProfileSources(query = {}) {
  const params = new URLSearchParams();
  if (query.wallet) params.set('wallet', query.wallet);
  if (query.userId) params.set('userId', query.userId);
  const suffix = params.toString() ? `?${params}` : '';
  return api(`/api/profile/sources${suffix}`);
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
