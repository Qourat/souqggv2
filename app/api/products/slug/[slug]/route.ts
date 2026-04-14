import { NextRequest } from 'next/server';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL || 'postgres://souq_user:souq123@localhost:5432/souq');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const [product] = await sql`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
             pr.username as seller_name,
             COALESCE((SELECT COUNT(*) FROM purchases WHERE product_id = p.id), 0) as sales_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN profiles pr ON p.seller_id = pr.id
      WHERE p.slug = ${slug} AND p.status = 'active'
    `;

    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    const files = await sql`
      SELECT id, version, file_url, file_size_bytes, changelog, created_at
      FROM product_files
      WHERE product_id = ${product.id}
      ORDER BY created_at DESC
    `;

    return Response.json({ success: true, product: { ...product, files } });
  } catch (error: any) {
    console.error('Product slug lookup error:', error);
    return Response.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
