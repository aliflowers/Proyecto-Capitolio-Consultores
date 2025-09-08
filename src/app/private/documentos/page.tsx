'use client';

import { useState, useEffect, useCallback } from 'react';
import UploadDocumentForm from '@/components/private/UploadDocumentForm';
import DocumentTable from '@/components/private/DocumentTable';
import DocumentFilters from '@/components/private/DocumentFilters';
import { useCurrentUser } from '@/hooks/use-current-user';

export default function DocumentosPage() {
  const user = useCurrentUser();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      // Limpiar filtros vacíos antes de enviar
      const cleanedFilters: { [key: string]: string } = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          cleanedFilters[key] = value as string;
        }
      });

      const params = new URLSearchParams(cleanedFilters).toString();
      const response = await fetch(`/api/crud/documentos?${params}`);
      const data = await response.json();

      if (data.success) {
        setDocuments(data.data);
      } else {
        throw new Error(data.error || 'Error al cargar documentos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return (
    <div className="w-full space-y-8 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Gestión Documental</h1>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-primary">Subir Nuevo Documento</h2>
        {user ? <UploadDocumentForm userId={user.id} onUploadSuccess={fetchDocuments} /> : <p>Cargando formulario...</p>}
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4 text-primary">Filtrar Documentos</h2>
        <DocumentFilters onFilterChange={fetchDocuments} />
      </div>

      {loading && <p>Cargando documentos...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && <DocumentTable initialDocuments={documents} onDeleteSuccess={fetchDocuments} />}
    </div>
  );
}
