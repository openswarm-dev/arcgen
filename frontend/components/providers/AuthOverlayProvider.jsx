'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import AuthOverlay from '@/components/auth/AuthOverlay';
import { useSupabase } from './SupabaseProvider';

const AuthOverlayContext = createContext(null);

export function useAuthOverlay() {
  const context = useContext(AuthOverlayContext);

  if (!context) {
    throw new Error('useAuthOverlay must be used within AuthOverlayProvider');
  }

  return context;
}

export default function AuthOverlayProvider({ children }) {
  const { user } = useSupabase();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('signin');

  const openAuth = useCallback((nextMode = 'signin') => {
    if (user) return;
    setMode(nextMode === 'signup' ? 'signup' : 'signin');
    setOpen(true);
  }, [user]);

  const closeAuth = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({
      open,
      mode,
      openAuth,
      closeAuth,
    }),
    [open, mode, openAuth, closeAuth]
  );

  return (
    <AuthOverlayContext.Provider value={value}>
      {children}
      <AuthOverlay open={open} mode={mode} onModeChange={setMode} onClose={closeAuth} />
    </AuthOverlayContext.Provider>
  );
}
