'use client';

import SupabaseProvider from './SupabaseProvider';
import SolanaWalletProvider from '../wallet/SolanaWalletProvider';

export default function ClientProviders({ children }) {
  return (
    <SupabaseProvider>
      <SolanaWalletProvider>{children}</SolanaWalletProvider>
    </SupabaseProvider>
  );
}
