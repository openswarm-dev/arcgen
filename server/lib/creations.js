import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { isValidSolanaAddress } from '../wallet.js';
import { DEFAULT_VIDEO_MODEL } from './openrouter.js';
import { getSupabaseAdmin, isSupabaseConfigured } from './supabase.js';
import { normalizeWan3Params } from './wan3.js';
import {
  getPresetReferenceVideoPublicUrl,
  hasPresetReferenceVideo,
} from './presets.js';
import { getPublicApiBase } from './publicUrl.js';
import { ensureWalletProfile } from './profiles.js';

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const DATA_PATH = path.join(DATA_DIR, 'creations.json');
const VIDEO_DIR = path.join(DATA_DIR, 'videos');
const REFERENCE_DIR = path.join(DATA_DIR, 'references');

export function getCreationReferenceVideoPublicUrl(id) {
  return `${getPublicApiBase()}/api/creations/${id}/reference/video`;
}

export function getCreationReferenceImagePublicUrl(id, index = 1) {
  return `${getPublicApiBase()}/api/creations/${id}/reference/image/${index}`;
}

export function getCreationReferencePublicUrl(id) {
  return getCreationReferenceImagePublicUrl(id, 1);
}

function parseDataImage(value) {
  const match = String(value || '').match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!match) return null;
  return { contentType: match[1], buffer: Buffer.from(match[2], 'base64') };
}

function parseDataVideo(value) {
  const match = String(value || '').match(/^data:(video\/(?:mp4|quicktime)|application\/octet-stream);base64,(.+)$/);
  if (!match) return null;
  return { contentType: match[1].startsWith('video/') ? match[1] : 'video/mp4', buffer: Buffer.from(match[2], 'base64') };
}

function imageExtension(contentType) {
  switch (contentType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'jpg';
  }
}

function parseReferenceMedia(row) {
  const raw = row.reference_media || row.referenceMedia;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function publicCreation(row) {
  if (!row) return null;

  const referenceMedia = parseReferenceMedia(row);

  return {
    id: row.id,
    wallet: row.wallet_address || row.wallet || '',
    prompt: row.prompt || '',
    title: row.title || '',
    model: row.model || DEFAULT_VIDEO_MODEL,
    duration: row.duration ?? 5,
    resolution: row.resolution || '720p',
    aspectRatio: row.aspect_ratio || row.aspectRatio || '9:16',
    status: row.status || 'queued',
    providerJobId: row.provider_job_id || row.providerJobId || null,
    provider: row.provider || 'openrouter',
    videoUrl: row.video_url || row.videoUrl || null,
    thumbnailUrl: row.thumbnail_url || row.thumbnailUrl || null,
    errorMessage: row.error_message || row.errorMessage || null,
    referenceImageUrl: row.reference_image_url || row.referenceImageUrl || null,
    referenceVideoUrl: row.reference_video_url || row.referenceVideoUrl || null,
    referenceMedia,
    inputMode: row.input_mode || row.inputMode || 'simple',
    isPublic: row.is_public ?? row.isPublic ?? true,
    createdAt: row.created_at || row.createdAt || null,
    completedAt: row.completed_at || row.completedAt || null,
  };
}

async function readFileStore() {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeFileStore(store) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(store, null, 2));
}

export function creationStoreMode() {
  return isSupabaseConfigured() ? 'supabase' : 'file';
}

export function buildOpenRouterInputReferences(creation) {
  const refs = [];

  if (creation.referenceVideoUrl) {
    refs.push({
      type: 'video_url',
      video_url: { url: creation.referenceVideoUrl },
    });
  }

  const imageRefs = (creation.referenceMedia || [])
    .filter(item => item.type === 'reference_image')
    .sort((a, b) => (a.index || 0) - (b.index || 0));

  for (const item of imageRefs) {
    refs.push({
      type: 'image_url',
      image_url: { url: item.url },
    });
  }

  if (!imageRefs.length && creation.referenceImageUrl) {
    refs.push({
      type: 'image_url',
      image_url: { url: creation.referenceImageUrl },
    });
  }

  return refs;
}

export function buildWanReferenceMedia(creation) {
  const media = [];

  if (creation.referenceVideoUrl) {
    media.push({ type: 'reference_video', url: creation.referenceVideoUrl });
  }

  const imageRefs = (creation.referenceMedia || [])
    .filter(item => item.type === 'reference_image')
    .sort((a, b) => (a.index || 0) - (b.index || 0));

  for (const item of imageRefs) {
    media.push({ type: 'reference_image', url: item.url });
  }

  if (!imageRefs.length && creation.referenceImageUrl) {
    media.push({ type: 'reference_image', url: creation.referenceImageUrl });
  }

  return media;
}

async function persistReferenceFile(id, kind, buffer, contentType, index = null) {
  const extension =
    kind === 'video' ? 'mp4' : imageExtension(contentType);
  const suffix = kind === 'video' ? 'video' : `image-${index ?? 1}`;
  const fileName = `${id}-${suffix}.${extension}`;
  const storagePath = kind === 'video' ? `references/videos/${fileName}` : `references/images/${fileName}`;
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      const { error } = await supabase.storage.from('creations').upload(storagePath, buffer, {
        contentType: kind === 'video' ? 'video/mp4' : contentType,
        upsert: true,
      });

      if (error) throw error;

      const { data } = supabase.storage.from('creations').getPublicUrl(storagePath);
      return data.publicUrl;
    } catch (error) {
      console.warn(`Supabase ${kind} reference upload failed, using local file store:`, error.message);
    }
  }

  await fs.mkdir(REFERENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(REFERENCE_DIR, fileName), buffer);

  if (kind === 'video') {
    return getCreationReferenceVideoPublicUrl(id);
  }

  return getCreationReferenceImagePublicUrl(id, index ?? 1);
}

export async function createCreation({
  wallet,
  prompt,
  title,
  duration = 5,
  resolution = '720p',
  aspectRatio = '9:16',
  model = DEFAULT_VIDEO_MODEL,
  inputMode = 'simple',
  characterImage,
  characterImageA,
  characterImageB,
  referenceVideo,
  presetId,
}) {
  if (!isValidSolanaAddress(wallet)) {
    throw Object.assign(new Error('Connect your wallet to create'), { status: 400 });
  }

  await ensureWalletProfile(wallet);

  const trimmedPrompt = String(prompt || '').trim();
  if (trimmedPrompt.length < 8) {
    throw Object.assign(new Error('Prompt is too short'), { status: 400 });
  }

  const normalized = normalizeWan3Params({ duration, resolution: '720p', aspectRatio });
  const row = {
    id: crypto.randomUUID(),
    wallet_address: wallet,
    prompt: trimmedPrompt,
    title: String(title || '').trim() || trimmedPrompt.slice(0, 80),
    model,
    duration: normalized.duration,
    resolution: normalized.resolution,
    aspect_ratio: normalized.aspectRatio,
    input_mode: inputMode,
    status: 'queued',
    is_public: true,
    created_at: new Date().toISOString(),
    reference_media: [],
  };

  if (inputMode === 'swap') {
    const imageA = parseDataImage(characterImageA);
    const imageB = parseDataImage(characterImageB);

    if (!imageA || !imageB) {
      throw Object.assign(new Error('Upload photos for both characters'), { status: 400 });
    }

    const presetReferenceId = String(presetId || '').trim();
    let referenceVideoUrl;

    if (presetReferenceId && hasPresetReferenceVideo(presetReferenceId)) {
      referenceVideoUrl = getPresetReferenceVideoPublicUrl(presetReferenceId);
    } else {
      const video = parseDataVideo(referenceVideo);
      if (!video) {
        throw Object.assign(new Error('Upload a reference video'), { status: 400 });
      }
      referenceVideoUrl = await persistReferenceFile(row.id, 'video', video.buffer, video.contentType);
    }

    row.reference_video_url = referenceVideoUrl;
    const imageAUrl = await persistReferenceFile(row.id, 'image', imageA.buffer, imageA.contentType, 1);
    const imageBUrl = await persistReferenceFile(row.id, 'image', imageB.buffer, imageB.contentType, 2);

    row.reference_image_url = imageAUrl;
    row.reference_media = [
      { type: 'reference_video', url: row.reference_video_url },
      { type: 'reference_image', url: imageAUrl, index: 1 },
      { type: 'reference_image', url: imageBUrl, index: 2 },
    ];
    row.model = process.env.DASHSCOPE_VIDEO_MODEL || 'wan3.0-video';
    row.provider = 'dashscope';
  } else {
    const image = parseDataImage(characterImage);
    if (!image) {
      throw Object.assign(new Error('Upload a character photo'), { status: 400 });
    }

    const imageUrl = await persistReferenceFile(row.id, 'image', image.buffer, image.contentType, 1);
    row.reference_image_url = imageUrl;
    row.reference_media = [{ type: 'reference_image', url: imageUrl, index: 1 }];
    row.provider = 'openrouter';
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const dbRow = {
        ...row,
        reference_media: JSON.stringify(row.reference_media),
      };
      const { data, error } = await supabase.from('creations').insert(dbRow).select('*').single();
      if (error) throw error;
      return publicCreation({
        ...data,
        reference_video_url: row.reference_video_url,
        reference_image_url: row.reference_image_url,
        reference_media: row.reference_media,
        provider: row.provider,
        input_mode: row.input_mode,
      });
    } catch (error) {
      console.warn('Supabase creation insert failed, using file store:', error.message);
    }
  }

  const store = await readFileStore();
  store[row.id] = row;
  await writeFileStore(store);
  return publicCreation(row);
}

export async function getCreationById(id) {
  if (!id) {
    throw Object.assign(new Error('Missing creation id'), { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('creations').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      if (data) return publicCreation(data);
    } catch (error) {
      console.warn('Supabase creation read failed, using file store:', error.message);
    }
  }

  const store = await readFileStore();
  return publicCreation(store[id]) || null;
}

export async function updateCreation(id, patch) {
  const supabase = getSupabaseAdmin();
  const dbPatch = {
    ...(patch.status ? { status: patch.status } : {}),
    ...(patch.providerJobId ? { provider_job_id: patch.providerJobId } : {}),
    ...(patch.videoUrl ? { video_url: patch.videoUrl } : {}),
    ...(patch.thumbnailUrl ? { thumbnail_url: patch.thumbnailUrl } : {}),
    ...(patch.errorMessage !== undefined ? { error_message: patch.errorMessage } : {}),
    ...(patch.completedAt ? { completed_at: patch.completedAt } : {}),
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('creations').update(dbPatch).eq('id', id).select('*').single();

      if (error) throw error;
      return publicCreation(data);
    } catch (error) {
      console.warn('Supabase creation update failed, using file store:', error.message);
    }
  }

  const store = await readFileStore();
  const existing = store[id];
  if (!existing) {
    throw Object.assign(new Error('Creation not found'), { status: 404 });
  }

  const next = {
    ...existing,
    ...(patch.status ? { status: patch.status } : {}),
    ...(patch.providerJobId ? { provider_job_id: patch.providerJobId } : {}),
    ...(patch.videoUrl ? { video_url: patch.videoUrl } : {}),
    ...(patch.thumbnailUrl ? { thumbnail_url: patch.thumbnailUrl } : {}),
    ...(patch.errorMessage !== undefined ? { error_message: patch.errorMessage } : {}),
    ...(patch.completedAt ? { completed_at: patch.completedAt } : {}),
  };

  store[id] = next;
  await writeFileStore(store);
  return publicCreation(next);
}

export async function listExploreCreations({ limit = 24, offset = 0 } = {}) {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('creations')
        .select('*')
        .eq('is_public', true)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return (data || []).map(publicCreation).filter(Boolean);
    } catch (error) {
      console.warn('Supabase explore list failed, using file store:', error.message);
    }
  }

  const store = await readFileStore();
  return Object.values(store)
    .map(publicCreation)
    .filter(item => item?.isPublic && item.status === 'completed')
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(offset, offset + limit);
}

export async function listWalletCreations(wallet, { limit = 24 } = {}) {
  if (!isValidSolanaAddress(wallet)) {
    throw Object.assign(new Error('Invalid Solana address'), { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('creations')
        .select('*')
        .eq('wallet_address', wallet)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map(publicCreation).filter(Boolean);
    } catch (error) {
      console.warn('Supabase wallet list failed, using file store:', error.message);
    }
  }

  const store = await readFileStore();
  return Object.values(store)
    .map(publicCreation)
    .filter(item => item?.wallet === wallet)
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, limit);
}

export async function persistCreationVideo(id, buffer, contentType = 'video/mp4') {
  const supabase = getSupabaseAdmin();
  const filePath = `${id}.mp4`;

  if (supabase) {
    try {
      const { error } = await supabase.storage.from('creations').upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

      if (error) throw error;

      const { data } = supabase.storage.from('creations').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.warn('Supabase video upload failed, using local file store:', error.message);
    }
  }

  await fs.mkdir(VIDEO_DIR, { recursive: true });
  await fs.writeFile(path.join(VIDEO_DIR, filePath), buffer);
  return `/api/creations/${id}/video`;
}

export async function readLocalCreationVideo(id) {
  const filePath = path.join(VIDEO_DIR, `${id}.mp4`);
  return fs.readFile(filePath);
}

async function readLocalReferenceFile(id, kind, index = 1) {
  if (kind === 'video') {
    const filePath = path.join(REFERENCE_DIR, `${id}-video.mp4`);
    const buffer = await fs.readFile(filePath);
    return { buffer, contentType: 'video/mp4' };
  }

  const candidates = ['jpg', 'png', 'webp'].map(ext => path.join(REFERENCE_DIR, `${id}-image-${index}.${ext}`));

  for (const filePath of candidates) {
    try {
      const buffer = await fs.readFile(filePath);
      const extension = path.extname(filePath).slice(1);
      const contentType =
        extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
      return { buffer, contentType };
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  throw Object.assign(new Error('Reference file not found'), { status: 404 });
}

export async function readLocalCreationReference(id) {
  return readLocalReferenceFile(id, 'image', 1);
}

export async function readLocalCreationReferenceVideo(id) {
  return readLocalReferenceFile(id, 'video');
}

export async function readLocalCreationReferenceImage(id, index = 1) {
  return readLocalReferenceFile(id, 'image', index);
}
