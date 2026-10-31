import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { COOKIE_NAME } from './lib/auth/jwt';

const SECRET_KEY = process.env.AUTH_SECRET || 'sri-mahadevaiyer-sweets-madurai-secret-key-1946-diwali-special';
const encodedKey = new TextEncoder().encode(SECRET_KEY);

const PUBLIC_PATHS = [
  '/login',
  '/track',
  '/api/auth/login',
  '/api/orders/track',
];

const OWNER_ONLY_PATHS = [
  '/reports',
  '/activity',
  '/users',
  '/settings',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static assets, next internal, and public paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    });

    const userRole = (payload as any).role;
    const mustChangePassword = (payload as any).must_change_password;

    // Enforce mandatory password change on first login
    if (mustChangePassword && pathname !== '/change-password' && !pathname.startsWith('/api/auth/')) {
      return NextResponse.redirect(new URL('/change-password', req.url));
    }

    // Role-based protection: Staff cannot access owner-only pages
    if (userRole === 'staff' && OWNER_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  } catch {
    // Invalid or expired token
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Session expired or invalid' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', req.url));

    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
