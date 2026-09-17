'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import ConnectWallet from '../wallet/ConnectWallet';
import { LogoIcon, SearchIcon } from './icons';
import { NAV_ITEMS } from './navItems';
import styles from './MobileMenu.module.css';

export default function MobileMenu({ open, onClose }) {
  const { connected, publicKey } = useWallet();
  const isConnected = connected && Boolean(publicKey);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.classList.add('menuOpen');
    document.body.style.overflow = 'hidden';

    const onKeyDown = event => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.classList.remove('menuOpen');
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  return (
    <>
      <div
        role="presentation"
        className={`${styles.backdrop} ${open ? styles.backdropOpen : ''}`}
        onClick={onClose}
      />

      <aside
        id="site-header-mobile-menu"
        aria-hidden={!open}
        {...(!open ? { inert: true } : {})}
        className={`${styles.panel} ${open ? styles.panelOpen : ''}`}
      >
        <div className={styles.header}>
          <Link href="/" className={styles.brand} onClick={onClose}>
            <span className={styles.brandMark}>J</span>
            <span className={styles.brandText}>
              <span className={styles.brandName}>jowenrat</span>
              <span className={styles.brandHandle}>@jowenrat</span>
            </span>
          </Link>
          <button type="button" aria-label="Close menu" className={styles.closeButton} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className={styles.closeIcon} aria-hidden="true">
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className={styles.searchBox}>
          <span className={styles.searchIconWrap}>
            <SearchIcon className={styles.searchIcon} />
          </span>
          <input
            type="search"
            aria-label="Search query"
            autoComplete="off"
            spellCheck="false"
            placeholder="Search"
            className={styles.searchInput}
          />
        </div>

        <nav aria-label="Mobile primary">
          <ul className={styles.navList}>
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={item.active ? 'page' : undefined}
                    className={`${styles.navLink} ${item.active ? styles.navLinkActive : ''}`}
                    onClick={onClose}
                  >
                    <Icon className={styles.navIcon} />
                    <span className={`${styles.navLabel} ${item.active ? styles.navLabelActive : ''}`}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={styles.footer}>
          {!isConnected ? <ConnectWallet variant="menu" /> : null}
          <a
            href="https://x.com"
            target="_blank"
            rel="noreferrer"
            className={styles.accountLink}
            onClick={onClose}
          >
            <span className={styles.accountAvatar}>J</span>
            <span className={styles.accountMeta}>
              <div className={styles.accountName}>jowenrat</div>
              <div className={styles.accountHandle}>@jowenrat</div>
            </span>
            <LogoIcon className={styles.closeIcon} />
          </a>
        </div>
      </aside>
    </>
  );
}
