import 'dotenv/config';
import { prisma } from '@/lib/db';
import { resolveProvider } from '@/lib/providers';
import type { ProviderName, ProviderJobStatus } from '@/lib/providers';
import { getModel } from '@/lib/models/registry';
import { uploadBuffer, downloadUrl, assetKey, thumbnailKey, publicUrl } from '@/lib/r2';
import sharp from 'sharp';
import path from 'path';

const SUBMIT_BATCH = 5;   // max queued jobs to submit per tick
const POLL_BATCH  = 20;   // max processing jobs to poll per tick

// ── Helpers ──────────────────────────────────────────────────────────────────

function mimeForModality(modality: string, url: string): string {
  const ext = path.extname(url).toLowerCase();
  if (modality === 'image') return ext === '.png' ? 'image/png' : 'image/webp';
  if (modality === 'video') return 'video/mp4';
  if (modality === 'audio') return ext === '.wav' ? 'audio/wav' : 'audio/mpeg';
  return 'application/octet-stream';
}

function extForMime(mime: string): string {
  const map: Record<string, string> = {
    'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg',
    'video/mp4': 'mp4', 'audio/mpeg': 'mp3', 'audio/wav': 'wav',
  };
  return map[mime] ?? 'bin';
}

async function makeThumbnail(buffer: Buffer, mime: string): Promise<Buffer | null> {
  if (!mime.startsWith('image/')) return null;
  try {
    return await sharp(buffer)
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();
  } catch {
    return null;
  }
}

// ── Submit queued jobs ────────────────────────────────────────────────────────

async function submitQueued(webhookBase: string) {
  const jobs = await prisma.generation.findMany({
    where: { status: 'queued' },
    orderBy: { createdAt: 'asc' },
    take: SUBMIT_BATCH,
  });

  for (const job of jobs) {
    try {
      const provider = resolveProvider(job.modelSlug, job.provider as ProviderName);
      const model = getModel(job.modelSlug);

      const webhookUrl = provider.name === 'replicate'
        ? `${webhookBase}/api/webhooks/replicate?generationId=${job.id}`
        : undefined;

      const params = (job.params as Record<string, unknown>) ?? {};
      if (job.negativePrompt) params.negative_prompt = job.negativePrompt;
      if (model.modality === 'image' || model.modality === 'video') {
        params.prompt = job.prompt;
      } else {
        params.prompt = job.prompt; // musicgen / tts also use prompt
      }

      const { providerJobId } = await provider.submit({
        modelSlug: job.modelSlug,
        modality: job.modality as 'image' | 'video' | 'audio',
        params,
        webhookUrl,
      });

      await prisma.generation.update({
        where: { id: job.id },
        data: {
          status: 'processing',
          providerJobId,
          startedAt: new Date(),
        },
      });

      console.log(`[worker] submitted ${job.id} → ${provider.name}:${providerJobId}`);
    } catch (err) {
      console.error(`[worker] submit failed for ${job.id}:`, err);
      await prisma.generation.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          errorMessage: err instanceof Error ? err.message : String(err),
        },
      });
    }
  }
}

// ── Poll processing jobs ──────────────────────────────────────────────────────

async function pollProcessing() {
  const jobs = await prisma.generation.findMany({
    where: { status: 'processing', providerJobId: { not: null } },
    orderBy: { startedAt: 'asc' },
    take: POLL_BATCH,
  });

  for (const job of jobs) {
    try {
      const provider = resolveProvider(job.modelSlug, job.provider as ProviderName);

      // ReplicateProvider has a modality-aware poll method
      let result: ProviderJobStatus;
      if ('pollWithModality' in provider && typeof provider.pollWithModality === 'function') {
        result = await (provider as { pollWithModality: (id: string, m: string) => Promise<ProviderJobStatus> })
          .pollWithModality(job.providerJobId!, job.modality);
      } else {
        result = await provider.poll(job.providerJobId!);
      }

      if (!result) continue;

      if (result.status === 'processing') {
        if (result.progress !== undefined) {
          await prisma.generation.update({
            where: { id: job.id },
            data: { progress: result.progress },
          });
        }
        continue;
      }

      if (result.status === 'failed') {
        await prisma.generation.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            errorMessage: result.error ?? 'Provider returned failed status',
            completedAt: new Date(),
          },
        });
        console.log(`[worker] failed ${job.id}: ${result.error}`);
        continue;
      }

      if (result.status === 'completed') {
        await handleCompleted(job, result.outputs ?? []);
      }
    } catch (err) {
      console.error(`[worker] poll failed for ${job.id}:`, err);
    }
  }
}

// ── Handle completed job: download → R2 → DB ─────────────────────────────────

export async function handleCompleted(
  job: { id: string; userId: string; modality: string; modelSlug: string },
  outputs: Array<{ url: string; type: 'image' | 'video' | 'audio' }>,
) {
  const assetRecords = [];

  for (let i = 0; i < outputs.length; i++) {
    const output = outputs[i];
    try {
      const mime = mimeForModality(output.type, output.url);
      const ext = extForMime(mime);
      const key = assetKey(job.userId, job.id, `output_${i}.${ext}`);

      const buffer = await downloadUrl(output.url);
      await uploadBuffer(key, buffer, mime);

      // Thumbnail for images
      let thumbKey: string | null = null;
      const thumbBuffer = await makeThumbnail(buffer, mime);
      if (thumbBuffer) {
        thumbKey = thumbnailKey(key).replace(/\.\w+$/, '.webp');
        await uploadBuffer(thumbKey, thumbBuffer, 'image/webp');
      }

      // Image dimensions
      let width: number | null = null;
      let height: number | null = null;
      if (mime.startsWith('image/')) {
        const meta = await sharp(buffer).metadata();
        width = meta.width ?? null;
        height = meta.height ?? null;
      }

      assetRecords.push({
        generationId: job.id,
        userId: job.userId,
        type: output.type,
        r2Key: key,
        url: publicUrl(key),
        thumbnailR2Key: thumbKey,
        mimeType: mime,
        bytes: buffer.length,
        width,
        height,
      });
    } catch (err) {
      console.error(`[worker] asset upload failed for ${job.id}[${i}]:`, err);
    }
  }

  // Derive cost from model registry
  const model = getModel(job.modelSlug);
  const providerRecord = await prisma.generation.findUnique({
    where: { id: job.id },
    select: { provider: true },
  });
  const cfg = providerRecord
    ? model.providers[providerRecord.provider as ProviderName]
    : null;
  const costCredits = cfg?.costEstimate ?? null;

  await prisma.$transaction([
    prisma.asset.createMany({ data: assetRecords }),
    prisma.generation.update({
      where: { id: job.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        progress: 100,
        costCredits,
      },
    }),
  ]);

  console.log(`[worker] completed ${job.id} — ${assetRecords.length} asset(s) uploaded`);
}

// ── Main tick ─────────────────────────────────────────────────────────────────

export async function tick(webhookBase: string) {
  await Promise.all([
    submitQueued(webhookBase),
    pollProcessing(),
  ]);
}

// ── Standalone process entry point ───────────────────────────────────────────

async function runLoop() {
  const webhookBase = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const interval = Number(process.env.WORKER_INTERVAL_MS ?? 5000);

  console.log(`[worker] starting — polling every ${interval}ms`);
  console.log(`[worker] webhook base: ${webhookBase}`);

  for (;;) {
    try {
      await tick(webhookBase);
    } catch (err) {
      console.error('[worker] tick error:', err);
    }
    await new Promise((r) => setTimeout(r, interval));
  }
}

// Run when invoked directly (tsx src/lib/jobs/worker.ts)
if (require.main === module || process.argv[1]?.endsWith('worker.ts') || process.argv[1]?.endsWith('worker.js')) {
  runLoop().catch((err) => {
    console.error('[worker] fatal:', err);
    process.exit(1);
  });
}
