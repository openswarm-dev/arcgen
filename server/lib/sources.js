import { cached, curlJson, curlText, extractOg, fetchJson, fetchText, formatCount, formatRelativeTime } from './http.js';
import { emptySource, looksLikeAddress, PLATFORMS, profileUrl } from './platforms.js';

const SOURCE_TTL_MS = 45_000;
let twitchToken = null;
let twitchTokenExpiresAt = 0;

export async function getProfileSources(handles = {}) {
  const results = await Promise.all(
    PLATFORMS.map(async platform => {
      const handle = handles[platform.id];
      if (!handle) {
        return emptySource(platform);
      }

      try {
        return await cached(`source:${platform.id}:${handle.toLowerCase()}`, SOURCE_TTL_MS, () =>
          fetchSource(platform, handle)
        );
      } catch (error) {
        console.error(`Source fetch failed (${platform.id}/${handle}):`, error.message);
        return emptySource(platform, handle);
      }
    })
  );

  return results;
}

async function fetchSource(platform, handle) {
  switch (platform.id) {
    case 'twitch':
      return fetchTwitch(platform, handle);
    case 'kick':
      return fetchKick(platform, handle);
    case 'youtube':
      return fetchYouTube(platform, handle);
    case 'x':
      return fetchX(platform, handle);
    case 'reddit':
      return fetchReddit(platform, handle);
    case 'instagram':
      return fetchInstagram(platform, handle);
    case 'tiktok':
      return fetchTikTok(platform, handle);
    case 'pumpfun':
      return fetchPumpFun(platform, handle);
    case 'fomo':
      return fetchFomo(platform, handle);
    default:
      return emptySource(platform, handle);
  }
}

function clipText(value, max = 72) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function okSource(platform, handle, { description, data, href, cta }) {
  return {
    id: platform.id,
    name: platform.label,
    handle,
    href: href || profileUrl(platform.id, handle),
    cta: cta || platform.cta,
    status: 'ok',
    description,
    data,
  };
}

async function fetchTwitch(platform, handle) {
  const helix = await fetchTwitchHelix(platform, handle);
  if (helix) return helix;

  const [uptime, title] = await Promise.all([
    fetchText(`https://decapi.me/twitch/uptime/${encodeURIComponent(handle)}`).catch(() => ''),
    fetchText(`https://decapi.me/twitch/title/${encodeURIComponent(handle)}`).catch(() => ''),
  ]);

  const live = Boolean(uptime) && !/offline|not found|404/i.test(uptime);
  const streamTitle = title && !/not found|404|offline/i.test(title) ? clipText(title.trim(), 64) : '';

  return okSource(platform, handle, {
    description: live
      ? `Live${streamTitle ? ` · ${streamTitle}` : ''}`
      : streamTitle
        ? `Offline · ${streamTitle}`
        : `Offline · @${handle}`,
    data: {
      live,
      title: streamTitle || `@${handle}`,
      viewers: live ? uptime : '',
      thumbnail: live
        ? `https://static-cdn.jtvnw.net/previews-ttv/live_user_${handle.toLowerCase()}-640x360.jpg`
        : '',
      videos: [
        {
          id: handle,
          title: streamTitle || `@${handle}`,
          thumbnail: live
            ? `https://static-cdn.jtvnw.net/previews-ttv/live_user_${handle.toLowerCase()}-640x360.jpg`
            : '',
          href: profileUrl('twitch', handle),
          meta: live ? uptime : 'Offline',
          live,
        },
      ],
    },
  });
}

async function fetchTwitchHelix(platform, handle) {
  const token = await getTwitchAppToken();
  if (!token) return null;

  const headers = {
    'Client-ID': process.env.TWITCH_CLIENT_ID,
    Authorization: `Bearer ${token}`,
  };

  const users = await fetchJson(
    `https://api.twitch.tv/helix/users?login=${encodeURIComponent(handle)}`,
    { headers }
  );
  const user = users?.data?.[0];
  if (!user) {
    throw new Error('Twitch user not found');
  }

  const streams = await fetchJson(
    `https://api.twitch.tv/helix/streams?user_id=${encodeURIComponent(user.id)}`,
    { headers }
  );
  const stream = streams?.data?.[0];

  const videos = await fetchJson(
    `https://api.twitch.tv/helix/videos?user_id=${encodeURIComponent(user.id)}&first=8`,
    { headers }
  );
  const vods = (videos?.data || []).map(item => ({
    id: item.id,
    title: item.title,
    thumbnail: (item.thumbnail_url || '').replace('%{width}', '640').replace('%{height}', '360'),
    href: item.url,
    meta: item.view_count ? `${formatCount(item.view_count)} views` : '',
    live: false,
  }));

  if (stream) {
    const liveItem = {
      id: stream.id,
      title: stream.title,
      thumbnail: (stream.thumbnail_url || '').replace('{width}', '640').replace('{height}', '360'),
      href: `https://www.twitch.tv/${handle}`,
      meta: `${formatCount(stream.viewer_count)} watching`,
      live: true,
    };
    return okSource(platform, handle, {
      description: `Live · ${formatCount(stream.viewer_count)} watching`,
      data: {
        live: true,
        title: stream.title,
        viewers: formatCount(stream.viewer_count),
        thumbnail: liveItem.thumbnail,
        videos: [liveItem, ...vods],
      },
    });
  }

  return okSource(platform, handle, {
    description: vods[0] ? `Last VOD · ${vods[0].title}` : `Offline · ${user.display_name}`,
    data: {
      live: false,
      title: vods[0]?.title || user.display_name,
      viewers: '',
      thumbnail: vods[0]?.thumbnail || user.offline_image_url || user.profile_image_url,
      videos: vods,
    },
  });
}

async function getTwitchAppToken() {
  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
    return null;
  }

  if (twitchToken && Date.now() < twitchTokenExpiresAt) {
    return twitchToken;
  }

  const params = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID,
    client_secret: process.env.TWITCH_CLIENT_SECRET,
    grant_type: 'client_credentials',
  });

  const data = await fetchJson(`https://id.twitch.tv/oauth2/token?${params.toString()}`, {
    method: 'POST',
  });

  twitchToken = data.access_token;
  twitchTokenExpiresAt = Date.now() + Math.max(60, (data.expires_in || 3600) - 120) * 1000;
  return twitchToken;
}

async function fetchKick(platform, handle) {
  const channel = await curlJson(`https://kick.com/api/v2/channels/${encodeURIComponent(handle)}`, [
    '-H',
    'Accept: application/json',
  ]);
  const live = channel?.livestream;
  const user = channel?.user || {};
  const thumbnail = live?.thumbnail?.url || live?.thumbnail?.src || user.profile_pic || '';

  let vods = [];
  try {
    const videos = await curlJson(`https://kick.com/api/v2/channels/${encodeURIComponent(handle)}/videos`, [
      '-H',
      'Accept: application/json',
    ]);
    const list = Array.isArray(videos) ? videos : videos?.data || videos?.videos || [];
    vods = list.slice(0, 8).map(item => ({
      id: String(item.id || item.uuid || item.video?.id || `${handle}-${item.session_title || item.title || ''}`),
      title: item.session_title || item.title || item.video?.title || `@${handle}`,
      thumbnail:
        item.thumbnail?.url ||
        item.thumbnail?.src ||
        item.video?.thumbnail?.url ||
        item.livestream?.thumbnail ||
        user.profile_pic ||
        '',
      href: item.video?.uuid
        ? `https://kick.com/${handle}/videos/${item.video.uuid}`
        : profileUrl('kick', handle),
      meta: item.duration ? String(item.duration) : item.views ? `${formatCount(item.views)} views` : '',
      live: false,
    }));
  } catch {
    vods = [];
  }

  if (live) {
    const liveItem = {
      id: String(live.id || handle),
      title: live.session_title || channel.slug,
      thumbnail,
      href: profileUrl('kick', handle),
      meta: `${formatCount(live.viewer_count)} watching`,
      live: true,
    };
    return okSource(platform, handle, {
      description: `Live · ${formatCount(live.viewer_count)} watching`,
      data: {
        live: true,
        title: live.session_title || channel.slug,
        viewers: formatCount(live.viewer_count),
        thumbnail,
        videos: [liveItem, ...vods.filter(item => item.id !== liveItem.id)],
      },
    });
  }

  return okSource(platform, handle, {
    description: `${formatCount(channel.followers_count)} followers · offline`,
    data: {
      live: false,
      title: user.username || handle,
      viewers: '',
      thumbnail: user.profile_pic || '',
      videos: vods.length
        ? vods
        : [
            {
              id: handle,
              title: user.username || handle,
              thumbnail: user.profile_pic || '',
              href: profileUrl('kick', handle),
              meta: `${formatCount(channel.followers_count)} followers`,
              live: false,
            },
          ],
    },
  });
}

async function fetchYouTube(platform, handle) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey) {
    const query = handle.startsWith('UC') ? `id=${encodeURIComponent(handle)}` : `forHandle=${encodeURIComponent(handle)}`;
    const channels = await fetchJson(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&${query}&key=${apiKey}`
    );
    const channel = channels?.items?.[0];
    if (!channel) throw new Error('YouTube channel not found');

    const uploads = channel.contentDetails?.relatedPlaylists?.uploads;
    let videos = [];
    if (uploads) {
      const playlist = await fetchJson(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploads}&maxResults=8&key=${apiKey}`
      );
      videos = (playlist?.items || []).map(item => ({
        id: item.contentDetails?.videoId || item.id,
        title: item.snippet?.title || '',
        thumbnail:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url,
        href: item.contentDetails?.videoId
          ? `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`
          : `https://www.youtube.com/channel/${channel.id}`,
        meta: item.snippet?.publishedAt ? formatRelativeTime(item.snippet.publishedAt) : '',
      }));
    }

    const stats = channel.statistics || {};
    const latest = videos[0];
    return okSource(platform, handle, {
      href: `https://www.youtube.com/channel/${channel.id}`,
      description: latest
        ? `Latest · ${formatCount(stats.subscriberCount)} subs`
        : `${formatCount(stats.subscriberCount)} subscribers`,
      data: {
        title: latest?.title || channel.snippet?.title,
        thumbnail: latest?.thumbnail || channel.snippet?.thumbnails?.high?.url,
        duration: '',
        views: formatCount(stats.viewCount),
        videos,
      },
    });
  }

  const html = await fetchText(profileUrl('youtube', handle));
  const og = extractOg(html);
  const channelId = html.match(/"channelId":"(UC[^"]+)"/)?.[1];
  const videos = channelId
    ? parseYouTubeRss(
        await fetchText(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`).catch(() => '')
      )
    : [];
  const video = videos[0];

  return okSource(platform, handle, {
    href: channelId ? `https://www.youtube.com/channel/${channelId}` : profileUrl('youtube', handle),
    description: video?.title ? `Latest · ${video.title}` : og.title || `@${handle}`,
    data: {
      title: video?.title || og.title || `@${handle}`,
      thumbnail: video?.thumbnail || og.image,
      duration: '',
      views: '',
      videos,
    },
  });
}

function parseYouTubeRss(xml) {
  if (!xml) return [];

  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, 8).map(match => {
    const entry = match[1];
    const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] || '';
    return {
      id: videoId,
      title: decodeXml(entry.match(/<title>([^<]+)<\/title>/)?.[1] || ''),
      thumbnail: entry.match(/<media:thumbnail[^>]+url="([^"]+)"/)?.[1] || '',
      href: videoId ? `https://www.youtube.com/watch?v=${videoId}` : entry.match(/<link rel="alternate" href="([^"]+)"/)?.[1] || '',
      meta: formatRelativeTime(entry.match(/<published>([^<]+)<\/published>/)?.[1]),
    };
  });
}

function decodeXml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}

async function fetchX(platform, handle) {
  const statuses = await fetchJson(
    `https://api.fxtwitter.com/2/profile/${encodeURIComponent(handle)}/statuses?count=8`
  ).catch(() => null);

  const profile = await fetchJson(`https://api.fxtwitter.com/${encodeURIComponent(handle)}`).catch(() => null);
  const user = profile?.user || statuses?.results?.[0]?.author || {};
  const tweets = (statuses?.results || [])
    .filter(item => item?.text || item?.content)
    .slice(0, 6)
    .map(item => ({
      id: item.id || item.rest_id,
      text: item.text || item.content || '',
      time: formatRelativeTime(item.created_at || item.createdAt),
      likes: formatCount(item.likes || item.like_count || item.favorite_count || 0),
      href: item.id ? `https://x.com/${handle}/status/${item.id}` : `https://x.com/${handle}`,
    }));

  if (!user?.screen_name && tweets.length === 0) {
    throw new Error('X profile not found');
  }

  return okSource(platform, handle, {
    description: user?.followers
      ? `${formatCount(user.followers)} followers`
      : tweets[0]?.text
        ? tweets[0].text.slice(0, 72)
        : `@${handle}`,
    data: {
      name: user.name || handle,
      tweets,
    },
  });
}

async function fetchReddit(platform, handle) {
  const headers = { 'User-Agent': 'F33D-profile/1.0' };
  const about = await fetchJson(`https://www.reddit.com/user/${encodeURIComponent(handle)}/about.json`, { headers });
  const listing = await fetchJson(
    `https://www.reddit.com/user/${encodeURIComponent(handle)}/submitted.json?limit=8`,
    { headers }
  );

  const karma = (about?.data?.total_karma ?? about?.data?.link_karma) || 0;
  const posts = (listing?.data?.children || []).slice(0, 6).map(child => ({
    sub: child.data?.subreddit_name_prefixed || 'reddit',
    title: child.data?.title || '',
    votes: formatCount(child.data?.score || 0),
  }));

  return okSource(platform, handle, {
    description: `${formatCount(karma)} karma · ${posts.length} recent posts`,
    data: { posts },
  });
}

async function fetchInstagram(platform, handle) {
  const html = await curlText(profileUrl('instagram', handle));
  const og = extractOg(html);
  const images = [...html.matchAll(/"display_url":"([^"]+)"/g)]
    .map(match => match[1].replaceAll('\\u0026', '&'))
    .slice(0, 6);

  const titleTag = html.match(/<title>([^<]+)<\/title>/i)?.[1] || '';
  const title = og.title || titleTag.replace(/\s*[|·-]\s*Instagram.*$/i, '').trim() || `@${handle}`;

  return okSource(platform, handle, {
    description: images.length ? `${images.length} recent posts` : `@${handle} on Instagram`,
    data: {
      title,
      images,
    },
  });
}

async function fetchTikTok(platform, handle) {
  const html = await curlText(profileUrl('tiktok', handle));
  const og = extractOg(html);

  const titleTag = html.match(/<title>([^<]+)<\/title>/i)?.[1] || '';
  const title = og.title?.replace(/[|·].*$/, '').trim() || `@${handle}`;

  return okSource(platform, handle, {
    description: og.description?.slice(0, 80) || `@${handle} on TikTok`,
    data: {
      title: title === 'TikTok - Make Your Day' ? `@${handle}` : title || `@${handle}`,
      caption: og.description?.slice(0, 80) || titleTag,
      thumbnail: og.image,
    },
  });
}

async function fetchPumpFun(platform, handle) {
  const headers = { Origin: 'https://pump.fun', Referer: 'https://pump.fun/' };
  let coin = null;
  let coins = [];

  if (looksLikeAddress(handle)) {
    coin = await fetchJson(`https://frontend-api-v3.pump.fun/coins/${encodeURIComponent(handle)}`, {
      headers,
    }).catch(() => null);

    if (!coin) {
      coins = await fetchJson(
        `https://frontend-api-v3.pump.fun/coins/user-created-coins/${encodeURIComponent(handle)}?offset=0&limit=5&includeNsfw=false`,
        { headers }
      ).catch(() => []);
      if (Array.isArray(coins) && coins.length) coin = coins[0];
    }
  }

  if (!coin) {
    const user = await fetchJson(`https://frontend-api-v3.pump.fun/users/${encodeURIComponent(handle)}`, {
      headers,
    }).catch(() => null);

    const address = user?.address || user?.id;
    if (address) {
      coins = await fetchJson(
        `https://frontend-api-v3.pump.fun/coins/user-created-coins/${encodeURIComponent(address)}?offset=0&limit=5&includeNsfw=false`,
        { headers }
      ).catch(() => []);
      if (Array.isArray(coins) && coins.length) coin = coins[0];
    }
  }

  if (!coin) {
    const search = await fetchJson(
      `https://frontend-api-v3.pump.fun/coins?offset=0&limit=5&sort=last_trade_timestamp&order=DESC&includeNsfw=false&searchTerm=${encodeURIComponent(handle)}`,
      { headers }
    ).catch(() => null);
    const list = Array.isArray(search) ? search : search?.data || search?.coins || [];
    const needle = handle.toLowerCase();
    coin =
      list.find(item =>
        [item.username, item.symbol, item.name].some(value => String(value || '').toLowerCase() === needle)
      ) || null;
  }

  if (!coin) {
    throw new Error('pump.fun profile not found');
  }

  const dex = coin.mint
    ? await fetchJson(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(coin.mint)}`).catch(
        () => null
      )
    : null;
  const pair = dex?.pairs?.[0];
  const change24h = pair?.priceChange?.h24;
  const marketCap = coin.usd_market_cap || pair?.marketCap || coin.market_cap;

  return okSource(platform, handle, {
    href: coin.mint ? `https://pump.fun/coin/${coin.mint}` : profileUrl('pumpfun', handle),
    description: `$${coin.symbol || handle} · MC ${formatUsdCompact(marketCap)}`,
    data: {
      name: coin.name || handle,
      symbol: coin.symbol || '',
      holders: coin.holder_count ? formatCount(coin.holder_count) : '',
      marketCap: formatUsdCompact(marketCap),
      change: typeof change24h === 'number' ? `${change24h > 0 ? '+' : ''}${change24h.toFixed(1)}%` : '',
      complete: Boolean(coin.complete),
      bonding: coin.complete ? 'Bonded' : '',
    },
  });
}

function formatUsdCompact(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return '—';
  if (number < 1000) return `$${number.toFixed(0)}`;
  if (number < 1_000_000) return `$${(number / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `$${(number / 1_000_000).toFixed(2).replace(/\.00$/, '')}M`;
}

async function fetchFomo(platform, handle) {
  const headers = process.env.FOMO_API_KEY ? { 'x-api-key': process.env.FOMO_API_KEY } : {};

  try {
    const user = await fetchJson(`https://api.fomoapi.io/v2/users/${encodeURIComponent(handle)}`, { headers });
    const tradesPayload = await fetchJson(
      `https://api.fomoapi.io/v2/users/${encodeURIComponent(handle)}/trades?limit=6`,
      { headers }
    ).catch(() => null);

    const trades = (tradesPayload?.trades || tradesPayload?.data || [])
      .slice(0, 6)
      .map(trade => {
        const pnl = Number(trade.realizedPnlUsd ?? trade.unrealizedPnlUsd ?? trade.pnlUsd ?? 0);
        const positive = pnl >= 0;
        return {
          action: trade.status === 'open' ? 'Holding' : 'Closed',
          token: trade.token?.symbol || trade.symbol || 'TOKEN',
          pnl: Number.isFinite(pnl) ? `${positive ? '+' : '-'}${formatUsdCompact(Math.abs(pnl)).replace('$', '')}` : '—',
          time: formatRelativeTime(trade.closedAt || trade.createdAt || trade.timestamp),
        };
      });

    const pnl = user?.pnlUsd ?? user?.pnl?.all;
    return okSource(platform, handle, {
      description:
        typeof pnl === 'number'
          ? `${pnl >= 0 ? '+' : '-'}${formatUsdCompact(Math.abs(pnl)).replace('$', '')} PnL · ${formatCount(user.trades || trades.length)} trades`
          : `@${handle} on fomo`,
      data: {
        name: user.displayName || user.handle || handle,
        trades,
      },
    });
  } catch (error) {
    if (error.status === 401) {
      return {
        ...emptySource(platform, handle),
        description: `Add FOMO_API_KEY to load @${handle}`,
      };
    }
    throw error;
  }
}
