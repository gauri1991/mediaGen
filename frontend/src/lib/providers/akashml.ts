import type { GenerationProvider, ProviderJobStatus, SubmitInput } from './types';
import { modelRegistry } from '@/lib/models/registry';

// AkashML: managed inference API on Akash Network decentralized GPUs.
// Docs: https://chatapi.akash.network/  (OpenAI-compatible for chat; image/video endpoints TBD)
// TODO: Verify exact endpoint structure for image/video/audio generation once API key is available.

const BASE = process.env.AKASHML_API_URL ?? 'https://api.akash.network/inference/v1';

function headers() {
  const key = process.env.AKASHML_API_KEY;
  if (!key) throw new Error('AKASHML_API_KEY is not set');
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

type AkashJob = {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  outputs?: Array<{ url: string }>;
  error?: string;
  progress?: number;
};

function mapStatus(job: AkashJob, modality: 'image' | 'video' | 'audio'): ProviderJobStatus {
  if (job.status === 'queued' || job.status === 'running') {
    return { status: 'processing', progress: job.progress };
  }
  if (job.status === 'completed') {
    return {
      status: 'completed',
      outputs: (job.outputs ?? []).map((o) => ({ url: o.url, type: modality })),
    };
  }
  return { status: 'failed', error: job.error ?? 'Unknown error' };
}

export class AkashMLProvider implements GenerationProvider {
  readonly name = 'akashml' as const;

  async submit(input: SubmitInput): Promise<{ providerJobId: string }> {
    const model = modelRegistry[input.modelSlug];
    if (!model) throw new Error(`Unknown model: ${input.modelSlug}`);

    const cfg = model.providers.akashml;
    if (!cfg) throw new Error(`Model ${input.modelSlug} has no AkashML config`);

    // TODO: confirm actual submit endpoint + request shape from AkashML docs
    const res = await fetch(`${BASE}/jobs`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        model: cfg.modelId,
        inputs: input.params,
        ...(input.webhookUrl ? { webhook_url: input.webhookUrl } : {}),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`AkashML submit failed (${res.status}): ${err}`);
    }

    const data = (await res.json()) as AkashJob;
    return { providerJobId: data.id };
  }

  async poll(providerJobId: string): Promise<ProviderJobStatus> {
    // TODO: confirm actual poll endpoint from AkashML docs
    const res = await fetch(`${BASE}/jobs/${providerJobId}`, {
      headers: headers(),
    });

    if (!res.ok) {
      throw new Error(`AkashML poll failed (${res.status})`);
    }

    const data = (await res.json()) as AkashJob;
    return mapStatus(data, 'image'); // caller overrides type from DB modality
  }

  async cancel(providerJobId: string): Promise<void> {
    // TODO: confirm cancel endpoint
    await fetch(`${BASE}/jobs/${providerJobId}/cancel`, {
      method: 'POST',
      headers: headers(),
    });
  }
}
