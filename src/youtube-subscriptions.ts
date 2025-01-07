import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

interface YouTubeSubscription {
  channelId: string;
  channelTitle: string;
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
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Get the authorization URL for YouTube access
   */
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/youtube.readonly',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }

  /**
   * Get all subscriptions for the authenticated user
   */
  async getAllSubscriptions(accessToken: string): Promise<YouTubeSubscription[]> {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    
    const youtube = google.youtube('v3');
    const subscriptions: YouTubeSubscription[] = [];
    let pageToken: string | undefined;

    try {
      do {
        const response = await youtube.subscriptions.list({
          auth: this.oauth2Client,
          part: ['snippet'],
          mine: true,
          maxResults: 50,
          pageToken,
        });

        const items = response.data.items || [];
        
        items.forEach((item) => {
          if (item.snippet) {
            subscriptions.push({
              channelId: item.snippet.resourceId?.channelId || '',
              channelTitle: item.snippet.title || '',
              description: item.snippet.description || undefined,
              publishedAt: item.snippet.publishedAt || '',
              thumbnails: {
                default: {
                  url: item.snippet.thumbnails?.default?.url || undefined,
                  width: item.snippet.thumbnails?.default?.width || undefined,
                  height: item.snippet.thumbnails?.default?.height || undefined
                },
                medium: {
                  url: item.snippet.thumbnails?.medium?.url || undefined,
                  width: item.snippet.thumbnails?.medium?.width || undefined,
                  height: item.snippet.thumbnails?.medium?.height || undefined
                },
                high: {
                  url: item.snippet.thumbnails?.high?.url || undefined,
                  width: item.snippet.thumbnails?.high?.width || undefined,
                  height: item.snippet.thumbnails?.high?.height || undefined
                }
              },
            });
          }
        });

        pageToken = response.data.nextPageToken || undefined;
      } while (pageToken);

      return subscriptions;

    } catch (error) {
      console.error('Error fetching YouTube subscriptions:', error);
      throw error;
    }
  }
} 