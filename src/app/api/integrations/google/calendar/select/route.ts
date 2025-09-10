import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { getCalendarClientForUser } from '@/lib/google-calendar';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });

  const gcal = await getCalendarClientForUser(user.id);
  if (!gcal) return NextResponse.json({ success: false, error: 'No hay conexión con Google' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const calendarId = body?.calendarId as string | undefined;
  if (!calendarId) {
    return NextResponse.json({ success: false, error: 'calendarId es requerido' }, { status: 400 });
  }

  try {
    const { data } = await gcal.calendarList.get({ calendarId } as any);
    const name = data.summary || 'Calendario Google';
    const timeZone = data.timeZone || 'UTC';

    // Limpiar selección previa y marcar nuevo seleccionado
    await query("UPDATE calendars SET is_primary=FALSE WHERE user_id=$1 AND provider='google'", [user.id]);

    const existing = await query(
      "SELECT id FROM calendars WHERE user_id=$1 AND provider='google' AND provider_calendar_id=$2",
      [user.id, calendarId]
    );

    if (existing.rowCount) {
      await query(
        `UPDATE calendars
         SET name=$2, time_zone=$3, is_primary=TRUE, updated_at=NOW()
         WHERE id=$1`,
        [existing.rows[0].id, name, timeZone]
      );
    } else {
      await query(
        `INSERT INTO calendars (user_id, name, time_zone, provider, provider_calendar_id, is_primary)
         VALUES ($1, $2, $3, 'google', $4, TRUE)`,
        [user.id, name, timeZone, calendarId]
      );
    }

    return NextResponse.json({ success: true, selected: { id: calendarId, summary: name, timeZone } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Error al seleccionar calendario' }, { status: 500 });
  }
}

