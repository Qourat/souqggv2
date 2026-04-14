import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {
    const [profile] = await sql`
      SELECT 
        p.id, p.username, p.display_name, p.bio, p.avatar_url,
        p.website, p.twitter, p.github, p.location, p.headline,
        p.social_links, p.product_count, p.follower_count, p.following_count,
        p.total_sales, p.role, p.created_at,
        sp.display_name as seller_display_name, sp.bio as seller_bio
      FROM public.profiles p
      LEFT JOIN public.seller_profiles sp ON sp.profile_id = p.id
      WHERE p.username = ${username}
    `;

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get user's products
    const products = await sql`
      SELECT p.id, p.title, p.slug, p.price_cents, p.upvotes, p.created_at, p.description, p.screenshot_url,
             c.name as category_name, c.slug as category_slug
      FROM public.products p
      LEFT JOIN public.categories c ON p.category_id = c.id
      WHERE p.seller_id = ${profile.id} AND p.status = 'active'
      ORDER BY p.upvotes DESC, p.created_at DESC
      LIMIT 20
    `;

    // Get review stats
    const [reviewStats] = await sql`
      SELECT 
        COUNT(*) as total_reviews,
        COALESCE(AVG(r.rating), 0) as avg_rating
      FROM public.reviews r
      JOIN public.products p ON r.product_id = p.id
      WHERE p.seller_id = ${profile.id}
    `;

    return NextResponse.json({
      profile,
      products,
      reviewStats: {
        total: Number(reviewStats?.total_reviews || 0),
        avgRating: Number(reviewStats?.avg_rating || 0),
      },
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}