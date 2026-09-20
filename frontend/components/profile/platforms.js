export const PROFILE_PLATFORMS = [
  { id: 'twitch', label: 'Twitch', placeholder: 'username' },
  { id: 'kick', label: 'Kick', placeholder: 'username' },
  { id: 'youtube', label: 'YouTube', placeholder: '@handle' },
  { id: 'tiktok', label: 'TikTok', placeholder: '@handle' },
  { id: 'x', label: 'X', placeholder: 'username' },
  { id: 'instagram', label: 'Instagram', placeholder: 'username' },
  { id: 'reddit', label: 'Reddit', placeholder: 'username' },
  { id: 'pumpfun', label: 'pump.fun', placeholder: 'username, wallet, or mint' },
  { id: 'fomo', label: 'fomo.family', placeholder: 'username' }
];

export const SOURCE_LAYOUT = {
  twitch: 'col-span-3 lg:col-span-2',
  kick: 'col-span-3 lg:col-span-1',
  youtube: 'col-span-3 lg:col-span-2',
  tiktok: 'col-span-3 lg:col-span-1',
  x: 'col-span-3 lg:col-span-1',
  instagram: 'col-span-3 lg:col-span-1',
  reddit: 'col-span-3 lg:col-span-1',
  pumpfun: 'col-span-3 lg:col-span-2',
  fomo: 'col-span-3 lg:col-span-1'
};

export function sourceAnchorId(id) {
  return `source-${id}`;
}

const FEED_BENTO_PATTERN = ['col-span-3 lg:col-span-2', 'col-span-3 lg:col-span-1', 'col-span-3 lg:col-span-1'];

export function feedCardLayout(sourceId, index, total = 0) {
  if (total === 1) {
    return 'col-span-3';
  }

  if (sourceId === 'tiktok' || sourceId === 'instagram') {
    return 'col-span-3 lg:col-span-1';
  }

  return FEED_BENTO_PATTERN[index % FEED_BENTO_PATTERN.length];
}
