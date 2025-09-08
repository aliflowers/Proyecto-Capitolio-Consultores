import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import EditDocumentForm from '@/components/private/EditDocumentForm';

async function getDocumentDetails(documentId: string) {
  // Necesitamos propagar las cookies para que la API protegida funcione desde un Server Component
  const cookieStore = cookies();
  const response = await fetch(`http://localhost:3000/api/crud/documentos/${documentId}`, {
    headers: {
      Cookie: cookieStore.toString(),
    },
  });

  const result = await response.json();

  if (!response.ok) {
    return null;
  }
  return result.data;
}

export default async function DocumentDetailPage({ params }: { params: { id: string } }) {
  const document = await getDocumentDetails(params.id);

  if (!document) {
    notFound();
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="bg-white shadow-lg rounded-lg p-8">
        <div className="mb-6 pb-4 border-b">
          <h1 className="text-3xl font-bold text-primary break-words">{document.name}</h1>
          <p className="text-sm text-gray-500 mt-2">ID: {document.id}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold text-gray-600">Tipo de Archivo</p>
            <p className="text-gray-800 bg-gray-100 p-2 rounded-md">{document.mime_type || 'No especificado'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-600">Fecha de Subida</p>
            <p className="text-gray-800 bg-gray-100 p-2 rounded-md">{new Date(document.created_at).toLocaleString('es-ES')}</p>
          </div>
        </div>

        <EditDocumentForm document={document} />

      </div>
    </div>
  );
}
