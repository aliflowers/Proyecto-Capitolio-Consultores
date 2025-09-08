import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { protectApiRoute } from '@/lib/server-auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const expedienteResult = await query(
      `SELECT * FROM expedientes WHERE id = $1 AND user_id = $2`,
      [id, user.id]
    );

    if (expedienteResult.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Expediente no encontrado o no tienes permiso para verlo.' }, { status: 404 });
    }

    const documentosResult = await query(
      `SELECT d.id, d.name, d.mime_type FROM documentos d
       JOIN expedientes_documentos ed ON d.id = ed.documento_id
       WHERE ed.expediente_id = $1`,
      [id]
    );

    const clientesResult = await query(
      `SELECT c.id, c.full_name FROM clientes c
       JOIN expedientes_clientes ec ON c.id = ec.cliente_id
       WHERE ec.expediente_id = $1`,
      [id]
    );

    const data = {
      expediente: expedienteResult.rows[0],
      documents: documentosResult.rows,
      clients: clientesResult.rows,
    };

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error(`Error al obtener el expediente con ID: ${id}` , error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
