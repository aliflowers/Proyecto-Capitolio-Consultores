import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ connected: false });
  const res = await query(
    `SELECT 1 FROM oauth_tokens WHERE user_id=$1 AND provider='google' AND service='calendar' LIMIT 1`,
    [user.id]
  );
  return NextResponse.json({ connected: res.rowCount > 0 });
}
