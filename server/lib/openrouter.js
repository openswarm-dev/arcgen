import { normalizeWan3Params } from './wan3.js';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
export const DEFAULT_VIDEO_MODEL = process.env.OPENROUTER_VIDEO_MODEL || 'alibaba/wan-3.0';

function getApiKey() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw Object.assign(new Error('OpenRouter is not configured'), { status: 503 });
  }
  return key;
}

function openRouterHeaders() {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:3000',
    'X-Title': process.env.OPENROUTER_APP_NAME || 'ArcGen',
  };
}

async function parseJsonResponse(response) {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.error ||
      payload?.message ||
      `OpenRouter request failed (${response.status})`;
    throw Object.assign(new Error(message), { status: response.status, payload });
  }

  return payload;
}

export function isOpenRouterConfigured() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export async function submitVideoGeneration({
  prompt,
  model = DEFAULT_VIDEO_MODEL,
  duration = 5,
  resolution = '720p',
  aspectRatio = '9:16',
  generateAudio = true,
  inputReferences = [],
}) {
  const normalized = normalizeWan3Params({ duration, resolution, aspectRatio });

  const body = {
    model,
    prompt,
    duration: normalized.duration,
    resolution: normalized.resolution,
    aspect_ratio: normalized.aspectRatio,
    generate_audio: generateAudio,
  };

  if (inputReferences.length) {
    body.input_references = inputReferences;
  }

  const response = await fetch(`${OPENROUTER_BASE}/videos`, {
    method: 'POST',
    headers: openRouterHeaders(),
    body: JSON.stringify(body),
  });

  return parseJsonResponse(response);
}

export async function pollVideoGeneration(jobId) {
  const response = await fetch(`${OPENROUTER_BASE}/videos/${encodeURIComponent(jobId)}`, {
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
    },
  });

  return parseJsonResponse(response);
}

export async function downloadVideoContent(contentUrl) {
  const response = await fetch(contentUrl, {
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
    },
  });

  if (!response.ok) {
    throw Object.assign(new Error(`Failed to download generated video (${response.status})`), {
      status: response.status,
    });
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get('content-type') || 'video/mp4';
  return { buffer, contentType };
}

export function getVideoContentUrl(jobId, index = 0) {
  return `${OPENROUTER_BASE}/videos/${encodeURIComponent(jobId)}/content?index=${index}`;
}
