import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/server-auth';
import Link from 'next/link';
import DynamicDocumentViewer from '@/components/private/DynamicDocumentViewer';

async function getDocument(id: string, userId: string) {
  try {
    const result = await query(
      'SELECT * FROM documentos WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching document:', error);
    return null;
  }
}

export default async function ViewDocumentPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return notFound();

  const document = await getDocument(params.id, user.id);
  if (!document) return notFound();

  return (
    <div className="w-full p-4">
      <div className="mb-6">
        <Link href="/private/documentos" className="text-blue-600 hover:underline">
          &larr; Volver a la lista de documentos
        </Link>
      </div>
      <div className="bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-4xl font-bold mb-2 text-primary">{document.name}</h1>
        <p className="text-lg text-gray-600 mb-4">Tipo: {document.document_type || 'No especificado'}</p>
        <div className="border-t pt-4">
          <DynamicDocumentViewer document={document} />
        </div>
      </div>
    </div>
  );
}
