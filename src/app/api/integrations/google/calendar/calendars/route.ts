import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { getCalendarClientForUser } from '@/lib/google-calendar';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });

  const gcal = await getCalendarClientForUser(user.id);
  if (!gcal) return NextResponse.json({ success: true, calendars: [], selected: null });

  try {
    const { data } = await gcal.calendarList.list({ maxResults: 250 });
    const items = (data.items || []).map((c: any) => ({
      id: c.id,
      summary: c.summary,
      timeZone: c.timeZone,
      primary: !!c.primary,
      accessRole: c.accessRole,
    }));

    const sel = await query(
      "SELECT provider_calendar_id FROM calendars WHERE user_id=$1 AND provider='google' AND is_primary=TRUE LIMIT 1",
      [user.id]
    );
    const selected = sel.rowCount ? sel.rows[0].provider_calendar_id : null;

    return NextResponse.json({ success: true, calendars: items, selected });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Error al listar calendarios' }, { status: 500 });
  }
}

