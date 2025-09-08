import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { protectApiRoute } from '@/lib/server-auth';

export async function GET(request: Request) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('query');
    const clientId = searchParams.get('clientId');

    if (!searchQuery) {
      return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
    }

    let dbQuery: string;
    let queryParams: any[];

    if (clientId) {
      dbQuery = `
        SELECT e.id, e.expediente_name as name
        FROM expedientes e
        JOIN expedientes_clientes ec ON e.id = ec.expediente_id
        WHERE e.user_id = $1
          AND ec.cliente_id = $2
          AND e.expediente_name ILIKE $3
        LIMIT 10;
      `;
      queryParams = [user.id, clientId, `%${searchQuery}%`];
    } else {
      dbQuery = `
        SELECT id, expediente_name as name
        FROM expedientes
        WHERE user_id = $1
          AND expediente_name ILIKE $2
        LIMIT 10;
      `;
      queryParams = [user.id, `%${searchQuery}%`];
    }

    const result = await query(dbQuery, queryParams);

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error al buscar expedientes:', error);
    return NextResponse.json({ success: false, error: 'Error al buscar expedientes' }, { status: 500 });
  }
}
