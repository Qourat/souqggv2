import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth/jwt';

// GET /api/comments?product_id=xxx — get comments for a product
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('product_id');

  if (!productId) {
    return NextResponse.json({ error: 'product_id required' }, { status: 400 });
  }

  try {
    const comments = await sql`
      SELECT c.id, c.body, c.parent_id, c.created_at,
             p.username, p.display_name, p.avatar_url
      FROM public.comments c
      JOIN public.profiles p ON c.user_id = p.id
      WHERE c.product_id = ${productId}
      ORDER BY c.created_at ASC
      LIMIT 200
    `;

    return NextResponse.json({ comments });
  } catch (err) {
    console.error('Comments fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST /api/comments — create a comment
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { product_id, parent_id, body } = await req.json();

    if (!product_id || !body || !body.trim()) {
      return NextResponse.json({ error: 'product_id and body required' }, { status: 400 });
    }

    const [comment] = await sql`
      INSERT INTO public.comments (product_id, user_id, parent_id, body)
      VALUES (${product_id}, ${session.userId}, ${parent_id || null}, ${body.trim()})
      RETURNING id, product_id, parent_id, body, created_at
    `;

    return NextResponse.json({ comment }, { status: 201 });
  } catch (err) {
    console.error('Comment create error:', err);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
