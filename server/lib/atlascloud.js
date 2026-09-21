const BASE_URL = 'https://api.atlascloud.ai/api/v1';
const DEFAULT_VIDEO_MODEL = 'alibaba/wan-3.0/reference-to-video';

function getApiKey() {
  const key = process.env.ATLASCLOUD_API_KEY;
  if (!key) {
    throw Object.assign(new Error('Atlas Cloud is not configured'), { status: 503 });
  }
  return key;
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
      payload?.error ||
      payload?.data?.error ||
      payload?.code ||
      `Atlas Cloud request failed (${response.status})`;
    throw Object.assign(new Error(message), { status: response.status, payload });
  }

  return payload;
}

export function isAtlasCloudConfigured() {
  return Boolean(process.env.ATLASCLOUD_API_KEY);
}

export function buildAtlasRefers(creation) {
  const refers = [];

  if (creation.referenceVideoUrl) {
    refers.push({ url: creation.referenceVideoUrl, type: 'video' });
  }

  const imageRefs = (creation.referenceMedia || [])
    .filter(item => item.type === 'reference_image')
    .sort((a, b) => (a.index || 0) - (b.index || 0));

  for (const item of imageRefs) {
    refers.push({ url: item.url, type: 'image' });
  }

  if (!imageRefs.length && creation.referenceImageUrl) {
    refers.push({ url: creation.referenceImageUrl, type: 'image' });
  }

  return refers;
}

export async function submitAtlasVideoGeneration({
  prompt,
  refers = [],
  duration = 5,
  resolution = '720p',
  aspectRatio = '9:16',
  model = process.env.ATLASCLOUD_VIDEO_MODEL || DEFAULT_VIDEO_MODEL,
  audio = true,
}) {
  const response = await fetch(`${BASE_URL}/model/generateVideo`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      model,
      prompt,
      refers,
      resolution,
      duration,
      ratio: aspectRatio,
      audio,
      enable_thinking: false,
    }),
  });

  const payload = await parseJsonResponse(response);
  const predictionId = payload?.data?.id;

  if (!predictionId) {
    throw Object.assign(new Error('Atlas Cloud did not return a prediction id'), { payload });
  }

  return { predictionId, payload };
}

export async function pollAtlasPrediction(predictionId) {
  const response = await fetch(`${BASE_URL}/model/prediction/${encodeURIComponent(predictionId)}`, {
    headers: authHeaders(null),
  });

  return parseJsonResponse(response);
}

export async function downloadAtlasVideo(videoUrl) {
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
