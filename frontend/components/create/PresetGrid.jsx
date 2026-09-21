'use client';

import { TRENDING_PRESETS } from './trendingPresets';
import styles from './PresetGrid.module.css';

export default function PresetGrid({ onSelect }) {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Create</p>
          <h1 className={styles.title}>Pick a preset</h1>
        </div>
      </div>

      <div className={styles.grid}>
        {TRENDING_PRESETS.map(preset => (
          <button
            key={preset.id}
            type="button"
            className={styles.tile}
            onClick={() => onSelect(preset)}
          >
            <div className={styles.media} style={{ background: preset.accent }}>
              <div className={styles.mediaGlow} aria-hidden="true" />
              <div className={styles.mediaGrain} aria-hidden="true" />

              {preset.trending ? <span className={styles.trendingBadge}>Trending</span> : null}

              <span className={styles.playBadge} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5.14v13.72L19 12 8 5.14z" />
                </svg>
              </span>

              <div className={styles.glassPanel}>
                <h2 className={styles.tileTitle}>{preset.title}</h2>
                <p className={styles.tileDescription}>{preset.description}</p>
              </div>
            </div>
          </button>
        ))}

        <button type="button" className={`${styles.tile} ${styles.scratchTile}`} onClick={() => onSelect(null)}>
          <div className={styles.scratchMedia}>
            <div className={styles.scratchGlow} aria-hidden="true" />
            <span className={styles.scratchIcon}>+</span>

            <div className={styles.glassPanel}>
              <h2 className={styles.tileTitle}>Start from scratch</h2>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
