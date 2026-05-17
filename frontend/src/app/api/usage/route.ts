import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;

  const [totals, byModality, byStatus, recent] = await Promise.all([
    prisma.generation.aggregate({
      where: { userId },
      _count: { id: true },
      _sum: { costCredits: true },
    }),
    prisma.generation.groupBy({
      by: ['modality'],
      where: { userId },
      _count: { id: true },
      _sum: { costCredits: true },
    }),
    prisma.generation.groupBy({
      by: ['status'],
      where: { userId },
      _count: { id: true },
    }),
    prisma.generation.findMany({
      where: { userId, status: 'completed' },
      orderBy: { completedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        modality: true,
        modelSlug: true,
        costCredits: true,
        completedAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    total: totals._count.id,
    totalCost: totals._sum.costCredits ?? 0,
    byModality,
    byStatus,
    recentCompleted: recent,
  });
}
