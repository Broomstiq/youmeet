'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Button, 
  TextField, 
  Typography, 
  Container, 
  Box, 
  CssBaseline,
  Paper,
  Alert,
  Divider
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import GoogleIcon from '@mui/icons-material/Google';
import { theme } from '../../styles/theme';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    console.log('Image path debugging:', {
      publicPath: '/youmeet_logo.svg',
      fullUrl: typeof window !== 'undefined' ? `${window.location.origin}/youmeet_logo.svg` : null,
      env: process.env.NODE_ENV
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      
      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setError('An error occurred during sign in');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Image
              src="/youmeet_logo.svg" 
              alt="YouMeet Logo"
              width={200}
              height={200}
              priority
              onError={(e) => {
                console.error('Image failed to load:', {
                  src: e.currentTarget.src,
                  error: e
                })
              }}
            />
            <Typography 
              component="h1" 
              variant="h4" 
              sx={{ 
                mt: 2,
                color: 'secondary.main',
                fontFamily: theme.typography.h1.fontFamily,
              }}
            >
              YouMeet
            </Typography>
          </Box>
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: 2 }}>
              <Link href="/auth/forgot-password" passHref>
                <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
                  Forgot password?
                </Typography>
              </Link>
              <Link href="/auth/signup" passHref>
                <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
                  Don't have an account? Sign up
                </Typography>
              </Link>
            </Box>
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              sx={{
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                },
              }}
            >
              Sign in with Google
            </Button>
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

