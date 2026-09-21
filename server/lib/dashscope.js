const DEFAULT_BASE = 'https://dashscope-intl.aliyuncs.com/api/v1';
const VIDEO_SYNTHESIS_PATH = '/services/aigc/video-generation/video-synthesis';

function getApiKey() {
  const key = process.env.DASHSCOPE_API_KEY;
  if (!key) {
    throw Object.assign(new Error('DashScope is not configured'), { status: 503 });
  }
  return key;
}

function getBaseUrl() {
  return (process.env.DASHSCOPE_BASE_URL || DEFAULT_BASE).replace(/\/$/, '');
}

function dashScopeHeaders() {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    'Content-Type': 'application/json',
    'X-DashScope-Async': 'enable',
  };
}

async function parseJsonResponse(response) {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.output?.message ||
      payload?.code ||
      `DashScope request failed (${response.status})`;
    throw Object.assign(new Error(message), { status: response.status, payload });
  }

  return payload;
}

export function isDashScopeConfigured() {
  return Boolean(process.env.DASHSCOPE_API_KEY);
}

function toDashScopeResolution(resolution = '720p') {
  switch (String(resolution).toLowerCase()) {
    case '480p':
      return '480P';
    case '1080p':
      return '1080P';
    default:
      return '720P';
  }
}

export async function submitWanReferenceGeneration({
  prompt,
  media = [],
  duration = 15,
  resolution = '720p',
  aspectRatio = '9:16',
  model = process.env.DASHSCOPE_VIDEO_MODEL || 'wan3.0-video',
}) {
  const response = await fetch(`${getBaseUrl()}${VIDEO_SYNTHESIS_PATH}`, {
    method: 'POST',
    headers: dashScopeHeaders(),
    body: JSON.stringify({
      model,
      input: {
        prompt,
        media,
      },
      parameters: {
        resolution: toDashScopeResolution(resolution),
        ratio: aspectRatio,
        duration,
        prompt_extend: false,
        audio: false,
      },
    }),
  });

  const payload = await parseJsonResponse(response);
  const taskId = payload?.output?.task_id || payload?.task_id;

  if (!taskId) {
    throw Object.assign(new Error('DashScope did not return a task id'), { payload });
  }

  return { taskId, payload };
}

export async function pollWanTask(taskId) {
  const response = await fetch(`${getBaseUrl()}/tasks/${encodeURIComponent(taskId)}`, {
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
    },
  });

  return parseJsonResponse(response);
}

export async function downloadWanVideo(videoUrl) {
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
