'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { createClient } from '@supabase/supabase-js';

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

    // Check if user needs onboarding
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Dashboard
          </Typography>
          <Button
            variant="contained"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          >
            Sign Out
          </Button>
        </Box>

        {session?.user && (
          <Stack spacing={2}>
            <Typography variant="h5" component="h2">
              User Information
            </Typography>
            <Divider />
            <Paper variant="outlined" sx={{ p: 3, bgcolor: 'grey.50' }}>
              <Stack spacing={2}>
                <Typography>
                  <strong>Name:</strong> {session.user.name}
                </Typography>
                <Typography>
                  <strong>Email:</strong> {session.user.email}
                </Typography>
                <Typography>
                  <strong>User ID:</strong> {session.user.id}
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        )}
      </Paper>
    </Container>
  );
} 