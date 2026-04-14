import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/jwt';
import { saveFileLocally, getFileType, isR2Configured, generatePresignedUploadUrl } from '@/lib/storage';
import { sql } from '@/lib/db';

// POST /api/upload — Unified upload endpoint (local or R2)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';

    // Handle multipart/form-data (local storage or direct upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const productId = (formData.get('productId') as string) || crypto.randomUUID();
      const version = (formData.get('version') as string) || '1.0';
      const changelog = (formData.get('changelog') as string) || 'Initial upload';

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      // 100MB limit
      if (file.size > 100 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 400 });
      }

      if (isR2Configured()) {
        // Upload to R2 directly
        const buffer = Buffer.from(await file.arrayBuffer());
        const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
        const r2 = new S3Client({
          region: 'auto',
          endpoint: process.env.R2_ENDPOINT,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
          },
        });
        const key = `products/${productId}/${version}/${file.name}`;
        await r2.send(new PutObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: file.type || 'application/octet-stream',
        }));
        const fileUrl = `${process.env.R2_PUBLIC_URL || process.env.R2_ENDPOINT}/${key}`;

        await sql`
          INSERT INTO product_files (product_id, version, file_url, file_size_bytes, changelog)
          VALUES (${productId}, ${version}, ${fileUrl}, ${file.size}, ${changelog})
        `;

        return NextResponse.json({ success: true, fileUrl, key, productId, fileSize: file.size, version });
      } else {
        // Local storage fallback
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await saveFileLocally(buffer, file.name, productId, file.type);

        await sql`
          INSERT INTO product_files (product_id, version, file_url, file_size_bytes, changelog)
          VALUES (${productId}, ${version}, ${result.fileUrl}, ${file.size}, ${changelog})
        `;

        return NextResponse.json({ success: true, fileUrl: result.fileUrl, key: result.key, productId, fileSize: file.size, version });
      }
    }

    // Handle JSON — presigned URL request for R2
    const body = await request.json();
    const { fileName, contentType: fileType, productId: pid } = body;

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'fileName and contentType required' }, { status: 400 });
    }

    if (!isR2Configured()) {
      return NextResponse.json({
        success: true,
        method: 'local',
        uploadEndpoint: '/api/upload',
        productId: pid || crypto.randomUUID(),
        message: 'R2 not configured. Use multipart upload.',
      });
    }

    const productUuid = pid || crypto.randomUUID();
    const result = await generatePresignedUploadUrl(fileName, fileType, productUuid);

    await sql`
      INSERT INTO product_files (product_id, version, file_url, file_size_bytes, changelog)
      VALUES (${productUuid}, '1.0', ${result.fileUrl}, 0, 'Presigned upload pending')
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
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed', details: error.message }, { status: 500 });
  }
}