import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false }, { status: 401 });

  const res = await query(
    `SELECT refresh_token FROM oauth_tokens WHERE user_id=$1 AND provider='google' AND service='calendar'`,
    [user.id]
  );
  const rt = res.rows?.[0]?.refresh_token as string | null;
  if (rt) {
    try {
      await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: rt })
      });
    } catch {}
  }
  await query(`DELETE FROM oauth_tokens WHERE user_id=$1 AND provider='google' AND service='calendar'`, [user.id]);
  return NextResponse.json({ success: true });
}
