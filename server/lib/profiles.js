import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { isValidSolanaAddress } from '../wallet.js';
import { getSupabaseAdmin, isSupabaseConfigured } from './supabase.js';
import { normalizeHandles } from './platforms.js';

const DATA_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'profiles.json');

function publicProfile(row) {
  if (!row) {
    return null;
  }

  return {
    wallet: row.wallet_address,
    displayName: row.display_name || '',
    bio: row.bio || '',
    avatarUrl: row.avatar_url || '',
    bannerUrl: row.banner_url || '',
    handles: row.handles || {},
    updatedAt: row.updated_at || null,
  };
}

function hasConnectedHandles(profile) {
  return Object.values(profile?.handles || {}).some(Boolean);
}

export async function listProfiles() {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      return (data || []).map(publicProfile).filter(Boolean);
    } catch (error) {
      console.warn('Supabase profile list failed, using file store:', error.message);
    }
  }

  const all = await readFileStore();
  return Object.values(all)
    .map(publicProfile)
    .filter(Boolean)
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
}

export async function getPublicProfile() {
  const profiles = await listProfiles();
  return profiles.find(hasConnectedHandles) || profiles[0] || null;
}

export async function getProfileByWallet(wallet) {
  if (!isValidSolanaAddress(wallet)) {
    throw Object.assign(new Error('Invalid Solana address'), { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('wallet_address', wallet)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return publicProfile(data) || emptyProfile(wallet);
    } catch (error) {
      console.warn('Supabase profile read failed, using file store:', error.message);
    }
  }

  const all = await readFileStore();
  return publicProfile(all[wallet]) || emptyProfile(wallet);
}

export async function upsertProfile({ wallet, displayName, bio, handles, avatarUrl, bannerUrl }) {
  if (!isValidSolanaAddress(wallet)) {
    throw Object.assign(new Error('Invalid Solana address'), { status: 400 });
  }

  const existing = await getProfileByWallet(wallet);
  const next = {
    wallet_address: wallet,
    display_name: typeof displayName === 'string' ? displayName.trim().slice(0, 48) : existing.displayName,
    bio: typeof bio === 'string' ? bio.trim().slice(0, 240) : existing.bio,
    avatar_url: sanitizeImageUrl(avatarUrl, existing.avatarUrl),
    banner_url: sanitizeImageUrl(bannerUrl, existing.bannerUrl),
    handles: handles ? normalizeHandles(handles) : existing.handles,
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('creator_profiles')
        .upsert(next, { onConflict: 'wallet_address' })
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      return publicProfile(data);
    } catch (error) {
      console.warn('Supabase profile write failed, using file store:', error.message);
    }
  }

  const all = await readFileStore();
  all[wallet] = {
    ...next,
    created_at: all[wallet]?.created_at || next.updated_at,
  };
  await writeFileStore(all);
  return publicProfile(all[wallet]);
}

function emptyProfile(wallet) {
  return {
    wallet,
    displayName: '',
    bio: '',
    avatarUrl: '',
    bannerUrl: '',
    handles: {},
    updatedAt: null,
  };
}

function sanitizeImageUrl(value, fallback) {
  if (typeof value !== 'string') return fallback || '';
  const next = value.trim();
  if (!next) return '';
  if (next.startsWith('data:image/') || next.startsWith('http://') || next.startsWith('https://') || next.startsWith('/')) {
    return next.slice(0, 2_000_000);
  }
  return fallback || '';
}

async function readFileStore() {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

async function writeFileStore(data) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

export function profileStoreMode() {
  return isSupabaseConfigured() ? 'supabase' : 'file';
}
