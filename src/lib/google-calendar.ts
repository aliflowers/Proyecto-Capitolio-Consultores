import { google } from 'googleapis';
import { query } from '@/lib/db';

export async function getCalendarClientForUser(userId: string) {
  const res = await query(
    `SELECT access_token, refresh_token, EXTRACT(EPOCH FROM expiry_date)*1000 AS expiry_ms, scope, token_type
     FROM oauth_tokens WHERE user_id=$1 AND provider='google' AND service='calendar'`,
    [userId]
  );
  if (!res.rowCount) return null;

  const row = res.rows[0];
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID!,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    process.env.GOOGLE_OAUTH_REDIRECT_URI!
  );
  oauth2Client.setCredentials({
    access_token: row.access_token,
    refresh_token: row.refresh_token,
    scope: row.scope,
    token_type: row.token_type,
    expiry_date: row.expiry_ms ? Number(row.expiry_ms) : undefined
  });

  try {
    await oauth2Client.getAccessToken();
    const tokens = oauth2Client.credentials;
    if (tokens && tokens.access_token) {
      await query(
        `UPDATE oauth_tokens SET access_token=$2, expiry_date=TO_TIMESTAMP($3/1000), updated_at=NOW()
         WHERE user_id=$1 AND provider='google' AND service='calendar'`,
        [userId, tokens.access_token, tokens.expiry_date || Date.now() + 50 * 60 * 1000]
      );
    }
  } catch {}

  return google.calendar({ version: 'v3', auth: oauth2Client });
}
