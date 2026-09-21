export const WAN3_MODEL = 'alibaba/wan-3.0';
export const WAN3_MAX_DURATION = 20;
export const WAN3_MIN_DURATION = 2;
export const WAN3_ASPECT_RATIOS = ['16:9', '4:3', '1:1', '3:4', '9:16'];
export const WAN3_RESOLUTIONS = ['480p', '720p', '1080p'];

export function normalizeWan3Params({
  duration = 5,
  resolution = '720p',
  aspectRatio = '9:16',
} = {}) {
  const parsedDuration = Number(duration);

  if (
    !Number.isInteger(parsedDuration) ||
    parsedDuration < WAN3_MIN_DURATION ||
    parsedDuration > WAN3_MAX_DURATION
  ) {
    throw Object.assign(new Error(`Duration must be between ${WAN3_MIN_DURATION} and ${WAN3_MAX_DURATION} seconds`), {
      status: 400,
    });
  }

  if (!WAN3_RESOLUTIONS.includes(resolution)) {
    throw Object.assign(new Error(`Resolution must be one of ${WAN3_RESOLUTIONS.join(', ')}`), { status: 400 });
  }

  if (!WAN3_ASPECT_RATIOS.includes(aspectRatio)) {
    throw Object.assign(new Error(`Aspect ratio must be one of ${WAN3_ASPECT_RATIOS.join(', ')}`), {
      status: 400,
    });
  }

  return {
    duration: parsedDuration,
    resolution,
    aspectRatio,
  };
}
