import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/jwt';
import { saveFileLocally, getFileType } from '@/lib/storage';
import { sql } from '@/lib/db';

// POST /api/upload/local — upload file directly to local storage
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const productId = formData.get('productId') as string;
    const version = (formData.get('version') as string) || '1.0';
    const changelog = (formData.get('changelog') as string) || 'Initial upload';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 100MB limit
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 400 });
    }

    const productUuid = productId || crypto.randomUUID();
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await saveFileLocally(buffer, file.name, productUuid, file.type);

    // Store file record in DB
    await sql`
      INSERT INTO product_files (product_id, version, file_url, file_size_bytes, changelog)
      VALUES (${productUuid}, ${version}, ${result.fileUrl}, ${file.size}, ${changelog})
    `;

    return NextResponse.json({
      success: true,
      fileUrl: result.fileUrl,
      key: result.key,
      productId: productUuid,
      fileSize: file.size,
      version,
    });
  } catch (error: any) {
    console.error('Local upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}