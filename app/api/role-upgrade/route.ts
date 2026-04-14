import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { getSession, encrypt } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

const sql = postgres(process.env.DATABASE_URL || 'postgres://souq_user:souq123@localhost:5432/souq');

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { display_name, bio, tos_accepted } = await req.json();

    if (!tos_accepted) {
      return NextResponse.json({ error: 'You must accept the Terms of Service' }, { status: 400 });
    }

    const uid = session.userId as string;
    const uname = session.username as string;
    const dname = display_name || uname;
    const bioText = bio || null;

    // Update profile role to seller
    await sql`
      UPDATE public.profiles
      SET role = 'seller', display_name = ${dname}, bio = ${bioText}, updated_at = now()
      WHERE id = ${uid} AND role = 'buyer'
    `;

    // Create seller profile
    await sql`
      INSERT INTO public.seller_profiles (profile_id, display_name, bio, tos_accepted, tos_accepted_at)
      VALUES (${uid}, ${dname}, ${bioText}, true, now())
      ON CONFLICT (profile_id) DO UPDATE SET
        display_name = ${dname},
        bio = ${bioText},
        tos_accepted = true,
        tos_accepted_at = now(),
        updated_at = now()
    `;

    // Update session cookie with new role
    const newSession = await encrypt({ userId: uid, username: uname, role: 'seller' });

    const cookieStore = await cookies();
    cookieStore.set('session', newSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({ success: true, role: 'seller' });
  } catch (e: any) {
    console.error('Role upgrade error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}