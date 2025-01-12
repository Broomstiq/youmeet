import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createClient } from '@supabase/supabase-js';
import { YouTubeService } from '../../../../lib/youtube-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const session = await auth();
        
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await request.json();
    
    // Get YouTube subscriptions using the service
    const youtube = new YouTubeService();
    const tokens = await youtube.getTokensFromCode(code);
    const subscriptions = await youtube.getSubscriptions(tokens.access_token!);

    // Store subscriptions in database
    const subscriptionData = subscriptions.map(sub => ({
      user_id: session.user.id,
      channel_id: sub.channelId,
      channel_name: sub.channelTitle,
      category: sub.category
    }));

    // Insert subscriptions
    const { error: subsError } = await supabase
      .from('subscriptions')
      .insert(subscriptionData);

    if (subsError) throw subsError;

    // Update user's YouTube connection status
    const { error: userError } = await supabase
      .from('users')
      .update({ youtube_connected: true })
      .eq('id', session.user.id);

    if (userError) throw userError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error connecting YouTube:', error);
    return NextResponse.json(
      { error: 'Failed to connect YouTube account' },
      { status: 500 }
    );
  }
} 