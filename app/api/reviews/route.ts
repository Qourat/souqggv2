import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth/jwt';

// GET /api/reviews?product_id=xxx — get reviews for a product
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('product_id');

  if (!productId) {
    return NextResponse.json({ error: 'product_id required' }, { status: 400 });
  }

  try {
    const reviews = await sql`
      SELECT r.id, r.rating, r.title, r.body, r.created_at,
             p.username, p.display_name, p.avatar_url
      FROM public.reviews r
      JOIN public.profiles p ON r.user_id = p.id
      WHERE r.product_id = ${productId}
      ORDER BY r.created_at DESC
      LIMIT 50
    `;

    const [stats] = await sql`
      SELECT 
        COUNT(*) as total,
        COALESCE(AVG(rating), 0) as avg_rating,
        COALESCE(MIN(rating), 0) as min_rating,
        COALESCE(MAX(rating), 0) as max_rating
      FROM public.reviews WHERE product_id = ${productId}
    `;

    return NextResponse.json({
      reviews,
      stats: {
        total: Number(stats?.total || 0),
        avgRating: Number(stats?.avg_rating || 0),
      },
    });
  } catch (err) {
    console.error('Reviews fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST /api/reviews — create a review
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { product_id, rating, title, body } = await req.json();

    if (!product_id || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'product_id and rating (1-5) required' }, { status: 400 });
    }

    // Check product exists
    const [product] = await sql`
      SELECT id FROM public.products WHERE id = ${product_id}
    `;
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Upsert review (one per user per product)
    const [review] = await sql`
      INSERT INTO public.reviews (product_id, user_id, rating, title, body)
      VALUES (${product_id}, ${session.userId}, ${rating}, ${title || null}, ${body || null})
      ON CONFLICT (product_id, user_id)
      DO UPDATE SET rating = ${rating}, title = ${title || null}, body = ${body || null}, updated_at = now()
      RETURNING id, rating, title, body, created_at
    `;

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    console.error('Review create error:', err);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
