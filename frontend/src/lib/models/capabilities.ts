// Model capability registry — UI-side only.
// Defines what fields the prompt builder shows per model.
// Backend routing (provider, modelId) lives in registry.ts.

export type AudioSubType = 'music' | 'speech' | 'sfx';
export type Resolution = '480p' | '720p' | '1080p' | '4K';

export type ModelCapabilities = {
  slug: string;
  label: string;
  providerLabel: string;
  modality: 'image' | 'video' | 'audio';
  audioSubType?: AudioSubType;

  // Prompt
  supportsNegativePrompt: boolean;
  supportsSeed: boolean;

  // Image
  supportsReferenceImages?: boolean;
  maxReferenceImages?: number;
  supportsLoRA?: boolean;
  supportsPromptUpsampling?: boolean;
  supportsSafetyTolerance?: boolean;
  supportsTextRendering?: boolean;

  // Video
  supportsT2V?: boolean;
  supportsI2V?: boolean;
  supportsV2V?: boolean;
  supportsNativeAudio?: boolean;
  supportsLipSync?: boolean;
  supportsNegativeForVideo?: boolean;
  maxDurationSeconds?: number;
  supportedResolutions?: Resolution[];

  // Audio
  supportsVoiceClone?: boolean;
  supportsStems?: boolean;
  supportsLyrics?: boolean;
  supportsReferenceTrack?: boolean;

  // When true: assembler sends aspect_ratio param; when false: sends width+height
  usesAspectRatioParam?: boolean;

  supportedAspectRatios: string[];

  parameters: {
    steps?: { min: number; max: number; default: number };
    guidanceScale?: { min: number; max: number; default: number; step: number };
    numImages?: { min: number; max: number; default: number };
    duration?: { options: number[]; default: number };
    safetyTolerance?: { min: number; max: number; default: number };
    speed?: { min: number; max: number; default: number; step: number };
    pitch?: { min: number; max: number; default: number; step: number };
    stability?: { min: number; max: number; default: number; step: number };
    similarityBoost?: { min: number; max: number; default: number; step: number };
    styleExaggeration?: { min: number; max: number; default: number; step: number };
    stylize?: { min: number; max: number; default: number };
    chaos?: { min: number; max: number; default: number };
    weird?: { min: number; max: number; default: number };
  };

  modelSpecific?: {
    styleRaw?: true;
    sampler?: true;
    scheduler?: true;
    loraSelector?: true;
    textToRender?: true;
    cameraMovement?: true;
    motionDescription?: true;
    multiShot?: true;
    endFrame?: true;
    loop?: true;
  };
};

const IMG_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'];
const VID_RATIOS = ['16:9', '9:16', '1:1'];

export const CAPABILITIES_REGISTRY: Record<string, ModelCapabilities> = {
  // ── IMAGE ──────────────────────────────────────────────────────────────────
  'flux-dev': {
    slug: 'flux-dev', label: 'Flux.1 Dev', providerLabel: 'Black Forest Labs', modality: 'image',
    supportsNegativePrompt: false, supportsSeed: true,
    supportsPromptUpsampling: true, supportsSafetyTolerance: true,
    supportedAspectRatios: IMG_RATIOS,
    parameters: {
      steps: { min: 1, max: 50, default: 28 },
      guidanceScale: { min: 1.5, max: 10, default: 3.5, step: 0.5 },
      numImages: { min: 1, max: 4, default: 1 },
      safetyTolerance: { min: 0, max: 6, default: 2 },
    },
  },
  'flux-schnell': {
    slug: 'flux-schnell', label: 'Flux.1 Schnell', providerLabel: 'Black Forest Labs', modality: 'image',
    supportsNegativePrompt: false, supportsSeed: true,
    supportsPromptUpsampling: false, supportsSafetyTolerance: false,
    supportedAspectRatios: IMG_RATIOS,
    parameters: {
      steps: { min: 1, max: 4, default: 4 },
      numImages: { min: 1, max: 4, default: 1 },
    },
  },
  'flux-1.1-pro': {
    slug: 'flux-1.1-pro', label: 'Flux 1.1 Pro', providerLabel: 'Black Forest Labs', modality: 'image',
    supportsNegativePrompt: false, supportsSeed: true,
    supportsPromptUpsampling: true, supportsSafetyTolerance: true,
    supportedAspectRatios: IMG_RATIOS,
    parameters: {
      numImages: { min: 1, max: 4, default: 1 },
      safetyTolerance: { min: 0, max: 6, default: 2 },
    },
  },
  'flux-1.1-pro-ultra': {
    slug: 'flux-1.1-pro-ultra', label: 'Flux 1.1 Pro Ultra', providerLabel: 'Black Forest Labs', modality: 'image',
    supportsNegativePrompt: false, supportsSeed: true,
    supportsPromptUpsampling: true, supportsSafetyTolerance: true,
    usesAspectRatioParam: true,
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '21:9'],
    parameters: {
      safetyTolerance: { min: 0, max: 6, default: 2 },
    },
  },
  'ideogram-v3-turbo': {
    slug: 'ideogram-v3-turbo', label: 'Ideogram v3 Turbo', providerLabel: 'Ideogram', modality: 'image',
    supportsNegativePrompt: false, supportsSeed: true,
    usesAspectRatioParam: true,
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '10:16', '16:10'],
    parameters: {},
  },
  'flux-kontext': {
    slug: 'flux-kontext', label: 'FLUX.1 Kontext', providerLabel: 'Black Forest Labs', modality: 'image',
    supportsNegativePrompt: false, supportsSeed: true,
    supportsReferenceImages: true, maxReferenceImages: 10,
    supportsPromptUpsampling: true, supportsSafetyTolerance: true,
    supportedAspectRatios: IMG_RATIOS,
    parameters: {
      steps: { min: 1, max: 50, default: 28 },
      guidanceScale: { min: 1.5, max: 10, default: 3.5, step: 0.5 },
      numImages: { min: 1, max: 4, default: 1 },
      safetyTolerance: { min: 0, max: 6, default: 2 },
    },
  },
  'flux-2-pro': {
    slug: 'flux-2-pro', label: 'FLUX.2 Pro', providerLabel: 'Black Forest Labs', modality: 'image',
    supportsNegativePrompt: false, supportsSeed: true,
    supportsPromptUpsampling: true, supportsSafetyTolerance: true,
    supportedAspectRatios: IMG_RATIOS,
    parameters: {
      steps: { min: 1, max: 50, default: 30 },
      guidanceScale: { min: 1.5, max: 10, default: 3.5, step: 0.5 },
      numImages: { min: 1, max: 4, default: 1 },
      safetyTolerance: { min: 0, max: 6, default: 2 },
    },
  },
  'sd-3.5-large': {
    slug: 'sd-3.5-large', label: 'SD 3.5 Large', providerLabel: 'Stability AI', modality: 'image',
    supportsNegativePrompt: true, supportsSeed: true, supportsLoRA: true,
    supportedAspectRatios: IMG_RATIOS,
    parameters: {
      steps: { min: 10, max: 50, default: 28 },
      guidanceScale: { min: 1, max: 10, default: 7, step: 0.5 },
      numImages: { min: 1, max: 4, default: 1 },
    },
    modelSpecific: { sampler: true, scheduler: true, loraSelector: true },
  },
  'sdxl': {
    slug: 'sdxl', label: 'SDXL', providerLabel: 'Stability AI', modality: 'image',
    supportsNegativePrompt: true, supportsSeed: true, supportsLoRA: true,
    supportedAspectRatios: IMG_RATIOS,
    parameters: {
      steps: { min: 10, max: 60, default: 30 },
      guidanceScale: { min: 1, max: 20, default: 7.5, step: 0.5 },
      numImages: { min: 1, max: 4, default: 1 },
    },
    modelSpecific: { sampler: true, scheduler: true, loraSelector: true },
  },
  'midjourney-v8': {
    slug: 'midjourney-v8', label: 'Midjourney V8', providerLabel: 'Midjourney', modality: 'image',
    supportsNegativePrompt: false, supportsSeed: false,
    supportedAspectRatios: [...IMG_RATIOS, '21:9'],
    parameters: {
      numImages: { min: 1, max: 4, default: 4 },
      stylize: { min: 0, max: 1000, default: 100 },
      chaos: { min: 0, max: 100, default: 0 },
      weird: { min: 0, max: 3000, default: 0 },
    },
    modelSpecific: { styleRaw: true },
  },
  'dall-e-4': {
    slug: 'dall-e-4', label: 'DALL-E 4', providerLabel: 'OpenAI', modality: 'image',
    supportsNegativePrompt: false, supportsSeed: false,
    supportsTextRendering: true,
    supportedAspectRatios: ['1:1', '16:9', '9:16'],
    parameters: { numImages: { min: 1, max: 4, default: 1 } },
    modelSpecific: { textToRender: true },
  },
  'imagen-4': {
    slug: 'imagen-4', label: 'Imagen 4', providerLabel: 'Google', modality: 'image',
    supportsNegativePrompt: false, supportsSeed: true,
    supportsTextRendering: true,
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    parameters: { numImages: { min: 1, max: 4, default: 1 } },
  },
  'ideogram-3': {
    slug: 'ideogram-3', label: 'Ideogram 3.0', providerLabel: 'Ideogram', modality: 'image',
    supportsNegativePrompt: true, supportsSeed: true,
    supportsTextRendering: true,
    supportedAspectRatios: IMG_RATIOS,
    parameters: { numImages: { min: 1, max: 4, default: 1 } },
    modelSpecific: { textToRender: true },
  },
  'firefly-3': {
    slug: 'firefly-3', label: 'Adobe Firefly 3', providerLabel: 'Adobe', modality: 'image',
    supportsNegativePrompt: false, supportsSeed: true,
    supportedAspectRatios: IMG_RATIOS,
    parameters: { numImages: { min: 1, max: 4, default: 1 } },
  },

  // ── VIDEO ──────────────────────────────────────────────────────────────────
  'ltx-video': {
    slug: 'ltx-video', label: 'LTX-Video', providerLabel: 'Lightricks', modality: 'video',
    supportsNegativePrompt: false, supportsSeed: true,
    supportsT2V: true, supportsI2V: false,
    supportedResolutions: ['720p'], maxDurationSeconds: 10,
    supportedAspectRatios: VID_RATIOS,
    parameters: {
      steps: { min: 10, max: 60, default: 40 },
      guidanceScale: { min: 1, max: 10, default: 3.0, step: 0.5 },
      duration: { options: [3, 5, 8, 10], default: 5 },
    },
    modelSpecific: { cameraMovement: true, motionDescription: true },
  },
  'wan-2.1': {
    slug: 'wan-2.1', label: 'Wan 2.1', providerLabel: 'WaveSpeed AI', modality: 'video',
    supportsNegativePrompt: false, supportsSeed: true,
    supportsT2V: true, supportsI2V: false,
    supportedResolutions: ['480p', '720p'], maxDurationSeconds: 8,
    supportedAspectRatios: VID_RATIOS,
    parameters: {
      steps: { min: 10, max: 50, default: 30 },
      guidanceScale: { min: 1, max: 10, default: 5.0, step: 0.5 },
      duration: { options: [3, 5, 8], default: 5 },
    },
    modelSpecific: { cameraMovement: true, motionDescription: true },
  },
  'veo-3.1': {
    slug: 'veo-3.1', label: 'Veo 3.1', providerLabel: 'Google', modality: 'video',
    supportsNegativePrompt: false, supportsSeed: true,
    supportsT2V: true, supportsI2V: true, supportsNativeAudio: true,
    supportedResolutions: ['720p', '1080p'], maxDurationSeconds: 60,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    parameters: { duration: { options: [5, 8, 15, 30, 60], default: 8 } },
    modelSpecific: { cameraMovement: true, motionDescription: true },
  },
  'runway-gen4': {
    slug: 'runway-gen4', label: 'Runway Gen-4.5', providerLabel: 'Runway', modality: 'video',
    supportsNegativePrompt: true, supportsNegativeForVideo: true, supportsSeed: true,
    supportsT2V: true, supportsI2V: true, supportsV2V: true,
    supportedResolutions: ['720p', '1080p'], maxDurationSeconds: 20,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    parameters: { duration: { options: [5, 10, 20], default: 5 } },
    modelSpecific: { cameraMovement: true, motionDescription: true },
  },
  'kling-3': {
    slug: 'kling-3', label: 'Kling 3.0', providerLabel: 'Kuaishou', modality: 'video',
    supportsNegativePrompt: true, supportsNegativeForVideo: true, supportsSeed: true,
    supportsT2V: true, supportsI2V: true, supportsNativeAudio: true,
    supportedResolutions: ['720p', '1080p'], maxDurationSeconds: 120,
    supportedAspectRatios: ['16:9', '9:16', '1:1', '4:3'],
    parameters: { duration: { options: [5, 10, 20, 60, 120], default: 5 } },
    modelSpecific: { cameraMovement: true, motionDescription: true, multiShot: true },
  },
  'sora-2': {
    slug: 'sora-2', label: 'Sora 2', providerLabel: 'OpenAI', modality: 'video',
    supportsNegativePrompt: false, supportsSeed: false,
    supportsT2V: true, supportsI2V: true, supportsNativeAudio: true,
    supportedResolutions: ['720p', '1080p'], maxDurationSeconds: 60,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    parameters: { duration: { options: [5, 10, 20, 60], default: 10 } },
    modelSpecific: { cameraMovement: true, motionDescription: true },
  },
  'seedance-2': {
    slug: 'seedance-2', label: 'Seedance 2.0', providerLabel: 'ByteDance', modality: 'video',
    supportsNegativePrompt: false, supportsSeed: true,
    supportsT2V: true, supportsI2V: true, supportsNativeAudio: true,
    supportedResolutions: ['720p', '1080p'], maxDurationSeconds: 20,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    parameters: { duration: { options: [5, 10, 20], default: 5 } },
    modelSpecific: { cameraMovement: true, motionDescription: true, multiShot: true },
  },
  'luma-ray3': {
    slug: 'luma-ray3', label: 'Luma Ray3', providerLabel: 'Luma AI', modality: 'video',
    supportsNegativePrompt: false, supportsSeed: false,
    supportsT2V: true, supportsI2V: true,
    supportedResolutions: ['720p', '1080p'], maxDurationSeconds: 20,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    parameters: { duration: { options: [5, 10, 20], default: 5 } },
    modelSpecific: { cameraMovement: true, motionDescription: true, loop: true },
  },
  'pika-2.5': {
    slug: 'pika-2.5', label: 'Pika 2.5', providerLabel: 'Pika Labs', modality: 'video',
    supportsNegativePrompt: false, supportsSeed: true,
    supportsT2V: true, supportsI2V: true,
    supportedResolutions: ['720p', '1080p'], maxDurationSeconds: 15,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    parameters: { duration: { options: [3, 5, 8, 10, 15], default: 5 } },
    modelSpecific: { cameraMovement: true, endFrame: true, loop: true },
  },
  'wan-2.6': {
    slug: 'wan-2.6', label: 'Wan 2.6', providerLabel: 'Wan', modality: 'video',
    supportsNegativePrompt: false, supportsSeed: true,
    supportsT2V: true, supportsI2V: true,
    supportedResolutions: ['720p', '1080p'], maxDurationSeconds: 15,
    supportedAspectRatios: VID_RATIOS,
    parameters: {
      steps: { min: 10, max: 50, default: 30 },
      guidanceScale: { min: 1, max: 10, default: 5.0, step: 0.5 },
      duration: { options: [3, 5, 8, 10, 15], default: 5 },
    },
    modelSpecific: { cameraMovement: true, motionDescription: true },
  },

  // ── AUDIO — Music ──────────────────────────────────────────────────────────
  'musicgen': {
    slug: 'musicgen', label: 'MusicGen', providerLabel: 'Meta', modality: 'audio', audioSubType: 'music',
    supportsNegativePrompt: false, supportsSeed: false,
    supportsLyrics: false, supportsReferenceTrack: false, supportsStems: false,
    supportedAspectRatios: [],
    parameters: { duration: { options: [15, 30, 60, 120, 240], default: 30 } },
  },
  'suno-v5.5': {
    slug: 'suno-v5.5', label: 'Suno v5.5', providerLabel: 'Suno', modality: 'audio', audioSubType: 'music',
    supportsNegativePrompt: false, supportsSeed: true,
    supportsLyrics: true, supportsReferenceTrack: true, supportsStems: false,
    supportedAspectRatios: [],
    parameters: { duration: { options: [15, 30, 60, 120, 240], default: 60 } },
  },
  'udio-v1.5': {
    slug: 'udio-v1.5', label: 'Udio v1.5', providerLabel: 'Udio', modality: 'audio', audioSubType: 'music',
    supportsNegativePrompt: false, supportsSeed: true,
    supportsLyrics: true, supportsReferenceTrack: true, supportsStems: true,
    supportedAspectRatios: [],
    parameters: { duration: { options: [15, 30, 60, 120, 240], default: 60 } },
  },
  'elevenlabs-music': {
    slug: 'elevenlabs-music', label: 'EL Eleven Music', providerLabel: 'ElevenLabs', modality: 'audio', audioSubType: 'music',
    supportsNegativePrompt: false, supportsSeed: true,
    supportsLyrics: false, supportsReferenceTrack: false,
    supportedAspectRatios: [],
    parameters: { duration: { options: [15, 30, 60], default: 30 } },
  },
  'lyria-3': {
    slug: 'lyria-3', label: 'Google Lyria 3 Pro', providerLabel: 'Google', modality: 'audio', audioSubType: 'music',
    supportsNegativePrompt: false, supportsSeed: true,
    supportsLyrics: false, supportsReferenceTrack: false,
    supportedAspectRatios: [],
    parameters: { duration: { options: [15, 30, 60, 120], default: 30 } },
  },
  'stable-audio-2.5': {
    slug: 'stable-audio-2.5', label: 'Stable Audio 2.5', providerLabel: 'Stability AI', modality: 'audio', audioSubType: 'music',
    supportsNegativePrompt: true, supportsSeed: true,
    supportsLyrics: false, supportsReferenceTrack: false,
    supportedAspectRatios: [],
    parameters: {
      steps: { min: 10, max: 100, default: 50 },
      guidanceScale: { min: 1, max: 10, default: 7, step: 0.5 },
      duration: { options: [15, 30, 60, 120], default: 30 },
    },
  },

  // ── AUDIO — Speech ─────────────────────────────────────────────────────────
  'f5-tts': {
    slug: 'f5-tts', label: 'F5-TTS', providerLabel: 'Open Source', modality: 'audio', audioSubType: 'speech',
    supportsNegativePrompt: false, supportsSeed: false, supportsVoiceClone: true,
    supportedAspectRatios: [],
    parameters: {
      steps: { min: 8, max: 64, default: 32 },
      speed: { min: 0.5, max: 2.0, default: 1.0, step: 0.1 },
    },
  },
  'elevenlabs-tts': {
    slug: 'elevenlabs-tts', label: 'ElevenLabs TTS', providerLabel: 'ElevenLabs', modality: 'audio', audioSubType: 'speech',
    supportsNegativePrompt: false, supportsSeed: false, supportsVoiceClone: true,
    supportedAspectRatios: [],
    parameters: {
      speed: { min: 0.5, max: 2.0, default: 1.0, step: 0.1 },
      stability: { min: 0, max: 1, default: 0.5, step: 0.05 },
      similarityBoost: { min: 0, max: 1, default: 0.75, step: 0.05 },
      styleExaggeration: { min: 0, max: 1, default: 0.0, step: 0.05 },
    },
  },
  'play-ht': {
    slug: 'play-ht', label: 'Play.ht', providerLabel: 'Play.ht', modality: 'audio', audioSubType: 'speech',
    supportsNegativePrompt: false, supportsSeed: false, supportsVoiceClone: true,
    supportedAspectRatios: [],
    parameters: { speed: { min: 0.5, max: 2.0, default: 1.0, step: 0.1 } },
  },
  'resemble-ai': {
    slug: 'resemble-ai', label: 'Resemble AI', providerLabel: 'Resemble AI', modality: 'audio', audioSubType: 'speech',
    supportsNegativePrompt: false, supportsSeed: false, supportsVoiceClone: true,
    supportedAspectRatios: [],
    parameters: {
      speed: { min: 0.5, max: 2.0, default: 1.0, step: 0.1 },
      pitch: { min: -20, max: 20, default: 0, step: 1 },
    },
  },
};

const DEFAULT_CAPS: ModelCapabilities = {
  slug: '', label: 'Unknown Model', providerLabel: '', modality: 'image',
  supportsNegativePrompt: false, supportsSeed: true,
  supportedAspectRatios: IMG_RATIOS,
  parameters: {
    steps: { min: 1, max: 50, default: 28 },
    guidanceScale: { min: 1, max: 10, default: 3.5, step: 0.5 },
    numImages: { min: 1, max: 4, default: 1 },
  },
};

export function getCapabilities(slug: string): ModelCapabilities {
  return CAPABILITIES_REGISTRY[slug] ?? { ...DEFAULT_CAPS, slug };
}
