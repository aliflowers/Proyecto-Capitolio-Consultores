import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/server-auth';
import EditDocumentForm from '@/components/private/EditDocumentForm';
import Link from 'next/link';

async function getDocument(id: string, userId: string) {
  try {
    const result = await query(
      'SELECT id, name, document_type FROM documentos WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching document:', error);
    return null;
  }
}

export default async function EditDocumentPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return notFound();

  const document = await getDocument(params.id, user.id);
  if (!document) return notFound();

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <Link href="/private/documentos" className="text-blue-600 hover:underline">
          &larr; Volver a la lista de documentos
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-8 text-primary">Editar Metadatos del Documento</h1>
      <EditDocumentForm document={document} />
    </div>
  );
}
