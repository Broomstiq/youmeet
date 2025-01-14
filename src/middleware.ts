import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Keep the list of public paths
  const isPublicPath = path === '/auth/signin' || 
                      path === '/auth/signup' || 
                      path === '/auth/forgot-password' ||
                      path === '/auth/reset-password' ||
                      path === '/youmeet_logo.svg' ||
                      path.startsWith('/api/auth/') ||
                      path.startsWith('/api/user/reset-password') ||
                      path.startsWith('/api/user/update-password') ||
                      path.startsWith('/api/prematch/test') || 
                      path.startsWith('/api/prematch/check') || 
                      path.startsWith('/api/prematch/calculate') || 
                      path.startsWith('/callback');

  const isApiPath = path.startsWith('/api/');

  // Check for authentication token
  const token = request.cookies.get('next-auth.session-token')?.value || 
                request.cookies.get('__Secure-next-auth.session-token')?.value;

  // Handle API paths
  if (!isPublicPath && !token && isApiPath) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Handle protected routes
  if (!isPublicPath && !token) {
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(url);
  }

  // Handle auth pages when user is logged in
  if ((path === '/auth/signin' || path === '/auth/signup') && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 