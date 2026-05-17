'use client';

import { Suspense, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ModeSwitcher } from '@/components/generate/ModeSwitcher';
import { ModelPicker } from '@/components/generate/ModelPicker';
import { JobCard } from '@/components/generate/JobCard';
import { AssetPreview } from '@/components/generate/AssetPreview';
import { PromptBuilder } from '@/components/prompt-builder/PromptBuilder';
import { useGenerationStream } from '@/hooks/use-generation-stream';
import { modelsByModality, modelRegistry } from '@/lib/models/registry';
import { djangoApi } from '@/lib/api';
import type { BuilderOutput } from '@/lib/prompt-assembler';

type Modality = 'image' | 'video' | 'audio';
type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

function defaultModel(modality: Modality): string {
  return modelsByModality(modality).find(({ config }) => !config.comingSoon)?.slug ?? '';
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 px-0.5">
      {children}
    </p>
  );
}

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

function GeneratePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlModel = searchParams.get('model');
  const resolvedModel = urlModel && modelRegistry[urlModel] ? urlModel : null;
  const initialMode = resolvedModel
    ? (modelRegistry[resolvedModel].modality as Modality)
    : (searchParams.get('mode') as Modality) ?? 'image';

  const [modality, setModality] = useState<Modality>(initialMode);
  const [modelSlug, setModelSlug] = useState<string>(() => resolvedModel ?? defaultModel(initialMode));
  const [builderOutput, setBuilderOutput] = useState<BuilderOutput>({ prompt: '', negativePrompt: '', params: {} });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobHistory, setJobHistory] = useState<Array<{ id: string; status: JobStatus }>>([]);

  const stream = useGenerationStream(activeJobId);

  const handleModeChange = useCallback((mode: Modality) => {
    setModality(mode);
    setModelSlug(defaultModel(mode));
    const p = new URLSearchParams(searchParams.toString());
    p.set('mode', mode);
    p.delete('model');
    router.replace(`?${p}`);
  }, [searchParams, router]);

  const handleGenerate = async () => {
    if (!builderOutput.prompt.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const model = modelRegistry[modelSlug];
      if (!model) return;

      const params: Record<string, unknown> = { ...builderOutput.params };

      // Ensure width/height present for image/video if not in builder params
      if ((modality === 'image' || modality === 'video') && !params.width) {
        params.width = 1024;
        params.height = 1024;
      }

      const { id } = await djangoApi.createGeneration({
        model_slug: modelSlug,
        prompt: builderOutput.prompt.trim(),
        negative_prompt: builderOutput.negativePrompt.trim() || undefined,
        params,
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
  }, []);

  const activeStatus = stream?.status ?? (activeJobId ? 'queued' : null);
  const isRunning = activeStatus === 'queued' || activeStatus === 'processing';

  const model = modelRegistry[modelSlug];
  const costEstimate = model?.providers[model?.defaultProvider]?.costEstimate;

  return (
    <div className="h-full">
      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] h-full">
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
          <PromptBuilder
            modality={modality}
            modelSlug={modelSlug}
            disabled={isRunning}
            onChange={setBuilderOutput}
          />

          {costEstimate != null && (
            <div className="flex items-center justify-between text-xs px-0.5">
              <span className="text-muted-foreground">Estimated cost</span>
              <span className="font-semibold">~${costEstimate.toFixed(3)}</span>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={!builderOutput.prompt.trim() || isSubmitting || isRunning}
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
                      onClick={() => setBuilderOutput((o) => ({ ...o, prompt: ex }))}
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
