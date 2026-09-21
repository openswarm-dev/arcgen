'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ConnectWallet from '../wallet/ConnectWallet';
import BrandLogo from '../brand/BrandLogo';
import { SearchIcon } from './icons';
import { isNavItemActive, NAV_ITEMS } from './navItems';
import styles from './MobileMenu.module.css';

export default function MobileMenu({ open, onClose }) {
  const pathname = usePathname();

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
            <BrandLogo className={styles.brandMark} />
            <span className={styles.brandText}>
              <span className={styles.brandName}>F33D</span>
              <span className={styles.brandHandle}>@f33d</span>
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
              const active = isNavItemActive(item.href, pathname);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                    onClick={onClose}
                  >
                    <Icon className={styles.navIcon} />
                    <span className={`${styles.navLabel} ${active ? styles.navLabelActive : ''}`}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={styles.footer}>
          <ConnectWallet variant="menu" />
        </div>
      </aside>
    </>
  );
}
