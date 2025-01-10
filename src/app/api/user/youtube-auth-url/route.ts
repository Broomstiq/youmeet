import { NextResponse } from 'next/server';
import { YouTubeService } from '../../../../lib/youtube-service';

export async function GET() {
  try {
    const youtube = new YouTubeService();
    const authUrl = youtube.getAuthUrl();
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
} 