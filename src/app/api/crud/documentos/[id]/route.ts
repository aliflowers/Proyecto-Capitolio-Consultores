import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { protectApiRoute } from '@/lib/server-auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;
    const { id } = params;

    const result = await query(
      `SELECT * FROM documentos WHERE id = $1 AND user_id = $2`,
      [id, user.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Documento no encontrado o no tienes permiso para verlo.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.rows[0] });

  } catch (error) {
    console.error(`Error al obtener el documento con ID: ${params.id}` , error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
