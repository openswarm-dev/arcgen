export function getSourceItems(source) {
  const data = source?.data || {};

  if (Array.isArray(data.videos) && data.videos.length) {
    return data.videos.map((item, index) => ({
      id: item.id || `${source.id}-video-${index}`,
      title: item.title,
      thumbnail: item.thumbnail,
      href: item.href || source.href,
      meta: item.meta,
      live: item.live,
    }));
  }

  if (Array.isArray(data.tweets) && data.tweets.length) {
    return data.tweets.map((item, index) => ({
      id: item.id || `${source.id}-tweet-${index}`,
      title: item.text,
      href: item.href || source.href,
      meta: [item.time, item.likes ? `${item.likes} likes` : ''].filter(Boolean).join(' · '),
    }));
  }

  if (Array.isArray(data.posts) && data.posts.length) {
    return data.posts.map((item, index) => ({
      id: `${source.id}-post-${index}`,
      title: item.title,
      subtitle: item.sub,
      href: source.href,
      meta: item.votes ? `${item.votes} upvotes` : '',
    }));
  }

  if (Array.isArray(data.images) && data.images.length) {
    return data.images.map((image, index) => ({
      id: `${source.id}-image-${index}`,
      title: source.handle ? `@${source.handle}` : source.name,
      thumbnail: image,
      href: source.href,
    }));
  }

  if (Array.isArray(data.trades) && data.trades.length) {
    return data.trades.map((item, index) => ({
      id: `${source.id}-trade-${index}`,
      title: `${item.action} $${item.token}`,
      meta: item.time,
      subtitle: item.pnl,
      href: source.href,
    }));
  }

  if (source.id === 'pumpfun' && (data.symbol || data.name)) {
    return [
      {
        id: data.symbol || source.handle,
        title: `$${data.symbol || source.handle}`,
        subtitle: data.name,
        meta: [data.marketCap ? `MC ${data.marketCap}` : '', data.change, data.bonding].filter(Boolean).join(' · '),
        href: source.href,
      },
    ];
  }

  if (source.id === 'tiktok') {
    return [
      {
        id: source.handle,
        title: data.title || `@${source.handle}`,
        subtitle: data.caption,
        thumbnail: data.thumbnail,
        href: source.href,
      },
    ];
  }

  if (data.title) {
    return [
      {
        id: source.id,
        title: data.title,
        thumbnail: data.thumbnail,
        href: source.href,
        meta: data.viewers || data.views,
        live: data.live,
      },
    ];
  }

  return [];
}
