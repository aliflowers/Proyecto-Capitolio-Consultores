import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { query } from '@/lib/db';
import { getCalendarClientForUser } from '@/lib/google-calendar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

async function ensureDefaultCalendar(userId: string) {
  // Create a default calendar if user has none
  const existing = await query('SELECT id FROM calendars WHERE user_id = $1 ORDER BY is_primary DESC LIMIT 1', [userId]);
  if (existing.rowCount && existing.rowCount > 0) return existing.rows[0].id as string;
  const result = await query(
    `INSERT INTO calendars (user_id, name, time_zone, color, is_primary)
     VALUES ($1, $2, $3, $4, TRUE)
     RETURNING id`,
    [userId, 'Calendario (local)', 'America/Caracas', '#222052']
  );
  return result.rows[0].id as string;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const start = parseDate(searchParams.get('start')) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = parseDate(searchParams.get('end')) || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    const result = await query(
      `SELECT e.id, e.title, e.description, e.location,
              e.start_at, e.end_at, e.all_day, e.calendar_id, e.color, e.reminders
       FROM events e
       WHERE e.user_id = $1
         AND e.start_at < $3 AND e.end_at > $2
       ORDER BY e.start_at ASC`,
      [user.id, start.toISOString(), end.toISOString()]
    );

    const events = result.rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      start: r.start_at,
      end: r.end_at,
      allDay: r.all_day,
      description: r.description,
      location: r.location,
      calendarId: r.calendar_id,
      color: r.color,
      reminders: r.reminders || [],
    }));

    // Fase 2: Lectura read-only desde Google Calendar (si el usuario está conectado)
    const remoteEvents: any[] = [];
    try {
      const gcal = await getCalendarClientForUser(user.id);
      if (gcal) {
        // Intentar usar un calendario seleccionado por el usuario; si no existe, usar 'primary'
        let calendarId = 'primary';
        try {
          const sel = await query(
            "SELECT provider_calendar_id FROM calendars WHERE user_id=$1 AND provider='google' AND is_primary=TRUE LIMIT 1",
            [user.id]
          );
          if (sel.rowCount && sel.rows[0].provider_calendar_id) {
            calendarId = sel.rows[0].provider_calendar_id as string;
          }
        } catch {}

        let pageToken: string | undefined = undefined;
        do {
          const { data } = await gcal.events.list({
            calendarId,
            timeMin: start.toISOString(),
            timeMax: end.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 2500,
            pageToken,
          } as any);

          const items = data.items || [];
          for (const ev of items) {
            const isAllDay = !!(ev.start && ev.start.date) && !ev.start?.dateTime;
            const startStr = (ev.start?.dateTime || ev.start?.date) as string | undefined;
            const endStr = (ev.end?.dateTime || ev.end?.date) as string | undefined;
            if (!startStr || !endStr) continue;

            remoteEvents.push({
              id: `g_${ev.id}`,
              title: ev.summary || '(sin título)',
              start: startStr,
              end: endStr,
              allDay: isAllDay,
              description: ev.description || null,
              location: ev.location || null,
              color: '#2563eb',
            });
          }
          pageToken = (data.nextPageToken as string | undefined) || undefined;
        } while (pageToken);
      }
    } catch (e) {
      console.error('Google Calendar fetch error:', (e as any)?.message || e);
    }

    const allEvents = [...events, ...remoteEvents];
    return NextResponse.json({ success: true, events: allEvents });
  } catch (err: any) {
    console.error('GET /api/calendar/events error:', err);
    return NextResponse.json({ success: false, error: 'Error al obtener eventos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = await req.json();
    const { title, description, location, start, end, allDay, color, reminders } = body || {};
    if (!title || !start || !end) {
      return NextResponse.json({ success: false, error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const calendarId = await ensureDefaultCalendar(user.id);

    const result = await query(
      `INSERT INTO events (user_id, calendar_id, title, description, location, start_at, end_at, all_day, color, reminders)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, title, start_at, end_at, all_day, description, location, calendar_id, color, reminders`,
      [user.id, calendarId, title, description || null, location || null, new Date(start).toISOString(), new Date(end).toISOString(), !!allDay, color || '#222052', Array.isArray(reminders) ? reminders : []]
    );

    const r = result.rows[0];
    return NextResponse.json({ success: true, event: {
      id: r.id, title: r.title, start: r.start_at, end: r.end_at, allDay: r.all_day,
      description: r.description, location: r.location, calendarId: r.calendar_id, color: r.color, reminders: r.reminders || []
    }});
  } catch (err: any) {
    console.error('POST /api/calendar/events error:', err);
    return NextResponse.json({ success: false, error: 'Error al crear evento' }, { status: 500 });
  }
}
