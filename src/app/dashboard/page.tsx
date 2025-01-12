'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import Image from 'next/image';
import {
  Container,
  Box,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  useMediaQuery,
} from '@mui/material';
import { ThemeProvider, useTheme } from '@mui/material/styles';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import ChatIcon from '@mui/icons-material/Chat';
import { createClient } from '@supabase/supabase-js';
import SwipeContainer from '../../components/SwipeContainer';
import { theme } from '../styles/theme';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

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
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <Image
                src="/youmeet_logo.svg"
                alt="YouMeet Logo"
                width={40}
                height={40}
                priority
              />
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  ml: 2,
                  fontFamily: theme.typography.h1.fontFamily,
                  color: 'secondary.main',
                }}
              >
                YouMeet
              </Typography>
            </Box>
            {isMobile ? (
              <>
                <IconButton color="primary" onClick={() => router.push('/chat')}>
                  <ChatIcon />
                </IconButton>
                <IconButton color="primary" onClick={() => router.push('/settings')}>
                  <SettingsIcon />
                </IconButton>
                <IconButton
                  color="primary"
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                >
                  <LogoutIcon />
                </IconButton>
              </>
            ) : (
              <>
                <Button
                  color="primary"
                  startIcon={<ChatIcon />}
                  onClick={() => router.push('/chat')}
                  sx={{ mr: 2 }}
                >
                  Chat
                </Button>
                <Button
                  color="primary"
                  startIcon={<SettingsIcon />}
                  onClick={() => router.push('/settings')}
                  sx={{ mr: 2 }}
                >
                  Settings
                </Button>
                <Button
                  color="primary"
                  startIcon={<LogoutIcon />}
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                >
                  Logout
                </Button>
              </>
            )}
          </Toolbar>
        </AppBar>

        <Container 
          maxWidth="md" 
          sx={{ 
            mt: 4, 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column' 
          }}
        >
          {session?.user && <SwipeContainer userId={session.user.id} />}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

