'use client';

import {
  ComponentsIcon,
  DocsIcon,
  ExploreIcon,
  HomeIcon,
  LaunchIcon
} from './icons';

export const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/create', label: 'Create', icon: LaunchIcon },
  { href: '/explore', label: 'Explore', icon: ExploreIcon },
  { href: '/components', label: 'Components', icon: ComponentsIcon },
  { href: '/docs', label: 'Docs', icon: DocsIcon }
];

export function isNavItemActive(href, pathname) {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
