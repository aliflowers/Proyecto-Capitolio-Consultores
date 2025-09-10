import { google } from 'googleapis';

export function getOAuth2Client() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID!,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    process.env.GOOGLE_OAUTH_REDIRECT_URI!
  );
  return client;
}

export function buildAuthUrl(state: string) {
  const client = getOAuth2Client();
  const scopes = (process.env.GOOGLE_OAUTH_SCOPES || '').split(' ').filter(Boolean);
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: scopes,
    state
  });
}
