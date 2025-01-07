import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

interface YouTubeSubscription {
  channelId: string;
  channelTitle: string;
  category?: string;
  description?: string;
  publishedAt: string;
  thumbnails?: {
    default?: { url?: string; width?: number; height?: number };
    medium?: { url?: string; width?: number; height?: number };
    high?: { url?: string; width?: number; height?: number };
  };
}

export class YouTubeService {
  private oauth2Client: OAuth2Client;

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    console.log('Initializing YouTubeService with:', {
      clientId: clientId ? 'set' : 'not set',
      clientSecret: clientSecret ? 'set' : 'not set',
      redirectUri
    });

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Missing required environment variables');
    }

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
  }

  getAuthUrl() {
    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/youtube.readonly']
    });
    console.log('Generated Auth URL:', url);
    return url;
  }

  async getTokensFromCode(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  private async getChannelCategory(youtube: any, channelId: string): Promise<string | undefined> {
    try {
      const response = await youtube.channels.list({
        auth: this.oauth2Client,
        part: ['topicDetails', 'snippet'],
        id: [channelId]
      });

      const channel = response.data.items?.[0];
      if (!channel) return undefined;

      // Try to get category from topicDetails
      const topics = channel.topicDetails?.topicCategories || [];
      if (topics.length > 0) {
        // Extract the last part of the topic URL which contains the category
        const mainTopic = topics[0].split('/').pop() || undefined;
        return mainTopic;
      }

      // Fallback to channel's custom category if available
      return channel.snippet?.categoryId;
    } catch (error) {
      console.error(`Error fetching category for channel ${channelId}:`, error);
      return undefined;
    }
  }

  async getSubscriptions(accessToken: string) {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const youtube = google.youtube('v3');
    
    const response = await youtube.subscriptions.list({
      auth: this.oauth2Client,
      part: ['snippet'],
      mine: true,
      maxResults: 50
    });

    const subscriptions = await Promise.all(
      (response.data.items || []).map(async item => {
        const channelId = item.snippet?.resourceId?.channelId;
        const category = channelId ? 
          await this.getChannelCategory(youtube, channelId) : 
          undefined;

        return {
          channelId: channelId || '',
          channelTitle: item.snippet?.title || '',
          category,
          description: item.snippet?.description,
          publishedAt: item.snippet?.publishedAt || '',
          thumbnails: item.snippet?.thumbnails
        };
      })
    );

    return subscriptions;
  }
} 