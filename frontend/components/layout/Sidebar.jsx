'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { CollapseIcon } from './icons';
import { useLayout } from './LayoutContext';
import { isNavItemActive, NAV_ITEMS } from './navItems';
import { useSupabase } from '../providers/SupabaseProvider';
import BrandLogo from '../brand/BrandLogo';
import styles from './Sidebar.module.css';

const COLLAPSED_WIDTH = 80;
const EXPANDED_WIDTH = 275;

export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed, restoreSidebar, toggleCollapsed } = useLayout();
  const { user } = useSupabase();
  const [wide, setWide] = useState(false);
  const accountName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Guest';
  const accountHandle = user?.email || 'Not signed in';

  useEffect(() => {
    const media = window.matchMedia('(min-width: 80rem)');
    const onChange = () => setWide(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    restoreSidebar();
  }, [pathname, restoreSidebar]);

  const minimized = collapsed || !wide;

  return (
    <motion.div
      className={`${styles.rail} ${collapsed ? styles.collapsed : ''}`}
      data-sidenav-rail=""
      initial={false}
      animate={{ width: minimized ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
      transition={{ type: 'spring', stiffness: 320, damping: 34 }}
    >
      <div className={styles.panel} data-sidenav-panel="">
        <div>
          <Link href="/" className={styles.logoLink} aria-label="F33D - home">
            <BrandLogo className={styles.logoMark} />
          </Link>

          <nav aria-label="Primary">
            <ul className={styles.navList}>
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const active = isNavItemActive(item.href, pathname);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={item.label}
                      aria-current={active ? 'page' : undefined}
                      className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                    >
                      <Icon className={styles.navIcon} />
                      <span
                        data-sidenav-label=""
                        className={`${styles.navLabel} ${active ? styles.navLabelActive : ''}`}
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

        <Link href="/profile" aria-label="Open profile" data-sidenav-account="" className={styles.accountLink}>
          <span className={styles.accountAvatar}>{(accountName || 'F').charAt(0).toUpperCase()}</span>
          <span data-sidenav-label="" className={styles.accountMeta}>
            <span className={styles.accountName}>{accountName}</span>
            <span className={styles.accountHandle}>{accountHandle}</span>
          </span>
        </Link>
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
    </motion.div>
  );
}
