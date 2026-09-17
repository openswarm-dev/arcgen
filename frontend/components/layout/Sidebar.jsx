'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CollapseIcon, LogoIcon } from './icons';
import { NAV_ITEMS } from './navItems';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sidenav-collapsed');
      if (stored === '1') setCollapsed(true);
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed(current => {
      const next = !current;
      try {
        localStorage.setItem('sidenav-collapsed', next ? '1' : '0');
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  return (
    <div className={`${styles.rail} ${collapsed ? styles.collapsed : ''}`} data-sidenav-rail="">
      <div className={styles.panel} data-sidenav-panel="">
        <div>
          <Link href="/" className={styles.logoLink} aria-label="jowenrat - home">
            <span className={styles.logoMark}>J</span>
          </Link>

          <nav aria-label="Primary">
            <ul className={styles.navList}>
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={item.label}
                      aria-current={item.active ? 'page' : undefined}
                      className={`${styles.navLink} ${item.active ? styles.navLinkActive : ''}`}
                    >
                      <Icon className={styles.navIcon} />
                      <span
                        data-sidenav-label=""
                        className={`${styles.navLabel} ${item.active ? styles.navLabelActive : ''}`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <a
          href="https://x.com"
          target="_blank"
          rel="noreferrer"
          aria-label="jowenrat on X"
          data-sidenav-account=""
          className={styles.accountLink}
        >
          <span className={styles.accountAvatar}>J</span>
          <span data-sidenav-label="" className={styles.accountMeta}>
            <span className={styles.accountName}>jowenrat</span>
            <span className={styles.accountHandle}>@jowenrat</span>
          </span>
          <LogoIcon className={styles.accountX} />
        </a>
      </div>

      <button
        type="button"
        data-sidenav-trigger=""
        aria-pressed={collapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={styles.collapseButton}
        onClick={toggleCollapsed}
      >
        <CollapseIcon className={styles.collapseIcon} />
      </button>
    </div>
  );
}
