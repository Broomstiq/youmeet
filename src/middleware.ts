import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define which paths should be handled by Node.js runtime
const nodeJsPaths = ['/api/'];
export const runtime = 'nodejs';


export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Skip middleware for paths that require Node.js
  if (nodeJsPaths.some(prefix => path.startsWith(prefix))) {
    return NextResponse.next();
  }

  const isRootPath = path === '/';
  
  // Handle static paths and basic auth checks in Edge
  if (isRootPath) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  const isPublicPath = path === '/auth/signin' || 
                      path === '/auth/signup' || 
                      path === '/auth/forgot-password' ||
                      path === '/auth/reset-password' ||
                      path === '/youmeet_logo.svg' ||
                      path.startsWith('/callback');

  try {
    const sessionToken = request.cookies.get('next-auth.session-token')?.value;
    const isAuthenticated = !!sessionToken;

    if (!isPublicPath && !isAuthenticated) {
      const redirectUrl = new URL('/auth/signin', request.url);
      redirectUrl.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(redirectUrl);
    }

    if ((path === '/auth/signin' || path === '/auth/signup') && isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
}

export const config = {
  matcher: [
    '/',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 