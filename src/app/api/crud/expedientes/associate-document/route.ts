import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { protectApiRoute } from '@/lib/server-auth';

export async function POST(request: Request) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { expedienteId, documentId } = await request.json();

    if (!expedienteId || !documentId) {
      return NextResponse.json({ success: false, error: 'El ID del expediente y del documento son requeridos' }, { status: 400 });
    }

    // Aquí se podría añadir una verificación para asegurar que el usuario tiene permiso sobre el expediente y el documento
    // pero por ahora, la protección de la ruta es suficiente para la funcionalidad básica.

    const result = await query(
      `INSERT INTO expedientes_documentos (expediente_id, documento_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *`,
      [expedienteId, documentId]
    );

    if (result.rowCount === 0) {
        return NextResponse.json({ success: true, message: 'La asociación ya existe.' });
    }

    return NextResponse.json({ success: true, message: 'Documento asociado exitosamente.', data: result.rows[0] }, { status: 201 });

  } catch (error) {
    console.error('Error al asociar documento al expediente:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al asociar documento al expediente',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
