import { NextRequest, NextResponse } from 'next/server';
import { handleReplicateWebhook } from '@/lib/jobs/webhook-handler';

export async function POST(req: NextRequest) {
  const generationId = req.nextUrl.searchParams.get('generationId');
  if (!generationId) {
    return NextResponse.json({ error: 'Missing generationId' }, { status: 400 });
  }

  // TODO: verify Replicate webhook signature for production security
  // Headers: webhook-id, webhook-timestamp, webhook-signature
  // Docs: https://replicate.com/docs/webhooks#verifying-webhooks

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    await handleReplicateWebhook(
      payload as Parameters<typeof handleReplicateWebhook>[0],
      generationId,
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[webhook/replicate] error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
