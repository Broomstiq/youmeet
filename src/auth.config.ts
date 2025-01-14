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
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single();

        if (!user || !user.password_hash) return null;

        const typedUser = user as User;
        
        const isValid = await bcrypt.compare(
          credentials.password as string,
          typedUser.password_hash
        );

        if (!isValid) return null;

        return {
          id: typedUser.id,
          email: typedUser.email,
          name: typedUser.name,
        };
      }
    })
  ],
  trustHost: true,
} satisfies NextAuthConfig; 