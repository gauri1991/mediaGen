import type { ProviderName } from '@/lib/providers/types';

// Model registry — TypeScript object, not a DB table.
// Verified against Replicate catalog 2026-05.
// Re-verify modelId strings if a model stops working — providers rename/version them.

export type ModelConfig = {
  label: string;
  modality: 'image' | 'video' | 'audio';
  defaultProvider: ProviderName;
  providers: Partial<Record<ProviderName, {
    modelId: string;
    costEstimate: number;
  }>>;
  defaults: Record<string, unknown>;
  comingSoon?: boolean;
};

export const modelRegistry: Record<string, ModelConfig> = {
  // ── Image — Flux ───────────────────────────────────────────────────────────
  'flux-schnell': {
    label: 'Flux.1 Schnell',
    modality: 'image',
    defaultProvider: 'replicate',
    providers: {
      replicate: { modelId: 'black-forest-labs/flux-schnell', costEstimate: 0.003 },
      fal:       { modelId: 'fal-ai/flux/schnell', costEstimate: 0.003 },
    },
    defaults: {
      width: 1024, height: 1024,
      num_inference_steps: 4,
      output_format: 'webp', output_quality: 90,
    },
  },

  'flux-dev': {
    label: 'Flux.1 Dev',
    modality: 'image',
    defaultProvider: 'replicate',
    providers: {
      replicate: { modelId: 'black-forest-labs/flux-dev', costEstimate: 0.025 },
      fal:       { modelId: 'fal-ai/flux/dev', costEstimate: 0.025 },
      akashml:   { modelId: 'flux.1-dev', costEstimate: 0.012 },
    },
    defaults: {
      width: 1024, height: 1024,
      num_inference_steps: 28, guidance: 3.5,
      output_format: 'webp', output_quality: 90,
    },
  },

  'flux-1.1-pro': {
    label: 'Flux 1.1 Pro',
    modality: 'image',
    defaultProvider: 'replicate',
    providers: {
      replicate: { modelId: 'black-forest-labs/flux-1.1-pro', costEstimate: 0.04 },
      fal:       { modelId: 'fal-ai/flux-pro/v1.1', costEstimate: 0.04 },
    },
    defaults: {
      width: 1024, height: 1024,
      output_format: 'webp', output_quality: 90,
      safety_tolerance: 2,
    },
  },

  'flux-1.1-pro-ultra': {
    label: 'Flux 1.1 Pro Ultra',
    modality: 'image',
    defaultProvider: 'replicate',
    providers: {
      replicate: { modelId: 'black-forest-labs/flux-1.1-pro-ultra', costEstimate: 0.06 },
      fal:       { modelId: 'fal-ai/flux-pro/v1.1-ultra', costEstimate: 0.06 },
    },
    defaults: {
      aspect_ratio: '1:1',
      output_format: 'jpg', output_quality: 90,
      safety_tolerance: 2,
    },
  },

  'flux-2-pro': {
    label: 'Flux 2 Pro',
    modality: 'image',
    defaultProvider: 'replicate',
    providers: {
      replicate: { modelId: 'black-forest-labs/flux-2-pro', costEstimate: 0.05 },
    },
    defaults: {
      width: 1024, height: 1024,
      output_format: 'webp', output_quality: 90,
      safety_tolerance: 2,
    },
  },

  // ── Image — Stability AI ───────────────────────────────────────────────────
  'sd-3.5-large': {
    label: 'SD 3.5 Large',
    modality: 'image',
    defaultProvider: 'replicate',
    providers: {
      replicate: { modelId: 'stability-ai/stable-diffusion-3.5-large', costEstimate: 0.035 },
      fal:       { modelId: 'fal-ai/stable-diffusion-v35-large', costEstimate: 0.035 },
    },
    defaults: {
      width: 1024, height: 1024,
      num_inference_steps: 28, guidance_scale: 4.5,
      output_format: 'webp', output_quality: 90,
    },
  },

  'sdxl': {
    label: 'SDXL',
    modality: 'image',
    defaultProvider: 'replicate',
    providers: {
      replicate: { modelId: 'stability-ai/sdxl', costEstimate: 0.0043 },
    },
    defaults: {
      width: 1024, height: 1024,
      num_inference_steps: 25, guidance_scale: 7.5,
      refine: 'expert_ensemble_refiner', high_noise_frac: 0.8,
    },
  },

  // ── Image — Other ──────────────────────────────────────────────────────────
  'ideogram-v3-turbo': {
    label: 'Ideogram v3 Turbo',
    modality: 'image',
    defaultProvider: 'replicate',
    providers: {
      replicate: { modelId: 'ideogram-ai/ideogram-v3-turbo', costEstimate: 0.03 },
      fal:       { modelId: 'fal-ai/ideogram/v3-turbo', costEstimate: 0.03 },
    },
    defaults: {
      aspect_ratio: '1:1',
      magic_prompt_option: 'Auto',
    },
  },

  // Coming soon — image
  'flux-kontext': {
    label: 'FLUX.1 Kontext', modality: 'image', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'imagen-4': {
    label: 'Imagen 4', modality: 'image', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'recraft-v4': {
    label: 'Recraft v4', modality: 'image', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'midjourney-v8': {
    label: 'Midjourney V8', modality: 'image', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'dall-e-4': {
    label: 'DALL-E 4', modality: 'image', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'firefly-3': {
    label: 'Adobe Firefly 3', modality: 'image', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },

  // ── Video ─────────────────────────────────────────────────────────────────
  'ltx-video': {
    label: 'LTX-Video',
    modality: 'video',
    defaultProvider: 'replicate',
    providers: {
      replicate: { modelId: 'lightricks/ltx-video', costEstimate: 0.08 },
      fal:       { modelId: 'fal-ai/ltx-video', costEstimate: 0.08 },
    },
    defaults: {
      width: 768, height: 512, num_frames: 97,
      num_inference_steps: 40, guidance_scale: 3.0,
    },
  },

  'wan-2.1': {
    label: 'Wan 2.1',
    modality: 'video',
    defaultProvider: 'replicate',
    providers: {
      replicate: { modelId: 'wavespeedai/wan-2.1-t2v-480p', costEstimate: 0.09 },
    },
    defaults: {
      width: 832, height: 480, num_frames: 81,
      num_inference_steps: 30, guidance_scale: 5.0,
    },
  },

  'wan-2.7': {
    label: 'Wan 2.7',
    modality: 'video',
    defaultProvider: 'replicate',
    providers: {
      replicate: { modelId: 'wan-video/wan-2.7-t2v', costEstimate: 0.12 },
    },
    defaults: {
      num_frames: 81, num_inference_steps: 30, guidance_scale: 5.0,
      aspect_ratio: '16:9',
    },
  },

  'hailuo-2.3': {
    label: 'Hailuo 2.3',
    modality: 'video',
    defaultProvider: 'replicate',
    providers: {
      replicate: { modelId: 'minimax/hailuo-2.3', costEstimate: 0.15 },
    },
    defaults: {
      duration: 6,
      resolution: '1280x720',
    },
  },

  'hailuo-2.3-fast': {
    label: 'Hailuo 2.3 Fast',
    modality: 'video',
    defaultProvider: 'replicate',
    providers: {
      replicate: { modelId: 'minimax/hailuo-2.3-fast', costEstimate: 0.08 },
    },
    defaults: {
      duration: 6,
      resolution: '512x512',
    },
  },

  'kling-v3': {
    label: 'Kling v3',
    modality: 'video',
    defaultProvider: 'replicate',
    providers: {
      replicate: { modelId: 'kwaivgi/kling-v3-video', costEstimate: 0.14 },
    },
    defaults: {
      duration: 5,
      aspect_ratio: '16:9',
      cfg_scale: 0.5,
    },
  },

  // Coming soon — video
  'veo-3.1': {
    label: 'Veo 3.1', modality: 'video', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'runway-gen4': {
    label: 'Runway Gen-4.5', modality: 'video', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'seedance-2': {
    label: 'Seedance 2.0', modality: 'video', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'sora-2': {
    label: 'Sora 2', modality: 'video', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'pika-2.5': {
    label: 'Pika 2.5', modality: 'video', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },

  // ── Audio — Music ─────────────────────────────────────────────────────────
  'musicgen': {
    label: 'MusicGen',
    modality: 'audio',
    defaultProvider: 'replicate',
    providers: {
      replicate: { modelId: 'meta/musicgen', costEstimate: 0.016 },
      fal:       { modelId: 'fal-ai/musicgen', costEstimate: 0.016 },
    },
    defaults: {
      duration: 30, model_version: 'stereo-large',
      output_format: 'mp3', top_k: 250, top_p: 0.0,
      temperature: 1.0, classifier_free_guidance: 3.0,
    },
  },

  'minimax-music': {
    label: 'MiniMax Music 2.6',
    modality: 'audio',
    defaultProvider: 'replicate',
    providers: {
      replicate: { modelId: 'minimax/music-2.6', costEstimate: 0.02 },
    },
    defaults: {
      duration: 30,
      bitrate: 128,
    },
  },

  'stable-audio-2.5': {
    label: 'Stable Audio 2.5',
    modality: 'audio',
    defaultProvider: 'replicate',
    providers: {
      replicate: { modelId: 'stability-ai/stable-audio-2.5', costEstimate: 0.02 },
    },
    defaults: {
      seconds_total: 30,
      steps: 100,
    },
  },

  // ── Audio — Speech ────────────────────────────────────────────────────────
  'f5-tts': {
    label: 'F5-TTS',
    modality: 'audio',
    defaultProvider: 'replicate',
    providers: {
      replicate: { modelId: 'lucataco/f5-tts', costEstimate: 0.008 },
      fal:       { modelId: 'fal-ai/f5-tts', costEstimate: 0.008 },
    },
    defaults: { speed: 1.0, nfe_step: 32 },
  },

  // Coming soon — audio
  'suno-v5.5': {
    label: 'Suno v5.5', modality: 'audio', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'udio-v1.5': {
    label: 'Udio v1.5', modality: 'audio', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'elevenlabs-music': {
    label: 'EL Eleven Music', modality: 'audio', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'lyria-3': {
    label: 'Google Lyria 3 Pro', modality: 'audio', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'elevenlabs-tts': {
    label: 'ElevenLabs TTS', modality: 'audio', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
};

export type ModelSlug = keyof typeof modelRegistry;

export function getModel(slug: string): ModelConfig {
  const m = modelRegistry[slug];
  if (!m) throw new Error(`Unknown model: ${slug}`);
  return m;
}

export function modelsByModality(modality: 'image' | 'video' | 'audio'): Array<{ slug: string; config: ModelConfig }> {
  return Object.entries(modelRegistry)
    .filter(([, c]) => c.modality === modality)
    .map(([slug, config]) => ({ slug, config }));
}
