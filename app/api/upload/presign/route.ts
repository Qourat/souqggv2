import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/jwt';
import { generatePresignedUploadUrl, isR2Configured, saveFileLocally, getFileType } from '@/lib/storage';
import { sql } from '@/lib/db';

// POST /api/upload/presign — get presigned URL for direct upload to R2
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { fileName, contentType, productId } = body;

    if (!fileName || !contentType) {
      return NextResponse.json({ error: 'fileName and contentType required' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf', 'application/zip', 'application/gzip',
      'application/x-tar', 'text/plain', 'text/markdown',
      'text/javascript', 'text/typescript', 'text/x-python',
      'application/json', 'application/octet-stream',
      'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml',
    ];
    if (!allowedTypes.some(t => contentType.startsWith(t.split('/')[0]))) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    // Max 100MB
    const MAX_SIZE = 100 * 1024 * 1024;

    if (isR2Configured()) {
      // Use R2 with presigned URLs
      const productUuid = productId || crypto.randomUUID();
      const result = await generatePresignedUploadUrl(fileName, contentType, productUuid);

      // Store file record in DB
      await sql`
        INSERT INTO product_files (product_id, version, file_url, file_size_bytes, changelog)
        VALUES (${productUuid}, '1.0', ${result.fileUrl}, 0, 'Initial upload')
        ON CONFLICT DO NOTHING
      `;

      return NextResponse.json({
        success: true,
        uploadUrl: result.uploadUrl,
        fileUrl: result.fileUrl,
        key: result.key,
        productId: productUuid,
        method: 'r2-presigned',
      });
    } else {
      // Local upload via multipart form — client must call /api/upload/local
      return NextResponse.json({
        success: true,
        method: 'local',
        uploadEndpoint: '/api/upload/local',
        productId: productId || crypto.randomUUID(),
        message: 'R2 not configured. Use local upload endpoint.',
      });
    }
  } catch (error: any) {
    console.error('Presign error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}