import { NextResponse } from 'next/server';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL || 'postgres://souq_user:souq123@localhost:5432/souq');

// GET /api/categories — list all categories
export async function GET() {
  try {
    const categories = await sql`
      SELECT id, slug, name, description, sort_order,
        (SELECT COUNT(*) FROM products WHERE category_id = categories.id AND status = 'active') as product_count
      FROM categories
      ORDER BY sort_order
    `;

    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    console.error('Categories list error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}