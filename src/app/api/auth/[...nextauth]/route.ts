import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import { handlers } from '@/auth';

export const { GET, POST } = handlers; 