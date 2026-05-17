import { prisma } from '@/lib/db';
import { handleCompleted } from './worker';

// Replicate webhook payload shape
type ReplicateWebhookPayload = {
  id: string;           // prediction id
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output: unknown;
  error: string | null;
};

function parseOutputs(
  payload: ReplicateWebhookPayload,
  modality: 'image' | 'video' | 'audio',
): Array<{ url: string; type: 'image' | 'video' | 'audio' }> {
  const raw = Array.isArray(payload.output)
    ? payload.output
    : payload.output
    ? [payload.output]
    : [];

  return raw
    .filter((u): u is string => typeof u === 'string')
    .map((url) => ({ url, type: modality }));
}

export async function handleReplicateWebhook(
  payload: ReplicateWebhookPayload,
  generationId: string,
) {
  const gen = await prisma.generation.findUnique({
    where: { id: generationId },
    select: { id: true, userId: true, modality: true, modelSlug: true, status: true },
  });

  if (!gen) {
    console.warn(`[webhook] unknown generationId: ${generationId}`);
    return;
  }

  // Skip if already in a terminal state (duplicate webhook)
  if (gen.status === 'completed' || gen.status === 'failed') return;

  if (payload.status === 'succeeded') {
    const outputs = parseOutputs(payload, gen.modality as 'image' | 'video' | 'audio');
    await handleCompleted(gen, outputs);
  } else if (payload.status === 'failed' || payload.status === 'canceled') {
    await prisma.generation.update({
      where: { id: generationId },
      data: {
        status: 'failed',
        errorMessage: payload.error ?? `Replicate status: ${payload.status}`,
        completedAt: new Date(),
      },
    });
  }
}
