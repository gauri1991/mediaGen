'use client';

import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ChipGroup } from './fields/ChipGroup';
import { SeedField } from './fields/SeedField';
import { AdvancedSection } from './fields/AdvancedSection';
import { TooltipSlider } from './fields/TooltipSlider';
import type { ImageFormState } from '@/lib/prompt-assembler';
import { aspectRatioDims } from '@/lib/prompt-assembler';
import type { ModelCapabilities } from '@/lib/models/capabilities';

const STYLES = [
  { label: 'Photo', value: 'Photo' },
  { label: 'Cinematic', value: 'Cinematic' },
  { label: 'Illustration', value: 'Illustration' },
  { label: '3D Render', value: '3D Render' },
  { label: 'Anime', value: 'Anime' },
  { label: 'Watercolor', value: 'Watercolor' },
  { label: 'Oil Painting', value: 'Oil Painting' },
  { label: 'Concept Art', value: 'Concept Art' },
  { label: 'Pixel Art', value: 'Pixel Art' },
];

const LIGHTINGS = [
  { label: 'Golden hour', value: 'Golden hour' },
  { label: 'Studio', value: 'Studio' },
  { label: 'Neon', value: 'Neon' },
  { label: 'Natural', value: 'Natural daylight' },
  { label: 'Dramatic', value: 'Dramatic' },
  { label: 'Soft', value: 'Soft' },
  { label: 'Backlit', value: 'Backlit' },
  { label: 'Volumetric', value: 'Volumetric' },
];

const MOODS = [
  { label: 'Serene', value: 'Serene' },
  { label: 'Energetic', value: 'Energetic' },
  { label: 'Dark', value: 'Dark' },
  { label: 'Whimsical', value: 'Whimsical' },
  { label: 'Cinematic', value: 'Cinematic' },
  { label: 'Minimalist', value: 'Minimalist' },
];

const COMPOSITIONS = [
  { label: 'Close-up', value: 'Close-up' },
  { label: 'Wide shot', value: 'Wide shot' },
  { label: 'Portrait', value: 'Portrait' },
  { label: 'Macro', value: 'Macro' },
  { label: 'Aerial', value: 'Aerial' },
  { label: 'POV', value: 'POV' },
];

const ASPECT_RATIOS = [
  { label: '1:1', value: '1:1' }, { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' }, { label: '4:3', value: '4:3' },
  { label: '3:4', value: '3:4' }, { label: '3:2', value: '3:2' },
  { label: '2:3', value: '2:3' }, { label: '21:9', value: '21:9' },
];

const OUTPUT_FORMATS = [
  { label: 'WebP', value: 'webp' }, { label: 'PNG', value: 'png' }, { label: 'JPEG', value: 'jpeg' },
];

const QUALITY_PRESETS: Record<string, number> = { draft: 8, standard: 20, high: 32, ultra: 50 };
const SAMPLERS = ['Euler', 'DPM2', 'DPM++ 2M Karras', 'LMS', 'DDIM'];

interface ImageFormProps {
  state: ImageFormState;
  caps: ModelCapabilities;
  onChange: (patch: Partial<ImageFormState>) => void;
  disabled?: boolean;
}

export function ImageForm({ state, caps, onChange, disabled = false }: ImageFormProps) {
  const aspectOptions = ASPECT_RATIOS.filter((r) =>
    caps.supportedAspectRatios.length === 0 || caps.supportedAspectRatios.includes(r.value)
  );
  const stepsRange = caps.parameters.steps;
  const guideRange = caps.parameters.guidanceScale;
  const safetyRange = caps.parameters.safetyTolerance;
  const numImgRange = caps.parameters.numImages;

  function setAspect(value: string) {
    const dims = aspectRatioDims(value);
    onChange({ aspectRatio: value, width: dims.width, height: dims.height });
  }

  function setQuality(preset: string) {
    const steps = QUALITY_PRESETS[preset] ?? state.steps;
    onChange({ qualityPreset: preset as ImageFormState['qualityPreset'], steps });
  }

  return (
    <div className="space-y-4">
      {/* Subject */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Subject <span className="text-red-400">*</span></Label>
        <Textarea
          rows={3}
          placeholder="Describe your subject…"
          value={state.subject}
          onChange={(e) => onChange({ subject: e.target.value })}
          disabled={disabled}
          className="resize-none text-sm"
        />
      </div>

      {/* Style */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Style</Label>
        <ChipGroup options={STYLES} value={state.style} onChange={(v) => onChange({ style: v })} cols={3} />
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Aspect Ratio</Label>
        <ChipGroup options={aspectOptions} value={state.aspectRatio} onChange={setAspect} cols={4} />
      </div>

      {/* Setting */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Setting / Background</Label>
        <Input
          placeholder="e.g. neon-lit Tokyo street at night"
          value={state.setting}
          onChange={(e) => onChange({ setting: e.target.value })}
          disabled={disabled}
          className="h-8 text-sm"
        />
      </div>

      {/* Lighting */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Lighting</Label>
        <ChipGroup options={LIGHTINGS} value={state.lighting} onChange={(v) => onChange({ lighting: v })} cols={4} />
      </div>

      {/* Mood + Composition — side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Mood</Label>
          <ChipGroup options={MOODS} value={state.mood} onChange={(v) => onChange({ mood: v })} cols={2} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Composition</Label>
          <ChipGroup options={COMPOSITIONS} value={state.composition} onChange={(v) => onChange({ composition: v })} cols={2} />
        </div>
      </div>

      {/* Advanced */}
      <AdvancedSection>
        {/* Quality preset */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Quality</Label>
          <ChipGroup
            options={[
              { label: 'Draft', value: 'draft' }, { label: 'Standard', value: 'standard' },
              { label: 'High', value: 'high' }, { label: 'Ultra', value: 'ultra' },
            ]}
            value={state.qualityPreset}
            onChange={setQuality}
            cols={4}
          />
        </div>

        {stepsRange && (
          <TooltipSlider
            label="Steps" tooltip="More steps = higher quality but slower generation."
            value={state.steps} min={stepsRange.min} max={stepsRange.max}
            onChange={(v) => onChange({ steps: v })}
          />
        )}

        {guideRange && (
          <TooltipSlider
            label="Guidance" tooltip="How closely the model follows your prompt. Higher = more literal."
            value={state.guidanceScale} min={guideRange.min} max={guideRange.max} step={guideRange.step ?? 0.5}
            format={(v) => v.toFixed(1)}
            onChange={(v) => onChange({ guidanceScale: v })}
          />
        )}

        {numImgRange && numImgRange.max > 1 && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Number of images</Label>
            <ChipGroup
              options={Array.from({ length: numImgRange.max - numImgRange.min + 1 }, (_, i) => {
                const n = numImgRange.min + i;
                return { label: String(n), value: String(n) };
              })}
              value={String(state.numImages)}
              onChange={(v) => onChange({ numImages: Number(v) })}
              cols={4}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Output format</Label>
          <ChipGroup options={OUTPUT_FORMATS} value={state.outputFormat} onChange={(v) => onChange({ outputFormat: v as ImageFormState['outputFormat'] })} cols={3} />
        </div>

        {caps.supportsSeed && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Seed</Label>
            <SeedField value={state.seed} onChange={(v) => onChange({ seed: v })} />
          </div>
        )}

        {caps.supportsNegativePrompt && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Negative prompt</Label>
            <Textarea
              rows={2}
              placeholder="What to avoid: blurry, watermark…"
              value={state.negativePrompt}
              onChange={(e) => onChange({ negativePrompt: e.target.value })}
              disabled={disabled}
              className="resize-none text-sm"
            />
          </div>
        )}

        {safetyRange && caps.supportsSafetyTolerance && (
          <TooltipSlider
            label="Safety tolerance"
            tooltip="0 = most restrictive content filter, 6 = most permissive. Use responsibly."
            value={state.safetyTolerance} min={safetyRange.min} max={safetyRange.max}
            onChange={(v) => onChange({ safetyTolerance: v })}
          />
        )}

        {caps.supportsPromptUpsampling && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Prompt upsampling</p>
              <p className="text-xs text-muted-foreground/60">Automatically enhance your prompt</p>
            </div>
            <Switch
              checked={state.promptUpsampling}
              onCheckedChange={(v) => onChange({ promptUpsampling: v })}
            />
          </div>
        )}

        {caps.modelSpecific?.textToRender && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Text to render</Label>
            <Input
              placeholder='Exact text to show in the image, e.g. "Hello World"'
              value={state.textToRender}
              onChange={(e) => onChange({ textToRender: e.target.value })}
              disabled={disabled}
              className="h-8 text-sm"
            />
          </div>
        )}

        {caps.modelSpecific?.sampler && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Sampler</Label>
            <ChipGroup
              options={SAMPLERS.map((s) => ({ label: s, value: s }))}
              value=""
              onChange={() => {}}
              cols={2}
            />
          </div>
        )}
      </AdvancedSection>

      {/* Model-specific: Midjourney */}
      {(caps.parameters.stylize != null || caps.parameters.chaos != null) && (
        <AdvancedSection label="Midjourney options">
          {caps.parameters.stylize != null && (
            <TooltipSlider
              label="Stylize" tooltip="How strongly Midjourney's default aesthetic is applied. 0 = literal, 1000 = very stylized."
              value={state.stylize} min={0} max={1000} step={10}
              onChange={(v) => onChange({ stylize: v })}
            />
          )}
          {caps.parameters.chaos != null && (
            <TooltipSlider
              label="Chaos" tooltip="Increases variety of results. Higher = more unexpected outputs."
              value={state.chaos} min={0} max={100}
              onChange={(v) => onChange({ chaos: v })}
            />
          )}
          {caps.parameters.weird != null && (
            <TooltipSlider
              label="Weird" tooltip="Introduces quirky, off-beat qualities to images."
              value={state.weird} min={0} max={3000} step={50}
              onChange={(v) => onChange({ weird: v })}
            />
          )}
          {caps.modelSpecific?.styleRaw && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Style raw</p>
                <p className="text-xs text-muted-foreground/60">Minimizes Midjourney&apos;s default styling</p>
              </div>
              <Switch
                checked={state.styleRaw}
                onCheckedChange={(v) => onChange({ styleRaw: v })}
              />
            </div>
          )}
        </AdvancedSection>
      )}
    </div>
  );
}
