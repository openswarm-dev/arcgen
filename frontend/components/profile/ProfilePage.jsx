'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { fetchProfile, fetchProfileSources, saveProfile } from '@/lib/api';
import { fileToDataUrl } from '@/lib/image';
import { useLayout } from '@/components/layout/LayoutContext';
import { useAuthOverlay } from '@/components/providers/AuthOverlayProvider';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import styles from '@/components/layout/AppShell.module.css';
import HandleEditor from './HandleEditor';
import ProfileHeader from './ProfileHeader';
import ProfileSources from './ProfileSources';
import SourceFeed from './SourceFeed';
import profileStyles from './ProfilePage.module.css';

export default function ProfilePage({ walletAddress } = {}) {
  const { user, session, isLoading: authLoading } = useSupabase();
  const { openAuth } = useAuthOverlay();
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

  const isOwner = Boolean(user && profile?.id && user.id === profile.id);
  const viewWallet = profile?.wallet || walletAddress || '';

  const loadSources = useCallback(async query => {
    setSourcesLoading(true);
    try {
      const data = await fetchProfileSources(query);
      setSources(data.sources || []);
    } catch {
      setSources([]);
    } finally {
      setSourcesLoading(false);
    }
  }, []);

  const loadProfile = useCallback(
    async query => {
      setLoading(true);
      setError('');
      try {
        const nextProfile = await fetchProfile(query);
        setProfile(nextProfile);
        await loadSources(
          nextProfile?.id
            ? { userId: nextProfile.id }
            : nextProfile?.wallet
              ? { wallet: nextProfile.wallet }
              : query
        );
      } catch (loadError) {
        setError(loadError.message || 'Could not load profile');
        if (query?.wallet || query?.me) {
          setProfile({
            id: query.userId || null,
            wallet: query.wallet || '',
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
      loadProfile({ wallet: walletAddress });
      return undefined;
    }

    if (authLoading) {
      return undefined;
    }

    if (user && session?.access_token) {
      loadProfile({ me: true, accessToken: session.access_token });
      return undefined;
    }

    loadProfile();
    return undefined;
  }, [walletAddress, user, session, authLoading, loadProfile]);

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
    if (!user || !isOwner || !session?.access_token) return;

    setSaving(true);
    setSaved(false);
    setError('');

    try {
      const nextProfile = await saveProfile(payload, session.access_token);
      setProfile(nextProfile);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
      await loadSources({ userId: nextProfile.id || user.id });
    } catch (saveError) {
      setError(saveError.message || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImageFile = async (kind, file) => {
    if (!user || !isOwner || !profile) return;

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
              <p>Log in to create your profile and attach social handles.</p>
              <button type="button" className={profileStyles.loginButton} onClick={() => openAuth('signup')}>
                Create account
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
