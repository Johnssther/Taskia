import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const COOKIE_NAME = 'taskia_session';
const PUBLIC_PATHS = ['/', '/login', '/register'];

function isPublicPath(pathname: string): boolean {
  const path = pathname.replace(/\/$/, '') || '/';
  return PUBLIC_PATHS.includes(path);
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'taskia-dev-secret-change-in-production'
    );
    const { payload } = await jose.jwtVerify(token, secret);
    return !!(payload.sub && payload.email);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir assets, _next y API sin verificar sesión
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // favicon, etc.
  ) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const valid = await verifyToken(token);
  if (!valid) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(COOKIE_NAME);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
