'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';

import ProfilePage from '@/components/profile/ProfilePage';
import { useClientMounted } from '@/lib/useClientMounted';

export default function MyProfileRoute() {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const mounted = useClientMounted();
  const wallet = mounted && connected && publicKey ? publicKey.toBase58() : '';

  useEffect(() => {
    if (wallet) {
      router.replace(`/profile/${wallet}`);
    }
  }, [wallet, router]);

  if (!mounted || wallet) {
    return null;
  }

  return <ProfilePage />;
}
