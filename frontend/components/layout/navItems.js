import {
  AnalyticsIcon,
  CapitalFlowIcon,
  ComponentsIcon,
  DocsIcon,
  ExploreIcon,
  HomeIcon,
  LaunchIcon,
  PaymentsIcon
} from './icons';

export const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: HomeIcon, active: true },
  { href: '/explore', label: 'Explore', icon: ExploreIcon },
  { href: '/payments', label: 'Payments', icon: PaymentsIcon },
  { href: '/components', label: 'Components', icon: ComponentsIcon },
  { href: '/analytics', label: 'Analytics', icon: AnalyticsIcon },
  { href: '/launch', label: 'Launch', icon: LaunchIcon },
  { href: '/capital-flow', label: 'Capital Flow', icon: CapitalFlowIcon },
  { href: '/docs', label: 'Docs', icon: DocsIcon }
];
