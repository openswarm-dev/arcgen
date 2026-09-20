'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthButton from '../auth/AuthButton';
import BrandLogo from '../brand/BrandLogo';
import MobileMenu from './MobileMenu';
import { MenuIcon, SearchIcon } from './icons';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.bar} />
        <div className={styles.border} />

        <div className={styles.inner}>
          <nav className={styles.nav}>
            <Link href="/" className={styles.mobileLogo} aria-label="F33D - home">
              <BrandLogo className={styles.mobileLogoMark} />
            </Link>

            <div className={styles.searchWrap}>
              <div className={styles.searchBox}>
                <span className={styles.searchIconWrap}>
                  <SearchIcon className={styles.searchIcon} />
                </span>
                <input
                  type="text"
                  role="combobox"
                  aria-label="Search query"
                  aria-expanded="false"
                  autoComplete="off"
                  spellCheck="false"
                  placeholder="Search"
                  className={styles.searchInput}
                />
              </div>
            </div>

            <div className={styles.actions}>
              <Link href="/launch" className={styles.primaryButton}>
                Launch
              </Link>
              <div className={styles.authSlot}>
                <AuthButton />
              </div>
              <button
                type="button"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                aria-controls="site-header-mobile-menu"
                className={styles.iconButton}
                onClick={() => setMenuOpen(open => !open)}
              >
                <MenuIcon className={styles.menuIcon} />
              </button>
            </div>
          </nav>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
