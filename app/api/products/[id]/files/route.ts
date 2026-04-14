import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth/jwt';

// GET /api/products/[id]/files — list files for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const files = await sql`
      SELECT pf.id, pf.product_id, pf.version, pf.file_url, pf.file_size_bytes, pf.changelog, pf.created_at
      FROM product_files pf
      WHERE pf.product_id = ${id}
      ORDER BY pf.created_at DESC
    `;
    return NextResponse.json({ success: true, files });
  } catch (error: any) {
    console.error('Product files list error:', error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
}

// POST /api/products/[id]/files — add a file version (seller only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const [product] = await sql`
      SELECT id, seller_id, title FROM products WHERE id = ${id}
    `;

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.seller_id !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const { version = '1.0', file_url, file_size_bytes, changelog } = body;

    if (!file_url) {
      return NextResponse.json({ error: 'file_url is required' }, { status: 400 });
    }

    const [file] = await sql`
      INSERT INTO product_files (product_id, version, file_url, file_size_bytes, changelog)
      VALUES (${id}, ${version}, ${file_url}, ${file_size_bytes || null}, ${changelog || null})
      RETURNING id, product_id, version, file_url, file_size_bytes, changelog, created_at
    `;

    await sql`
      UPDATE products SET version = ${version}, file_url = ${file_url}
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, file }, { status: 201 });
  } catch (error: any) {
    console.error('Product file create error:', error);
    return NextResponse.json({ error: 'Failed to add file' }, { status: 500 });
  }
}

// DELETE /api/products/[id]/files — remove a file version (seller only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 });
    }

    const [product] = await sql`
      SELECT id, seller_id FROM products WHERE id = ${id}
    `;

    if (!product || (product.seller_id !== session.userId && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    await sql`DELETE FROM product_files WHERE id = ${fileId} AND product_id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Product file delete error:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}