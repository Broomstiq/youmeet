import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';
import OnboardingClient from './OnboardingClient';
import { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PageProps {
  searchParams: Promise<{
    step?: string; 
    code?: string;
    error?: string;
  }>;
}

async function OnboardingContent({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const { data: user } = await supabase
    .from('users')
    .select('needs_onboarding, youtube_connected')
    .eq('id', session.user.id)
    .single();

  if (!user?.needs_onboarding) {
    redirect('/dashboard');
  }

  const resolvedSearchParams = await searchParams;
  const currentStep = resolvedSearchParams?.step || 'profile';
  const step = user && !user.youtube_connected && currentStep === 'profile' 
    ? 'youtube' 
    : currentStep;

  const error = resolvedSearchParams?.error;

  return (
    <OnboardingClient 
      step={step}
      youtubeConnected={user.youtube_connected}
      error={error}
    />
  );
}

export default async function OnboardingPage(props: PageProps) {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: '#ff5757' }} />
      </Box>
    }>
      <OnboardingContent {...props} />
    </Suspense>
  );
}
