-- CreateEnum
CREATE TYPE "Modality" AS ENUM ('image', 'video', 'audio');

-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('replicate', 'akashml', 'modal', 'runpod');

-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('queued', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('image', 'video', 'audio');

-- CreateTable
CREATE TABLE "Generation" (
    "id" TEXT NOT NULL,
    "modality" "Modality" NOT NULL,
    "modelSlug" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "providerJobId" TEXT,
    "status" "GenerationStatus" NOT NULL DEFAULT 'queued',
    "progress" INTEGER,
    "prompt" TEXT NOT NULL,
    "negativePrompt" TEXT,
    "params" JSONB NOT NULL DEFAULT '{}',
    "costCredits" DECIMAL(10,6),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "Generation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "r2Key" TEXT NOT NULL,
    "url" TEXT,
    "thumbnailR2Key" TEXT,
    "mimeType" TEXT,
    "bytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "durationSeconds" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Generation_userId_createdAt_idx" ON "Generation"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Generation_userId_status_idx" ON "Generation"("userId", "status");

-- CreateIndex
CREATE INDEX "Generation_providerJobId_idx" ON "Generation"("providerJobId");

-- CreateIndex
CREATE INDEX "Asset_userId_createdAt_idx" ON "Asset"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Asset_generationId_idx" ON "Asset"("generationId");

-- AddForeignKey
ALTER TABLE "Generation" ADD CONSTRAINT "Generation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Generation" ADD CONSTRAINT "Generation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Generation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "Generation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
