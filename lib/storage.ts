// Storage abstraction — Cloudflare R2 (S3-compatible) presigned URL uploads
// Falls back to local storage if R2 is not configured

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET || 'souq-products';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}

function getS3Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  });
}

export interface PresignedUrlResult {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

/**
 * Generate a presigned URL for uploading a file to R2.
 * The client uploads directly to R2 using PUT.
 */
export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  productId: string,
): Promise<PresignedUrlResult> {
  if (!isR2Configured()) {
    throw new Error('R2 storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.');
  }

  const client = getS3Client();
  const ext = fileName.split('.').pop() || 'bin';
  const key = `products/${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 }); // 1 hour

  const fileUrl = R2_PUBLIC_URL
    ? `${R2_PUBLIC_URL}/${key}`
    : `https://${R2_BUCKET}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

  return { uploadUrl, fileUrl, key };
}

/**
 * Generate a presigned download URL (for private files).
 */
export async function generatePresignedDownloadUrl(key: string): Promise<string> {
  if (!isR2Configured()) {
    throw new Error('R2 storage is not configured.');
  }

  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn: 3600 });
}

// Local storage fallback for development
import { promises as fs } from 'fs';
import path from 'path';

const LOCAL_UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR || '/var/www/souq_v2/public/uploads';

export async function saveFileLocally(
  fileBuffer: Buffer,
  fileName: string,
  productId: string,
  contentType: string,
): Promise<{ fileUrl: string; key: string }> {
  const dir = path.join(LOCAL_UPLOAD_DIR, 'products', productId);
  await fs.mkdir(dir, { recursive: true });

  const ext = fileName.split('.').pop() || 'bin';
  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filePath = path.join(dir, key);

  await fs.writeFile(filePath, fileBuffer);

  const fileUrl = `/uploads/products/${productId}/${key}`;
  return { fileUrl, key };
}

/**
 * Get file info for product file download verification.
 */
export function getFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const types: Record<string, string> = {
    pdf: 'application/pdf',
    zip: 'application/zip',
    gz: 'application/gzip',
    tar: 'application/x-tar',
    js: 'text/javascript',
    ts: 'text/typescript',
    py: 'text/x-python',
    md: 'text/markdown',
    txt: 'text/plain',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  };
  return types[ext] || 'application/octet-stream';
}