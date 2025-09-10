import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/server-auth';
import { getOAuth2Client } from '@/lib/google-oauth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url));

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get('google_oauth_state')?.value;

  if (!code || !state || !stateCookie || state !== stateCookie) {
    return NextResponse.redirect(new URL('/private/calendario?error=oauth_state', req.url));
  }

  try {
    const client = getOAuth2Client();
    const { tokens } = await client.getToken(code);
    await query(
      `INSERT INTO oauth_tokens (user_id, provider, service, access_token, refresh_token, expiry_date, scope, token_type, updated_at)
       VALUES ($1,'google','calendar',$2,$3,TO_TIMESTAMP($4/1000),$5,$6,NOW())
       ON CONFLICT (user_id, provider, service)
       DO UPDATE SET access_token = EXCLUDED.access_token,
                     refresh_token = COALESCE(EXCLUDED.refresh_token, oauth_tokens.refresh_token),
                     expiry_date = EXCLUDED.expiry_date,
                     scope = EXCLUDED.scope,
                     token_type = EXCLUDED.token_type,
                     updated_at = NOW()`,
      [
        user.id,
        tokens.access_token || null,
        tokens.refresh_token || null,
        tokens.expiry_date || 0,
        tokens.scope || null,
        tokens.token_type || null,
      ]
    );

    cookieStore.delete('google_oauth_state');
    return NextResponse.redirect(new URL('/private/calendario?connected=google', req.url));
  } catch (e) {
    return NextResponse.redirect(new URL('/private/calendario?error=oauth_exchange', req.url));
  }
}
