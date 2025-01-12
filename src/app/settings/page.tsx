'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { createClient } from '@supabase/supabase-js';
import { User } from '@/lib/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Settings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    city: '',
    profile_picture: '',
    matching_param: 3
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [updatingYoutube, setUpdatingYoutube] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    const fetchUserData = async () => {
      try {
        if (session?.user?.id) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Error fetching user data:', error);
            setMessage({ type: 'error', text: 'Failed to load user data' });
            return;
          }

          setUser(userData);
          setEditData({
            city: userData.city || '',
            profile_picture: userData.profile_picture || '',
            matching_param: userData.matching_param
          });
        }
      } catch (error) {
        console.error('Error in fetchUserData:', error);
        setMessage({ type: 'error', text: 'Failed to load user data' });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [status, session, router]);

  const handleEditSubmit = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          city: editData.city,
          profile_picture: editData.profile_picture,
          matching_param: editData.matching_param
        })
        .eq('id', session?.user?.id);

      if (error) throw error;

      setUser(prev => prev ? { ...prev, ...editData } : null);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    }
  };

  const handleUpdateYoutubeData = async () => {
    try {
      setUpdatingYoutube(true);
      // Get YouTube auth URL
      const response = await fetch('/api/user/youtube-auth-url');
      const { authUrl } = await response.json();
      
      // Open YouTube auth in new window
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error updating YouTube data:', error);
      setMessage({ type: 'error', text: 'Failed to update YouTube data' });
    } finally {
      setUpdatingYoutube(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      const response = await fetch('/api/user/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setMessage({ 
        type: 'success', 
        text: 'Password reset email sent! Please check your inbox.' 
      });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to send reset email' 
      });
    }
  };

  if (loading || status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => router.push('/dashboard')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Settings
          </Typography>
        </Box>

        {message && (
          <Alert 
            severity={message.type} 
            onClose={() => setMessage(null)}
            sx={{ mb: 3 }}
          >
            {message.text}
          </Alert>
        )}

        {user && (
          <Box>
            <Box display="flex" alignItems="center" mb={4}>
              <Box>
                <Typography variant="h5">
                  {user.name}, {calculateAge(user.birth_date)}
                </Typography>
                <Typography color="text.secondary">
                  {user.city || 'No city set'}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Minimum common subscriptions: {user.matching_param}
                </Typography>
              </Box>
              <IconButton onClick={() => setEditOpen(true)} sx={{ ml: 2 }}>
                <EditIcon />
              </IconButton>
            </Box>

            <Box display="flex" flexDirection="column" gap={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpdateYoutubeData}
                disabled={updatingYoutube}
              >
                Update YouTube Subscriptions
              </Button>

              <Button
                variant="contained"
                color="primary"
                onClick={handleResetPassword}
              >
                Reset Password
              </Button>
            </Box>
          </Box>
        )}

        <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 2 }}>
              <TextField
                label="City"
                value={editData.city}
                onChange={(e) => setEditData(prev => ({ ...prev, city: e.target.value }))}
              />
              <TextField
                label="Profile Picture URL"
                value={editData.profile_picture}
                onChange={(e) => setEditData(prev => ({ ...prev, profile_picture: e.target.value }))}
              />
              <TextField
                label="Minimum Common Subscriptions"
                type="number"
                value={editData.matching_param}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 1) {
                    setEditData(prev => ({ ...prev, matching_param: value }));
                  }
                }}
                inputProps={{ min: 1 }}
                helperText="Minimum number of YouTube subscriptions you want to have in common with matches"
                fullWidth
                required
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
} 