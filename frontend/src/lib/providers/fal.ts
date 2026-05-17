import type { GenerationProvider, ProviderJobStatus, SubmitInput } from './types';
import { modelRegistry } from '@/lib/models/registry';

const BASE = 'https://queue.fal.run';

function headers() {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error('FAL_KEY is not set');
  return { Authorization: `Key ${key}`, 'Content-Type': 'application/json' };
}

function translateParams(params: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const drop = new Set(['output_quality', 'refine', 'high_noise_frac', 'safety_tolerance', 'width', 'height']);

  for (const [k, v] of Object.entries(params)) {
    if (drop.has(k)) continue;
    if (k === 'guidance') { out['guidance_scale'] = v; continue; }
    if (k === 'num_outputs') { out['num_images'] = v; continue; }
    if (k === 'steps') { out['num_inference_steps'] ??= v; continue; }
    if (k === 'output_format') { out['output_format'] = v === 'webp' ? 'jpeg' : v; continue; }
    if (k === 'prompt_upsampling') { out['enable_prompt_upsampling'] = v; continue; }
    if (k === 'seed' && v == null) continue;
    out[k] = v;
  }

  const w = params['width'] as number | undefined;
  const h = params['height'] as number | undefined;
  if (w != null && h != null) out['image_size'] = { width: w, height: h };

  return out;
}

export class FalProvider implements GenerationProvider {
  readonly name = 'fal' as const;

  async submit(input: SubmitInput): Promise<{ providerJobId: string }> {
    const model = modelRegistry[input.modelSlug];
    if (!model) throw new Error(`Unknown model: ${input.modelSlug}`);
    const cfg = model.providers.fal;
    if (!cfg) throw new Error(`Model ${input.modelSlug} has no fal.ai config`);

    const res = await fetch(`${BASE}/${cfg.modelId}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ input: translateParams(input.params) }),
    });
    if (!res.ok) throw new Error(`fal.ai submit failed (${res.status}): ${await res.text()}`);
    const data = await res.json() as { request_id: string };
    return { providerJobId: `${cfg.modelId}||${data.request_id}` };
  }

  async poll(providerJobId: string): Promise<ProviderJobStatus> {
    const [modelId, requestId] = providerJobId.split('||', 2);

    const statusRes = await fetch(`${BASE}/${modelId}/requests/${requestId}/status`, { headers: headers() });
    if (!statusRes.ok) throw new Error(`fal.ai poll failed (${statusRes.status})`);
    const statusData = await statusRes.json() as { status: string; error?: string };

    const statusMap: Record<string, ProviderJobStatus['status']> = {
      IN_QUEUE: 'queued', IN_PROGRESS: 'processing', COMPLETED: 'completed', FAILED: 'failed',
    };
    const status = statusMap[statusData.status] ?? 'processing';

    if (status !== 'completed') return { status, error: statusData.error };

    const resultRes = await fetch(`${BASE}/${modelId}/requests/${requestId}`, { headers: headers() });
    if (!resultRes.ok) throw new Error(`fal.ai result fetch failed (${resultRes.status})`);
    const result = await resultRes.json() as Record<string, unknown>;

    const outputs: ProviderJobStatus['outputs'] = [];
    if (Array.isArray(result['images'])) {
      for (const img of result['images'] as Array<{ url: string } | string>) {
        const url = typeof img === 'string' ? img : img.url;
        if (url) outputs.push({ url, type: 'image' });
      }
    } else if (result['video']) {
      const v = result['video'] as { url: string } | string;
      const url = typeof v === 'string' ? v : v.url;
      if (url) outputs.push({ url, type: 'video' });
    } else if (result['audio']) {
      const a = result['audio'] as { url: string } | string;
      const url = typeof a === 'string' ? a : a.url;
      if (url) outputs.push({ url, type: 'audio' });
    }

    return { status: 'completed', outputs };
  }

  async cancel(_providerJobId: string): Promise<void> {
    // fal.ai has no cancel endpoint
  }
}
