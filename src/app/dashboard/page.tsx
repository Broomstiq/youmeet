'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import {
  Container,
  Box,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { createClient } from '@supabase/supabase-js';
import SwipeContainer from '../../components/SwipeContainer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }

    const checkOnboardingStatus = async () => {
      if (session?.user?.id) {
        const { data: user } = await supabase
          .from('users')
          .select('needs_onboarding')
          .eq('id', session.user.id)
          .single();

        if (user?.needs_onboarding) {
          router.push('/onboarding');
        }
      }
    };

    if (status === 'authenticated') {
      checkOnboardingStatus();
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            YouMeet
          </Typography>
          <IconButton color="inherit" onClick={() => router.push('/settings')}>
            <SettingsIcon />
          </IconButton>
          <IconButton
            color="inherit"
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          >
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        {session?.user && <SwipeContainer userId={session.user.id} />}
      </Container>
    </Box>
  );
} 