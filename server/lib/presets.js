import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const PRESETS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'presets');

const PRESET_REFERENCE_VIDEOS = {
  'hotel-lobby': 'hotel-lobby.mp4',
  'on-the-radar': 'on-the-radar.mp4',
};

function getPublicApiBase() {
  return (process.env.PUBLIC_API_URL || process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 3001}`).replace(
    /\/$/,
    ''
  );
}

export function getPresetReferenceVideoPath(presetId) {
  const fileName = PRESET_REFERENCE_VIDEOS[presetId];
  if (!fileName) return null;
  return path.join(PRESETS_DIR, fileName);
}

export function hasPresetReferenceVideo(presetId) {
  return Boolean(getPresetReferenceVideoPath(presetId));
}

export function getPresetReferenceVideoPublicUrl(presetId) {
  return `${getPublicApiBase()}/api/presets/${encodeURIComponent(presetId)}/reference`;
}

export async function readPresetReferenceVideo(presetId) {
  const filePath = getPresetReferenceVideoPath(presetId);
  if (!filePath) {
    throw Object.assign(new Error('Preset reference not found'), { status: 404 });
  }

  const buffer = await fs.readFile(filePath);
  return { buffer, contentType: 'video/mp4' };
}
