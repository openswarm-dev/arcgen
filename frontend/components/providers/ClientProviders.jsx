'use client';

import SupabaseProvider from './SupabaseProvider';
import AuthOverlayProvider from './AuthOverlayProvider';
import SolanaWalletProvider from '../wallet/SolanaWalletProvider';
import { LayoutProvider } from '../layout/LayoutContext';

export default function ClientProviders({ children }) {
  return (
    <LayoutProvider>
      <SupabaseProvider>
        <AuthOverlayProvider>
          <SolanaWalletProvider>{children}</SolanaWalletProvider>
        </AuthOverlayProvider>
      </SupabaseProvider>
    </LayoutProvider>
  );
}
