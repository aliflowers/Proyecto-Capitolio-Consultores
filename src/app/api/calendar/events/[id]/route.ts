import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { query } from '@/lib/db';
import { getCalendarClientForUser } from '@/lib/google-calendar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { id } = params;
    const body = await req.json();
    const { title, description, location, start, end, allDay, color, reminders } = body || {};
    if (!title || !start || !end) {
      return NextResponse.json({ success: false, error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const result = await query(
      `UPDATE events
       SET title = $1,
           description = $2,
           location = $3,
           start_at = $4,
           end_at = $5,
           all_day = $6,
           color = $7,
           reminders = $8,
           updated_at = NOW()
       WHERE id = $9 AND user_id = $10
       RETURNING id, title, start_at, end_at, all_day, description, location, calendar_id, color, reminders, google_event_id`,
      [title, description || null, location || null, new Date(start).toISOString(), new Date(end).toISOString(), !!allDay, color || '#222052', Array.isArray(reminders) ? reminders : [], id, user.id]
    );

    if (result.rowCount === 0) return NextResponse.json({ success: false, error: 'Evento no encontrado' }, { status: 404 });

    const r = result.rows[0];

    // Espejar en Google si corresponde
    try {
      const gcal = await getCalendarClientForUser(user.id);
      if (gcal) {
        let sel = await query("SELECT provider_calendar_id, time_zone FROM calendars WHERE user_id=$1 AND provider='google' AND is_primary=TRUE LIMIT 1", [user.id]);
        let googleCalendarId: string | null = sel.rowCount ? sel.rows[0].provider_calendar_id : 'primary';
        const tz: string = sel.rowCount ? (sel.rows[0].time_zone || 'UTC') : 'UTC';
        if (googleCalendarId) {
          const body: any = {
            summary: r.title,
            description: r.description || undefined,
            location: r.location || undefined,
            reminders: Array.isArray(r.reminders) && r.reminders.length > 0 ? { useDefault: false, overrides: (r.reminders as number[]).slice(0,5).map((m:number)=>({ method:'popup', minutes:m })) } : undefined,
          };
          if (r.all_day) {
            const s = new Date(r.start_at);
            const e = new Date(r.end_at);
            const startDate = s.toISOString().slice(0,10);
            let endDate = e.toISOString().slice(0,10);
            if (startDate === endDate) {
              const d = new Date(s.getTime()); d.setDate(d.getDate()+1); endDate = d.toISOString().slice(0,10);
            }
            body.start = { date: startDate, timeZone: tz };
            body.end = { date: endDate, timeZone: tz };
          } else {
            body.start = { dateTime: new Date(r.start_at).toISOString(), timeZone: tz };
            body.end = { dateTime: new Date(r.end_at).toISOString(), timeZone: tz };
          }

          if (r.google_event_id) {
            await gcal.events.patch({ calendarId: googleCalendarId, eventId: r.google_event_id, requestBody: body } as any);
          } else {
            const { data } = await gcal.events.insert({ calendarId: googleCalendarId, requestBody: body } as any);
            if (data?.id) {
              await query('UPDATE events SET google_event_id=$2 WHERE id=$1', [r.id, data.id]);
            }
          }
        }
      }
    } catch (e) {
      console.error('Google patch/insert error:', (e as any)?.message || e);
    }

    return NextResponse.json({ success: true, event: {
      id: r.id, title: r.title, start: r.start_at, end: r.end_at, allDay: r.all_day,
      description: r.description, location: r.location, calendarId: r.calendar_id, color: r.color, reminders: r.reminders || []
    }});
  } catch (err: any) {
    console.error('PUT /api/calendar/events/[id] error:', err);
    return NextResponse.json({ success: false, error: 'Error al actualizar evento' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { id } = params;

    // Obtener google_event_id antes de borrar
    const existing = await query('SELECT google_event_id FROM events WHERE id=$1 AND user_id=$2', [id, user.id]);
    const googleId = existing.rows?.[0]?.google_event_id as string | null;

    // Borrar en Google si corresponde
    if (googleId) {
      try {
        const gcal = await getCalendarClientForUser(user.id);
        if (gcal) {
          let sel = await query("SELECT provider_calendar_id FROM calendars WHERE user_id=$1 AND provider='google' AND is_primary=TRUE LIMIT 1", [user.id]);
          const googleCalendarId: string | null = sel.rowCount ? sel.rows[0].provider_calendar_id : 'primary';
          if (googleCalendarId) {
            await gcal.events.delete({ calendarId: googleCalendarId, eventId: googleId } as any).catch(()=>{});
          }
        }
      } catch (e) {
        console.error('Google delete error:', (e as any)?.message || e);
      }
    }

    const result = await query('DELETE FROM events WHERE id = $1 AND user_id = $2', [id, user.id]);
    if (result.rowCount === 0) return NextResponse.json({ success: false, error: 'Evento no encontrado' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/calendar/events/[id] error:', err);
    return NextResponse.json({ success: false, error: 'Error al eliminar evento' }, { status: 500 });
  }
}
