import ProfilePage from '@/components/profile/ProfilePage';

export const metadata = {
  title: 'Profile · jowenrat',
  description: 'Streams, clips, and launches from Kick, Twitch, YouTube, X, Reddit, Instagram, pump.fun, TikTok, and fomo.family.'
};

export default async function Page({ params }) {
  const { wallet } = await params;
  return <ProfilePage walletAddress={wallet} />;
}
