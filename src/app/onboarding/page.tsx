import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { createClient } from '@supabase/supabase-js';
import { authOptions } from '../api/auth/[...nextauth]/route';
import OnboardingClient from './OnboardingClient';
import { Suspense } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PageProps {
  searchParams: { 
    step?: string; 
    code?: string;
    error?: string;
  };
}

async function OnboardingContent({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Check if user needs onboarding and YouTube connection status
  const { data: user } = await supabase
    .from('users')
    .select('needs_onboarding, youtube_connected')
    .eq('id', session.user.id)
    .single();

  if (!user?.needs_onboarding) {
    redirect('/dashboard');
  }

  // Determine current step
  const currentStep = searchParams?.step || 'profile';
  
  // If profile is completed but YouTube isn't connected, force YouTube step
  const step = user && !user.youtube_connected && currentStep === 'profile' 
    ? 'youtube' 
    : currentStep;

  // Show error if YouTube connection failed
  const error = searchParams?.error;

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
    <Suspense fallback={<div>Loading...</div>}>
      <OnboardingContent {...props} />
    </Suspense>
  );
} 