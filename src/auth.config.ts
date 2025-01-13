import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }: { 
      auth: { user: any } | null; 
      request: { nextUrl: URL } 
    }) {
      const isLoggedIn = !!auth?.user;
      const isOnAuthPage = nextUrl.pathname.startsWith('/auth');
      const isOnboardingPage = nextUrl.pathname.startsWith('/onboarding');
      
      // Allow access to onboarding for logged-in users who need it
      if (isOnboardingPage && isLoggedIn) {
        return true;
      }

      // Redirect authenticated users from auth pages
      if (isOnAuthPage && isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      // Allow access to auth pages
      if (isOnAuthPage) {
        return true;
      }

      // Protect all other pages
      if (!isLoggedIn) {
        let redirectUrl = new URL('/auth/signin', nextUrl);
        redirectUrl.searchParams.set('callbackUrl', nextUrl.pathname);
        return Response.redirect(redirectUrl);
      }

      return true;
    },
  },
  providers: [], // We'll configure providers in auth.ts
} satisfies NextAuthConfig; 