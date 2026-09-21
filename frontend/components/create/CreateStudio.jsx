'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { formatDistanceToNow } from 'date-fns';

import { createVideoCreation, fetchCreation } from '@/lib/api';
import { truncateAddress } from '@/lib/wallet';
import { useClientMounted } from '@/lib/useClientMounted';
import CreateStudioForm from './CreateStudioForm';
import styles from './CreateStudio.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const DEFAULT_RESOLUTION = '720p';
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const STYLE_PREFIXES = {
  hook: 'Scroll-stopping social clip for X. Open with an immediate hook. ',
  'hot-take': 'Bold creator hot take for X. High energy, punchy pacing, confident delivery. ',
  story: 'Short cinematic story beat for X creators. Clear setup, tension, payoff. ',
  showcase: 'Premium creator showcase clip for X. Clean motion, aspirational lighting, product-forward. ',
};

function resolveVideoUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_URL}${url}`;
  return url;
}

function previewAspectClass(aspectRatio) {
  switch (aspectRatio) {
    case '9:16':
      return styles.previewVertical;
    case '3:4':
      return styles.previewPortrait;
    case '4:3':
      return styles.previewStandard;
    case '1:1':
      return styles.previewSquare;
    default:
      return styles.previewLandscape;
  }
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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

export default function CreateStudio({ preset = null, onBack }) {
  const { publicKey, connected } = useWallet();
  const mounted = useClientMounted();
  const wallet = mounted && connected && publicKey ? publicKey.toBase58() : '';

  const inputMode = preset?.inputMode || 'simple';
  const isSwap = inputMode === 'swap';

  const [styleId, setStyleId] = useState(preset?.styleId || 'hook');
  const [aspectRatio, setAspectRatio] = useState(preset?.aspectRatio || '9:16');
  const [duration, setDuration] = useState(preset?.duration || 5);
  const [referenceVideoPreview, setReferenceVideoPreview] = useState('');
  const [referenceVideo, setReferenceVideo] = useState('');
  const [characterPreview, setCharacterPreview] = useState('');
  const [characterImage, setCharacterImage] = useState('');
  const [characterPreviewA, setCharacterPreviewA] = useState('');
  const [characterImageA, setCharacterImageA] = useState('');
  const [characterPreviewB, setCharacterPreviewB] = useState('');
  const [characterImageB, setCharacterImageB] = useState('');
  const [creation, setCreation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const finalPrompt = useMemo(() => {
    if (preset?.basePrompt) {
      return preset.basePrompt;
    }

    const characterNote = 'Use the uploaded person as the main character, matching their appearance.';
    return `${STYLE_PREFIXES[styleId] || STYLE_PREFIXES.hook}${characterNote}`;
  }, [preset, styleId]);

  const isGenerating = creation && (creation.status === 'queued' || creation.status === 'processing');
  const videoUrl = resolveVideoUrl(creation?.videoUrl);
  const showPresetBackdrop = Boolean(preset && !videoUrl);

  const handleImageSelect = async (file, { setPreview, setData, maxBytes = MAX_IMAGE_BYTES, invalidMessage }) => {
    if (!file.type.startsWith('image/')) {
      setError(invalidMessage || 'Upload a JPG, PNG, or WebP image.');
      return;
    }

    if (file.size > maxBytes) {
      setError(`Image must be under ${Math.round(maxBytes / (1024 * 1024))} MB.`);
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPreview(dataUrl);
      setData(dataUrl);
      setError('');
    } catch {
      setError('Could not read image.');
    }
  };

  const handleReferenceVideoSelect = async file => {
    if (!file.type.startsWith('video/')) {
      setError('Upload an MP4 or MOV video.');
      return;
    }

    if (file.size > MAX_VIDEO_BYTES) {
      setError('Video must be under 100 MB.');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setReferenceVideoPreview(dataUrl);
      setReferenceVideo(dataUrl);
      setError('');
    } catch {
      setError('Could not read video.');
    }
  };

  const handleGenerate = async () => {
    if (!wallet) {
      setError('Connect your wallet to generate.');
      return;
    }

    if (isSwap) {
      if (!referenceVideo || !characterImageA || !characterImageB) {
        setError('Upload the reference video and both character photos.');
        return;
      }
    } else if (!characterImage) {
      setError('Upload a character photo.');
      return;
    }

    setSubmitting(true);
    setError('');
    setCreation(null);

    try {
      const next = await createVideoCreation({
        wallet,
        prompt: finalPrompt,
        inputMode,
        characterImage: isSwap ? undefined : characterImage,
        characterImageA: isSwap ? characterImageA : undefined,
        characterImageB: isSwap ? characterImageB : undefined,
        referenceVideo: isSwap ? referenceVideo : undefined,
        aspectRatio,
        duration,
        resolution: DEFAULT_RESOLUTION,
        title: preset?.title,
      });
      setCreation(next);
    } catch (submitError) {
      setError(submitError.message || 'Could not start generation.');
    } finally {
      setSubmitting(false);
    }
  };

  const pollCreation = useCallback(async () => {
    if (!creation?.id) return;
    if (creation.status === 'completed' || creation.status === 'failed') return;

    try {
      const next = await fetchCreation(creation.id);
      setCreation(next);
    } catch {
      // Keep polling on transient failures.
    }
  }, [creation?.id, creation?.status]);

  useEffect(() => {
    if (!creation?.id || creation.status === 'completed' || creation.status === 'failed') {
      return undefined;
    }

    pollCreation();
    const interval = window.setInterval(pollCreation, 4000);
    return () => window.clearInterval(interval);
  }, [creation?.id, creation?.status, pollCreation]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          {onBack ? (
            <button type="button" className={styles.backButton} onClick={onBack}>
              ← Back
            </button>
          ) : null}
          <p className={styles.eyebrow}>{preset ? 'Preset' : 'Create'}</p>
          <h1 className={styles.title}>{preset ? preset.title : 'Generate a clip'}</h1>
        </div>
        {wallet ? (
          <div className={styles.walletPill}>{truncateAddress(wallet, 5)}</div>
        ) : (
          <div className={styles.walletPillMuted}>Wallet not connected</div>
        )}
      </div>

      <div className={styles.layout}>
        <section className={styles.panel}>
          <CreateStudioForm
            preset={preset}
            inputMode={inputMode}
            styleId={styleId}
            onStyleChange={setStyleId}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            duration={duration}
            onDurationChange={setDuration}
            referenceVideoPreview={referenceVideoPreview}
            onReferenceVideoSelect={handleReferenceVideoSelect}
            onReferenceVideoClear={() => {
              setReferenceVideoPreview('');
              setReferenceVideo('');
            }}
            characterPreview={characterPreview}
            onCharacterSelect={file =>
              handleImageSelect(file, {
                setPreview: setCharacterPreview,
                setData: setCharacterImage,
              })
            }
            onCharacterClear={() => {
              setCharacterPreview('');
              setCharacterImage('');
            }}
            characterPreviewA={characterPreviewA}
            onCharacterASelect={file =>
              handleImageSelect(file, {
                setPreview: setCharacterPreviewA,
                setData: setCharacterImageA,
              })
            }
            onCharacterAClear={() => {
              setCharacterPreviewA('');
              setCharacterImageA('');
            }}
            characterPreviewB={characterPreviewB}
            onCharacterBSelect={file =>
              handleImageSelect(file, {
                setPreview: setCharacterPreviewB,
                setData: setCharacterImageB,
              })
            }
            onCharacterBClear={() => {
              setCharacterPreviewB('');
              setCharacterImageB('');
            }}
          />

          {error ? <p className={styles.error}>{error}</p> : null}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.generateButton}
              disabled={submitting || isGenerating || !wallet}
              onClick={handleGenerate}
            >
              {submitting ? 'Starting...' : isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </section>

        <aside className={styles.outputPanel}>
          <div
            className={styles.outputStage}
            style={showPresetBackdrop ? { background: preset.accent } : undefined}
          >
            {showPresetBackdrop ? (
              <>
                <div className={styles.outputGlow} aria-hidden="true" />
                <div className={styles.outputGrain} aria-hidden="true" />
              </>
            ) : null}

            <div className={`${styles.outputMedia} ${previewAspectClass(aspectRatio)}`}>
              {videoUrl ? (
                <video className={styles.previewVideo} src={videoUrl} controls playsInline preload="metadata" />
              ) : (
                <div className={styles.outputEmpty}>
                  {isGenerating ? (
                    <>
                      <div className={styles.loader} aria-hidden="true" />
                      <p className={styles.outputEmptyTitle}>Generating</p>
                    </>
                  ) : creation?.status === 'failed' ? (
                    <>
                      <p className={styles.outputEmptyTitle}>Failed</p>
                      <span className={styles.outputEmptyText}>
                        {creation.errorMessage || 'Try again.'}
                      </span>
                    </>
                  ) : preset ? (
                    <span className={styles.outputPlayBadge} aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5.14v13.72L19 12 8 5.14z" />
                      </svg>
                    </span>
                  ) : (
                    <p className={styles.outputEmptyTitle}>Preview</p>
                  )}
                </div>
              )}
            </div>

            <div className={styles.outputGlass}>
              <div className={styles.outputGlassHeader}>
                <div>
                  <p className={styles.outputEyebrow}>Output</p>
                  <h2 className={styles.outputTitle}>{preset ? preset.title : 'Your clip'}</h2>
                </div>
                {creation ? <span className={styles.statusBadge}>{statusLabel(creation.status)}</span> : null}
              </div>

              {creation ? (
                <div className={styles.metaBlock}>
                  {creation.createdAt ? (
                    <p className={styles.metaTime}>
                      {formatDistanceToNow(new Date(creation.createdAt), { addSuffix: true })}
                    </p>
                  ) : null}
                  {creation.status === 'completed' ? (
                    <Link href="/explore" className={styles.exploreLink}>
                      View on Explore
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
