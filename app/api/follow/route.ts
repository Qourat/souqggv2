import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth/jwt';

// POST /api/follow — follow or unfollow a user
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { username } = await req.json();
    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    // Find target user
    const [target] = await sql`
      SELECT id FROM public.profiles WHERE username = ${username}
    `;
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (target.id === session.userId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Check if already following
    const [existing] = await sql`
      SELECT id FROM public.follows
      WHERE follower_id = ${session.userId} AND following_id = ${target.id}
    `;

    if (existing) {
      // Unfollow
      await sql`
        DELETE FROM public.follows
        WHERE follower_id = ${session.userId} AND following_id = ${target.id}
      `;
      await sql`
        UPDATE public.profiles SET following_count = GREATEST(following_count - 1, 0)
        WHERE id = ${session.userId}
      `;
      await sql`
        UPDATE public.profiles SET follower_count = GREATEST(follower_count - 1, 0)
        WHERE id = ${target.id}
      `;
      return NextResponse.json({ following: false });
    } else {
      // Follow
      await sql`
        INSERT INTO public.follows (follower_id, following_id)
        VALUES (${session.userId}, ${target.id})
        ON CONFLICT (follower_id, following_id) DO NOTHING
      `;
      await sql`
        UPDATE public.profiles SET following_count = following_count + 1
        WHERE id = ${session.userId}
      `;
      await sql`
        UPDATE public.profiles SET follower_count = follower_count + 1
        WHERE id = ${target.id}
      `;
      return NextResponse.json({ following: true });
    }
  } catch (err) {
    console.error('Follow error:', err);
    return NextResponse.json({ error: 'Failed to follow/unfollow' }, { status: 500 });
  }
}
