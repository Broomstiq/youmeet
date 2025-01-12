'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Stack,
  Alert,
  Snackbar,
  Paper,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import YouTubeIcon from '@mui/icons-material/YouTube';
import { theme } from '../styles/theme';

interface OnboardingClientProps {
  step: string;
  youtubeConnected: boolean;
  error?: string;
}

export default function OnboardingClient({ step, youtubeConnected, error }: OnboardingClientProps) {
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

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm">
        <Box sx={{ mt: 4, mb: 6 }}>
          <Stack spacing={2} alignItems="center">
            <Image
              src="/youmeet_logo.svg"
              alt="YouMeet Logo"
              width={80}
              height={80}
              priority
            />
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom 
              sx={{ 
                color: 'secondary.main',
                textAlign: 'center',
                fontFamily: theme.typography.h4.fontFamily,
              }}
            >
              YouMeet
            </Typography>
          </Stack>
        </Box>

        {step === 'youtube' && !youtubeConnected ? (
          <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
            <Stack spacing={4} alignItems="center">
              <Typography variant="h4" component="h2" gutterBottom align="center">
                Connect YouTube
              </Typography>
              <Typography variant="body1" gutterBottom align="center" sx={{ maxWidth: 400 }}>
                Connect your YouTube account to find people with similar interests based on your subscriptions
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleYouTubeConnect}
                startIcon={<YouTubeIcon />}
                sx={{ 
                  py: 1.5,
                  px: 4,
                  fontSize: '1.1rem',
                }}
              >
                Connect YouTube Account
              </Button>
            </Stack>
          </Paper>
        ) : (
          <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <Typography variant="h4" component="h2" gutterBottom align="center">
                  Complete Your Profile
                </Typography>
                
                <Typography variant="body1" gutterBottom align="center" sx={{ mb: 2 }}>
                  Tell us a bit about yourself to get started
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
                  helperText="Minimum number of shared YouTube subscriptions for matching"
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  fullWidth
                  sx={{ 
                    mt: 2,
                    py: 1.5,
                    fontSize: '1.1rem',
                  }}
                >
                  {isLoading ? 'Completing Profile...' : 'Complete Profile'}
                </Button>
              </Stack>
            </Box>
          </Paper>
        )}

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
    </ThemeProvider>
  );
}

