'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Document = {
  id: string;
  name: string;
};

interface AddDocumentToExpedienteProps {
  expedienteId: string;
  associatedDocumentIds: string[];
  onAssociationSuccess: () => void;
}

export default function AddDocumentToExpediente({ expedienteId, associatedDocumentIds, onAssociationSuccess }: AddDocumentToExpedienteProps) {
  const router = useRouter()
  const [availableDocs, setAvailableDocs] = useState<Document[]>([])
  const [selectedDoc, setSelectedDoc] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDocs = async () => {
      if (!expedienteId) return;
      setLoading(true);
      try {
        const response = await fetch(`/api/crud/documentos/available-for-expediente?expedienteId=${expedienteId}`);
        const result = await response.json();
        
        if (response.ok) {
          // El filtrado ahora se hace en el backend, pero mantenemos esto por si acaso
          const unassociated = result.data.filter((doc: Document) => !associatedDocumentIds.includes(doc.id))
          setAvailableDocs(unassociated);
        } else {
          throw new Error(result.error || 'No se pudieron cargar los documentos');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error('Error fetching documents:', err)
      } finally {
        setLoading(false);
      }
    }
    fetchDocs()
  }, [associatedDocumentIds, expedienteId])

  const handleAssociate = async () => {
    if (!selectedDoc) return
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/crud/expedientes/associate-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expedienteId, documentId: selectedDoc })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al asociar documento');
      }

      setSelectedDoc('');
      onAssociationSuccess(); // Llama a la función de callback para recargar los datos
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      alert(`Error: ${err instanceof Error ? err.message : 'Error al asociar documento'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t">
      <h4 className="font-semibold mb-2">Asociar un documento existente</h4>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <div className="flex items-center space-x-2">
        <select
          value={selectedDoc}
          onChange={(e) => setSelectedDoc(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          disabled={loading}
        >
          <option value="" disabled>Selecciona un documento...</option>
          {availableDocs.length > 0 ? (
            availableDocs.map((doc: Document) => (
              <option key={doc.id} value={doc.id}>{doc.name}</option>
            ))
          ) : (
            <option disabled>No hay más documentos para asociar</option>
          )}
        </select>
        <button
          onClick={handleAssociate}
          disabled={!selectedDoc || loading}
          className="px-4 py-2 bg-gray-600 text-white rounded-md disabled:bg-gray-400 hover:bg-gray-700 transition-colors whitespace-nowrap"
        >
          {loading ? 'Asociando...' : 'Asociar'}
        </button>
      </div>
    </div>
  )
}
