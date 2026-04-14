import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL || 'postgres://souq_user:souq123@localhost:5432/souq');

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [product] = await sql`SELECT id, upvotes FROM products WHERE id = ${id} AND status = 'active'`;
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await sql`UPDATE products SET upvotes = upvotes + 1 WHERE id = ${id}`;
    const [updated] = await sql`SELECT upvotes FROM products WHERE id = ${id}`;

    return NextResponse.json({ success: true, upvotes: updated.upvotes });
  } catch (error: any) {
    console.error('Upvote error:', error);
    return NextResponse.json({ error: 'Failed to upvote' }, { status: 500 });
  }
}
