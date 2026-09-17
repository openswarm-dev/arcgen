import { createBrowserClient } from '@supabase/ssr';

import { getSupabaseEnv } from './env';

export function createClient() {
  const { url, anonKey } = getSupabaseEnv();

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend/.env.local'
    );
  }

  return createBrowserClient(url, anonKey);
}
