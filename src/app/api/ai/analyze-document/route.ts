import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { query } from '@/lib/db';
import { genAI } from '@/lib/ai';
import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
const mammoth = require('mammoth');

async function getDocumentText(filePath: string, mimeType: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);

  if (mimeType === 'application/pdf') {
    const data = await pdf(buffer);
    return data.text;
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }

  if (mimeType.startsWith('text/')) {
    return buffer.toString('utf-8');
  }

  throw new Error('Unsupported file type for analysis.');
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { documentId, prompt } = await request.json();
    if (!documentId || !prompt) {
      return NextResponse.json({ error: 'documentId and prompt are required' }, { status: 400 });
    }

    const docResult = await query(
      'SELECT path, mime_type FROM documentos WHERE id = $1 AND user_id = $2',
      [documentId, user.id]
    );

    if (docResult.rows.length === 0) {
      return NextResponse.json({ error: 'Documento no encontrado o sin acceso' }, { status: 404 });
    }

    const document = docResult.rows[0];
    const absoluteFilePath = path.join(process.cwd(), 'storage', document.path);

    if (!fs.existsSync(absoluteFilePath)) {
      return NextResponse.json({ error: 'Archivo no encontrado en el disco' }, { status: 404 });
    }

    const documentText = await getDocumentText(absoluteFilePath, document.mime_type);

    if (!documentText.trim()) {
      return NextResponse.json({ error: 'No se pudo extraer texto del documento para el análisis.' }, { status: 400 });
    }

    const generativeModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const fullPrompt = `Eres un asistente legal experto. Analiza el siguiente texto extraído de un documento y responde a la solicitud del usuario.
    
    --- INICIO DEL TEXTO DEL DOCUMENTO ---
    ${documentText.substring(0, 10000)} 
    --- FIN DEL TEXTO DEL DOCUMENTO ---

    Solicitud del usuario: "${prompt}"
    
    Respuesta:`;

    const result = await generativeModel.generateContent(fullPrompt);
    const response = result.response;
    const analysis = response.text();

    return NextResponse.json({ success: true, analysis });

  } catch (error) {
    console.error('Error analyzing document:', error);
    return NextResponse.json(
      { error: 'Error en el análisis del documento', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
