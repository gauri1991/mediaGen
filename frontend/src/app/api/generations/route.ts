import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getModel } from '@/lib/models/registry';
import { resolveProvider } from '@/lib/providers';
import type { ProviderName } from '@/lib/providers';
import { tick } from '@/lib/jobs/worker';
import { z } from 'zod';

const schema = z.object({
  modelSlug: z.string(),
  prompt: z.string().min(1).max(2000),
  negativePrompt: z.string().max(500).optional(),
  provider: z.string().optional(),
  params: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { modelSlug, prompt, negativePrompt, provider, params } = parsed.data;

  let model;
  try {
    model = getModel(modelSlug);
  } catch {
    return NextResponse.json({ error: `Unknown model: ${modelSlug}` }, { status: 400 });
  }

  const resolvedProvider = resolveProvider(modelSlug, provider as ProviderName | undefined);

  const generation = await prisma.generation.create({
    data: {
      userId: session.user.id,
      modality: model.modality,
      modelSlug,
      provider: resolvedProvider.name,
      status: 'queued',
      prompt,
      negativePrompt: negativePrompt ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params: { ...model.defaults, ...(params ?? {}) } as any,
    },
  });

  // Trigger worker in the background (best-effort; worker process handles it too)
  const webhookBase = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  void tick(webhookBase);

  return NextResponse.json({ id: generation.id, status: generation.status }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const modality = url.searchParams.get('modality') as 'image' | 'video' | 'audio' | null;
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 100);

  const generations = await prisma.generation.findMany({
    where: {
      userId: session.user.id,
      ...(modality ? { modality } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { assets: { take: 1 } },
  });

  return NextResponse.json(generations);
}

