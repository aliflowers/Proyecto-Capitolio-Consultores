'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NuevoClientePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('cedula');
  const [nacionalidad, setNacionalidad] = useState('V');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [direccion, setDireccion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/crud/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          tipo_documento: tipoDocumento,
          numero_documento: numeroDocumento,
          nacionalidad: tipoDocumento === 'cedula' ? nacionalidad : null,
          direccion,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Error al crear el cliente');
      }

      alert('Cliente creado exitosamente');
      router.push('/private/clientes');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-primary">Crear Nuevo Cliente</h1>
      <form onSubmit={handleSubmit} className="space-y-6 p-8 border rounded-md bg-white shadow-lg">
        <div>
          <label htmlFor="fullName" className="block text-gray-700 text-sm font-bold mb-2">Nombre Completo</label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>
        <div>
          <label htmlFor="tipoDocumento" className="block text-gray-700 text-sm font-bold mb-2">Tipo de Documento</label>
          <select
            id="tipoDocumento"
            value={tipoDocumento}
            onChange={(e) => setTipoDocumento(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="cedula">Cédula</option>
            <option value="pasaporte">Pasaporte</option>
          </select>
        </div>
        {tipoDocumento === 'cedula' && (
          <div className="flex items-center space-x-4">
            <label className="block text-gray-700 text-sm font-bold">Nacionalidad</label>
            <div className="flex items-center">
              <input type="radio" id="v" name="nacionalidad" value="V" checked={nacionalidad === 'V'} onChange={() => setNacionalidad('V')} className="mr-2" />
              <label htmlFor="v">V</label>
            </div>
            <div className="flex items-center">
              <input type="radio" id="e" name="nacionalidad" value="E" checked={nacionalidad === 'E'} onChange={() => setNacionalidad('E')} className="mr-2" />
              <label htmlFor="e">E</label>
            </div>
            <div className="flex items-center">
              <input type="radio" id="j" name="nacionalidad" value="J" checked={nacionalidad === 'J'} onChange={() => setNacionalidad('J')} className="mr-2" />
              <label htmlFor="j">J</label>
            </div>
          </div>
        )}
        <div>
          <label htmlFor="numeroDocumento" className="block text-gray-700 text-sm font-bold mb-2">Número de Documento</label>
          <input
            id="numeroDocumento"
            type="text"
            value={numeroDocumento}
            onChange={(e) => setNumeroDocumento(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-gray-700 text-sm font-bold mb-2">Teléfono</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="direccion" className="block text-gray-700 text-sm font-bold mb-2">Dirección</label>
          <textarea
            id="direccion"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            rows={3}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        {error && <p className="text-red-500 text-sm">Error: {error}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Guardando...' : 'Guardar Cliente'}
          </button>
        </div>
      </form>
    </div>
  );
}
