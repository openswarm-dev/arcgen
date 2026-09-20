'use client';

import SupabaseProvider from './SupabaseProvider';
import SolanaWalletProvider from '../wallet/SolanaWalletProvider';
import { LayoutProvider } from '../layout/LayoutContext';

export default function ClientProviders({ children }) {
  return (
    <LayoutProvider>
      <SupabaseProvider>
        <SolanaWalletProvider>{children}</SolanaWalletProvider>
      </SupabaseProvider>
    </LayoutProvider>
  );
}
