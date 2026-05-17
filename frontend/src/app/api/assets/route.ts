import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get('type') as 'image' | 'video' | 'audio' | null;
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '48'), 200);
  const cursor = url.searchParams.get('cursor') ?? undefined;

  const assets = await prisma.asset.findMany({
    where: {
      userId: session.user.id,
      ...(type ? { type } : {}),
      ...(cursor ? { id: { lt: cursor } } : {}),
    },
    orderBy: { id: 'desc' },
    take: limit + 1,
    include: {
      generation: {
        select: {
          id: true,
          prompt: true,
          modelSlug: true,
          modality: true,
          createdAt: true,
        },
      },
    },
  });

  const hasMore = assets.length > limit;
  const items = hasMore ? assets.slice(0, limit) : assets;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ items, nextCursor });
}
