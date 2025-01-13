import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isLoggedIn = !!token;
  const isOnAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isOnboardingPage = request.nextUrl.pathname.startsWith('/onboarding');
  const isRootPath = request.nextUrl.pathname === '/';

  // Redirect root path to signin
  if (isRootPath) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // Allow access to onboarding for logged-in users who need it
  if (isOnboardingPage && isLoggedIn) {
    return NextResponse.next();
  }

  // Redirect authenticated users from auth pages
  if (isOnAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow access to auth pages
  if (isOnAuthPage) {
    return NextResponse.next();
  }

  // Protect all other pages
  if (!isLoggedIn) {
    const redirectUrl = new URL('/auth/signin', request.url);
    redirectUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/((?!api|_next/static|_next/image|.*\\.png$|favicon.ico).*)',
  ],
}; 