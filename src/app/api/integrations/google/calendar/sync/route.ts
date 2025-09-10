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

  // Buscar el calendario de Google seleccionado
  const sel = await query(
    "SELECT id, provider_calendar_id, time_zone FROM calendars WHERE user_id=$1 AND provider='google' AND is_primary=TRUE LIMIT 1",
    [user.id]
  );
  if (!sel.rowCount) {
    return NextResponse.json({ success: false, error: 'No hay calendario de Google seleccionado' }, { status: 400 });
  }

  const calendarId: string = sel.rows[0].provider_calendar_id;

  try {
    // Incremental con syncToken si existe; si no, full sync con ventana y obteniendo el nextSyncToken
    const calRow = await query("SELECT google_sync_token FROM calendars WHERE id=$1", [sel.rows[0].id]);
    let syncToken: string | null = calRow.rows?.[0]?.google_sync_token || null;

    let nextSyncToken: string | undefined;
    let total = 0;

    if (syncToken) {
      try {
        let pageToken: string | undefined = undefined;
        do {
          const { data } = await gcal.events.list({
            calendarId,
            syncToken,
            maxResults: 2500,
            pageToken,
          } as any);
          total += (data.items?.length || 0);
          nextSyncToken = data.nextSyncToken as string | undefined;
          pageToken = data.nextPageToken as string | undefined;
        } while (pageToken);
      } catch (e: any) {
        if (e?.code === 410) {
          // invalidSyncToken => forzar full sync
          syncToken = null;
        } else {
          throw e;
        }
      }
    }

    if (!syncToken) {
      // Full sync inicial con ventana de 90 días hacia atrás
      const timeMin = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      let pageToken: string | undefined = undefined;
      do {
        const { data } = await gcal.events.list({
          calendarId,
          timeMin,
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 2500,
          pageToken,
        } as any);
        total += (data.items?.length || 0);
        nextSyncToken = data.nextSyncToken as string | undefined;
        pageToken = data.nextPageToken as string | undefined;
      } while (pageToken);
    }

    if (nextSyncToken) {
      await query(
        "UPDATE calendars SET google_sync_token=$2, google_last_sync_at=NOW(), updated_at=NOW() WHERE id=$1",
        [sel.rows[0].id, nextSyncToken]
      );
    }

    return NextResponse.json({ success: true, syncedChanges: total, hasToken: !!nextSyncToken });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Error al sincronizar' }, { status: 500 });
  }
}

