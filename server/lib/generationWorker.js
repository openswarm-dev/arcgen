import {
  getCreationById,
  persistCreationVideo,
  updateCreation,
} from './creations.js';
import {
  buildAtlasRefers,
  downloadAtlasVideo,
  isAtlasCloudConfigured,
  pollAtlasPrediction,
  submitAtlasVideoGeneration,
} from './atlascloud.js';
import {
  downloadVideoContent,
  getVideoContentUrl,
  isOpenRouterConfigured,
  pollVideoGeneration,
  submitVideoGeneration,
} from './openrouter.js';
import { isLocalhostUrl } from './publicUrl.js';
import {
  buildWaveSpeedReferenceImages,
  downloadWaveSpeedVideo,
  isWaveSpeedConfigured,
  isWaveSpeedFailureStatus,
  pollWaveSpeedPrediction,
  submitWanImageToVideoSpicy,
} from './wavespeed.js';

const POLL_INTERVAL_MS = 12_000;
const MAX_POLL_ATTEMPTS = 45;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function assertPublicReferenceUrls(references) {
  for (const reference of references) {
    const url = reference.video_url?.url || reference.image_url?.url || reference.url;
    if (url && isLocalhostUrl(url)) {
      throw new Error(
        'Reference media must use a public URL. Set PUBLIC_API_URL or deploy on Render with RENDER_EXTERNAL_URL available.'
      );
    }
  }
}

function assertPublicUrls(urls) {
  assertPublicReferenceUrls(urls.map(url => ({ url })));
}

async function runWaveSpeedGeneration(creationId, creation) {
  if (!isWaveSpeedConfigured()) {
    throw new Error('Character swap requires WaveSpeed. Add WAVESPEED_API_KEY on the server.');
  }

  const referenceImages = buildWaveSpeedReferenceImages(creation);
  if (referenceImages.length < 2) {
    throw new Error('Missing character photos for swap generation');
  }

  assertPublicUrls(referenceImages);

  const job = await submitWanImageToVideoSpicy({
    prompt: creation.prompt,
    image: referenceImages[0],
    lastImage: referenceImages[1],
    duration: creation.duration,
    resolution: creation.resolution,
    aspectRatio: creation.aspectRatio,
  });

  await updateCreation(creationId, {
    status: 'processing',
    providerJobId: job.predictionId,
  });

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await sleep(POLL_INTERVAL_MS);
    }

    const latest = await pollWaveSpeedPrediction(job.predictionId);
    const taskStatus = latest?.status;

    if (isWaveSpeedFailureStatus(taskStatus)) {
      throw new Error(latest?.error || `Generation ${taskStatus}`);
    }

    if (taskStatus === 'completed') {
      const outputUrl = latest?.outputs?.[0];
      if (!outputUrl || typeof outputUrl !== 'string') {
        throw new Error('WaveSpeed completed without a video URL');
      }

      const { buffer, contentType } = await downloadWaveSpeedVideo(outputUrl);
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

async function runAtlasCloudGeneration(creationId, creation) {
  if (!isAtlasCloudConfigured()) {
    throw new Error('Character swap requires Atlas Cloud. Add ATLASCLOUD_API_KEY on the server.');
  }

  const refers = buildAtlasRefers(creation);
  if (refers.length < 3) {
    throw new Error('Missing reference video or character photos for swap generation');
  }

  assertPublicReferenceUrls(refers);

  const job = await submitAtlasVideoGeneration({
    prompt: creation.prompt,
    refers,
    duration: creation.duration,
    resolution: creation.resolution,
    aspectRatio: creation.aspectRatio,
    model: creation.model,
    audio: true,
  });

  await updateCreation(creationId, {
    status: 'processing',
    providerJobId: job.predictionId,
  });

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await sleep(POLL_INTERVAL_MS);
    }

    const latest = await pollAtlasPrediction(job.predictionId);
    const taskStatus = latest?.data?.status;

    if (taskStatus === 'failed') {
      throw new Error(latest?.data?.error || 'Generation failed');
    }

    if (taskStatus === 'completed' || taskStatus === 'succeeded') {
      const outputUrl = latest?.data?.outputs?.[0];
      if (!outputUrl) {
        throw new Error('Atlas Cloud completed without a video URL');
      }

      const { buffer, contentType } = await downloadAtlasVideo(outputUrl);
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

  const inputReferences = creation.referenceImageUrl
    ? [{ type: 'image_url', image_url: { url: creation.referenceImageUrl } }]
    : [];

  assertPublicReferenceUrls(inputReferences);

  const job = await submitVideoGeneration({
    prompt: creation.prompt,
    model: creation.model,
    duration: creation.duration,
    resolution: creation.resolution,
    aspectRatio: creation.aspectRatio,
    generateAudio: true,
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

function usesSwapGeneration(creation) {
  return (
    creation.inputMode === 'swap' ||
    creation.provider === 'wavespeed' ||
    creation.provider === 'atlascloud' ||
    creation.provider === 'dashscope'
  );
}

export async function runCreationGeneration(creationId) {
  const creation = await getCreationById(creationId);
  if (!creation || creation.status === 'completed' || creation.status === 'failed') {
    return;
  }

  try {
    if (usesSwapGeneration(creation)) {
      if (isWaveSpeedConfigured()) {
        await runWaveSpeedGeneration(creationId, creation);
        return;
      }

      if (isAtlasCloudConfigured()) {
        await runAtlasCloudGeneration(creationId, creation);
        return;
      }

      throw new Error('Character swap requires WaveSpeed or Atlas Cloud. Add WAVESPEED_API_KEY on the server.');
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
