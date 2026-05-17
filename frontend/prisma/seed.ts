import "dotenv/config";
import { PrismaClient, Modality, Provider, GenerationStatus, AssetType } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Use the test user created during M1 testing, or create a seed user
  let user = await prisma.user.findFirst({ where: { email: "test@mediagen.dev" } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Seed User",
        email: "seed@mediagen.dev",
        emailVerified: false,
      },
    });
    console.log(`Created user: ${user.email}`);
  } else {
    console.log(`Using existing user: ${user.email}`);
  }

  // Clean up any previous seed generations
  await prisma.generation.deleteMany({
    where: { userId: user.id, prompt: { startsWith: "[seed]" } },
  });

  const seeds: Array<{
    modality: Modality;
    modelSlug: string;
    provider: Provider;
    status: GenerationStatus;
    prompt: string;
    params: Record<string, unknown>;
    asset?: { type: AssetType; r2Key: string; mimeType: string; width?: number; height?: number; durationSeconds?: number };
  }> = [
    {
      modality: "image",
      modelSlug: "flux-dev",
      provider: "replicate",
      status: "completed",
      prompt: "[seed] a photorealistic mountain landscape at golden hour, 4k",
      params: { width: 1024, height: 1024, steps: 28, cfg: 3.5, seed: 42 },
      asset: { type: "image", r2Key: "users/seed/gen-img-001/output.webp", mimeType: "image/webp", width: 1024, height: 1024 },
    },
    {
      modality: "video",
      modelSlug: "wan-2.2",
      provider: "replicate",
      status: "processing",
      prompt: "[seed] a slow-motion waterfall in a tropical jungle, cinematic",
      params: { width: 1280, height: 720, duration: 5, seed: 99 },
    },
    {
      modality: "audio",
      modelSlug: "musicgen",
      provider: "replicate",
      status: "queued",
      prompt: "[seed] upbeat electronic synthwave track, 120bpm, energetic",
      params: { duration: 30, top_k: 250, top_p: 0.0, temperature: 1.0 },
    },
    {
      modality: "image",
      modelSlug: "flux-dev",
      provider: "akashml",
      status: "failed",
      prompt: "[seed] abstract digital art, neon colors, geometric shapes",
      params: { width: 1024, height: 1024, steps: 20, seed: 7 },
    },
  ];

  for (const seed of seeds) {
    const gen = await prisma.generation.create({
      data: {
        userId: user.id,
        modality: seed.modality,
        modelSlug: seed.modelSlug,
        provider: seed.provider,
        status: seed.status,
        prompt: seed.prompt,
        params: seed.params as Parameters<typeof prisma.generation.create>[0]["data"]["params"],
        progress: seed.status === "processing" ? 47 : null,
        startedAt: ["processing", "completed", "failed"].includes(seed.status) ? new Date(Date.now() - 60_000) : null,
        completedAt: seed.status === "completed" ? new Date() : null,
        errorMessage: seed.status === "failed" ? "GPU timeout after 60s — provider returned 524" : null,
        costCredits: seed.status === "completed" ? 0.025 : null,
      },
    });

    if (seed.asset) {
      await prisma.asset.create({
        data: {
          generationId: gen.id,
          userId: user.id,
          type: seed.asset.type,
          r2Key: seed.asset.r2Key,
          mimeType: seed.asset.mimeType,
          width: seed.asset.width ?? null,
          height: seed.asset.height ?? null,
          durationSeconds: seed.asset.durationSeconds ?? null,
          bytes: 1_240_000,
        },
      });
    }

    console.log(`  [${seed.status.padEnd(10)}] ${seed.modality} — ${seed.modelSlug}`);
  }

  console.log("\nSeed complete. Rows in DB:");
  const counts = await Promise.all([
    prisma.generation.count({ where: { userId: user.id } }),
    prisma.asset.count({ where: { userId: user.id } }),
  ]);
  console.log(`  Generation: ${counts[0]}`);
  console.log(`  Asset:      ${counts[1]}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
