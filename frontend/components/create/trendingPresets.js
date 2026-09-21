import { STUDIO_CHARACTER_SWAP_PROMPT } from './prompts/studioCharacterSwap';

export const TRENDING_PRESETS = [
  {
    id: 'hotel-lobby',
    title: 'HOTEL LOBBY',
    description: 'Swap both performers into the HOTEL LOBBY clip.',
    trending: true,
    inputMode: 'swap',
    aspectRatio: '9:16',
    duration: 15,
    previewVideo: '/presets/hotel-lobby.mp4',
    basePrompt: STUDIO_CHARACTER_SWAP_PROMPT,
  },
  {
    id: 'on-the-radar',
    title: 'On The Radar',
    description: 'Swap both performers into the On The Radar clip.',
    trending: true,
    inputMode: 'swap',
    aspectRatio: '9:16',
    duration: 15,
    previewVideo: '/presets/on-the-radar.mp4',
    basePrompt: STUDIO_CHARACTER_SWAP_PROMPT,
  },
  {
    id: 'desk-hot-take',
    title: 'Desk hot take',
    description: 'Fast-cut creator rant with punchy energy.',
    trending: true,
    inputMode: 'simple',
    styleId: 'hot-take',
    aspectRatio: '9:16',
    duration: 10,
    accent: 'linear-gradient(160deg, #3f1d1d 0%, #ea580c 50%, #fbbf24 100%)',
    basePrompt:
      'High-energy creator hot take for X. Tight framing, quick gestures, confident delivery, punchy pacing, bold opinion energy. Use the uploaded person as the main character, matching their appearance.',
  },
  {
    id: 'rooftop-story',
    title: 'Rooftop story beat',
    description: 'Mini arc with setup, tension, and payoff.',
    trending: true,
    inputMode: 'simple',
    styleId: 'story',
    aspectRatio: '9:16',
    duration: 15,
    accent: 'linear-gradient(160deg, #0f172a 0%, #334155 40%, #f97316 100%)',
    basePrompt:
      'Short cinematic story beat for X creators. Clear setup, rising tension, emotional payoff, golden-hour rooftop atmosphere. Use the uploaded person as the main character, matching their appearance.',
  },
  {
    id: 'product-showcase',
    title: 'Product showcase',
    description: 'Premium flex with clean motion and lighting.',
    trending: false,
    inputMode: 'simple',
    styleId: 'showcase',
    aspectRatio: '9:16',
    duration: 8,
    accent: 'linear-gradient(160deg, #111827 0%, #4b5563 45%, #a855f7 100%)',
    basePrompt:
      'Premium creator showcase clip for X. Clean camera motion, aspirational lighting, product-forward composition, luxury social ad feel. Use the uploaded person as the main character, matching their appearance.',
  },
  {
    id: 'mirror-reveal',
    title: 'Mirror reveal',
    description: 'Character turn with a dramatic hook reveal.',
    trending: true,
    inputMode: 'simple',
    styleId: 'hook',
    aspectRatio: '9:16',
    duration: 5,
    accent: 'linear-gradient(160deg, #18181b 0%, #52525b 50%, #22d3ee 100%)',
    basePrompt:
      'Scroll-stopping vertical clip for X. Mirror reflection reveal, dramatic turn to camera, immediate hook in the first second. Use the uploaded person as the main character, matching their appearance.',
  },
  {
    id: 'street-interview',
    title: 'Street interview',
    description: 'Handheld mic moment with viral clip energy.',
    trending: false,
    inputMode: 'simple',
    styleId: 'story',
    aspectRatio: '9:16',
    duration: 10,
    accent: 'linear-gradient(160deg, #052e16 0%, #166534 45%, #fde047 100%)',
    basePrompt:
      'Viral street interview style clip for X. Handheld camera, natural daylight, candid reactions, authentic social documentary feel. Use the uploaded person as the main character, matching their appearance.',
  },
];

export function getTrendingPreset(id) {
  return TRENDING_PRESETS.find(preset => preset.id === id) || null;
}
