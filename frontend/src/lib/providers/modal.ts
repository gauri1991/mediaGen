import type { GenerationProvider, ProviderJobStatus, SubmitInput } from './types';

export class ModalProvider implements GenerationProvider {
  readonly name = 'modal' as const;

  async submit(): Promise<{ providerJobId: string }> {
    throw new Error('Modal adapter not implemented yet. Add implementation in src/lib/providers/modal.ts');
  }

  async poll(): Promise<ProviderJobStatus> {
    throw new Error('Modal adapter not implemented yet.');
  }

  async cancel(): Promise<void> {
    throw new Error('Modal adapter not implemented yet.');
  }
}

// satisfy interface — TS checks structural compatibility, param names optional
void (null as unknown as SubmitInput);
