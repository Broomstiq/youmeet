'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Stack,
  Alert,
  Snackbar,
} from '@mui/material';

interface OnboardingClientProps {
  step: string;
  youtubeConnected: boolean;
  error?: string;
}

export default function OnboardingClient({ step, youtubeConnected }: OnboardingClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    city: '',
    profilePicture: '',
    matchingParam: 3,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setSnackbarMessage('Profile updated successfully');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);

      router.push('/dashboard');
    } catch (error) {
      setSnackbarMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleYouTubeConnect = async () => {
    try {
      const response = await fetch('/api/user/youtube-auth-url');
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('No auth URL received');
      }
    } catch (error) {
      setSnackbarMessage('Failed to start YouTube connection');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  if (step === 'youtube' && !youtubeConnected) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 4 }}>
          <Stack spacing={3} alignItems="center">
            <Typography variant="h4" component="h1" gutterBottom>
              Connect YouTube Account
            </Typography>
            <Typography variant="body1" gutterBottom align="center">
              We need access to your YouTube subscriptions to provide better matches
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleYouTubeConnect}
            >
              Connect YouTube Account
            </Button>
          </Stack>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
        <Stack spacing={3}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Complete Your Profile
          </Typography>
          
          <Typography variant="body1" gutterBottom align="center">
            Please provide some information to get started
          </Typography>

          <TextField
            required
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
          />

          <TextField
            required
            type="date"
            label="Birth Date"
            value={formData.birthDate}
            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="City (Optional)"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            fullWidth
          />

          <TextField
            label="Profile Picture URL (Optional)"
            type="url"
            value={formData.profilePicture}
            onChange={(e) => setFormData({ ...formData, profilePicture: e.target.value })}
            fullWidth
          />

          <TextField
            required
            type="number"
            label="Minimum Common Subscriptions"
            value={formData.matchingParam}
            onChange={(e) => setFormData({ ...formData, matchingParam: parseInt(e.target.value) })}
            inputProps={{ min: 1, max: 100 }}
            fullWidth
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isLoading}
            fullWidth
          >
            {isLoading ? 'Completing Profile...' : 'Complete Profile'}
          </Button>
        </Stack>
      </Box>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
} 