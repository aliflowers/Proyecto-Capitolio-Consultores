'use client'

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ExpedienteData {
  expediente_name: string;
  expediente_number: string;
  description: string;
  status: string;
}

export default function EditExpedientePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const expedienteId = params.id;
  const [expedienteData, setExpedienteData] = useState<ExpedienteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpedienteDetails = useCallback(async () => {
    if (!expedienteId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/crud/expedientes/${expedienteId}`);
      const result = await response.json();
      if (response.ok) {
        setExpedienteData(result.data);
      } else {
        throw new Error(result.error || 'Error al cargar los datos del expediente');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [expedienteId]);

  useEffect(() => {
    fetchExpedienteDetails();
  }, [fetchExpedienteDetails]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setExpedienteData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/crud/expedientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: expedienteId, ...expedienteData }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar el expediente');
      }

      alert('Expediente actualizado exitosamente');
      router.push(`/private/expedientes/${expedienteId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !expedienteData) {
    return <p>Cargando datos del expediente...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-primary">Editar Expediente</h1>
      {expedienteData && (
        <form onSubmit={handleSubmit} className="space-y-6 p-8 border rounded-md bg-white shadow-lg">
          <div>
            <label htmlFor="expediente_name" className="block text-gray-700 text-sm font-bold mb-2">Nombre del Expediente</label>
            <input
              id="expediente_name"
              name="expediente_name"
              type="text"
              value={expedienteData.expediente_name}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>
          <div>
            <label htmlFor="expediente_number" className="block text-gray-700 text-sm font-bold mb-2">Número de Expediente</label>
            <input
              id="expediente_number"
              name="expediente_number"
              type="text"
              value={expedienteData.expediente_number}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Descripción</label>
            <textarea
              id="description"
              name="description"
              value={expedienteData.description}
              onChange={handleInputChange}
              rows={4}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2">Estado</label>
            <select
              id="status"
              name="status"
              value={expedienteData.status}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="abierto">Abierto</option>
              <option value="cerrado">Cerrado</option>
              <option value="archivado">Archivado</option>
            </select>
          </div>
          {error && <p className="text-red-500 text-sm">Error: {error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Actualizando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
