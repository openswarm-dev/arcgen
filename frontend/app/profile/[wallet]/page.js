import ProfilePage from '@/components/profile/ProfilePage';

export default async function WalletProfileRoute({ params }) {
  const { wallet } = await params;
  return <ProfilePage walletAddress={wallet} />;
}
