'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
} from '@mui/material';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface User {
  email: string;
}

interface ResetData {
  user_id: string;
  users: User;
}

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
      setTimeout(() => {
        router.push('/auth/signin');
      }, 3000);
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      console.log('Starting password reset with token:', token);

      // First verify the token and get user data
      const { data: resetData, error: resetError } = await supabase
        .from('password_resets')
        .select(`
          user_id,
          users!inner (
            email
          )
        `)
        .eq('token', token)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single() as { data: ResetData | null, error: any };

      console.log('Query response:', {
        resetData,
        resetError,
        timestamp: new Date().toISOString()
      });

      if (resetError) {
        console.error('Reset token verification error:', resetError);
        throw new Error('Invalid or expired reset token');
      }

      if (!resetData) {
        console.error('No reset data found');
        throw new Error('Invalid or expired reset token');
      }

      console.log('Reset data structure:', {
        fullData: resetData,
        users: resetData.users,
        timestamp: new Date().toISOString()
      });

      if (!resetData.users) {
        console.error('Users object is missing from reset data');
        throw new Error('User data not found');
      }

      const userEmail = resetData.users.email;
      console.log('Retrieved user email:', userEmail);

      if (!userEmail) {
        console.error('Email is missing from user data');
        throw new Error('User email not found');
      }

      console.log('Attempting to update password for email:', userEmail);

      // Update the password using the API route
      const response = await fetch('/api/user/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
          userId: resetData.user_id
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update password');
      }

      console.log('Password updated successfully');

      // Mark the token as used
      const { error: tokenUpdateError } = await supabase
        .from('password_resets')
        .update({ used: true })
        .eq('token', token);

      if (tokenUpdateError) {
        console.error('Token update error:', tokenUpdateError);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/signin');
      }, 2000);

    } catch (error: any) {
      console.error('Error resetting password:', {
        error,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      setError(error.message || 'Failed to reset password');
    }
  };

  if (!token) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">Invalid or missing reset token</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Reset Password
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Password reset successful! Redirecting to login...
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={success}
            />
            <TextField
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={success}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={success}
            >
              Reset Password
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
} 