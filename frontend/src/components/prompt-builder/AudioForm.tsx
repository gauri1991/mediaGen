'use client';

import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ChipGroup } from './fields/ChipGroup';
import { MultiSelect } from './fields/MultiSelect';
import { SeedField } from './fields/SeedField';
import { AdvancedSection } from './fields/AdvancedSection';
import { TooltipSlider } from './fields/TooltipSlider';
import type { AudioFormState, MusicFormState, SpeechFormState, SfxFormState } from '@/lib/prompt-assembler';
import type { ModelCapabilities } from '@/lib/models/capabilities';

const GENRES = ['Pop', 'Rock', 'EDM', 'Hip-hop', 'Jazz', 'Classical', 'Ambient', 'Folk', 'R&B', 'Country', 'Metal', 'Lo-fi', 'Cinematic'];
const MOODS = ['Happy', 'Sad', 'Energetic', 'Calm', 'Dark', 'Epic', 'Romantic', 'Mysterious', 'Uplifting'];
const INSTRUMENTS = ['Guitar', 'Piano', 'Synth', 'Drums', 'Strings', 'Brass', 'Bass', 'Choir', 'Flute', 'Violin'];
const TEMPOS = [
  { label: 'Slow (60-80)', value: 'slow' }, { label: 'Mid (80-120)', value: 'mid' },
  { label: 'Fast (120-160)', value: 'fast' }, { label: 'Very fast (160+)', value: 'vfast' },
];
const VOCALS = [
  { label: 'Instrumental', value: 'instrumental' }, { label: 'Female', value: 'female' },
  { label: 'Male', value: 'male' }, { label: 'Duet', value: 'duet' }, { label: 'Choir', value: 'choir' },
];
const VOCAL_STYLES = [
  { label: 'Smooth', value: 'Smooth' }, { label: 'Raspy', value: 'Raspy' },
  { label: 'Operatic', value: 'Operatic' }, { label: 'Whisper', value: 'Whisper' },
  { label: 'Rap', value: 'Rap' }, { label: 'Spoken', value: 'Spoken' },
];
const EMOTIONS = [
  { label: 'Neutral', value: 'neutral' }, { label: 'Happy', value: 'happy' },
  { label: 'Sad', value: 'sad' }, { label: 'Angry', value: 'angry' },
  { label: 'Excited', value: 'excited' }, { label: 'Whisper', value: 'whisper' },
];
const OUTPUT_FORMATS = [
  { label: 'MP3', value: 'mp3' }, { label: 'WAV', value: 'wav' }, { label: 'FLAC', value: 'flac' },
];
const LYRICS_MODES = [
  { label: 'None', value: 'none' }, { label: 'Auto-generate', value: 'auto' }, { label: 'Write my own', value: 'custom' },
];

// ── Music sub-form ─────────────────────────────────────────────────────────────

function MusicForm({
  state, caps, onChange, disabled,
}: { state: MusicFormState; caps: ModelCapabilities; onChange: (p: Partial<MusicFormState>) => void; disabled: boolean }) {
  const durationOpts = (caps.parameters.duration?.options ?? [15, 30, 60]).map((d) => ({
    label: d >= 60 ? `${d / 60}m` : `${d}s`,
    value: String(d),
  }));

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Description <span className="text-red-400">*</span></Label>
        <Textarea
          rows={3}
          placeholder="Describe the music you want…"
          value={state.description}
          onChange={(e) => onChange({ description: e.target.value })}
          disabled={disabled}
          className="resize-none text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Genre</Label>
        <MultiSelect options={GENRES} value={state.genres} onChange={(v) => onChange({ genres: v })} max={5} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Mood</Label>
        <MultiSelect options={MOODS} value={state.moods} onChange={(v) => onChange({ moods: v })} max={4} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Tempo</Label>
        <ChipGroup options={TEMPOS} value={state.tempo} onChange={(v) => onChange({ tempo: v })} cols={2} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Duration</Label>
        <ChipGroup options={durationOpts} value={String(state.duration)} onChange={(v) => onChange({ duration: Number(v) })} cols={4} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Vocals</Label>
        <ChipGroup options={VOCALS} value={state.vocals} onChange={(v) => onChange({ vocals: v as MusicFormState['vocals'] })} cols={3} />
      </div>

      {state.vocals !== 'instrumental' && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Vocal style</Label>
          <ChipGroup options={VOCAL_STYLES} value={state.vocalStyle} onChange={(v) => onChange({ vocalStyle: v })} cols={3} />
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Instruments</Label>
        <MultiSelect options={INSTRUMENTS} value={state.instruments} onChange={(v) => onChange({ instruments: v })} max={6} />
      </div>

      {caps.supportsLyrics && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Lyrics</Label>
          <ChipGroup options={LYRICS_MODES} value={state.lyricsMode} onChange={(v) => onChange({ lyricsMode: v as MusicFormState['lyricsMode'] })} cols={3} />
          {state.lyricsMode === 'custom' && (
            <Textarea
              rows={4}
              placeholder="Paste or write your lyrics here…"
              value={state.lyrics}
              onChange={(e) => onChange({ lyrics: e.target.value })}
              disabled={disabled}
              className="resize-none text-sm font-mono"
            />
          )}
        </div>
      )}

      <AdvancedSection>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Output format</Label>
          <ChipGroup
            options={caps.supportsStems ? [...OUTPUT_FORMATS, { label: 'Stems', value: 'stems' }] : OUTPUT_FORMATS}
            value={state.outputFormat}
            onChange={(v) => onChange({ outputFormat: v as MusicFormState['outputFormat'] })}
            cols={4}
          />
        </div>
        {caps.parameters.steps && (
          <TooltipSlider
            label="Steps" tooltip="Higher steps improve audio quality."
            value={state.steps} min={caps.parameters.steps.min} max={caps.parameters.steps.max}
            onChange={(v) => onChange({ steps: v })}
          />
        )}
        {caps.supportsSeed && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Seed</Label>
            <SeedField value={state.seed} onChange={(v) => onChange({ seed: v })} />
          </div>
        )}
      </AdvancedSection>
    </div>
  );
}

// ── Speech sub-form ────────────────────────────────────────────────────────────

function SpeechForm({
  state, caps, onChange, disabled,
}: { state: SpeechFormState; caps: ModelCapabilities; onChange: (p: Partial<SpeechFormState>) => void; disabled: boolean }) {
  const speedRange = caps.parameters.speed ?? { min: 0.5, max: 2.0, default: 1.0, step: 0.1 };
  const pitchRange = caps.parameters.pitch;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Text <span className="text-red-400">*</span></Label>
        <Textarea
          rows={4}
          placeholder="Enter the text to convert to speech…"
          value={state.text}
          onChange={(e) => onChange({ text: e.target.value })}
          disabled={disabled}
          className="resize-none text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Voice</Label>
        <Input
          placeholder="Voice ID or name (e.g. alloy, nova…)"
          value={state.voice}
          onChange={(e) => onChange({ voice: e.target.value })}
          disabled={disabled}
          className="h-8 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Emotion</Label>
        <ChipGroup options={EMOTIONS} value={state.emotion} onChange={(v) => onChange({ emotion: v as SpeechFormState['emotion'] })} cols={3} />
      </div>

      <TooltipSlider
        label="Speed" tooltip="Speech rate multiplier. 1.0 = normal speed."
        value={state.speed} min={speedRange.min} max={speedRange.max} step={speedRange.step}
        format={(v) => `${v.toFixed(1)}×`}
        onChange={(v) => onChange({ speed: v })}
      />

      {pitchRange && (
        <TooltipSlider
          label="Pitch" tooltip="Pitch shift in semitones. 0 = unchanged."
          value={state.pitch} min={pitchRange.min} max={pitchRange.max} step={pitchRange.step}
          format={(v) => (v > 0 ? `+${v}` : String(v))}
          onChange={(v) => onChange({ pitch: v })}
        />
      )}

      <AdvancedSection>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Output format</Label>
          <ChipGroup options={OUTPUT_FORMATS} value={state.outputFormat} onChange={(v) => onChange({ outputFormat: v as SpeechFormState['outputFormat'] })} cols={3} />
        </div>
        {caps.parameters.stability && (
          <TooltipSlider
            label="Stability" tooltip="Low = expressive & variable. High = stable & consistent."
            value={state.stability} min={0} max={1} step={0.05}
            format={(v) => v.toFixed(2)}
            onChange={(v) => onChange({ stability: v })}
          />
        )}
        {caps.parameters.similarityBoost && (
          <TooltipSlider
            label="Similarity boost" tooltip="How closely to match the reference voice."
            value={state.similarityBoost} min={0} max={1} step={0.05}
            format={(v) => v.toFixed(2)}
            onChange={(v) => onChange({ similarityBoost: v })}
          />
        )}
        {caps.parameters.styleExaggeration && (
          <TooltipSlider
            label="Style exaggeration" tooltip="Amplifies the voice's speaking style. 0 = neutral."
            value={state.styleExaggeration} min={0} max={1} step={0.05}
            format={(v) => v.toFixed(2)}
            onChange={(v) => onChange({ styleExaggeration: v })}
          />
        )}
      </AdvancedSection>
    </div>
  );
}

// ── SFX sub-form ───────────────────────────────────────────────────────────────

function SfxForm({
  state, caps, onChange, disabled,
}: { state: SfxFormState; caps: ModelCapabilities; onChange: (p: Partial<SfxFormState>) => void; disabled: boolean }) {
  const durationOpts = [1, 3, 5, 10, 15, 30].map((d) => ({ label: `${d}s`, value: String(d) }));

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Sound description <span className="text-red-400">*</span></Label>
        <Textarea
          rows={3}
          placeholder="e.g. thunder rumbling in the distance, rain on glass…"
          value={state.description}
          onChange={(e) => onChange({ description: e.target.value })}
          disabled={disabled}
          className="resize-none text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Duration</Label>
        <ChipGroup options={durationOpts} value={String(state.duration)} onChange={(v) => onChange({ duration: Number(v) })} cols={4} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Loop</p>
          <p className="text-xs text-muted-foreground/60">Make the sound effect loop seamlessly</p>
        </div>
        <Switch checked={state.loop} onCheckedChange={(v) => onChange({ loop: v })} />
      </div>

      <AdvancedSection>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Output format</Label>
          <ChipGroup options={OUTPUT_FORMATS} value={state.outputFormat} onChange={(v) => onChange({ outputFormat: v as SfxFormState['outputFormat'] })} cols={3} />
        </div>
        {caps.supportsSeed && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Seed</Label>
            <SeedField value={state.seed} onChange={(v) => onChange({ seed: v })} />
          </div>
        )}
      </AdvancedSection>
    </div>
  );
}

// ── Main AudioForm ─────────────────────────────────────────────────────────────

interface AudioFormProps {
  state: AudioFormState;
  caps: ModelCapabilities;
  onChange: (patch: Partial<AudioFormState>) => void;
  disabled?: boolean;
}

export function AudioForm({ state, caps, onChange, disabled = false }: AudioFormProps) {
  const subType = caps.audioSubType ?? state.audioSubType;

  const SUB_TYPES = [
    { label: 'Music', value: 'music' },
    { label: 'Speech', value: 'speech' },
    { label: 'Sound FX', value: 'sfx' },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Type</Label>
        <ChipGroup
          options={SUB_TYPES}
          value={subType}
          onChange={(v) => onChange({ audioSubType: v as AudioFormState['audioSubType'] })}
          cols={3}
        />
      </div>

      {subType === 'music' && (
        <MusicForm
          state={state.music}
          caps={caps}
          onChange={(p) => onChange({ music: { ...state.music, ...p } })}
          disabled={disabled}
        />
      )}
      {subType === 'speech' && (
        <SpeechForm
          state={state.speech}
          caps={caps}
          onChange={(p) => onChange({ speech: { ...state.speech, ...p } })}
          disabled={disabled}
        />
      )}
      {subType === 'sfx' && (
        <SfxForm
          state={state.sfx}
          caps={caps}
          onChange={(p) => onChange({ sfx: { ...state.sfx, ...p } })}
          disabled={disabled}
        />
      )}
    </div>
  );
}
