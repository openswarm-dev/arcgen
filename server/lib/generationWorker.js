import {
  buildOpenRouterInputReferences,
  getCreationById,
  persistCreationVideo,
  updateCreation,
} from './creations.js';
import {
  DEFAULT_SWAP_VIDEO_MODEL,
  downloadVideoContent,
  getVideoContentUrl,
  isOpenRouterConfigured,
  pollVideoGeneration,
  submitVideoGeneration,
} from './openrouter.js';
import { isLocalhostUrl } from './publicUrl.js';

const POLL_INTERVAL_MS = 12_000;
const MAX_POLL_ATTEMPTS = 45;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runOpenRouterGeneration(creationId, creation) {
  if (!isOpenRouterConfigured()) {
    throw new Error('OpenRouter is not configured on the server');
  }

  const isSwap = creation.inputMode === 'swap';
  const inputReferences = isSwap
    ? buildOpenRouterInputReferences(creation)
    : creation.referenceImageUrl
      ? [{ type: 'image_url', image_url: { url: creation.referenceImageUrl } }]
      : [];

  if (isSwap && inputReferences.length < 3) {
    throw new Error('Missing reference video or character photos for swap generation');
  }

  for (const reference of inputReferences) {
    const url = reference.video_url?.url || reference.image_url?.url;
    if (url && isLocalhostUrl(url)) {
      throw new Error(
        'Reference media must use a public URL. Set PUBLIC_API_URL or deploy on Render with RENDER_EXTERNAL_URL available.'
      );
    }
  }

  const job = await submitVideoGeneration({
    prompt: creation.prompt,
    model: isSwap ? creation.model || DEFAULT_SWAP_VIDEO_MODEL : creation.model,
    duration: creation.duration,
    resolution: creation.resolution,
    aspectRatio: creation.aspectRatio,
    generateAudio: !isSwap,
    inputReferences,
  });

  await updateCreation(creationId, {
    status: 'processing',
    providerJobId: job.id,
  });

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await sleep(POLL_INTERVAL_MS);
    }

    const latest = await pollVideoGeneration(job.id);

    if (latest.status === 'failed' || latest.status === 'cancelled' || latest.status === 'expired') {
      throw new Error(latest.error || `Generation ${latest.status}`);
    }

    if (latest.status === 'completed') {
      const contentUrl = latest.unsigned_urls?.[0] || getVideoContentUrl(job.id);
      const { buffer, contentType } = await downloadVideoContent(contentUrl);
      const videoUrl = await persistCreationVideo(creationId, buffer, contentType);

      await updateCreation(creationId, {
        status: 'completed',
        videoUrl,
        errorMessage: null,
        completedAt: new Date().toISOString(),
      });
      return;
    }
  }

  throw new Error('Video generation timed out. Try again in a moment.');
}

export async function runCreationGeneration(creationId) {
  const creation = await getCreationById(creationId);
  if (!creation || creation.status === 'completed' || creation.status === 'failed') {
    return;
  }

  try {
    if (!isOpenRouterConfigured()) {
      throw new Error('OpenRouter is not configured on the server');
    }

    await runOpenRouterGeneration(creationId, creation);
  } catch (error) {
    console.error(`Creation ${creationId} failed:`, error);
    await updateCreation(creationId, {
      status: 'failed',
      errorMessage: error.message || 'Video generation failed',
      completedAt: new Date().toISOString(),
    });
  }
}

export function queueCreationGeneration(creationId) {
  setImmediate(() => {
    runCreationGeneration(creationId).catch(error => {
      console.error(`Unhandled generation worker error for ${creationId}:`, error);
    });
  });
}
