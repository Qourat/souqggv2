import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { getSession } from '@/lib/auth/jwt';

const sql = postgres(process.env.DATABASE_URL || 'postgres://souq_user:souq123@localhost:5432/souq');

/**
 * POST /api/auth/set-password
 * - For legacy accounts without a password hash: set initial password
 * - For existing accounts: change password (requires currentPassword)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password, currentPassword } = body;

    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Get current user from session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const uid = session.userId as string;

    // Look up current password hash
    const users = await sql`
      SELECT password_hash FROM public.profiles WHERE id = ${uid}
    `;
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentHash = users[0].password_hash;

    // If user already has a password, require current password verification
    if (currentHash) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
      }
      const valid = await verifyPassword(currentPassword, currentHash);
      if (!valid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
      }
    }

    // Set new password
    const newHash = await hashPassword(password);
    await sql`
      UPDATE public.profiles SET password_hash = ${newHash}, updated_at = now() WHERE id = ${uid}
    `;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Set password error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}