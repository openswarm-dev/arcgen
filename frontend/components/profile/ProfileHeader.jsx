'use client';

import { useRef } from 'react';

import { truncateAddress } from '@/lib/wallet';
import { PROFILE_PLATFORMS, sourceAnchorId } from './platforms';
import styles from './ProfileHeader.module.css';

export default function ProfileHeader({
  profile,
  wallet,
  loading,
  isOwner = false,
  canEdit,
  onAvatarFile,
  onBannerFile,
}) {
  const avatarRef = useRef(null);
  const bannerRef = useRef(null);
  const connectedCount = profile ? PROFILE_PLATFORMS.filter(platform => profile.handles?.[platform.id]).length : 0;
  const initial = (profile?.displayName || 'F').trim().charAt(0).toUpperCase();

  return (
    <aside className={styles.rail}>
      <div className={styles.banner}>
        {profile?.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.bannerUrl} alt="" className={styles.bannerImage} />
        ) : null}
        {canEdit ? (
          <button type="button" className={styles.bannerButton} onClick={() => bannerRef.current?.click()}>
            <span className={styles.changeLabel}>Change banner</span>
          </button>
        ) : null}
        <input
          ref={bannerRef}
          className={styles.hiddenInput}
          type="file"
          accept="image/*"
          onChange={event => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) onBannerFile(file);
          }}
        />
      </div>

      <div className={styles.overlay}>
        <div className={styles.avatarWrap}>
          {canEdit ? (
            <button type="button" className={styles.avatarButton} onClick={() => avatarRef.current?.click()} aria-label="Change profile picture">
              {profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="" className={styles.avatarImage} />
              ) : (
                <span>{wallet ? initial : 'F'}</span>
              )}
              <span className={styles.changeLabel}>Edit</span>
            </button>
          ) : (
            <span className={styles.avatar}>
              {profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="" className={styles.avatarImage} />
              ) : (
                wallet ? initial : 'F'
              )}
            </span>
          )}
          <input
            ref={avatarRef}
            className={styles.hiddenInput}
            type="file"
            accept="image/*"
            onChange={event => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) onAvatarFile(file);
            }}
          />
        </div>

        <div className={styles.identity}>
          <h1 className={styles.name}>{profile?.displayName || (isOwner ? 'Your profile' : 'Profile')}</h1>
          <p className={styles.handle}>
            {profile?.displayName
              ? `@${String(profile.displayName).replace(/\s+/g, '').toLowerCase()}`
              : wallet
                ? truncateAddress(wallet, 4)
                : isOwner
                  ? 'Your public profile'
                  : ''}
          </p>
          {profile?.bio ? (
            <p className={styles.bio}>{profile.bio}</p>
          ) : isOwner ? (
            <p className={`${styles.bio} text-muted-foreground`}>
              Save Kick, Twitch, YouTube, X, Reddit, Instagram, TikTok, pump.fun, and fomo.family accounts, then we pull
              public content into the grid.
            </p>
          ) : null}

          {connectedCount > 0 ? (
            <div className={styles.pills}>
              {PROFILE_PLATFORMS.filter(platform => profile?.handles?.[platform.id]).map(platform => (
                <a
                  key={platform.id}
                  href={`#${sourceAnchorId(platform.id)}`}
                  className={styles.pill}
                  onClick={event => {
                    const node = document.getElementById(sourceAnchorId(platform.id));
                    if (!node) return;
                    event.preventDefault();
                    node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }}
                >
                  {platform.label}
                </a>
              ))}
            </div>
          ) : null}

          <div className={styles.meta}>
            <span>{connectedCount} connected</span>
            {loading ? <span>Loading...</span> : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
