import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { verifyPassword } from '@/lib/auth/password';
import { checkRateLimit, RATE_LIMITS } from '@/lib/auth/rate-limit';
import { encrypt } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

const sql = postgres(process.env.DATABASE_URL || 'postgres://souq_user:souq123@localhost:5432/souq');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Rate limit by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rlResult = checkRateLimit(`login:${ip}`, RATE_LIMITS.buyer);
    if (!rlResult.allowed) {
      return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 });
    }

    // Look up user
    const users = await sql`
      SELECT id, username, password_hash, role FROM public.profiles WHERE username = ${username}
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const user = users[0];
    const isOwnerAdmin = String(user.username).toLowerCase() === 'qourat';

    // Ensure owner account is always admin.
    if (isOwnerAdmin && user.role !== 'admin') {
      await sql`UPDATE public.profiles SET role = 'admin' WHERE id = ${user.id}`;
      user.role = 'admin';
    }

    // Check if user has a password hash (legacy accounts might not)
    if (!user.password_hash) {
      return NextResponse.json({ error: 'Account needs password setup. Use /api/auth/set-password first.' }, { status: 403 });
    }

    // Verify password
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Create session
    const session = await encrypt({ userId: user.id, username: user.username, role: user.role });
    const cookieStore = await cookies();
    cookieStore.set('session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (e: any) {
    console.error('Login error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}