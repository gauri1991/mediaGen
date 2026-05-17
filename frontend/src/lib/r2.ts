import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function createR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  if (!accountId) throw new Error('R2_ACCOUNT_ID is not set');

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

const BUCKET = () => {
  const b = process.env.R2_BUCKET_NAME;
  if (!b) throw new Error('R2_BUCKET_NAME is not set');
  return b;
};

export function assetKey(userId: string, generationId: string, filename: string): string {
  return `users/${userId}/generations/${generationId}/${filename}`;
}

export function thumbnailKey(key: string): string {
  const dot = key.lastIndexOf('.');
  return dot === -1 ? `${key}_thumb` : `${key.slice(0, dot)}_thumb${key.slice(dot)}`;
}

export async function uploadBuffer(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  const client = createR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
}

export async function downloadUrl(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function getSignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  const client = createR2Client();
  const command = new GetObjectCommand({ Bucket: BUCKET(), Key: key });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export function publicUrl(key: string): string {
  const base = process.env.R2_PUBLIC_URL;
  if (!base) throw new Error('R2_PUBLIC_URL is not set');
  return `${base.replace(/\/$/, '')}/${key}`;
}
