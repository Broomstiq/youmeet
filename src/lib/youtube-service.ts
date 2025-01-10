import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface YouTubeSubscription {
  channelId: string;
  channelTitle: string;
  category?: string;
}

export class YouTubeService {
  private oauth2Client: OAuth2Client;

  constructor() {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
      throw new Error('Missing required environment variables for YouTube service');
    }

    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/youtube.readonly'],
      include_granted_scopes: true
    });
  }

  async getTokensFromCode(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }

  async getSubscriptions(accessToken: string): Promise<YouTubeSubscription[]> {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const youtube = google.youtube('v3');
    
    const response = await youtube.subscriptions.list({
      auth: this.oauth2Client,
      part: ['snippet'],
      mine: true,
      maxResults: 50
    });

    return (response.data.items || []).map(item => ({
      channelId: item.snippet?.resourceId?.channelId || '',
      channelTitle: item.snippet?.title || '',
      category: undefined // You can implement category fetching if needed
    }));
  }
} 