'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaEye, FaPencilAlt, FaTrash } from 'react-icons/fa';
import DeleteExpedienteButton from '@/components/private/DeleteExpedienteButton';

interface Expediente {
  id: string;
  expediente_number: string;
  expediente_name: string;
  cliente_name: string;
  status: string;
  created_at: string;
}

export default function ExpedientesPage() {
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    expediente_number: '',
    expediente_name: '',
    cliente_name: '',
    status: '',
  });

  const fetchExpedientes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.expediente_number) params.append('expediente_number', filters.expediente_number);
      if (filters.expediente_name) params.append('expediente_name', filters.expediente_name);
      if (filters.cliente_name) params.append('cliente_name', filters.cliente_name);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(`/api/crud/expedientes?${params.toString()}`);
      const result = await response.json();

      if (!result.success) throw new Error(result.error || 'Error al cargar los expedientes');
      
      setExpedientes(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpedientes();
  }, [filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Mis Expedientes</h1>
        <Link href="/private/expedientes/nuevo">
          <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary transition-colors">
            Crear Nuevo Expediente
          </button>
        </Link>
      </div>

      <div className="mb-4 p-4 bg-white rounded-md shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            name="expediente_number"
            placeholder="Buscar por número..."
            value={filters.expediente_number}
            onChange={handleFilterChange}
            className="p-2 border rounded-md"
          />
          <input
            type="text"
            name="expediente_name"
            placeholder="Buscar por nombre..."
            value={filters.expediente_name}
            onChange={handleFilterChange}
            className="p-2 border rounded-md"
          />
          <input
            type="text"
            name="cliente_name"
            placeholder="Buscar por cliente..."
            value={filters.cliente_name}
            onChange={handleFilterChange}
            className="p-2 border rounded-md"
          />
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="p-2 border rounded-md"
          >
            <option value="">Todos los estados</option>
            <option value="abierto">Abierto</option>
            <option value="cerrado">Cerrado</option>
            <option value="archivado">Archivado</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expedientes.map((exp) => (
                <tr key={exp.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{exp.expediente_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{exp.expediente_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{exp.cliente_name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{exp.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(exp.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-4">
                      <Link href={`/private/expedientes/${exp.id}`} className="text-blue-600 hover:text-blue-900">
                        <FaEye />
                      </Link>
                      <Link href={`/private/expedientes/${exp.id}/edit`} className="text-gray-500 hover:text-indigo-900">
                        <FaPencilAlt />
                      </Link>
                      <DeleteExpedienteButton expedienteId={exp.id} onDeleteSuccess={fetchExpedientes} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
