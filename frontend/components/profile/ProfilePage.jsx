'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

import { fetchMyCreations, fetchProfileByWallet } from '@/lib/api';
import { truncateAddress } from '@/lib/wallet';
import shellStyles from '@/components/layout/AppShell.module.css';
import exploreStyles from '@/components/explore/ExploreFeed.module.css';
import styles from './ProfilePage.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function resolveVideoUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_URL}${url}`;
  return url;
}

function aspectClass(aspectRatio) {
  if (aspectRatio === '16:9') return exploreStyles.mediaLandscape;
  if (aspectRatio === '4:3') return exploreStyles.mediaStandard;
  if (aspectRatio === '3:4') return exploreStyles.mediaPortrait;
  if (aspectRatio === '1:1') return exploreStyles.mediaSquare;
  return exploreStyles.mediaVertical;
}

function statusLabel(status) {
  switch (status) {
    case 'queued':
      return 'Queued';
    case 'processing':
      return 'Generating';
    case 'completed':
      return 'Ready';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
}

export default function ProfilePage({ walletAddress = '' }) {
  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(walletAddress));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!walletAddress) {
      setLoading(false);
      return undefined;
    }

    let active = true;

    (async () => {
      setLoading(true);
      setError('');

      try {
        const [nextProfile, creations] = await Promise.all([
          fetchProfileByWallet(walletAddress),
          fetchMyCreations(walletAddress, { limit: 24 }),
        ]);

        if (!active) return;
        setProfile(nextProfile);
        setItems(creations.items || []);
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Could not load profile.');
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
  }, [walletAddress]);

  return (
    <div className={`${shellStyles.pageSection} ${shellStyles.pageSectionWide}`}>
      <div className={styles.page}>
        {!walletAddress ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>Connect your wallet</p>
            <p className={styles.emptyCopy}>Your profile and generated clips show up here once your wallet is connected.</p>
            <Link href="/create" className={styles.createLink}>
              Go to Create
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.header}>
              <div>
                <p className={styles.eyebrow}>Profile</p>
                <h1 className={styles.title}>{profile?.displayName || truncateAddress(walletAddress, 5)}</h1>
                <p className={styles.subtitle}>{truncateAddress(walletAddress, 8)}</p>
              </div>
              <Link href="/create" className={styles.createLink}>
                Create clip
              </Link>
            </div>

            {loading ? <p className={styles.state}>Loading profile...</p> : null}
            {error ? <p className={styles.error}>{error}</p> : null}

            {!loading && !error && items.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>No clips yet</p>
                <p className={styles.emptyCopy}>Generate your first clip and it will show up here.</p>
                <Link href="/create" className={styles.createLink}>
                  Start creating
                </Link>
              </div>
            ) : null}

            <div className={exploreStyles.grid}>
              {items.map(item => {
                const videoUrl = resolveVideoUrl(item.videoUrl);
                return (
                  <article key={item.id} className={exploreStyles.card}>
                    <div className={`${exploreStyles.media} ${aspectClass(item.aspectRatio)}`}>
                      {videoUrl ? (
                        <video
                          className={exploreStyles.video}
                          src={videoUrl}
                          controls
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <div className={exploreStyles.mediaFallback}>{statusLabel(item.status)}</div>
                      )}
                    </div>

                    <div className={exploreStyles.cardBody}>
                      <p className={exploreStyles.prompt}>{item.title || item.prompt}</p>
                      <div className={exploreStyles.meta}>
                        <span>{statusLabel(item.status)}</span>
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
          </>
        )}
      </div>
    </div>
  );
}
