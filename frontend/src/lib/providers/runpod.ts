import type { GenerationProvider, ProviderJobStatus, SubmitInput } from './types';

export class RunPodProvider implements GenerationProvider {
  readonly name = 'runpod' as const;

  async submit(): Promise<{ providerJobId: string }> {
    throw new Error('RunPod adapter not implemented yet. Add implementation in src/lib/providers/runpod.ts');
  }

  async poll(): Promise<ProviderJobStatus> {
    throw new Error('RunPod adapter not implemented yet.');
  }

  async cancel(): Promise<void> {
    throw new Error('RunPod adapter not implemented yet.');
  }
}

void (null as unknown as SubmitInput);
