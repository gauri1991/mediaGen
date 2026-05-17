'use client';

import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ChipGroup } from './fields/ChipGroup';
import { SeedField } from './fields/SeedField';
import { AdvancedSection } from './fields/AdvancedSection';
import { TooltipSlider } from './fields/TooltipSlider';
import type { VideoFormState } from '@/lib/prompt-assembler';
import { videoAspectDims } from '@/lib/prompt-assembler';
import type { ModelCapabilities } from '@/lib/models/capabilities';

const STYLES = [
  { label: 'Cinematic', value: 'Cinematic' }, { label: 'Documentary', value: 'Documentary' },
  { label: 'Anime', value: 'Anime' }, { label: 'Photoreal', value: 'Photoreal' },
  { label: 'Surreal', value: 'Surreal' }, { label: 'Stop-motion', value: 'Stop-motion' },
];

const CAMERA_MOVEMENTS = [
  { label: 'Static', value: 'static' }, { label: 'Pan left', value: 'Pan left' },
  { label: 'Pan right', value: 'Pan right' }, { label: 'Tilt up', value: 'Tilt up' },
  { label: 'Tilt down', value: 'Tilt down' }, { label: 'Zoom in', value: 'Zoom in' },
  { label: 'Zoom out', value: 'Zoom out' }, { label: 'Dolly', value: 'Dolly' },
  { label: 'Orbit', value: 'Orbit' }, { label: 'Tracking', value: 'Tracking shot' },
  { label: 'Handheld', value: 'Handheld' },
];

const SUBJECT_MOTIONS = [
  { label: 'Still', value: 'still' }, { label: 'Subtle', value: 'subtle' },
  { label: 'Moderate', value: 'moderate' }, { label: 'Dynamic', value: 'dynamic' },
  { label: 'High action', value: 'high action' },
];

const RESOLUTIONS: { label: string; value: '480p' | '720p' | '1080p' | '4K' }[] = [
  { label: '480p', value: '480p' }, { label: '720p', value: '720p' },
  { label: '1080p', value: '1080p' }, { label: '4K', value: '4K' },
];

const FRAME_RATES = [{ label: '24 fps', value: '24' }, { label: '30 fps', value: '30' }];

interface VideoFormProps {
  state: VideoFormState;
  caps: ModelCapabilities;
  onChange: (patch: Partial<VideoFormState>) => void;
  disabled?: boolean;
}

export function VideoForm({ state, caps, onChange, disabled = false }: VideoFormProps) {
  const durationOpts = (caps.parameters.duration?.options ?? [5, 10, 20]).map((d) => ({
    label: d >= 60 ? `${d / 60}m` : `${d}s`,
    value: String(d),
  }));

  const aspectOptions = (caps.supportedAspectRatios.length > 0
    ? caps.supportedAspectRatios
    : ['16:9', '9:16', '1:1']
  ).map((r) => ({ label: r, value: r }));

  const resOptions = RESOLUTIONS.filter((r) =>
    !caps.supportedResolutions || caps.supportedResolutions.includes(r.value)
  );

  function setAspect(value: string) {
    const dims = videoAspectDims(value, state.resolution);
    onChange({ aspectRatio: value, width: dims.width, height: dims.height });
  }

  function setResolution(value: string) {
    const dims = videoAspectDims(state.aspectRatio, value);
    onChange({ resolution: value as VideoFormState['resolution'], width: dims.width, height: dims.height });
  }

  const videoModeOpts = [
    { label: 'Text to Video', value: 't2v' },
    ...(caps.supportsI2V ? [{ label: 'Image to Video', value: 'i2v' }] : []),
    ...(caps.supportsV2V ? [{ label: 'Video to Video', value: 'v2v' }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Mode */}
      {videoModeOpts.length > 1 && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Mode</Label>
          <ChipGroup options={videoModeOpts} value={state.videoMode} onChange={(v) => onChange({ videoMode: v as VideoFormState['videoMode'] })} cols={3} />
        </div>
      )}

      {/* Scene */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Scene description <span className="text-red-400">*</span></Label>
        <Textarea
          rows={3}
          placeholder="Describe what happens in the video…"
          value={state.sceneDescription}
          onChange={(e) => onChange({ sceneDescription: e.target.value })}
          disabled={disabled}
          className="resize-none text-sm"
        />
      </div>

      {/* Style */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Style</Label>
        <ChipGroup options={STYLES} value={state.style} onChange={(v) => onChange({ style: v })} cols={3} />
      </div>

      {/* Aspect ratio + duration */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Aspect ratio</Label>
          <ChipGroup options={aspectOptions} value={state.aspectRatio} onChange={setAspect} cols={2} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Duration</Label>
          <ChipGroup options={durationOpts} value={String(state.duration)} onChange={(v) => onChange({ duration: Number(v) })} cols={2} />
        </div>
      </div>

      {/* Resolution + Frame rate */}
      <div className="grid grid-cols-2 gap-3">
        {resOptions.length > 1 && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Resolution</Label>
            <ChipGroup options={resOptions} value={state.resolution} onChange={setResolution} cols={2} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Frame rate</Label>
          <ChipGroup options={FRAME_RATES} value={String(state.frameRate)} onChange={(v) => onChange({ frameRate: Number(v) as 24 | 30 })} cols={2} />
        </div>
      </div>

      {/* Camera */}
      {caps.modelSpecific?.cameraMovement && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Camera movement</Label>
          <ChipGroup options={CAMERA_MOVEMENTS} value={state.cameraMovement} onChange={(v) => onChange({ cameraMovement: v })} cols={3} />
        </div>
      )}

      {/* Subject motion */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Subject motion</Label>
        <ChipGroup options={SUBJECT_MOTIONS} value={state.subjectMotion} onChange={(v) => onChange({ subjectMotion: v })} cols={3} />
      </div>

      {/* Motion description */}
      {caps.modelSpecific?.motionDescription && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Motion description</Label>
          <Input
            placeholder="e.g. wind blowing leaves, rain falling"
            value={state.motionDescription}
            onChange={(e) => onChange({ motionDescription: e.target.value })}
            disabled={disabled}
            className="h-8 text-sm"
          />
        </div>
      )}

      {/* Audio (native audio models only) */}
      {caps.supportsNativeAudio && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Audio</Label>
          <ChipGroup
            options={[
              { label: 'None', value: 'none' },
              { label: 'Auto-generate', value: 'native' },
              ...(caps.supportsLipSync ? [{ label: 'Lip-sync', value: 'lipsync' }] : []),
            ]}
            value={state.audioMode}
            onChange={(v) => onChange({ audioMode: v as VideoFormState['audioMode'] })}
            cols={3}
          />
          {state.audioMode === 'native' && (
            <Input
              placeholder="Describe the audio: ambient forest, dramatic orchestra…"
              value={state.audioDescription}
              onChange={(e) => onChange({ audioDescription: e.target.value })}
              disabled={disabled}
              className="h-8 text-sm"
            />
          )}
          {state.audioMode === 'lipsync' && (
            <Textarea
              rows={2}
              placeholder="Dialogue for lip-sync…"
              value={state.dialogue}
              onChange={(e) => onChange({ dialogue: e.target.value })}
              disabled={disabled}
              className="resize-none text-sm"
            />
          )}
        </div>
      )}

      {/* Advanced */}
      <AdvancedSection>
        {caps.parameters.steps && (
          <TooltipSlider
            label="Steps" tooltip="More denoising steps = higher quality but slower."
            value={state.steps} min={caps.parameters.steps.min} max={caps.parameters.steps.max}
            onChange={(v) => onChange({ steps: v })}
          />
        )}
        {caps.parameters.guidanceScale && (
          <TooltipSlider
            label="CFG scale" tooltip="How strictly the model adheres to your prompt."
            value={state.guidanceScale} min={caps.parameters.guidanceScale.min} max={caps.parameters.guidanceScale.max} step={0.5}
            format={(v) => v.toFixed(1)}
            onChange={(v) => onChange({ guidanceScale: v })}
          />
        )}
        {caps.supportsNegativeForVideo && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Negative prompt</Label>
            <Textarea
              rows={2}
              placeholder="What to avoid in the video…"
              value={state.negativePrompt}
              onChange={(e) => onChange({ negativePrompt: e.target.value })}
              disabled={disabled}
              className="resize-none text-sm"
            />
          </div>
        )}
        {caps.supportsSeed && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Seed</Label>
            <SeedField value={state.seed} onChange={(v) => onChange({ seed: v })} />
          </div>
        )}
        {caps.modelSpecific?.loop && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Loop</p>
              <p className="text-xs text-muted-foreground/60">Make the video loop seamlessly</p>
            </div>
            <Switch checked={state.loop} onCheckedChange={(v) => onChange({ loop: v })} />
          </div>
        )}
        {caps.modelSpecific?.multiShot && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Multi-shot</p>
              <p className="text-xs text-muted-foreground/60">Generate multiple camera angles</p>
            </div>
            <Switch checked={state.multiShot} onCheckedChange={(v) => onChange({ multiShot: v })} />
          </div>
        )}
      </AdvancedSection>
    </div>
  );
}
