'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

import { fetchExploreCreations } from '@/lib/api';
import { truncateAddress } from '@/lib/wallet';
import styles from './ExploreFeed.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function resolveVideoUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_URL}${url}`;
  return url;
}

function aspectClass(aspectRatio) {
  if (aspectRatio === '16:9') return styles.mediaLandscape;
  if (aspectRatio === '4:3') return styles.mediaStandard;
  if (aspectRatio === '3:4') return styles.mediaPortrait;
  if (aspectRatio === '1:1') return styles.mediaSquare;
  return styles.mediaVertical;
}

export default function ExploreFeed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      setError('');

      try {
        const data = await fetchExploreCreations();
        if (active) {
          setItems(data.items || []);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Could not load creations.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Explore</p>
          <h1 className={styles.title}>Fresh clips from creators</h1>
          <p className={styles.subtitle}>
            Every completed generation lands here. Browse viral-ready videos built for X.
          </p>
        </div>
        <Link href="/create" className={styles.createLink}>
          Create your own
        </Link>
      </div>

      {loading ? <p className={styles.state}>Loading creations...</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}

      {!loading && !error && items.length === 0 ? (
        <div className={styles.empty}>
          <p>No clips yet.</p>
          <span>Generate the first viral clip on Create.</span>
          <Link href="/create" className={styles.createLinkInline}>
            Go to Create
          </Link>
        </div>
      ) : null}

      <div className={styles.grid}>
        {items.map(item => {
          const videoUrl = resolveVideoUrl(item.videoUrl);
          return (
            <article key={item.id} className={styles.card}>
              <div className={`${styles.media} ${aspectClass(item.aspectRatio)}`}>
                {videoUrl ? (
                  <video
                    className={styles.video}
                    src={videoUrl}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    onMouseEnter={event => event.currentTarget.play().catch(() => {})}
                    onMouseLeave={event => {
                      event.currentTarget.pause();
                      event.currentTarget.currentTime = 0;
                    }}
                  />
                ) : (
                  <div className={styles.mediaFallback}>Processing</div>
                )}
              </div>

              <div className={styles.cardBody}>
                <p className={styles.prompt}>{item.title || item.prompt}</p>
                <div className={styles.meta}>
                  <Link href={`/profile/${item.wallet}`} className={styles.metaLink}>
                    {truncateAddress(item.wallet, 4)}
                  </Link>
                  <span>{item.aspectRatio}</span>
                  <span>{item.duration}s</span>
                  {item.createdAt ? (
                    <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
