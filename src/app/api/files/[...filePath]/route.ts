import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { query } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

export async function GET(
  request: Request,
  context: { params: { filePath: string[] } }
) {
  try {
    const { params } = context;

    // 1. Verificar autenticación
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    // 2. Construir y validar la ruta del archivo
    const requestedPath = params.filePath.join('/');
    const storageDir = path.join(process.cwd(), 'storage');
    const absoluteFilePath = path.join(storageDir, requestedPath);

    // Medida de seguridad: Prevenir ataques de Path Traversal
    if (!absoluteFilePath.startsWith(storageDir)) {
      return new NextResponse('Acceso denegado', { status: 403 });
    }

    // 3. Verificar permisos en la base de datos
    const dbPath = requestedPath.replace(/\\/g, '/');
    const dbResult = await query(
      'SELECT user_id FROM documentos WHERE path = $1',
      [dbPath]
    );

    if (dbResult.rows.length === 0) {
      return new NextResponse('Archivo no encontrado en la base de datos', { status: 404 });
    }

    const docOwnerId = dbResult.rows[0].user_id;

    if (docOwnerId !== user.id) {
      return new NextResponse('Acceso denegado', { status: 403 });
    }

    // 4. Leer y servir el archivo
    if (!fs.existsSync(absoluteFilePath)) {
      return new NextResponse('Archivo no encontrado en el disco', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(absoluteFilePath);
    const contentType = mime.lookup(absoluteFilePath) || 'application/octet-stream';

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', fileBuffer.length.toString());

    return new Response(fileBuffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}
