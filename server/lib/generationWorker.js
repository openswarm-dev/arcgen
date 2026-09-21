import {
  downloadWanVideo,
  isDashScopeConfigured,
  pollWanTask,
  submitWanReferenceGeneration,
} from './dashscope.js';
import {
  buildWanReferenceMedia,
  getCreationById,
  persistCreationVideo,
  updateCreation,
} from './creations.js';
import {
  downloadVideoContent,
  getVideoContentUrl,
  isOpenRouterConfigured,
  pollVideoGeneration,
  submitVideoGeneration,
} from './openrouter.js';

const POLL_INTERVAL_MS = 12_000;
const MAX_POLL_ATTEMPTS = 45;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runDashScopeGeneration(creationId, creation) {
  if (!isDashScopeConfigured()) {
    throw new Error('DashScope is not configured on the server');
  }

  const media = buildWanReferenceMedia(creation);
  if (!media.length) {
    throw new Error('Missing reference media for swap generation');
  }

  const job = await submitWanReferenceGeneration({
    prompt: creation.prompt,
    media,
    duration: creation.duration,
    resolution: creation.resolution,
    aspectRatio: creation.aspectRatio,
  });

  await updateCreation(creationId, {
    status: 'processing',
    providerJobId: job.taskId,
  });

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await sleep(POLL_INTERVAL_MS);
    }

    const latest = await pollWanTask(job.taskId);
    const taskStatus = latest?.output?.task_status || latest?.task_status;

    if (taskStatus === 'FAILED' || taskStatus === 'CANCELED' || taskStatus === 'UNKNOWN') {
      throw new Error(latest?.output?.message || latest?.message || `Generation ${taskStatus}`);
    }

    if (taskStatus === 'SUCCEEDED') {
      const outputUrl = latest?.output?.video_url;
      if (!outputUrl) {
        throw new Error('DashScope completed without a video URL');
      }

      const { buffer, contentType } = await downloadWanVideo(outputUrl);
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

async function runOpenRouterGeneration(creationId, creation) {
  if (!isOpenRouterConfigured()) {
    throw new Error('OpenRouter is not configured on the server');
  }

  const job = await submitVideoGeneration({
    prompt: creation.prompt,
    model: creation.model,
    duration: creation.duration,
    resolution: creation.resolution,
    aspectRatio: creation.aspectRatio,
    generateAudio: true,
    inputReferences: creation.referenceImageUrl
      ? [{ type: 'image_url', image_url: { url: creation.referenceImageUrl } }]
      : [],
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
    if (creation.inputMode === 'swap' || creation.provider === 'dashscope') {
      if (!isDashScopeConfigured()) {
        throw new Error('DashScope is not configured on the server');
      }
      await runDashScopeGeneration(creationId, creation);
      return;
    }

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
