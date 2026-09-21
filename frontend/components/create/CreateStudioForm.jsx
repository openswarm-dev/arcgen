'use client';

import { useRef } from 'react';

import styles from './CreateStudioForm.module.css';

const STYLE_PRESETS = [
  { id: 'hook', label: 'Hook' },
  { id: 'hot-take', label: 'Hot take' },
  { id: 'story', label: 'Story' },
  { id: 'showcase', label: 'Showcase' },
];

const ASPECT_RATIOS = ['9:16', '3:4', '1:1', '4:3', '16:9'];
const DURATIONS = [5, 8, 10, 15, 20];

function UploadSlot({ label, preview, previewType = 'image', emptyLabel, accept, onSelect, onClear }) {
  const inputRef = useRef(null);

  return (
    <div className={styles.uploadSection}>
      <div className={styles.sectionHeading}>{label}</div>
      {preview ? (
        <div className={styles.uploadFilled}>
          <button type="button" className={styles.uploadThumb} onClick={() => inputRef.current?.click()}>
            {previewType === 'video' ? (
              <video src={preview} className={styles.uploadPreview} muted playsInline />
            ) : (
              <img src={preview} alt="" className={styles.uploadPreview} />
            )}
          </button>
          <div className={styles.uploadMeta}>
            <button type="button" className={styles.changeButton} onClick={() => inputRef.current?.click()}>
              Change
            </button>
            <button type="button" className={styles.clearButton} onClick={onClear}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className={styles.uploadZone} onClick={() => inputRef.current?.click()}>
          <span className={styles.uploadIcon}>+</span>
          <span className={styles.uploadLabel}>{emptyLabel}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className={styles.fileInput}
        onChange={event => {
          const file = event.target.files?.[0];
          if (file) onSelect(file);
          event.target.value = '';
        }}
      />
    </div>
  );
}

export default function CreateStudioForm({
  preset = null,
  inputMode = 'simple',
  styleId,
  onStyleChange,
  aspectRatio,
  onAspectRatioChange,
  duration,
  onDurationChange,
  referenceVideoPreview,
  onReferenceVideoSelect,
  onReferenceVideoClear,
  characterPreview,
  onCharacterSelect,
  onCharacterClear,
  characterPreviewA,
  onCharacterASelect,
  onCharacterAClear,
  characterPreviewB,
  onCharacterBSelect,
  onCharacterBClear,
}) {
  const isSwap = inputMode === 'swap';

  return (
    <div className={styles.form}>
      {isSwap ? (
        <>
          <UploadSlot
            label="Reference video"
            preview={referenceVideoPreview}
            previewType="video"
            emptyLabel="Upload reference clip"
            accept="video/mp4,video/quicktime"
            onSelect={onReferenceVideoSelect}
            onClear={onReferenceVideoClear}
          />
          <UploadSlot
            label="Person A"
            preview={characterPreviewA}
            emptyLabel="Upload photo"
            accept="image/jpeg,image/png,image/webp"
            onSelect={onCharacterASelect}
            onClear={onCharacterAClear}
          />
          <UploadSlot
            label="Person B"
            preview={characterPreviewB}
            emptyLabel="Upload photo"
            accept="image/jpeg,image/png,image/webp"
            onSelect={onCharacterBSelect}
            onClear={onCharacterBClear}
          />
        </>
      ) : (
        <UploadSlot
          label={preset ? 'Your character' : 'Character'}
          preview={characterPreview}
          emptyLabel="Upload photo"
          accept="image/jpeg,image/png,image/webp"
          onSelect={onCharacterSelect}
          onClear={onCharacterClear}
        />
      )}

      {!preset ? (
        <div className={styles.controlSection}>
          <div className={styles.sectionHeading}>Style</div>
          <div className={styles.optionRow}>
            {STYLE_PRESETS.map(item => (
              <button
                key={item.id}
                type="button"
                className={`${styles.option} ${styleId === item.id ? styles.optionActive : ''}`}
                onClick={() => onStyleChange(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {!isSwap ? (
        <>
          <div className={styles.controlSection}>
            <div className={styles.sectionHeading}>Aspect ratio</div>
            <div className={styles.optionRow}>
              {ASPECT_RATIOS.map(value => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.option} ${aspectRatio === value ? styles.optionActive : ''}`}
                  onClick={() => onAspectRatioChange(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.controlSection}>
            <div className={styles.sectionHeading}>Duration</div>
            <div className={styles.optionRow}>
              {DURATIONS.map(value => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.option} ${duration === value ? styles.optionActive : ''}`}
                  onClick={() => onDurationChange(value)}
                >
                  {value}s
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export { STYLE_PRESETS };
