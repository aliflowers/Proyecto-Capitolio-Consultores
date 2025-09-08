'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Definimos los tipos de documentos para usarlos en el formulario
const documentTypes = {
  contrato_arrendamiento: 'Contrato de Arrendamiento',
  contrato_compra_venta: 'Contrato de Compra-Venta',
  sentencia_tribunal: 'Sentencia de Tribunal',
  documento_privado: 'Documento Privado',
  documento_publico: 'Documento Público',
  otro: 'Otro',
};

interface Document {
  id: string;
  name: string;
  document_type: string;
}

export default function EditDocumentForm({ document }: { document: Document }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    document_type: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (document) {
      setFormData({
        name: document.name || '',
        document_type: document.document_type || 'otro',
      });
    }
  }, [document]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/crud/documentos`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: document.id,
          ...formData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar el documento');
      }

      router.push('/private/documentos');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-8 border rounded-md bg-white shadow-lg">
      <div>
        <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Nombre del Documento</label>
        <input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          required
        />
      </div>
      <div>
        <label htmlFor="document_type" className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de Documento
        </label>
        <select
          id="document_type"
          name="document_type"
          value={formData.document_type}
          onChange={handleChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {Object.entries(documentTypes).map(([key, value]) => (
            <option key={key} value={key}>{value}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-red-500 text-sm">Error: {error}</p>}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  );
}
