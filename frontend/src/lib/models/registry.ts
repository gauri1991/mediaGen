import type { ProviderName } from '@/lib/providers/types';

// Model registry — TypeScript object, not a DB table.
// Verified against provider catalogs as of 2026-05.
// Re-verify modelId strings if a model stops working — providers rename/version them.

export type ModelConfig = {
  label: string;
  modality: 'image' | 'video' | 'audio';
  defaultProvider: ProviderName;
  providers: Partial<Record<ProviderName, {
    modelId: string;    // provider-specific model identifier
    costEstimate: number; // USD per generation (approximate)
  }>>;
  // Default parameters shown in the UI for this model
  defaults: Record<string, unknown>;
  // Coming-soon models are shown in the picker but disabled
  comingSoon?: boolean;
};

export const modelRegistry: Record<string, ModelConfig> = {
  // ── Image ──────────────────────────────────────────────────────────────────
  'flux-dev': {
    label: 'Flux.1 Dev',
    modality: 'image',
    defaultProvider: 'replicate',
    providers: {
      replicate: {
        // https://replicate.com/black-forest-labs/flux-dev
        modelId: 'black-forest-labs/flux-dev',
        costEstimate: 0.025,
      },
      akashml: {
        // TODO: verify exact modelId on AkashML once API key is available
        modelId: 'flux.1-dev',
        costEstimate: 0.012,
      },
    },
    defaults: {
      width: 1024,
      height: 1024,
      num_inference_steps: 28,
      guidance: 3.5,
      output_format: 'webp',
      output_quality: 90,
    },
  },

  'flux-schnell': {
    label: 'Flux.1 Schnell',
    modality: 'image',
    defaultProvider: 'replicate',
    providers: {
      replicate: {
        // https://replicate.com/black-forest-labs/flux-schnell
        modelId: 'black-forest-labs/flux-schnell',
        costEstimate: 0.003,
      },
    },
    defaults: {
      width: 1024,
      height: 1024,
      num_inference_steps: 4,
      output_format: 'webp',
      output_quality: 90,
    },
  },

  // ── Video ──────────────────────────────────────────────────────────────────
  'ltx-video': {
    label: 'LTX-Video',
    modality: 'video',
    defaultProvider: 'replicate',
    providers: {
      replicate: {
        // https://replicate.com/lightricks/ltx-video
        // Wan 2.2 not confirmed on Replicate at time of writing; using LTX-Video as fallback
        modelId: 'lightricks/ltx-video',
        costEstimate: 0.08,
      },
    },
    defaults: {
      width: 768,
      height: 512,
      num_frames: 97,       // ~4s at 24fps
      num_inference_steps: 40,
      guidance_scale: 3.0,
      output_format: 'mp4',
    },
  },

  'wan-2.1': {
    label: 'Wan 2.1',
    modality: 'video',
    defaultProvider: 'replicate',
    providers: {
      replicate: {
        // https://replicate.com/wavespeedai/wan-2.1-t2v-480p
        // NOTE: Wan 2.2 not found on Replicate at registry build time; using 2.1
        modelId: 'wavespeedai/wan-2.1-t2v-480p',
        costEstimate: 0.09,
      },
    },
    defaults: {
      width: 832,
      height: 480,
      num_frames: 81,
      num_inference_steps: 30,
      guidance_scale: 5.0,
    },
  },

  // ── Audio ──────────────────────────────────────────────────────────────────
  'musicgen': {
    label: 'MusicGen',
    modality: 'audio',
    defaultProvider: 'replicate',
    providers: {
      replicate: {
        // https://replicate.com/meta/musicgen
        modelId: 'meta/musicgen',
        costEstimate: 0.016,
      },
    },
    defaults: {
      duration: 30,
      model_version: 'stereo-large',
      output_format: 'mp3',
      top_k: 250,
      top_p: 0.0,
      temperature: 1.0,
      classifier_free_guidance: 3.0,
    },
  },

  'f5-tts': {
    label: 'F5-TTS',
    modality: 'audio',
    defaultProvider: 'replicate',
    providers: {
      replicate: {
        // https://replicate.com/lucataco/f5-tts
        modelId: 'lucataco/f5-tts',
        costEstimate: 0.008,
      },
    },
    defaults: {
      speed: 1.0,
      nfe_step: 32,
    },
  },

  // ── Coming soon — image ────────────────────────────────────────────────────
  'flux-kontext': {
    label: 'FLUX.1 Kontext', modality: 'image', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'flux-2-pro': {
    label: 'FLUX.2 Pro', modality: 'image', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'sd-3.5-large': {
    label: 'SD 3.5 Large', modality: 'image', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'sdxl': {
    label: 'SDXL', modality: 'image', defaultProvider: 'replicate',
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
  'imagen-4': {
    label: 'Imagen 4', modality: 'image', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'ideogram-3': {
    label: 'Ideogram 3.0', modality: 'image', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'firefly-3': {
    label: 'Adobe Firefly 3', modality: 'image', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },

  // ── Coming soon — video ────────────────────────────────────────────────────
  'veo-3.1': {
    label: 'Veo 3.1', modality: 'video', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'runway-gen4': {
    label: 'Runway Gen-4.5', modality: 'video', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'kling-3': {
    label: 'Kling 3.0', modality: 'video', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'sora-2': {
    label: 'Sora 2', modality: 'video', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'seedance-2': {
    label: 'Seedance 2.0', modality: 'video', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'luma-ray3': {
    label: 'Luma Ray3', modality: 'video', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'pika-2.5': {
    label: 'Pika 2.5', modality: 'video', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'wan-2.6': {
    label: 'Wan 2.6', modality: 'video', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },

  // ── Coming soon — audio (music) ────────────────────────────────────────────
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
  'stable-audio-2.5': {
    label: 'Stable Audio 2.5', modality: 'audio', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },

  // ── Coming soon — audio (speech) ───────────────────────────────────────────
  'elevenlabs-tts': {
    label: 'ElevenLabs TTS', modality: 'audio', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'play-ht': {
    label: 'Play.ht', modality: 'audio', defaultProvider: 'replicate',
    providers: {}, defaults: {}, comingSoon: true,
  },
  'resemble-ai': {
    label: 'Resemble AI', modality: 'audio', defaultProvider: 'replicate',
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
