export function truncateAddress(address, chars = 4) {
  if (!address || address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

function getExtensionProvider(adapterName) {
  if (typeof window === 'undefined') return null;

  if (adapterName === 'Phantom') {
    return window.phantom?.solana || window.solana || null;
  }

  if (adapterName === 'Solflare') {
    return window.solflare || null;
  }

  return null;
}

export async function disconnectExtensionProvider(adapterName) {
  const provider = getExtensionProvider(adapterName);
  if (!provider?.isConnected) return;

  try {
    await provider.disconnect();
  } catch {
    // Extension may already be disconnected
  }
}

export async function disconnectAllExtensionProviders() {
  if (typeof window === 'undefined') return;

  const providers = [window.phantom?.solana, window.solana, window.solflare].filter(Boolean);

  await Promise.all(
    providers.map(async provider => {
      if (!provider.isConnected) return;

      try {
        await provider.disconnect();
      } catch {
        // ignore per-provider failures
      }
    })
  );
}

export async function prepareWalletConnect(adapter) {
  if (!adapter) return;

  // Phantom skips wallet.connect() if the extension session is still active.
  await disconnectExtensionProvider(adapter.name);
}

export function clearStoredWalletSelection(storageKey = 'walletName') {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // ignore storage errors
  }
}
