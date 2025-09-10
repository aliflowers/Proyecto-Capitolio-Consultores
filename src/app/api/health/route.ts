import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const headers: Record<string, string> = { 'Cache-Control': 'no-store' };
  try {
    await query('SELECT 1');
    return NextResponse.json({ ok: true, db: 'up' }, { status: 200, headers });
  } catch (err: any) {
    const error = process.env.NODE_ENV === 'development'
      ? (err?.message || 'db unavailable')
      : 'unavailable';
    return NextResponse.json({ ok: false, db: 'down', error }, { status: 503, headers });
  }
}

