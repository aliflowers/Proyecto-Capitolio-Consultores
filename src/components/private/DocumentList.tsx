'use client'

import { useState } from 'react'
import DeleteDocumentButton from './DeleteDocumentButton'; // Importar el botón de eliminar

// Define the type for a document based on your table schema
type Document = {
  id: string;
  created_at: string;
  name: string;
  mime_type: string | null;
};

export default function DocumentList({ initialDocuments }: { initialDocuments: Document[] }) {
  const [documents, setDocuments] = useState(initialDocuments)

  if (documents.length === 0) {
    return <p className="text-gray-500">No has subido ningún documento todavía.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-md">
        <thead>
          <tr className="bg-gray-50">
            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Nombre del Archivo</th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Tipo</th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Fecha de Subida</th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id} className="border-t hover:bg-gray-50">
              <td className="py-3 px-4 text-sm text-gray-800">{doc.name}</td>
              <td className="py-3 px-4 text-sm text-gray-600">{doc.mime_type || 'Desconocido'}</td>
              <td className="py-3 px-4 text-sm text-gray-600">
                {new Date(doc.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </td>
              <td className="py-3 px-4 text-sm">
                <DeleteDocumentButton documentId={doc.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
