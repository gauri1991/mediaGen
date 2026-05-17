export type ProviderName = 'replicate' | 'akashml' | 'fal' | 'runpod' | 'modal';

export interface SubmitInput {
  modelSlug: string;
  modality: 'image' | 'video' | 'audio';
  params: Record<string, unknown>;
  webhookUrl?: string;
}

export interface ProviderJobStatus {
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  outputs?: { url: string; type: 'image' | 'video' | 'audio' }[];
  error?: string;
}

export interface GenerationProvider {
  readonly name: ProviderName;
  submit(input: SubmitInput): Promise<{ providerJobId: string }>;
  poll(providerJobId: string): Promise<ProviderJobStatus>;
  cancel(providerJobId: string): Promise<void>;
}
