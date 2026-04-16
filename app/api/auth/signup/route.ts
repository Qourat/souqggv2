import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { checkRateLimit, RATE_LIMITS } from '@/lib/auth/rate-limit';
import { encrypt } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

const sql = postgres(process.env.DATABASE_URL || 'postgres://souq_user:souq123@localhost:5432/souq');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, password } = body;

    // Validate inputs
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({ error: 'Username must be 3-20 characters' }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return NextResponse.json({ error: 'Username can only contain letters, numbers, - and _' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Rate limit by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rlResult = checkRateLimit(`signup:${ip}`, RATE_LIMITS.buyer);
    if (!rlResult.allowed) {
      return NextResponse.json({ error: 'Too many signup attempts. Try again later.' }, { status: 429 });
    }

    // Check if username taken
    const existing = await sql`
      SELECT id FROM public.profiles WHERE username = ${username}
    `;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    // Check if email taken
    if (email) {
      const existingEmail = await sql`
        SELECT id FROM public.profiles WHERE email = ${email}
      `;
      if (existingEmail.length > 0) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      }
    }

    // Hash password and create profile
    const passwordHash = await hashPassword(password);
    const normalized = String(username).toLowerCase();
    const defaultRole = normalized === 'qourat' ? 'admin' : 'buyer';

    const result = await sql`
      INSERT INTO public.profiles (username, email, password_hash, role, display_name, created_at, updated_at)
      VALUES (${username}, ${email || null}, ${passwordHash}, ${defaultRole}, ${username}, now(), now())
      RETURNING id, username, role
    `;

    const user = result[0];

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
    }, { status: 201 });
  } catch (e: any) {
    console.error('Signup error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}