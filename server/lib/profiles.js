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
    id: row.user_id || row.id || null,
    wallet: row.wallet_address || '',
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

export async function getProfileByUserId(userId) {
  if (!userId) {
    throw Object.assign(new Error('Missing user'), { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return publicProfile(data) || emptyProfile(userId);
    } catch (error) {
      console.warn('Supabase profile read failed, using file store:', error.message);
    }
  }

  const all = await readFileStore();
  return publicProfile(all[userId]) || emptyProfile(userId);
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

      return publicProfile(data) || emptyProfile(null, wallet);
    } catch (error) {
      console.warn('Supabase profile read failed, using file store:', error.message);
    }
  }

  const all = await readFileStore();
  const match = Object.values(all).find(row => row.wallet_address === wallet);
  return publicProfile(match) || emptyProfile(null, wallet);
}

export async function upsertProfile({ userId, wallet, displayName, bio, handles, avatarUrl, bannerUrl }) {
  if (!userId) {
    throw Object.assign(new Error('Missing user'), { status: 400 });
  }

  if (wallet && !isValidSolanaAddress(wallet)) {
    throw Object.assign(new Error('Invalid Solana address'), { status: 400 });
  }

  const existing = await getProfileByUserId(userId);
  const next = {
    user_id: userId,
    wallet_address: wallet || existing.wallet || null,
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
        .upsert(next, { onConflict: 'user_id' })
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
  all[userId] = {
    ...next,
    created_at: all[userId]?.created_at || next.updated_at,
  };
  await writeFileStore(all);
  return publicProfile(all[userId]);
}

function emptyProfile(userId, wallet = '') {
  return {
    id: userId || null,
    wallet: wallet || '',
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
