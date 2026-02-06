import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hasAuth = request.cookies.has('auth');
  const { pathname } = request.nextUrl;

  // If user is trying to access /admin but is not authenticated, redirect to /login
  if (pathname.startsWith('/admin') && !hasAuth) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated and tries to access /login, redirect to /admin
  if (pathname.startsWith('/login') && hasAuth) {
    const adminUrl = new URL('/admin', request.url);
    return NextResponse.redirect(adminUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
