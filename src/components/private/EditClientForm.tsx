'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Client {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  tipo_documento: string;
  numero_documento: string;
  nacionalidad: string;
  direccion: string;
}

export default function EditClientForm({ client }: { client: Client }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    tipo_documento: 'cedula',
    numero_documento: '',
    nacionalidad: 'V',
    direccion: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (client) {
      setFormData({
        full_name: client.full_name || '',
        email: client.email || '',
        phone: client.phone || '',
        tipo_documento: client.tipo_documento || 'cedula',
        numero_documento: client.numero_documento || '',
        nacionalidad: client.nacionalidad || 'V',
        direccion: client.direccion || '',
      });
    }
  }, [client]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/crud/clientes?id=${client.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar el cliente');
      }

      router.push('/private/clientes');
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
        <label htmlFor="full_name" className="block text-gray-700 text-sm font-bold mb-2">Nombre Completo</label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          value={formData.full_name}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          required
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-gray-700 text-sm font-bold mb-2">Teléfono</label>
        <input
          id="phone"
          name="phone"
          type="text"
          value={formData.phone}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>
      <div>
        <label htmlFor="tipo_documento" className="block text-gray-700 text-sm font-bold mb-2">Tipo de Documento</label>
        <select
          id="tipo_documento"
          name="tipo_documento"
          value={formData.tipo_documento}
          onChange={(e) => setFormData(prev => ({ ...prev, tipo_documento: e.target.value }))}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="cedula">Cédula</option>
          <option value="pasaporte">Pasaporte</option>
        </select>
      </div>
      {formData.tipo_documento === 'cedula' && (
        <div className="flex items-center space-x-4">
          <label className="block text-gray-700 text-sm font-bold">Nacionalidad</label>
          <div className="flex items-center">
            <input type="radio" id="v" name="nacionalidad" value="V" checked={formData.nacionalidad === 'V'} onChange={() => setFormData(prev => ({...prev, nacionalidad: 'V'}))} className="mr-2" />
            <label htmlFor="v">V</label>
          </div>
          <div className="flex items-center">
            <input type="radio" id="e" name="nacionalidad" value="E" checked={formData.nacionalidad === 'E'} onChange={() => setFormData(prev => ({...prev, nacionalidad: 'E'}))} className="mr-2" />
            <label htmlFor="e">E</label>
          </div>
          <div className="flex items-center">
            <input type="radio" id="j" name="nacionalidad" value="J" checked={formData.nacionalidad === 'J'} onChange={() => setFormData(prev => ({...prev, nacionalidad: 'J'}))} className="mr-2" />
            <label htmlFor="j">J</label>
          </div>
        </div>
      )}
      <div>
        <label htmlFor="numero_documento" className="block text-gray-700 text-sm font-bold mb-2">Número de Documento</label>
        <input
          id="numero_documento"
          name="numero_documento"
          type="text"
          value={formData.numero_documento}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>
      <div>
        <label htmlFor="direccion" className="block text-gray-700 text-sm font-bold mb-2">Dirección</label>
        <textarea
          id="direccion"
          name="direccion"
          value={formData.direccion}
          onChange={handleChange}
          rows={4}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
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
