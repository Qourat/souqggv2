import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = process.env.JWT_SECRET as string;
if (!SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const encodedSecret = new TextEncoder().encode(SECRET);

// Unlisted routes default to public (pages) or are gated in the /api/ block below.

// Paths that require authentication but any role
const AUTH_ONLY_PATHS = [
  '/submit',
  '/seller',
  '/purchases',
  '/agent/keys',
  '/settings',
  '/api/role-upgrade',  // any authenticated user can upgrade to seller
  '/api/agent-keys',    // any authenticated user can manage their own keys
  '/api/auth/set-password',
  '/api/auth/logout',
  '/api/auth/session',
];

// Paths that require admin role
const ADMIN_ONLY_PATHS = [
  '/admin',
  '/api/admin',
];

// Paths that require seller role (or admin) for write operations
const SELLER_ONLY_PATHS = [
  '/submit',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets and auth routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/signup') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2')
  ) {
    return NextResponse.next();
  }

  // ─── Agent API Key Auth ───
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer sk_live_')) {
    const response = NextResponse.next();
    response.headers.set('X-Auth-Type', 'agent-key');
    return response;
  }

  // ─── Session Cookie Auth ───
  const token = request.cookies.get('session')?.value;
  let session: { userId: string; username: string; role: string } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, encodedSecret);
      session = payload as { userId: string; username: string; role: string };
    } catch {
      // Invalid/expired token
    }
  }

  // ─── Admin-only routes ───
  if (ADMIN_ONLY_PATHS.some(p => pathname.startsWith(p))) {
    if (!session) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const isOwnerAdmin = String(session.username).toLowerCase() === 'qourat';
    if (session.role !== 'admin' && !isOwnerAdmin) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
    const response = NextResponse.next();
    response.headers.set('X-User-Id', session.userId);
    response.headers.set('X-User-Role', session.role);
    return response;
  }

  // ─── Seller-only page routes (not API) ───
  if (SELLER_ONLY_PATHS.some(p => pathname.startsWith(p) && !pathname.startsWith('/api/'))) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (session.role !== 'seller' && session.role !== 'admin') {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
    const response = NextResponse.next();
    response.headers.set('X-User-Id', session.userId);
    response.headers.set('X-User-Role', session.role);
    return response;
  }

  // ─── Auth-required routes (any role) ───
  if (AUTH_ONLY_PATHS.some(p => pathname.startsWith(p))) {
    if (!session) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const response = NextResponse.next();
    response.headers.set('X-User-Id', session.userId);
    response.headers.set('X-User-Role', session.role);
    return response;
  }

  // ─── General API auth ───
  if (pathname.startsWith('/api/')) {
    // Public GET endpoints
    if (pathname === '/api/products' && request.method === 'GET') {
      return NextResponse.next();
    }
    if (pathname === '/api/categories' && request.method === 'GET') {
      return NextResponse.next();
    }
    // Checkout allows anonymous for free products
    if (pathname === '/api/checkout' && request.method === 'POST') {
      return NextResponse.next();
    }
    // Upvote requires auth but handled by its own route
    if (pathname === '/api/upvote') {
      return NextResponse.next();
    }

    if (!session && !authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (session) {
      const response = NextResponse.next();
      response.headers.set('X-User-Id', session.userId);
      response.headers.set('X-User-Role', session.role);
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};