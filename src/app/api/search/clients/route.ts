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

    if (!searchQuery) {
      return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
    }

    // Buscar clientes por nombre que coincidan con la búsqueda
    const result = await query(
      `SELECT id, full_name as name FROM clientes 
       WHERE user_id = $1 AND full_name ILIKE $2
       LIMIT 10`,
      [user.id, `%${searchQuery}%`]
    );

    return NextResponse.json({ success: true, data: result.rows });

  } catch (error) {
    console.error('Error searching clients:', error);
    return NextResponse.json(
      { success: false, error: 'Error al buscar clientes' },
      { status: 500 }
    );
  }
}
