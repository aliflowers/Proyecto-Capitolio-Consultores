import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { id } = params;
    const body = await req.json();
    const { title, description, location, start, end, allDay } = body || {};
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
           updated_at = NOW()
       WHERE id = $7 AND user_id = $8
       RETURNING id, title, start_at, end_at, all_day, description, location, calendar_id`,
      [title, description || null, location || null, new Date(start).toISOString(), new Date(end).toISOString(), !!allDay, id, user.id]
    );

    if (result.rowCount === 0) return NextResponse.json({ success: false, error: 'Evento no encontrado' }, { status: 404 });

    const r = result.rows[0];
    return NextResponse.json({ success: true, event: {
      id: r.id, title: r.title, start: r.start_at, end: r.end_at, allDay: r.all_day,
      description: r.description, location: r.location, calendarId: r.calendar_id
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
    const result = await query('DELETE FROM events WHERE id = $1 AND user_id = $2', [id, user.id]);

    if (result.rowCount === 0) return NextResponse.json({ success: false, error: 'Evento no encontrado' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/calendar/events/[id] error:', err);
    return NextResponse.json({ success: false, error: 'Error al eliminar evento' }, { status: 500 });
  }
}
