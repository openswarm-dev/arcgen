const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
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

export async function fetchProfile(wallet) {
  const query = wallet ? `?wallet=${encodeURIComponent(wallet)}` : '';
  return api(`/api/profile${query}`);
}

export async function saveProfile(payload) {
  return api('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function fetchProfileSources(wallet) {
  const query = wallet ? `?wallet=${encodeURIComponent(wallet)}` : '';
  return api(`/api/profile/sources${query}`);
}
