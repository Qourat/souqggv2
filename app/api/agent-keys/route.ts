import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { getSession } from '@/lib/auth/jwt';
import { generateApiKey, hashKey } from '@/lib/auth/agent-keys';
import { checkRateLimit } from '@/lib/auth/rate-limit';

const sql = postgres(process.env.DATABASE_URL || 'postgres://souq_user:souq123@localhost:5432/souq');

/**
 * GET /api/agent-keys — List current user's agent keys (masked)
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const keys = await sql`
    SELECT key_id, scopes, is_active, last_used_at, expires_at, created_at
    FROM public.agent_keys
    WHERE profile_id = ${session.userId}
    ORDER BY created_at DESC
  `;

  return NextResponse.json({
    keys: keys.map(k => ({
      ...k,
      scopes: k.scopes || ['read'],
    })),
  });
}

/**
 * POST /api/agent-keys — Create a new agent API key
 * Body: { name?: string, scopes?: string[], expiresAt?: string }
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Rate limit key creation
  const rlResult = checkRateLimit(`agentkey:create:${session.userId}`, { perMinute: 5, perDay: 20, total: 0 });
  if (!rlResult.allowed) {
    return NextResponse.json({ error: 'Too many key creation attempts' }, { status: 429 });
  }

  try {
    const { name, scopes = ['read'], expiresAt } = await req.json();

    // Validate scopes
    const validScopes = ['read', 'write', 'purchase', 'admin'];
    const filteredScopes = scopes.filter((s: string) => validScopes.includes(s));
    if (filteredScopes.length === 0) {
      return NextResponse.json({ error: 'At least one valid scope is required' }, { status: 400 });
    }

    // Only admins can create admin-scoped keys
    const role = (session.role as string) || 'buyer';
    if (filteredScopes.includes('admin') && role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create admin-scoped keys' }, { status: 403 });
    }

    // Generate key
    const { keyId, apiKey, keyHash } = generateApiKey();

    // Store hashed key in DB
    await sql`
      INSERT INTO public.agent_keys (key_id, profile_id, api_key, scopes, is_active, expires_at, created_at)
      VALUES (${keyId}, ${session.userId}, ${keyHash}, ${filteredScopes}, true, ${expiresAt || null}, now())
    `;

    // Set rate limit
    await sql`UPDATE public.agent_keys SET rate_limit = 100 WHERE key_id = ${keyId}`;

    // Return the raw key ONLY on creation
    return NextResponse.json({
      success: true,
      key: {
        id: keyId,
        name: name || `Agent Key ${keyId.slice(0, 8)}`,
        apiKey,
        scopes: filteredScopes,
        expiresAt: expiresAt || null,
      },
    }, { status: 201 });
  } catch (e: any) {
    console.error('Agent key creation error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/agent-keys — Revoke an agent key
 * Body: { keyId: string }
 */
export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { keyId } = await req.json();
    if (!keyId) {
      return NextResponse.json({ error: 'keyId is required' }, { status: 400 });
    }

    // Only allow deleting own keys
    const result = await sql`
      UPDATE public.agent_keys SET is_active = false
      WHERE key_id = ${keyId} AND profile_id = ${session.userId}
      RETURNING key_id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, revoked: result[0].key_id });
  } catch (e: any) {
    console.error('Agent key revocation error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}