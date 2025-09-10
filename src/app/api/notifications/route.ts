import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function minutesToMs(mins: number) { return mins * 60 * 1000; }

async function scanDueNotifications(userId: string) {
  // Buscar eventos del usuario con recordatorios próximos o vencidos, en una ventana razonable
  const now = new Date();
  const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24h atrás
  const windowEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 días adelante

  const res = await query(
    `SELECT id, title, start_at, reminders FROM events
     WHERE user_id = $1 AND reminders IS NOT NULL
       AND start_at BETWEEN $2 AND $3`,
    [userId, windowStart.toISOString(), windowEnd.toISOString()]
  );

  for (const row of res.rows) {
    const startAt = new Date(row.start_at);
    const reminders: number[] = Array.isArray(row.reminders) ? row.reminders : [];
    for (const mins of reminders) {
      if (typeof mins !== 'number') continue;
      const scheduledAt = new Date(startAt.getTime() - minutesToMs(mins));
      if (scheduledAt <= now) {
        // Insertar notificación si no existe (clave única user_id+event_id+scheduled_at)
        try {
          await query(
            `INSERT INTO notifications (user_id, title, body, event_id, scheduled_at, is_read)
             VALUES ($1, $2, $3, $4, $5, FALSE)
             ON CONFLICT (user_id, event_id, scheduled_at) DO NOTHING`,
            [userId, `Recordatorio de evento`, `${row.title} — empieza a las ${startAt.toLocaleString()}`, row.id, scheduledAt.toISOString()]
          );
        } catch (e) {
          // ignorar
        }
      }
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    // Escanear y generar notificaciones vencidas para este usuario
    await scanDueNotifications(user.id);

    const { searchParams } = new URL(req.url);
    const onlyUnread = searchParams.get('unread') === '1' || searchParams.get('onlyUnread') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    const list = await query(
      `SELECT id, title, body, is_read, created_at, scheduled_at, event_id
       FROM notifications
       WHERE user_id = $1 ${onlyUnread ? 'AND is_read = FALSE' : ''}
       ORDER BY COALESCE(scheduled_at, created_at) DESC
       LIMIT $2`,
      [user.id, limit]
    );

    const unreadCountRes = await query(
      `SELECT COUNT(*)::int AS c FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
      [user.id]
    );

    return NextResponse.json({ success: true, notifications: list.rows, unread: unreadCountRes.rows[0].c });
  } catch (err) {
    console.error('GET /api/notifications error:', err);
    return NextResponse.json({ success: false, error: 'Error al obtener notificaciones' }, { status: 500 });
  }
}
