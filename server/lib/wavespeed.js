const BASE_URL = 'https://api.wavespeed.ai';
const DEFAULT_VIDEO_MODEL = 'alibaba/wan-3.0-prime/image-to-video-spicy';
const TERMINAL_FAILURE_STATUSES = new Set(['failed', 'cancelled', 'timeout', 'deleted']);

function getApiKey() {
  const key = process.env.WAVESPEED_API_KEY;
  if (!key) {
    throw Object.assign(new Error('WaveSpeed is not configured'), { status: 503 });
  }
  return key;
}

function getVideoModelPath() {
  return (process.env.WAVESPEED_VIDEO_MODEL || DEFAULT_VIDEO_MODEL).replace(/^\/+|\/+$/g, '');
}

function shouldEnablePromptExpansion() {
  return process.env.WAVESPEED_ENABLE_PROMPT_EXPANSION === 'true';
}

function shouldEnableAudio() {
  return process.env.WAVESPEED_ENABLE_AUDIO !== 'false';
}

function authHeaders(contentType = 'application/json') {
  const headers = {
    Authorization: `Bearer ${getApiKey()}`,
  };

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  return headers;
}

async function parseJsonResponse(response) {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.data?.error ||
      payload?.error ||
      `WaveSpeed request failed (${response.status})`;
    throw Object.assign(new Error(message), { status: response.status, payload });
  }

  return payload;
}

export function isWaveSpeedConfigured() {
  return Boolean(process.env.WAVESPEED_API_KEY);
}

export function isSwapVideoConfigured() {
  return isWaveSpeedConfigured() || Boolean(process.env.ATLASCLOUD_API_KEY);
}

export function buildWaveSpeedReferenceImages(creation) {
  const images = [];

  const imageRefs = (creation.referenceMedia || [])
    .filter(item => item.type === 'reference_image')
    .sort((a, b) => (a.index || 0) - (b.index || 0));

  for (const item of imageRefs) {
    images.push(item.url);
  }

  if (!images.length && creation.referenceImageUrl) {
    images.push(creation.referenceImageUrl);
  }

  return images;
}

export async function submitWanImageToVideoSpicy({
  prompt,
  image,
  lastImage,
  duration = 5,
  resolution = '720p',
  aspectRatio = '9:16',
  enablePromptExpansion = shouldEnablePromptExpansion(),
  enableAudio = shouldEnableAudio(),
  seed,
  modelPath = getVideoModelPath(),
}) {
  if (!image) {
    throw Object.assign(new Error('WaveSpeed image-to-video requires a first-frame image'), { status: 400 });
  }

  const body = {
    image,
    resolution,
    aspect_ratio: aspectRatio,
    duration,
    enable_prompt_expansion: enablePromptExpansion,
    enable_audio: enableAudio,
  };

  if (prompt) {
    body.prompt = prompt;
  }

  if (lastImage) {
    body.last_image = lastImage;
  }

  if (seed !== undefined && seed !== null) {
    body.seed = seed;
  }

  const response = await fetch(`${BASE_URL}/api/v3/${modelPath}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  const payload = await parseJsonResponse(response);
  const task = payload?.data ?? payload;
  const predictionId = task?.id;

  if (!predictionId) {
    throw Object.assign(new Error('WaveSpeed did not return a prediction id'), { payload });
  }

  return { predictionId, payload: task };
}

export async function pollWaveSpeedPrediction(predictionId) {
  const response = await fetch(
    `${BASE_URL}/api/v3/predictions/${encodeURIComponent(predictionId)}/result`,
    {
      headers: authHeaders(null),
    }
  );

  const payload = await parseJsonResponse(response);
  return payload?.data ?? payload;
}

export function isWaveSpeedFailureStatus(status) {
  return TERMINAL_FAILURE_STATUSES.has(status);
}

export async function downloadWaveSpeedVideo(videoUrl) {
  const response = await fetch(videoUrl);

  if (!response.ok) {
    throw Object.assign(new Error(`Failed to download generated video (${response.status})`), {
      status: response.status,
    });
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get('content-type') || 'video/mp4';
  return { buffer, contentType };
}
