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
    const expedienteId = searchParams.get('expedienteId');

    if (!expedienteId) {
      return NextResponse.json({ success: false, error: 'El ID del expediente es requerido' }, { status: 400 });
    }

    const result = await query(
      `
      SELECT d.id, d.name
      FROM documentos d
      WHERE d.user_id = $1
      AND (
        d.client_id IS NULL OR
        d.client_id IN (
          SELECT cliente_id
          FROM expedientes_clientes
          WHERE expediente_id = $2
        )
      )
      AND NOT EXISTS (
        SELECT 1
        FROM expedientes_documentos ed
        WHERE ed.documento_id = d.id
        AND ed.expediente_id = $2
      )
      `,
      [user.id, expedienteId]
    );

    return NextResponse.json({ success: true, data: result.rows });

  } catch (error) {
    console.error('Error al obtener documentos disponibles:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
