/**
 * CLI test for the end-to-end generation pipeline.
 *
 * Usage:
 *   npm run test:generate -- --model flux-dev --prompt "a cat"
 *   npm run test:generate -- --model musicgen --prompt "upbeat jazz" --provider replicate
 *
 * Submits a real job to the provider, polls until completion, and prints the result.
 * Requires REPLICATE_API_TOKEN (or relevant provider key) + DATABASE_URL in .env
 */
import 'dotenv/config';
import { prisma } from '@/lib/db';
import { resolveProvider } from '@/lib/providers';
import type { ProviderName } from '@/lib/providers';
import { getModel } from '@/lib/models/registry';
import { tick } from '@/lib/jobs/worker';

// ── Argument parsing ──────────────────────────────────────────────────────────

function arg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const modelSlug = arg('--model') ?? 'flux-schnell';
const prompt    = arg('--prompt') ?? 'a photorealistic cat sitting on a windowsill';
const provider  = (arg('--provider') as ProviderName | undefined);

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n── test:generate ──────────────────────────────`);
  console.log(`  model:    ${modelSlug}`);
  console.log(`  prompt:   ${prompt}`);
  console.log(`  provider: ${provider ?? '(default)'}`);
  console.log(`───────────────────────────────────────────────\n`);

  const model = getModel(modelSlug);
  const resolvedProvider = resolveProvider(modelSlug, provider);
  console.log(`Resolved provider: ${resolvedProvider.name}`);

  // Find or create a test user
  let user = await prisma.user.findFirst({ where: { email: 'test@mediagen.dev' } });
  if (!user) {
    user = await prisma.user.create({
      data: { name: 'CLI Test User', email: 'test@mediagen.dev', emailVerified: false },
    });
  }

  // Create the generation record
  const gen = await prisma.generation.create({
    data: {
      userId: user.id,
      modality: model.modality,
      modelSlug,
      provider: resolvedProvider.name,
      status: 'queued',
      prompt,
      params: model.defaults as Parameters<typeof prisma.generation.create>[0]['data']['params'],
    },
  });

  console.log(`Created generation: ${gen.id}`);
  console.log('Submitting to provider…\n');

  // Run worker ticks until terminal state
  const MAX_TICKS = 60;
  const TICK_INTERVAL_MS = 5000;
  const webhookBase = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  for (let i = 0; i < MAX_TICKS; i++) {
    await tick(webhookBase);

    const current = await prisma.generation.findUnique({
      where: { id: gen.id },
      include: { assets: true },
    });
    if (!current) break;

    const elapsed = Math.round((Date.now() - new Date(gen.createdAt).getTime()) / 1000);
    const progress = current.progress != null ? ` [${current.progress}%]` : '';
    process.stdout.write(`\r  ${current.status}${progress} — ${elapsed}s elapsed   `);

    if (current.status === 'completed') {
      console.log('\n\n✓ Completed!');
      console.log(`  Cost: $${current.costCredits ?? 'unknown'}`);
      console.log(`  Assets (${current.assets.length}):`);
      for (const a of current.assets) {
        console.log(`    ${a.type} → r2://${a.r2Key}`);
        if (a.url) console.log(`    public: ${a.url}`);
      }
      break;
    }

    if (current.status === 'failed') {
      console.log('\n\n✗ Failed:', current.errorMessage);
      process.exit(1);
    }

    await new Promise((r) => setTimeout(r, TICK_INTERVAL_MS));
  }

  console.log('\nDone.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
