import type { NextAuthConfig } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

// Define the User type based on your database schema
interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const authConfig = {
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAuthPage = nextUrl.pathname.startsWith('/auth');
      const isOnboardingPage = nextUrl.pathname.startsWith('/onboarding');
      
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
        return false;
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
} satisfies NextAuthConfig; 