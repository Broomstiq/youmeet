import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      needs_onboarding: boolean;
      google_id?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    needs_onboarding: boolean;
    google_id?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    needs_onboarding: boolean;
    google_id?: string;
  }
} 