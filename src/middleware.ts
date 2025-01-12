import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Extend the auth middleware with custom logic
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

  // Use the new auth() function
  const auth = await NextAuth(authConfig).auth();
  const isAuthenticated = !!auth?.user;

  // Handle API paths
  if (!isPublicPath && !isAuthenticated && isApiPath) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Handle protected routes
  if (!isPublicPath && !isAuthenticated) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // Handle auth pages when user is logged in
  if ((path === '/auth/signin' || path === '/auth/signup') && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Keep the existing matcher configuration
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 