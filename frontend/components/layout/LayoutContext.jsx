'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const LayoutContext = createContext(null);
const COLLAPSED_KEY = 'sidenav-collapsed';

function readCollapsedPref() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeCollapsedPref(collapsed) {
  try {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
  } catch {
    // ignore storage errors
  }
}

export function LayoutProvider({ children }) {
  const [collapsedPref, setCollapsedPref] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const pref = readCollapsedPref();
    setCollapsedPref(pref);
    setCollapsed(pref);
  }, []);

  const minimizeSidebar = useCallback(() => setCollapsed(true), []);

  const restoreSidebar = useCallback(() => {
    setCollapsed(collapsedPref);
  }, [collapsedPref]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed(current => {
      const next = !current;
      setCollapsedPref(next);
      writeCollapsedPref(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      collapsed,
      collapsedPref,
      minimizeSidebar,
      restoreSidebar,
      toggleCollapsed,
    }),
    [collapsed, collapsedPref, minimizeSidebar, restoreSidebar, toggleCollapsed]
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayout() {
  const context = useContext(LayoutContext);

  if (!context) {
    throw new Error('useLayout must be used within LayoutProvider');
  }

  return context;
}
