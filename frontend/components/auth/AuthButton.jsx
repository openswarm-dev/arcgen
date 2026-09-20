'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { useAuthOverlay } from '@/components/providers/AuthOverlayProvider';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import styles from './AuthButton.module.css';

function useClickOutside(ref, handler, active) {
  useEffect(() => {
    if (!active) return undefined;

    const onPointerDown = event => {
      if (ref.current && !ref.current.contains(event.target)) {
        handler();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [ref, handler, active]);
}

function labelForUser(user) {
  const metadataName = user?.user_metadata?.display_name;
  if (metadataName) return metadataName;
  const email = user?.email || '';
  return email.split('@')[0] || 'Account';
}

export default function AuthButton({ variant = 'navbar' }) {
  const rootRef = useRef(null);
  const { user, supabase, isLoading } = useSupabase();
  const { openAuth } = useAuthOverlay();
  const [menuOpen, setMenuOpen] = useState(false);

  useClickOutside(rootRef, () => setMenuOpen(false), menuOpen);

  const handleSignOut = useCallback(async () => {
    setMenuOpen(false);
    await supabase?.auth.signOut();
  }, [supabase]);

  const rootClass = `${styles.root} ${variant === 'menu' ? styles.menuVariant : ''}`;

  if (!user) {
    return (
      <div className={rootClass}>
        <button
          type="button"
          className={styles.connectButton}
          onClick={() => openAuth('signin')}
          disabled={isLoading}
        >
          Log in
        </button>
      </div>
    );
  }

  const label = labelForUser(user);
  const initial = label.trim().charAt(0).toUpperCase();

  return (
    <div ref={rootRef} className={rootClass}>
      <button
        type="button"
        className={`${styles.trigger} ${styles.triggerConnected}`}
        onClick={() => setMenuOpen(open => !open)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
      >
        <span className={styles.avatar}>{initial}</span>
        <span className={styles.label}>{label}</span>
        <svg viewBox="0 0 20 20" fill="currentColor" className={`${styles.chevron} ${menuOpen ? styles.chevronOpen : ''}`} aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
        </svg>
      </button>

      {menuOpen ? (
        <div className={styles.menu} role="menu">
          <div className={styles.menuHeader}>
            <div className={styles.menuTitle}>Account</div>
            <div className={styles.email}>{user.email}</div>
          </div>
          <div className={styles.menuBody}>
            <Link href="/profile" className={styles.menuItem} onClick={() => setMenuOpen(false)}>
              Profile
            </Link>
            <button type="button" className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={handleSignOut}>
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
