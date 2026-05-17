'use client';

import { useState, useEffect, useCallback } from 'react';
import { ImageForm } from './ImageForm';
import { VideoForm } from './VideoForm';
import { AudioForm } from './AudioForm';
import { PromptPreview } from './PromptPreview';
import { PresetSelector, savePresetToStorage } from './PresetSelector';
import {
  DEFAULT_IMAGE_STATE, DEFAULT_VIDEO_STATE, DEFAULT_AUDIO_STATE,
  assembleImage, assembleVideo, assembleAudio,
  type ImageFormState, type VideoFormState, type AudioFormState,
  type BuilderOutput, type Preset, type BuilderMode,
} from '@/lib/prompt-assembler';
import { getCapabilities } from '@/lib/models/capabilities';

const STORAGE_KEY = 'mediagen_builder_state';

type Modality = 'image' | 'video' | 'audio';

interface PromptBuilderProps {
  modality: Modality;
  modelSlug: string;
  disabled?: boolean;
  onChange: (output: BuilderOutput) => void;
}

const MODE_LABELS: { value: BuilderMode; label: string }[] = [
  { value: 'guided', label: 'Guided' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'raw', label: 'Raw' },
];

function loadState<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  return fallback;
}

function saveState(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function PromptBuilder({ modality, modelSlug, disabled = false, onChange }: PromptBuilderProps) {
  const caps = getCapabilities(modelSlug);

  const [mode, setMode] = useState<BuilderMode>(() =>
    typeof window !== 'undefined'
      ? (localStorage.getItem(`${STORAGE_KEY}_mode`) as BuilderMode) ?? 'guided'
      : 'guided'
  );
  const [imageState, setImageState] = useState<ImageFormState>(() =>
    loadState(`${STORAGE_KEY}_image`, DEFAULT_IMAGE_STATE)
  );
  const [videoState, setVideoState] = useState<VideoFormState>(() =>
    loadState(`${STORAGE_KEY}_video`, DEFAULT_VIDEO_STATE)
  );
  const [audioState, setAudioState] = useState<AudioFormState>(() =>
    loadState(`${STORAGE_KEY}_audio`, DEFAULT_AUDIO_STATE)
  );
  const [rawPrompt, setRawPrompt] = useState('');
  const [hybridOverride, setHybridOverride] = useState<string | null>(null);

  // ── Assemble output ──────────────────────────────────────────────────────────

  const assembled: BuilderOutput = (() => {
    if (modality === 'image') return assembleImage(imageState, caps);
    if (modality === 'video') return assembleVideo(videoState);
    return assembleAudio(audioState);
  })();

  const finalPrompt = mode === 'raw'
    ? rawPrompt
    : mode === 'hybrid' && hybridOverride !== null
      ? hybridOverride
      : assembled.prompt;

  const output: BuilderOutput = {
    prompt: finalPrompt,
    negativePrompt: mode === 'raw' ? '' : assembled.negativePrompt,
    params: mode === 'raw' ? {} : assembled.params,
  };

  // Notify parent on every change
  useEffect(() => {
    onChange(output);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalPrompt, assembled.negativePrompt, JSON.stringify(assembled.params)]);

  // ── Persist form state ───────────────────────────────────────────────────────

  useEffect(() => { saveState(`${STORAGE_KEY}_image`, imageState); }, [imageState]);
  useEffect(() => { saveState(`${STORAGE_KEY}_video`, videoState); }, [videoState]);
  useEffect(() => { saveState(`${STORAGE_KEY}_audio`, audioState); }, [audioState]);
  useEffect(() => { saveState(`${STORAGE_KEY}_mode`, mode); }, [mode]);

  // ── Preset apply ─────────────────────────────────────────────────────────────

  const applyPreset = useCallback((preset: Preset) => {
    if (modality === 'image' && preset.image) {
      setImageState((s) => ({ ...s, ...preset.image }));
    } else if (modality === 'video' && preset.video) {
      setVideoState((s) => ({ ...s, ...preset.video }));
    } else if (modality === 'audio') {
      const sub = preset.audioSubType ?? audioState.audioSubType;
      if (sub === 'music' && preset.music) {
        setAudioState((s) => ({ ...s, audioSubType: 'music', music: { ...s.music, ...preset.music } }));
      } else if (sub === 'speech' && preset.speech) {
        setAudioState((s) => ({ ...s, audioSubType: 'speech', speech: { ...s.speech, ...preset.speech } }));
      } else if (sub === 'sfx' && preset.sfx) {
        setAudioState((s) => ({ ...s, audioSubType: 'sfx', sfx: { ...s.sfx, ...preset.sfx } }));
      }
    }
  }, [modality, audioState.audioSubType]);

  const saveCurrentAsPreset = useCallback((label: string) => {
    const preset: Preset = {
      id: `custom_${Date.now()}`,
      label,
      modality,
      audioSubType: modality === 'audio' ? audioState.audioSubType : undefined,
      image: modality === 'image' ? imageState : undefined,
      video: modality === 'video' ? videoState : undefined,
      music: modality === 'audio' && audioState.audioSubType === 'music' ? audioState.music : undefined,
      speech: modality === 'audio' && audioState.audioSubType === 'speech' ? audioState.speech : undefined,
      sfx: modality === 'audio' && audioState.audioSubType === 'sfx' ? audioState.sfx : undefined,
    };
    savePresetToStorage(preset);
  }, [modality, imageState, videoState, audioState]);

  // ── Render ───────────────────────────────────────────────────────────────────

  const audioSubType = modality === 'audio' ? audioState.audioSubType : undefined;

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden bg-muted/30 p-0.5 gap-0.5">
        {MODE_LABELS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={[
              'flex-1 py-1 text-xs font-medium rounded-md transition-all',
              mode === value
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Presets (not shown in Raw mode) */}
      {mode !== 'raw' && (
        <PresetSelector
          modality={modality}
          audioSubType={audioSubType}
          onSelect={applyPreset}
          onSave={saveCurrentAsPreset}
        />
      )}

      {/* Form or textarea */}
      {mode === 'raw' ? (
        <div className="space-y-2">
          <textarea
            value={rawPrompt}
            onChange={(e) => setRawPrompt(e.target.value)}
            rows={5}
            placeholder="Describe what you want to generate…"
            disabled={disabled}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-muted-foreground/50"
          />
          <div className="flex justify-end">
            <span className="text-xs text-muted-foreground/60">{rawPrompt.length}/2000</span>
          </div>
        </div>
      ) : (
        <>
          {modality === 'image' && (
            <ImageForm
              state={imageState}
              caps={caps}
              onChange={(p) => { setImageState((s) => ({ ...s, ...p })); setHybridOverride(null); }}
              disabled={disabled}
            />
          )}
          {modality === 'video' && (
            <VideoForm
              state={videoState}
              caps={caps}
              onChange={(p) => { setVideoState((s) => ({ ...s, ...p })); setHybridOverride(null); }}
              disabled={disabled}
            />
          )}
          {modality === 'audio' && (
            <AudioForm
              state={audioState}
              caps={caps}
              onChange={(p) => { setAudioState((s) => ({ ...s, ...p })); setHybridOverride(null); }}
              disabled={disabled}
            />
          )}

          {/* Live preview */}
          <PromptPreview
            prompt={finalPrompt}
            editable={mode === 'hybrid'}
            onEdit={(v) => setHybridOverride(v)}
          />
        </>
      )}
    </div>
  );
}
