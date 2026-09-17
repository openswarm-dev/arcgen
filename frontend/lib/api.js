const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchWalletBalance(address) {
  const response = await fetch(
    `${API_URL}/api/wallet/balance?address=${encodeURIComponent(address)}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch balance');
  }

  return response.json();
}
