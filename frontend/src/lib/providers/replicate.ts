import type { GenerationProvider, ProviderJobStatus, SubmitInput } from './types';
import { modelRegistry } from '@/lib/models/registry';

const BASE = 'https://api.replicate.com/v1';

function headers() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error('REPLICATE_API_TOKEN is not set');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Prefer: 'wait', // return immediately with a prediction id, don't block
  };
}

type ReplicatePrediction = {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output: unknown;
  error: string | null;
  logs: string | null;
};

function mapStatus(p: ReplicatePrediction, modality: 'image' | 'video' | 'audio'): ProviderJobStatus {
  if (p.status === 'starting' || p.status === 'processing') {
    return { status: 'processing' };
  }
  if (p.status === 'succeeded') {
    const rawOutputs = Array.isArray(p.output) ? p.output : p.output ? [p.output] : [];
    return {
      status: 'completed',
      outputs: rawOutputs
        .filter((u): u is string => typeof u === 'string')
        .map((url) => ({ url, type: modality })),
    };
  }
  return {
    status: 'failed',
    error: p.error ?? p.status,
  };
}

export class ReplicateProvider implements GenerationProvider {
  readonly name = 'replicate' as const;

  async submit(input: SubmitInput): Promise<{ providerJobId: string }> {
    const model = modelRegistry[input.modelSlug];
    if (!model) throw new Error(`Unknown model: ${input.modelSlug}`);

    const cfg = model.providers.replicate;
    if (!cfg) throw new Error(`Model ${input.modelSlug} has no Replicate config`);

    const body: Record<string, unknown> = {
      input: input.params,
    };
    if (input.webhookUrl) {
      body.webhook = input.webhookUrl;
      body.webhook_events_filter = ['completed'];
    }

    // Replicate API: POST /models/{owner}/{name}/predictions  OR  /predictions with version
    const url = `${BASE}/models/${cfg.modelId}/predictions`;
    const res = await fetch(url, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Replicate submit failed (${res.status}): ${err}`);
    }

    const data = (await res.json()) as ReplicatePrediction;
    return { providerJobId: data.id };
  }

  async poll(providerJobId: string): Promise<ProviderJobStatus> {
    const res = await fetch(`${BASE}/predictions/${providerJobId}`, {
      headers: headers(),
    });

    if (!res.ok) {
      throw new Error(`Replicate poll failed (${res.status})`);
    }

    const data = (await res.json()) as ReplicatePrediction;
    // We don't know modality here — caller must map outputs after the fact if needed
    return mapStatus(data, 'image'); // type will be overridden by caller from DB
  }

  async pollWithModality(
    providerJobId: string,
    modality: 'image' | 'video' | 'audio',
  ): Promise<ProviderJobStatus> {
    const res = await fetch(`${BASE}/predictions/${providerJobId}`, {
      headers: headers(),
    });

    if (!res.ok) {
      throw new Error(`Replicate poll failed (${res.status})`);
    }

    const data = (await res.json()) as ReplicatePrediction;
    return mapStatus(data, modality);
  }

  async cancel(providerJobId: string): Promise<void> {
    await fetch(`${BASE}/predictions/${providerJobId}/cancel`, {
      method: 'POST',
      headers: headers(),
    });
  }
}
