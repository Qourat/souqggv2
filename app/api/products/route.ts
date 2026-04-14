import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { getSession } from '@/lib/auth/jwt';

const sql = postgres(process.env.DATABASE_URL || 'postgres://souq_user:souq123@localhost:5432/souq');

// GET /api/products — list products with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const productType = searchParams.get('type');
    const status = searchParams.get('status') || 'active';
    const sort = searchParams.get('sort') || 'newest';
    const search = searchParams.get('q');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    let where = sql`WHERE 1=1`;
    
    if (status === 'all') {
      // seller sees all their own; public sees active
      const session = await getSession();
      if (session?.userId) {
        where = sql`WHERE (p.status = 'active' OR p.seller_id = ${session.userId})`;
      } else {
        where = sql`WHERE p.status = 'active'`;
      }
    } else {
      where = sql`WHERE p.status = ${status}`;
    }

    let orderBy = sql`p.created_at DESC`;
    if (sort === 'popular') orderBy = sql`p.upvotes DESC`;
    if (sort === 'price_low') orderBy = sql`p.price_cents ASC`;
    if (sort === 'price_high') orderBy = sql`p.price_cents DESC`;

    const categoryFilter = category ? sql` AND c.slug = ${category}` : sql``;
    const typeFilter = productType ? sql` AND p.product_type = ${productType}` : sql``;
    const searchFilter = search ? sql` AND (p.title ILIKE ${'%' + search + '%'} OR p.description ILIKE ${'%' + search + '%'} OR ${search} = ANY(p.tags))` : sql``;

    const products = await sql`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
             pr.username as seller_name,
             COALESCE((SELECT COUNT(*) FROM purchases WHERE product_id = p.id), 0) as sales_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN profiles pr ON p.seller_id = pr.id
      ${where} ${categoryFilter} ${typeFilter} ${searchFilter}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const totalResult = await sql`
      SELECT COUNT(*) as total FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${where} ${categoryFilter} ${typeFilter} ${searchFilter}
    `;

    return NextResponse.json({
      success: true,
      products,
      total: parseInt(totalResult[0]?.total || '0'),
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Products list error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST /api/products — create a new product (seller/admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (session.role !== 'seller' && session.role !== 'admin') {
      return NextResponse.json({ error: 'Seller access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title, description, price_cents, category_id,
      product_type = 'code', pricing_type = 'one_time', license_type = 'standard',
      tags = [], file_url, demo_url, screenshot_url,
      version = '1.0', changelog, status = 'draft',
    } = body;

    if (!title || !description || price_cents === undefined) {
      return NextResponse.json({ error: 'title, description, and price_cents are required' }, { status: 400 });
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36);

    const [product] = await sql`
      INSERT INTO products (
        seller_id, title, slug, description, price_cents,
        category_id, product_type, pricing_type, license_type,
        tags, file_url, demo_url, screenshot_url,
        version, changelog, status
      ) VALUES (
        ${session.userId}, ${title}, ${slug}, ${description}, ${price_cents},
        ${category_id || null}, ${product_type}, ${pricing_type}, ${license_type},
        ${tags}, ${file_url || null}, ${demo_url || null}, ${screenshot_url || null},
        ${version}, ${changelog || null}, ${status}
      )
      RETURNING id, title, slug, status, created_at
    `;

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: any) {
    console.error('Product create error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Product slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}