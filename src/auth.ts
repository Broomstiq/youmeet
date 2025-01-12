import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { JWT } from 'next-auth/jwt';
import type { Session } from 'next-auth';

export interface ExtendedSession extends Session {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface ExtendedJWT extends JWT {
  userId?: string;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development",
}); 