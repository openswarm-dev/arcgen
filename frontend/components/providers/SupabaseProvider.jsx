'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/env';

const SupabaseContext = createContext(null);

export function useSupabase() {
  const context = useContext(SupabaseContext);

  if (!context) {
    throw new Error('useSupabase must be used within SupabaseProvider');
  }

  return context;
}

export default function SupabaseProvider({ children }) {
  const configured = isSupabaseConfigured();
  const supabase = useMemo(() => (configured ? createClient() : null), [configured]);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(configured);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return undefined;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session: nextSession } }) => {
      if (!isMounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo(
    () => ({
      supabase,
      session,
      user,
      isLoading,
      isConfigured: configured,
    }),
    [supabase, session, user, isLoading, configured]
  );

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}
