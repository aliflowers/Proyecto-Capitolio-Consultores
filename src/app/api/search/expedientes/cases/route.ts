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

    // Buscar casos por nombre o número que coincidan con la búsqueda
    const result = await query(
      `SELECT id, case_name as name FROM casos 
       WHERE user_id = $1 AND (case_name ILIKE $2 OR case_number ILIKE $2)
       LIMIT 10`,
      [user.id, `%${searchQuery}%`]
    );

    return NextResponse.json({ success: true, data: result.rows });

  } catch (error) {
    console.error('Error searching cases:', error);
    return NextResponse.json(
      { success: false, error: 'Error al buscar casos' },
      { status: 500 }
    );
  }
}
