import express from 'express';
import { YouTubeService } from './youtube-service.js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv to use .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Verify environment variables are loaded
const requiredEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const app = express();
const port = 3000;
const youtube = new YouTubeService();

app.get('/', (_req, res) => {
  const authUrl = youtube.getAuthUrl();
  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code as string;
  try {
    const tokens = await youtube.getTokensFromCode(code);
    const subs = await youtube.getSubscriptions(tokens.access_token!);
    res.json(subs);
  } catch (error) {
    console.error('Error in callback:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 