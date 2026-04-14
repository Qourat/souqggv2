import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth/jwt';

// GET /api/profile/me — current user's profile
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const [profile] = await sql`
    SELECT id, username, display_name, email, role, avatar_url, bio, website,
           twitter, github, location, headline, social_links,
           product_count, follower_count, following_count, total_sales, created_at
    FROM public.profiles WHERE id = ${session.userId}
  `;

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json({ profile });
}

// PUT /api/profile/me — update current user's profile
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      display_name, bio, avatar_url, website, twitter, github,
      location, headline, social_links
    } = body;

    await sql`
      UPDATE public.profiles SET
        display_name = COALESCE(${display_name}, display_name),
        bio = COALESCE(${bio}, bio),
        avatar_url = COALESCE(${avatar_url}, avatar_url),
        website = COALESCE(${website}, website),
        twitter = COALESCE(${twitter}, twitter),
        github = COALESCE(${github}, github),
        location = COALESCE(${location}, location),
        headline = COALESCE(${headline}, headline),
        social_links = COALESCE(${social_links}::jsonb, social_links),
        updated_at = now()
      WHERE id = ${session.userId}
    `;

    const [updated] = await sql`
      SELECT id, username, display_name, email, role, avatar_url, bio, website,
             twitter, github, location, headline, social_links,
             product_count, follower_count, following_count, total_sales, created_at
      FROM public.profiles WHERE id = ${session.userId}
    `;

    return NextResponse.json({ profile: updated });
  } catch (err) {
    console.error('Profile update error:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
