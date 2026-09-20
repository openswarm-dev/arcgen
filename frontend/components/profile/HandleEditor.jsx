'use client';

import { useEffect, useState } from 'react';

import { PROFILE_PLATFORMS } from './platforms';
import styles from './HandleEditor.module.css';

export default function HandleEditor({ profile, saving, error, saved, onSave }) {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [handles, setHandles] = useState({});

  useEffect(() => {
    setDisplayName(profile?.displayName || '');
    setBio(profile?.bio || '');
    setAvatarUrl(profile?.avatarUrl || '');
    setBannerUrl(profile?.bannerUrl || '');
    setHandles(profile?.handles || {});
  }, [profile]);

  const handleSubmit = event => {
    event.preventDefault();
    onSave({
      displayName,
      bio,
      avatarUrl,
      bannerUrl,
      handles: PROFILE_PLATFORMS.reduce((next, platform) => {
        next[platform.id] = handles[platform.id] || '';
        return next;
      }, {}),
    });
  };

  return (
    <section id="accounts" className={`${styles.card} scroll-mt-24`}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Your accounts</h2>
          <p className={styles.subtitle}>Add handles and we’ll pull public content into the boxes below.</p>
        </div>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.identity}>
          <label className={styles.field}>
            <span className={styles.label}>Display name</span>
            <input
              className={styles.input}
              value={displayName}
              onChange={event => setDisplayName(event.target.value)}
              placeholder="F33D"
              maxLength={48}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Bio</span>
            <input
              className={`${styles.input} ${styles.textarea}`}
              value={bio}
              onChange={event => setBio(event.target.value)}
              placeholder="Streams, clips, and launches"
              maxLength={240}
            />
          </label>
        </div>

        <div className={styles.identity}>
          <label className={styles.field}>
            <span className={styles.label}>Profile picture URL</span>
            <input
              className={styles.input}
              value={avatarUrl.startsWith('data:') ? '' : avatarUrl}
              onChange={event => setAvatarUrl(event.target.value)}
              placeholder="https://… or use the photo on the banner"
              autoComplete="off"
              spellCheck="false"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Banner URL</span>
            <input
              className={styles.input}
              value={bannerUrl.startsWith('data:') ? '' : bannerUrl}
              onChange={event => setBannerUrl(event.target.value)}
              placeholder="https://… or click the banner to upload"
              autoComplete="off"
              spellCheck="false"
            />
          </label>
        </div>

        <div className={styles.grid}>
          {PROFILE_PLATFORMS.map(platform => (
            <label key={platform.id} className={styles.field}>
              <span className={styles.label}>{platform.label}</span>
              <input
                className={styles.input}
                value={handles[platform.id] || ''}
                onChange={event =>
                  setHandles(current => ({
                    ...current,
                    [platform.id]: event.target.value,
                  }))
                }
                placeholder={platform.placeholder}
                autoComplete="off"
                spellCheck="false"
              />
            </label>
          ))}
        </div>

        <div className={styles.footer}>
          <button type="submit" className={styles.save} disabled={saving}>
            {saving ? 'Saving...' : 'Save handles'}
          </button>
          {error ? <span className={`${styles.status} ${styles.error}`}>{error}</span> : null}
          {saved && !error ? <span className={styles.status}>Saved</span> : null}
        </div>
      </form>
    </section>
  );
}
