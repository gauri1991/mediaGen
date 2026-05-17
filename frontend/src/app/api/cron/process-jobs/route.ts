import { NextRequest, NextResponse } from 'next/server';
import { tick } from '@/lib/jobs/worker';

// Called by Vercel Cron (every 10s) or any HTTP trigger.
// Protect with CRON_SECRET so random callers can't drain your provider budget.
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const webhookBase = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  try {
    await tick(webhookBase);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[cron/process-jobs] error:', err);
    return NextResponse.json({ error: 'Worker tick failed' }, { status: 500 });
  }
}

// Vercel cron config — runs every 10 seconds (minimum allowed)
export const dynamic = 'force-dynamic';
