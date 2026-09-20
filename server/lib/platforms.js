const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export const PLATFORMS = [
  {
    id: 'twitch',
    label: 'Twitch',
    placeholder: 'username',
    cta: 'Watch',
  },
  {
    id: 'kick',
    label: 'Kick',
    placeholder: 'username',
    cta: 'Watch',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    placeholder: '@handle',
    cta: 'Play',
  },
  {
    id: 'x',
    label: 'X',
    placeholder: 'username',
    cta: 'Follow',
  },
  {
    id: 'reddit',
    label: 'Reddit',
    placeholder: 'username',
    cta: 'Read',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    placeholder: 'username',
    cta: 'View',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    placeholder: '@handle',
    cta: 'Open',
  },
  {
    id: 'pumpfun',
    label: 'pump.fun',
    placeholder: 'username, wallet, or mint',
    cta: 'Trade',
  },
  {
    id: 'fomo',
    label: 'fomo.family',
    placeholder: 'username',
    cta: 'Track',
  },
];

const PLATFORM_IDS = new Set(PLATFORMS.map(platform => platform.id));

export function isPlatformId(id) {
  return PLATFORM_IDS.has(id);
}

export function looksLikeAddress(value) {
  return typeof value === 'string' && BASE58.test(value);
}

export function normalizeHandle(platformId, raw) {
  if (typeof raw !== 'string') return '';

  let handle = raw.trim();
  if (!handle) return '';

  handle = handle.replace(/^https?:\/\//i, '');
  handle = handle.replace(/^www\./i, '');
  handle = handle.split(/[?#]/)[0];
  handle = handle.replace(/\/+$/, '');

  const prefixes = {
    twitch: [/^twitch\.tv\//i],
    kick: [/^kick\.com\//i],
    youtube: [/^youtube\.com\//i, /^youtu\.be\//i],
    x: [/^x\.com\//i, /^twitter\.com\//i],
    reddit: [/^reddit\.com\//i, /^old\.reddit\.com\//i],
    instagram: [/^instagram\.com\//i],
    tiktok: [/^tiktok\.com\//i],
    pumpfun: [/^pump\.fun\/(?:profile|coin|board)\//i, /^pump\.fun\//i],
    fomo: [/^fomo\.family\//i, /^app\.fomo\.family\//i],
  };

  for (const prefix of prefixes[platformId] || []) {
    handle = handle.replace(prefix, '');
  }

  handle = handle.replace(/^@/, '');

  if (platformId === 'reddit') {
    handle = handle.replace(/^(u|user|r)\//i, '');
  }

  if (platformId === 'youtube') {
    handle = handle.replace(/^(c|channel|user|@)\//i, '');
    handle = handle.replace(/\/(videos|featured|streams|shorts)$/i, '');
  }

  if (platformId === 'tiktok' || platformId === 'instagram') {
    handle = handle.split('/')[0];
  }

  if (platformId === 'x' || platformId === 'twitch' || platformId === 'kick') {
    handle = handle.split('/')[0];
  }

  return handle.trim();
}

export function normalizeHandles(handles = {}) {
  const next = {};

  for (const platform of PLATFORMS) {
    const handle = normalizeHandle(platform.id, handles[platform.id]);
    if (handle) next[platform.id] = handle;
  }

  return next;
}

export function profileUrl(platformId, handle) {
  if (!handle) return null;

  switch (platformId) {
    case 'twitch':
      return `https://www.twitch.tv/${handle}`;
    case 'kick':
      return `https://kick.com/${handle}`;
    case 'youtube':
      return handle.startsWith('UC') && handle.length >= 20
        ? `https://www.youtube.com/channel/${handle}`
        : `https://www.youtube.com/@${handle}`;
    case 'x':
      return `https://x.com/${handle}`;
    case 'reddit':
      return `https://www.reddit.com/user/${handle}`;
    case 'instagram':
      return `https://www.instagram.com/${handle}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${handle}`;
    case 'pumpfun':
      return looksLikeAddress(handle)
        ? `https://pump.fun/coin/${handle}`
        : `https://pump.fun/profile/${handle}`;
    case 'fomo':
      return `https://fomo.family`;
    default:
      return null;
  }
}

export function emptySource(platform, handle = '') {
  return {
    id: platform.id,
    name: platform.label,
    handle: handle || '',
    href: handle ? profileUrl(platform.id, handle) : platformHomepage(platform.id),
    cta: platform.cta,
    status: handle ? 'error' : 'empty',
    description: handle ? `Couldn't load @${handle}` : `Add your ${platform.label} handle`,
    data: null,
  };
}

function platformHomepage(platformId) {
  switch (platformId) {
    case 'twitch':
      return 'https://www.twitch.tv';
    case 'kick':
      return 'https://kick.com';
    case 'youtube':
      return 'https://www.youtube.com';
    case 'x':
      return 'https://x.com';
    case 'reddit':
      return 'https://www.reddit.com';
    case 'instagram':
      return 'https://www.instagram.com';
    case 'tiktok':
      return 'https://www.tiktok.com';
    case 'pumpfun':
      return 'https://pump.fun';
    case 'fomo':
      return 'https://fomo.family';
    default:
      return '#';
  }
}
