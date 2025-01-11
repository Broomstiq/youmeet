import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /protected)
  const path = request.nextUrl.pathname;

  // Public paths that don't require authentication
  const isPublicPath = path === '/auth/signin' || 
                      path === '/auth/signup' || 
                      path.startsWith('/api/auth/') ||
                      path.startsWith('/api/prematch/test') || // Allow test endpoint
                      path.startsWith('/api/prematch/check') || // Allow check endpoint
                      path.startsWith('/api/prematch/calculate') || 
                      path.startsWith('/callback');

  const isApiPath = path.startsWith('/api/');
  const token = await getToken({ req: request });

  // Redirect to signin if accessing a protected route without auth
  if (!isPublicPath && !token) {
    if (isApiPath) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // Redirect to dashboard if accessing auth page with token
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