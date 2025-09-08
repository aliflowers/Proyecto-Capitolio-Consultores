import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/server-auth';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const fileType = formData.get('fileType') as string;
    const documentType = formData.get('documentType') as string;
    const caseId = formData.get('caseId') as string | null;
    const clientId = formData.get('clientId') as string | null; // Recibir el clientId opcional

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // 1. Guardar el archivo físicamente en el servidor
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const userStorageDir = path.join(process.cwd(), 'storage', user.id);
    const filePath = path.join(userStorageDir, fileName);

    // Asegurarse de que el directorio del usuario exista
    if (!fs.existsSync(userStorageDir)) {
      fs.mkdirSync(userStorageDir, { recursive: true });
    }

    // Escribir el archivo en el disco
    fs.writeFileSync(filePath, fileBuffer);

    // 2. Guardar los metadatos en la base de datos
    // Usamos una ruta relativa para almacenar en la BD, que será resuelta por la API de descarga
    const dbPath = path.join(user.id, fileName).replace(/\\/g, '/'); // Normalizar para URL

    const result = await query(
      `INSERT INTO documentos (user_id, name, path, mime_type, document_type, client_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, user_id, name, path, mime_type, document_type, client_id, created_at`,
      [user.id, fileName, dbPath, fileType, documentType, clientId]
    );

    const newDocument = result.rows[0];

    // Si se proporcionó un caseId, crear la asociación
    if (caseId && newDocument.id) {
      await query(
        `INSERT INTO casos_documentos (documento_id, caso_id)
         VALUES ($1, $2)
         ON CONFLICT (documento_id, caso_id) DO NOTHING`,
        [newDocument.id, caseId]
      );
    }

    return NextResponse.json({
      success: true,
      document: newDocument
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Error al subir el documento' },
      { status: 500 }
    );
  }
}
