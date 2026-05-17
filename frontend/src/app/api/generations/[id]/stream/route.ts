import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const POLL_MS = 2000;
const TIMEOUT_MS = 10 * 60 * 1000; // 10 min

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const gen = await prisma.generation.findUnique({ where: { id }, select: { userId: true } });
  if (!gen || gen.userId !== session.user.id) {
    return new Response('Not found', { status: 404 });
  }

  const encoder = new TextEncoder();
  const started = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      }

      while (true) {
        if (Date.now() - started > TIMEOUT_MS) {
          send('timeout', { message: 'Stream timed out' });
          controller.close();
          return;
        }

        try {
          const current = await prisma.generation.findUnique({
            where: { id },
            include: {
              assets: {
                select: {
                  id: true,
                  type: true,
                  url: true,
                  thumbnailR2Key: true,
                  mimeType: true,
                  width: true,
                  height: true,
                  durationSeconds: true,
                },
              },
            },
          });

          if (!current) {
            send('error', { message: 'Generation not found' });
            controller.close();
            return;
          }

          send('update', {
            id: current.id,
            status: current.status,
            progress: current.progress,
            errorMessage: current.errorMessage,
            assets: current.assets,
          });

          if (current.status === 'completed' || current.status === 'failed') {
            controller.close();
            return;
          }
        } catch {
          // DB error — keep retrying
        }

        await new Promise((r) => setTimeout(r, POLL_MS));
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
