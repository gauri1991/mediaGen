// Pure function: form state + model slug → { prompt, negativePrompt, params }
// No side effects. Import getCapabilities only for param defaults.

export type BuilderMode = 'guided' | 'raw' | 'hybrid';
export type AudioSubType = 'music' | 'speech' | 'sfx';

// ── Image ─────────────────────────────────────────────────────────────────────

export interface ImageFormState {
  subject: string;
  style: string;
  setting: string;
  lighting: string;
  mood: string;
  composition: string;
  // Advanced
  qualityPreset: 'draft' | 'standard' | 'high' | 'ultra';
  steps: number;
  guidanceScale: number;
  seed: number | null;
  numImages: number;
  negativePrompt: string;
  outputFormat: 'png' | 'jpeg' | 'webp';
  aspectRatio: string;
  width: number;
  height: number;
  // Model-specific
  safetyTolerance: number;
  stylize: number;
  chaos: number;
  weird: number;
  styleRaw: boolean;
  promptUpsampling: boolean;
  textToRender: string;
}

export const DEFAULT_IMAGE_STATE: ImageFormState = {
  subject: '', style: '', setting: '', lighting: '', mood: '', composition: '',
  qualityPreset: 'standard', steps: 28, guidanceScale: 3.5, seed: null,
  numImages: 1, negativePrompt: '', outputFormat: 'webp',
  aspectRatio: '1:1', width: 1024, height: 1024,
  safetyTolerance: 2, stylize: 100, chaos: 0, weird: 0,
  styleRaw: false, promptUpsampling: false, textToRender: '',
};

// ── Video ─────────────────────────────────────────────────────────────────────

export interface VideoFormState {
  videoMode: 't2v' | 'i2v' | 'v2v';
  sceneDescription: string;
  style: string;
  aspectRatio: string;
  width: number;
  height: number;
  duration: number;
  resolution: '480p' | '720p' | '1080p' | '4K';
  frameRate: 24 | 30;
  cameraMovement: string;
  cameraIntensity: number;
  subjectMotion: string;
  motionDescription: string;
  audioMode: 'none' | 'native' | 'lipsync';
  audioDescription: string;
  dialogue: string;
  // Advanced
  negativePrompt: string;
  seed: number | null;
  cfgScale: number;
  loop: boolean;
  multiShot: boolean;
  steps: number;
  guidanceScale: number;
}

export const DEFAULT_VIDEO_STATE: VideoFormState = {
  videoMode: 't2v', sceneDescription: '', style: '',
  aspectRatio: '16:9', width: 1280, height: 720,
  duration: 5, resolution: '720p', frameRate: 24,
  cameraMovement: 'static', cameraIntensity: 2,
  subjectMotion: 'moderate', motionDescription: '',
  audioMode: 'none', audioDescription: '', dialogue: '',
  negativePrompt: '', seed: null, cfgScale: 3.0,
  loop: false, multiShot: false, steps: 40, guidanceScale: 3.0,
};

// ── Audio ─────────────────────────────────────────────────────────────────────

export interface MusicFormState {
  description: string;
  genres: string[];
  moods: string[];
  tempo: string;
  duration: number;
  vocals: 'instrumental' | 'female' | 'male' | 'duet' | 'choir';
  vocalStyle: string;
  lyricsMode: 'auto' | 'custom' | 'none';
  lyrics: string;
  instruments: string[];
  seed: number | null;
  outputFormat: 'mp3' | 'wav' | 'flac';
  steps: number;
  guidanceScale: number;
}

export const DEFAULT_MUSIC_STATE: MusicFormState = {
  description: '', genres: [], moods: [], tempo: 'mid',
  duration: 30, vocals: 'instrumental', vocalStyle: '',
  lyricsMode: 'none', lyrics: '', instruments: [],
  seed: null, outputFormat: 'mp3', steps: 50, guidanceScale: 7,
};

export interface SpeechFormState {
  text: string;
  voice: string;
  emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'excited' | 'whisper';
  speed: number;
  pitch: number;
  stability: number;
  similarityBoost: number;
  styleExaggeration: number;
  outputFormat: 'mp3' | 'wav' | 'flac';
  steps: number;
}

export const DEFAULT_SPEECH_STATE: SpeechFormState = {
  text: '', voice: 'alloy', emotion: 'neutral',
  speed: 1.0, pitch: 0,
  stability: 0.5, similarityBoost: 0.75, styleExaggeration: 0.0,
  outputFormat: 'mp3', steps: 32,
};

export interface SfxFormState {
  description: string;
  duration: number;
  loop: boolean;
  seed: number | null;
  outputFormat: 'mp3' | 'wav' | 'flac';
}

export const DEFAULT_SFX_STATE: SfxFormState = {
  description: '', duration: 5, loop: false, seed: null, outputFormat: 'mp3',
};

export interface AudioFormState {
  audioSubType: AudioSubType;
  music: MusicFormState;
  speech: SpeechFormState;
  sfx: SfxFormState;
}

export const DEFAULT_AUDIO_STATE: AudioFormState = {
  audioSubType: 'music',
  music: DEFAULT_MUSIC_STATE,
  speech: DEFAULT_SPEECH_STATE,
  sfx: DEFAULT_SFX_STATE,
};

// ── Builder output ────────────────────────────────────────────────────────────

export interface BuilderOutput {
  prompt: string;
  negativePrompt: string;
  params: Record<string, unknown>;
}

// ── Aspect ratio helpers ──────────────────────────────────────────────────────

const ASPECT_RATIO_DIMS: Record<string, { width: number; height: number }> = {
  '1:1':  { width: 1024, height: 1024 },
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768,  height: 1344 },
  '4:3':  { width: 1152, height: 896 },
  '3:4':  { width: 896,  height: 1152 },
  '3:2':  { width: 1216, height: 832 },
  '2:3':  { width: 832,  height: 1216 },
  '21:9': { width: 1536, height: 640 },
};

export function aspectRatioDims(ratio: string): { width: number; height: number } {
  return ASPECT_RATIO_DIMS[ratio] ?? { width: 1024, height: 1024 };
}

const VIDEO_ASPECT_DIMS: Record<string, Record<string, { width: number; height: number }>> = {
  '16:9': { '480p': { width: 854, height: 480 }, '720p': { width: 1280, height: 720 }, '1080p': { width: 1920, height: 1080 } },
  '9:16': { '480p': { width: 480, height: 854 }, '720p': { width: 720, height: 1280 }, '1080p': { width: 1080, height: 1920 } },
  '1:1':  { '480p': { width: 480, height: 480 }, '720p': { width: 720, height: 720 },  '1080p': { width: 1080, height: 1080 } },
  '4:3':  { '480p': { width: 640, height: 480 }, '720p': { width: 960, height: 720 },  '1080p': { width: 1440, height: 1080 } },
};

export function videoAspectDims(ratio: string, res: string): { width: number; height: number } {
  return VIDEO_ASPECT_DIMS[ratio]?.[res] ?? { width: 1280, height: 720 };
}

// ── Assemblers ────────────────────────────────────────────────────────────────

export function assembleImagePrompt(state: ImageFormState): string {
  const parts: string[] = [];
  if (state.composition) parts.push(state.composition.toLowerCase());
  if (state.subject) parts.push(state.subject.trim());
  if (state.style) parts.push(`${state.style.toLowerCase()} style`);
  if (state.setting) parts.push(`in ${state.setting}`);
  if (state.lighting) parts.push(`${state.lighting.toLowerCase()} lighting`);
  if (state.mood) parts.push(`${state.mood.toLowerCase()} mood`);
  return parts.join(', ');
}

export function assembleVideoPrompt(state: VideoFormState): string {
  const parts: string[] = [];
  if (state.cameraMovement && state.cameraMovement !== 'static') {
    parts.push(state.cameraMovement.toLowerCase());
  }
  if (state.sceneDescription) parts.push(state.sceneDescription.trim());
  if (state.style) parts.push(`${state.style.toLowerCase()} style`);
  if (state.subjectMotion && state.subjectMotion !== 'moderate') {
    parts.push(`${state.subjectMotion.toLowerCase()} movement`);
  }
  if (state.motionDescription) parts.push(state.motionDescription.trim());
  if (state.audioDescription && state.audioMode === 'native') {
    parts.push(`with ${state.audioDescription}`);
  }
  return parts.join(', ');
}

export function assembleMusicPrompt(state: MusicFormState): string {
  const parts: string[] = [];
  if (state.description) parts.push(state.description.trim());
  if (state.genres.length) parts.push(state.genres.join('/'));
  if (state.moods.length) parts.push(state.moods.join(', ').toLowerCase());
  if (state.tempo) {
    const tempoLabel: Record<string, string> = {
      slow: 'slow tempo (60-80 BPM)', mid: 'mid tempo (80-120 BPM)',
      fast: 'fast tempo (120-160 BPM)', vfast: 'very fast tempo (160+ BPM)',
    };
    if (tempoLabel[state.tempo]) parts.push(tempoLabel[state.tempo]);
  }
  if (state.vocals !== 'instrumental') parts.push(`${state.vocals} vocals`);
  else parts.push('instrumental');
  if (state.vocalStyle && state.vocals !== 'instrumental') parts.push(`${state.vocalStyle} vocal style`);
  if (state.instruments.length) parts.push(state.instruments.join(', '));
  return parts.join(', ');
}

function assembleSpeechPrompt(state: SpeechFormState): string {
  return state.text.trim();
}

function assembleSfxPrompt(state: SfxFormState): string {
  return state.description.trim();
}

// ── Main assembler ────────────────────────────────────────────────────────────

export function assembleImage(state: ImageFormState): BuilderOutput {
  const prompt = assembleImagePrompt(state);
  const dims = aspectRatioDims(state.aspectRatio);
  const params: Record<string, unknown> = {
    width: dims.width,
    height: dims.height,
    num_inference_steps: state.steps,
    guidance: state.guidanceScale,
    num_outputs: state.numImages,
    output_format: state.outputFormat,
  };
  if (state.seed !== null) params.seed = state.seed;
  if (state.safetyTolerance != null) params.safety_tolerance = state.safetyTolerance;
  if (state.promptUpsampling) params.prompt_upsampling = true;
  // Midjourney-style params (will be converted to --flags by backend)
  if (state.stylize !== 100) params.stylize = state.stylize;
  if (state.chaos > 0) params.chaos = state.chaos;
  if (state.weird > 0) params.weird = state.weird;
  if (state.styleRaw) params.style_raw = true;
  return { prompt, negativePrompt: state.negativePrompt, params };
}

export function assembleVideo(state: VideoFormState): BuilderOutput {
  const prompt = assembleVideoPrompt(state);
  const dims = videoAspectDims(state.aspectRatio, state.resolution);
  const params: Record<string, unknown> = {
    width: dims.width,
    height: dims.height,
    duration: state.duration,
    fps: state.frameRate,
    num_inference_steps: state.steps,
    guidance_scale: state.cfgScale,
  };
  if (state.seed !== null) params.seed = state.seed;
  if (state.loop) params.loop = true;
  if (state.multiShot) params.multi_shot = true;
  return { prompt, negativePrompt: state.negativePrompt, params };
}

export function assembleMusic(state: MusicFormState): BuilderOutput {
  const prompt = assembleMusicPrompt(state);
  const params: Record<string, unknown> = {
    duration: state.duration,
    output_format: state.outputFormat,
  };
  if (state.seed !== null) params.seed = state.seed;
  if (state.lyricsMode === 'custom' && state.lyrics.trim()) params.lyrics = state.lyrics.trim();
  return { prompt, negativePrompt: '', params };
}

export function assembleSpeech(state: SpeechFormState): BuilderOutput {
  const prompt = assembleSpeechPrompt(state);
  const params: Record<string, unknown> = {
    voice: state.voice,
    emotion: state.emotion,
    speed: state.speed,
    output_format: state.outputFormat,
  };
  if (state.pitch !== 0) params.pitch = state.pitch;
  if (state.stability !== 0.5) params.stability = state.stability;
  if (state.similarityBoost !== 0.75) params.similarity_boost = state.similarityBoost;
  if (state.styleExaggeration !== 0) params.style_exaggeration = state.styleExaggeration;
  return { prompt, negativePrompt: '', params };
}

export function assembleSfx(state: SfxFormState): BuilderOutput {
  const prompt = assembleSfxPrompt(state);
  const params: Record<string, unknown> = { duration: state.duration, output_format: state.outputFormat };
  if (state.seed !== null) params.seed = state.seed;
  if (state.loop) params.loop = true;
  return { prompt, negativePrompt: '', params };
}

export function assembleAudio(state: AudioFormState): BuilderOutput {
  switch (state.audioSubType) {
    case 'music': return assembleMusic(state.music);
    case 'speech': return assembleSpeech(state.speech);
    case 'sfx': return assembleSfx(state.sfx);
  }
}

// ── Presets ───────────────────────────────────────────────────────────────────

export interface Preset {
  id: string;
  label: string;
  modality: 'image' | 'video' | 'audio';
  audioSubType?: AudioSubType;
  image?: Partial<ImageFormState>;
  video?: Partial<VideoFormState>;
  music?: Partial<MusicFormState>;
  speech?: Partial<SpeechFormState>;
  sfx?: Partial<SfxFormState>;
}

export const BUILT_IN_PRESETS: Preset[] = [
  // Image
  {
    id: 'img-cinematic-portrait', label: 'Cinematic Portrait', modality: 'image',
    image: { style: 'Cinematic', lighting: 'Dramatic', mood: 'Cinematic', composition: 'Portrait' },
  },
  {
    id: 'img-product-shot', label: 'Product Shot', modality: 'image',
    image: { style: 'Photo', setting: 'white marble surface, studio', lighting: 'Studio', mood: 'Minimalist', composition: 'Close-up' },
  },
  {
    id: 'img-dark-fantasy', label: 'Dark Fantasy', modality: 'image',
    image: { style: 'Concept Art', lighting: 'Volumetric', mood: 'Dark', composition: 'Wide shot' },
  },
  // Video
  {
    id: 'vid-dramatic-reveal', label: 'Dramatic Reveal', modality: 'video',
    video: { style: 'Cinematic', cameraMovement: 'Dolly', cameraIntensity: 3, subjectMotion: 'still' },
  },
  {
    id: 'vid-nature-doc', label: 'Nature Documentary', modality: 'video',
    video: { style: 'Documentary', cameraMovement: 'Tracking shot', subjectMotion: 'subtle' },
  },
  {
    id: 'vid-urban-timelapse', label: 'Urban Time-lapse', modality: 'video',
    video: { style: 'Cinematic', cameraMovement: 'Static', subjectMotion: 'dynamic', motionDescription: 'time-lapse of traffic and people' },
  },
  // Music
  {
    id: 'aud-lofi', label: 'Lo-fi Study Beats', modality: 'audio', audioSubType: 'music',
    music: { genres: ['Lo-fi', 'Hip-hop'], moods: ['Calm'], tempo: 'slow', vocals: 'instrumental', instruments: ['Piano', 'Bass'] },
  },
  {
    id: 'aud-epic-trailer', label: 'Epic Trailer', modality: 'audio', audioSubType: 'music',
    music: { genres: ['Cinematic'], moods: ['Epic', 'Uplifting'], tempo: 'fast', vocals: 'choir', instruments: ['Strings', 'Brass', 'Drums'] },
  },
  {
    id: 'aud-ambient', label: 'Ambient Forest', modality: 'audio', audioSubType: 'music',
    music: { genres: ['Ambient'], moods: ['Calm', 'Mysterious'], tempo: 'slow', vocals: 'instrumental' },
  },
  // Speech
  {
    id: 'spk-podcast', label: 'Podcast Narration', modality: 'audio', audioSubType: 'speech',
    speech: { emotion: 'neutral', speed: 1.0 },
  },
  {
    id: 'spk-promo', label: 'Energetic Promo', modality: 'audio', audioSubType: 'speech',
    speech: { emotion: 'excited', speed: 1.1 },
  },
  {
    id: 'spk-meditation', label: 'Calm Meditation', modality: 'audio', audioSubType: 'speech',
    speech: { emotion: 'neutral', speed: 0.85 },
  },
];
