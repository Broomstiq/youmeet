import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isRootPath = path === '/';

  // Redirect root path to signin
  if (isRootPath) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

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

  try {
    // Use getToken instead of NextAuth().auth()
    const token = await getToken({ req: request });
    const isAuthenticated = !!token;

    // Handle API paths
    if (!isPublicPath && !isAuthenticated && isApiPath) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Handle protected routes
    if (!isPublicPath && !isAuthenticated) {
      const redirectUrl = new URL('/auth/signin', request.url);
      redirectUrl.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(redirectUrl);
    }

    // Handle auth pages when user is logged in
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
    '/',  // Add root path to matcher
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 