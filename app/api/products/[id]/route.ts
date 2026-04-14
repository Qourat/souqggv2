import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { getSession } from '@/lib/auth/jwt';

const sql = postgres(process.env.DATABASE_URL || 'postgres://souq_user:souq123@localhost:5432/souq');

// GET /api/products/[id] — single product detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [product] = await sql`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
             pr.username as seller_name, pr.email as seller_email,
             COALESCE((SELECT COUNT(*) FROM purchases WHERE product_id = p.id), 0) as sales_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN profiles pr ON p.seller_id = pr.id
      WHERE p.id = ${id}
    `;

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.status !== 'active') {
      const session = await getSession();
      if (!session?.userId || (session.userId !== product.seller_id && session.role !== 'admin')) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
    }

    const files = await sql`
      SELECT id, version, file_url, file_size_bytes, changelog, created_at
      FROM product_files
      WHERE product_id = ${id}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ success: true, product: { ...product, files } });
  } catch (error: any) {
    console.error('Product detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

// PUT /api/products/[id] — update product (owner or admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const [existing] = await sql`SELECT seller_id FROM products WHERE id = ${id}`;
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    if (existing.seller_id !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const allowedFields = [
      'title', 'description', 'price_cents', 'category_id',
      'product_type', 'pricing_type', 'license_type', 'tags',
      'file_url', 'demo_url', 'screenshot_url', 'version',
      'changelog', 'status',
    ];

    const update: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) update[field] = body[field];
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    if (update.title) {
      update.slug = update.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Date.now().toString(36);
    }

    // Build update using individual field queries
    const [updated] = await sql`
      UPDATE products SET ${
        // postgres.js handles dynamic updates via the update helper
        sql(update)
      }
      WHERE id = ${id}
      RETURNING id, title, slug, status
    `;

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error('Product update error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE /api/products/[id] — soft delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    const [existing] = await sql`SELECT seller_id, status FROM products WHERE id = ${id}`;
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    if (existing.seller_id !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    await sql`UPDATE products SET status = 'deleted' WHERE id = ${id}`;

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error: any) {
    console.error('Product delete error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}