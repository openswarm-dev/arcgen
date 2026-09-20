'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useWallet } from '@solana/wallet-adapter-react';

import { fetchProfile, fetchProfileSources, saveProfile } from '@/lib/api';
import { fileToDataUrl } from '@/lib/image';
import { useLayout } from '@/components/layout/LayoutContext';
import styles from '@/components/layout/AppShell.module.css';
import HandleEditor from './HandleEditor';
import ProfileHeader from './ProfileHeader';
import ProfileSources from './ProfileSources';
import SourceFeed from './SourceFeed';
import profileStyles from './ProfilePage.module.css';

export default function ProfilePage({ walletAddress } = {}) {
  const { connected, publicKey } = useWallet();
  const sessionWallet = connected && publicKey ? publicKey.toBase58() : null;
  const { minimizeSidebar, restoreSidebar } = useLayout();

  const [profile, setProfile] = useState(null);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const mainRef = useRef(null);

  const isOwner = Boolean(sessionWallet && profile?.wallet && sessionWallet === profile.wallet);
  const viewWallet = profile?.wallet || walletAddress || sessionWallet;

  const loadSources = useCallback(async address => {
    setSourcesLoading(true);
    try {
      const data = await fetchProfileSources(address);
      setSources(data.sources || []);
    } catch {
      setSources([]);
    } finally {
      setSourcesLoading(false);
    }
  }, []);

  const loadProfile = useCallback(
    async address => {
      setLoading(true);
      setError('');
      try {
        const nextProfile = await fetchProfile(address);
        setProfile(nextProfile);
        await loadSources(nextProfile?.wallet || address);
      } catch (loadError) {
        setError(loadError.message || 'Could not load profile');
        if (address) {
          setProfile({
            wallet: address,
            displayName: '',
            bio: '',
            avatarUrl: '',
            bannerUrl: '',
            handles: {},
          });
        } else {
          setProfile(null);
        }
        setSources([]);
      } finally {
        setLoading(false);
      }
    },
    [loadSources]
  );

  useEffect(() => {
    setExpanded(null);

    if (walletAddress) {
      loadProfile(walletAddress);
      return undefined;
    }

    if (sessionWallet) {
      loadProfile(sessionWallet);
      return undefined;
    }

    loadProfile();
    return undefined;
  }, [walletAddress, sessionWallet, loadProfile]);

  useEffect(() => {
    if (!expanded) return undefined;

    const onKeyDown = event => {
      if (event.key === 'Escape') {
        setExpanded(null);
        restoreSidebar();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [expanded, restoreSidebar]);

  const handleSave = async payload => {
    if (!sessionWallet || !isOwner) return;

    setSaving(true);
    setSaved(false);
    setError('');

    try {
      const nextProfile = await saveProfile({ wallet: sessionWallet, ...payload });
      setProfile(nextProfile);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
      await loadSources(sessionWallet);
    } catch (saveError) {
      setError(saveError.message || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImageFile = async (kind, file) => {
    if (!sessionWallet || !isOwner || !profile) return;

    try {
      const dataUrl = await fileToDataUrl(file, kind);
      await handleSave({
        displayName: profile.displayName,
        bio: profile.bio,
        handles: profile.handles,
        avatarUrl: kind === 'avatar' ? dataUrl : profile.avatarUrl,
        bannerUrl: kind === 'banner' ? dataUrl : profile.bannerUrl,
      });
    } catch (uploadError) {
      setError(uploadError.message || 'Could not update image');
    }
  };

  const openSource = source => {
    if (!source?.handle) return;
    setExpanded(source);
    minimizeSidebar();
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeSource = () => {
    setExpanded(null);
    restoreSidebar();
  };

  const showProfile = Boolean(profile) || loading;

  return (
    <section className={`${styles.pageSection} ${styles.pageSectionFill}`}>
      <div className={profileStyles.layout}>
        <ProfileHeader
          profile={profile}
          wallet={viewWallet}
          loading={loading}
          isOwner={isOwner}
          canEdit={isOwner}
          onAvatarFile={file => handleImageFile('avatar', file)}
          onBannerFile={file => handleImageFile('banner', file)}
        />

        <div className={profileStyles.main} ref={mainRef}>
          {showProfile ? (
            <AnimatePresence mode="wait">
              {expanded ? (
                <motion.div
                  key={`feed-${expanded.id}`}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                >
                  <SourceFeed source={expanded} onBack={closeSource} />
                </motion.div>
              ) : (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                  {isOwner ? (
                    <HandleEditor
                      profile={profile}
                      saving={saving}
                      error={error}
                      saved={saved}
                      onSave={handleSave}
                    />
                  ) : null}
                  <ProfileSources
                    sources={sources}
                    loading={sourcesLoading || loading}
                    onOpen={openSource}
                    connectedOnly={!isOwner}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <div className={profileStyles.empty}>
              Connect a wallet in the header to create your profile and attach social handles.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
