import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { protectApiRoute } from '@/lib/server-auth';

export async function POST(request: Request) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const { documentId, caseId } = await request.json();

    if (!documentId || !caseId) {
      return NextResponse.json({ success: false, error: 'documentId and caseId are required' }, { status: 400 });
    }

    // Verificar que el usuario tenga acceso tanto al documento como al caso (medida de seguridad)
    const docCheck = await query('SELECT id FROM documentos WHERE id = $1 AND user_id = $2', [documentId, user.id]);
    const caseCheck = await query('SELECT id FROM expedientes WHERE id = $1 AND user_id = $2', [caseId, user.id]);

    if (docCheck.rowCount === 0 || caseCheck.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Acceso denegado o recurso no encontrado' }, { status: 403 });
    }

    // Insertar la asociación, ignorando si ya existe para evitar errores
    await query(
      `INSERT INTO expedientes_documentos (documento_id, expediente_id)
       VALUES ($1, $2)
       ON CONFLICT (documento_id, expediente_id) DO NOTHING`,
      [documentId, caseId]
    );

    return NextResponse.json({ success: true, message: 'Documento asociado exitosamente' });

  } catch (error) {
    console.error('Error associating document:', error);
    return NextResponse.json(
      { success: false, error: 'Error al asociar el documento' },
      { status: 500 }
    );
  }
}
