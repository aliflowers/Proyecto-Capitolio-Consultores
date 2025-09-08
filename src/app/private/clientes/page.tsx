'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ClientTable from '@/components/private/ClientTable';

export default function ClientesPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    full_name: '',
    numero_documento: '',
    email: '',
    phone: '',
    date_from: '',
    date_to: '',
  });

  const fetchClients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/crud/clientes?${params.toString()}`);
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Error al cargar los clientes');
      }
      setClients(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchClients();
    }, 500);
    return () => clearTimeout(handler);
  }, [filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestión de Clientes</h1>
        <Link href="/private/clientes/nuevo">
          <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary transition-colors">
            Crear Nuevo Cliente
          </button>
        </Link>
      </div>

      <div className="mb-4 p-4 bg-white rounded-md shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="text" name="full_name" placeholder="Buscar por nombre..." value={filters.full_name} onChange={handleFilterChange} className="p-2 border rounded-md" />
          <input type="text" name="numero_documento" placeholder="Buscar por documento..." value={filters.numero_documento} onChange={handleFilterChange} className="p-2 border rounded-md" />
          <input type="text" name="email" placeholder="Buscar por email..." value={filters.email} onChange={handleFilterChange} className="p-2 border rounded-md" />
          <input type="text" name="phone" placeholder="Buscar por teléfono..." value={filters.phone} onChange={handleFilterChange} className="p-2 border rounded-md" />
          <input type="date" name="date_from" value={filters.date_from} onChange={handleFilterChange} className="p-2 border rounded-md" />
          <input type="date" name="date_to" value={filters.date_to} onChange={handleFilterChange} className="p-2 border rounded-md" />
        </div>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <ClientTable initialClients={clients} />
      )}
    </div>
  );
}
