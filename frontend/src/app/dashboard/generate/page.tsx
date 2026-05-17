'use client';

import { Suspense, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ModeSwitcher } from '@/components/generate/ModeSwitcher';
import { PromptInput } from '@/components/generate/PromptInput';
import { ModelPicker } from '@/components/generate/ModelPicker';
import { AspectRatioGrid, IMAGE_ASPECT_RATIOS, VIDEO_ASPECT_RATIOS } from '@/components/generate/AspectRatioGrid';
import type { AspectRatioOption } from '@/components/generate/AspectRatioGrid';
import { ParamSlider } from '@/components/generate/ParamSlider';
import { JobCard } from '@/components/generate/JobCard';
import { AssetPreview } from '@/components/generate/AssetPreview';
import { useGenerationStream } from '@/hooks/use-generation-stream';
import { modelsByModality, modelRegistry } from '@/lib/models/registry';
import { djangoApi } from '@/lib/api';

type Modality = 'image' | 'video' | 'audio';
type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

function defaultModel(modality: Modality): string {
  return modelsByModality(modality)[0]?.slug ?? '';
}

interface ParamState {
  steps: number;
  guidance: number;
  seed: number | null;
}

const DEFAULT_PARAMS: Record<Modality, ParamState> = {
  image: { steps: 28, guidance: 3.5, seed: null },
  video: { steps: 40, guidance: 3.0, seed: null },
  audio: { steps: 32, guidance: 3.0, seed: null },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 px-0.5">
      {children}
    </p>
  );
}

const EXAMPLE_PROMPTS: Record<Modality, string[]> = {
  image: [
    'Cinematic photo of a neon-lit Tokyo street at night, rain reflections',
    'Minimalist product shot of a glass bottle on white marble, studio lighting',
    'Portrait of a red fox in a snowy forest, golden hour',
  ],
  video: [
    'Drone shot slowly rising over misty mountain peaks at dawn',
    'Time-lapse of storm clouds rolling over a city skyline',
    'Close-up of campfire embers glowing in the dark, slow motion',
  ],
  audio: [
    'Upbeat lo-fi hip hop with soft piano and vinyl crackle',
    'Epic orchestral trailer music with pounding drums and strings',
    'Ambient forest soundscape with birdsong and a gentle stream',
  ],
};

function GeneratePageFallback() {
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[400px_1fr]">
      <aside className="border-r bg-card p-6 space-y-5">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
      </aside>
      <main className="bg-muted/30 p-6 flex items-center justify-center">
        <Skeleton className="h-32 w-64 rounded-2xl" />
      </main>
    </div>
  );
}

function GeneratePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ?model= from the Models page "Generate with this model" links
  const urlModel = searchParams.get('model');
  const resolvedModel = urlModel && modelRegistry[urlModel] ? urlModel : null;
  const initialMode = resolvedModel
    ? (modelRegistry[resolvedModel].modality as Modality)
    : (searchParams.get('mode') as Modality) ?? 'image';

  const [modality, setModality] = useState<Modality>(initialMode);
  const [modelSlug, setModelSlug] = useState<string>(() => resolvedModel ?? defaultModel(initialMode));
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>(IMAGE_ASPECT_RATIOS[0]);
  const [params, setParams] = useState<ParamState>(DEFAULT_PARAMS[initialMode]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobHistory, setJobHistory] = useState<Array<{ id: string; status: JobStatus }>>([]);

  const stream = useGenerationStream(activeJobId);

  const handleModeChange = useCallback((mode: Modality) => {
    setModality(mode);
    setModelSlug(defaultModel(mode));
    setParams(DEFAULT_PARAMS[mode]);
    if (mode === 'image') setAspectRatio(IMAGE_ASPECT_RATIOS[0]);
    if (mode === 'video') setAspectRatio(VIDEO_ASPECT_RATIOS[0]);
    const p = new URLSearchParams(searchParams.toString());
    p.set('mode', mode);
    p.delete('model');
    router.replace(`?${p}`);
  }, [searchParams, router]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const model = modelRegistry[modelSlug];
      if (!model) return;
      const extraParams: Record<string, unknown> = {
        num_inference_steps: params.steps,
      };

      if (modality === 'image' || modality === 'video') {
        extraParams.width = aspectRatio.width;
        extraParams.height = aspectRatio.height;
        if (modality === 'image') extraParams.guidance = params.guidance;
        if (modality === 'video') extraParams.guidance_scale = params.guidance;
      }

      if (model.modality === 'audio') {
        delete extraParams.num_inference_steps;
        extraParams.nfe_step = params.steps;
      }

      if (params.seed !== null) extraParams.seed = params.seed;

      const { id } = await djangoApi.createGeneration({
        model_slug: modelSlug,
        prompt: prompt.trim(),
        negative_prompt: negativePrompt.trim() || undefined,
        params: extraParams,
      });
      setActiveJobId(id);
      setJobHistory((h) => [{ id, status: 'queued' }, ...h]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = useCallback(async () => {
    if (!activeJobId) return;
    try {
      await djangoApi.cancelGeneration(activeJobId);
    } catch {
      // SSE will reflect the updated status
    }
  }, [activeJobId]);

  const handleReset = useCallback(() => {
    setActiveJobId(null);
    setPrompt('');
    setNegativePrompt('');
  }, []);

  const activeStatus = stream?.status ?? (activeJobId ? 'queued' : null);
  const isRunning = activeStatus === 'queued' || activeStatus === 'processing';
  const showAspectRatio = modality === 'image' || modality === 'video';
  const showNegative = modality === 'image';
  const aspectOptions = modality === 'video' ? VIDEO_ASPECT_RATIOS : IMAGE_ASPECT_RATIOS;
  const showParams = modality !== 'audio' || modelSlug === 'f5-tts';

  return (
    <div className="h-full">
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] h-full">
        {/* Left panel — controls */}
        <aside className="border-r bg-card p-6 space-y-5 overflow-y-auto">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Generate</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Create images, video &amp; audio</p>
          </div>

          <SectionLabel>Type</SectionLabel>
          <ModeSwitcher value={modality} onChange={handleModeChange} />

          <SectionLabel>Model</SectionLabel>
          <ModelPicker modality={modality} value={modelSlug} onChange={setModelSlug} />

          <SectionLabel>Prompt</SectionLabel>
          <PromptInput
            prompt={prompt}
            negativePrompt={negativePrompt}
            onPromptChange={setPrompt}
            onNegativeChange={setNegativePrompt}
            showNegative={showNegative}
          />

          {showAspectRatio && (
            <>
              <SectionLabel>Options</SectionLabel>
              <AspectRatioGrid
                options={aspectOptions}
                value={aspectRatio.value}
                onChange={setAspectRatio}
              />
            </>
          )}

          {showParams && modality === 'image' && (
            <>
              <SectionLabel>Parameters</SectionLabel>
              <div className="space-y-3">
                <ParamSlider
                  label="Steps"
                  value={params.steps}
                  min={1}
                  max={50}
                  onChange={(v) => setParams((p) => ({ ...p, steps: v }))}
                />
                <ParamSlider
                  label="Guidance"
                  value={params.guidance}
                  min={0}
                  max={20}
                  step={0.5}
                  format={(v) => v.toFixed(1)}
                  onChange={(v) => setParams((p) => ({ ...p, guidance: v }))}
                />
              </div>
            </>
          )}

          {showParams && modality === 'video' && (
            <>
              <SectionLabel>Parameters</SectionLabel>
              <ParamSlider
                label="Steps"
                value={params.steps}
                min={10}
                max={60}
                onChange={(v) => setParams((p) => ({ ...p, steps: v }))}
              />
            </>
          )}

          {(() => {
            const model = modelRegistry[modelSlug];
            const cost = model?.providers[model.defaultProvider]?.costEstimate;
            return cost ? (
              <div className="flex items-center justify-between text-xs px-0.5">
                <span className="text-muted-foreground">Estimated cost</span>
                <span className="font-semibold">~${cost.toFixed(3)}</span>
              </div>
            ) : null;
          })()}

          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isSubmitting || isRunning}
            className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 font-semibold"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Submitting…' : isRunning ? 'Generating…' : 'Generate'}
          </Button>

          {jobHistory.length > 0 && (
            <p className="text-xs text-muted-foreground/60 text-center">
              {jobHistory.length} job{jobHistory.length !== 1 ? 's' : ''} this session
            </p>
          )}
        </aside>

        {/* Right panel — preview */}
        <main className="bg-muted/30 p-6 overflow-y-auto">
          {activeJobId && activeStatus ? (
            <div className="space-y-4 max-w-2xl mx-auto">
              <JobCard
                status={activeStatus as 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'}
                progress={stream?.progress}
                errorMessage={stream?.error_message}
                onCancel={handleCancel}
              />

              {stream?.status === 'completed' && stream.assets.length > 0 && (
                <AssetPreview assets={stream.assets} />
              )}

              {(activeStatus === 'completed' || activeStatus === 'failed') && (
                <Button variant="outline" onClick={handleReset} className="w-full">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  New generation
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center space-y-5 max-w-sm w-full px-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-cyan-500" />
                </div>
                <div>
                  <p className="font-semibold">Your output will appear here</p>
                  <p className="text-muted-foreground text-sm mt-1">Try one of these to get started:</p>
                </div>
                <div className="space-y-2">
                  {EXAMPLE_PROMPTS[modality].map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setPrompt(ex)}
                      className="w-full text-left text-xs text-muted-foreground border border-border rounded-lg px-3 py-2.5 hover:border-cyan-400 hover:text-foreground hover:bg-cyan-500/5 transition-all"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<GeneratePageFallback />}>
      <GeneratePageInner />
    </Suspense>
  );
}
