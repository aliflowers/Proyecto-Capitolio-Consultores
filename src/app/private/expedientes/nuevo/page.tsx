'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Combobox from '@/components/private/Combobox'

interface Cliente {
  id: string;
  full_name: string;
}

interface Documento {
  id: string;
  name: string;
}

export default function NuevoExpedientePage() {
  const router = useRouter()
  const [expedienteName, setExpedienteName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('abierto')
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [documentoIds, setDocumentoIds] = useState<string[]>([])
  
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [documentos, setDocumentos] = useState<Documento[]>([])
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [clientesRes, documentosRes] = await Promise.all([
          fetch('/api/crud/clientes'),
          fetch('/api/crud/documentos')
        ]);
        
        const clientesData = await clientesRes.json();
        const documentosData = await documentosRes.json();

        if (clientesData.success) setClientes(clientesData.data);
        if (documentosData.success) setDocumentos(documentosData.data);
      } catch (err) {
        setError('Error al cargar datos iniciales');
      }
    }
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!clienteId) {
      setError('Por favor, selecciona un cliente.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/crud/expedientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expediente_name: expedienteName,
          description,
          status,
          cliente_id: clienteId,
          documento_ids: documentoIds,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear el expediente');
      }

      router.push('/private/expedientes')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-primary">Crear Nuevo Expediente</h1>
      <form onSubmit={handleSubmit} className="space-y-6 p-8 border rounded-md bg-white shadow-lg">
        <div>
          <label htmlFor="expedienteName" className="block text-gray-700 text-sm font-bold mb-2">Nombre del Expediente</label>
          <input
            id="expedienteName"
            type="text"
            value={expedienteName}
            onChange={(e) => setExpedienteName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Cliente</label>
          <Combobox
            items={clientes.map(c => ({ value: c.id, label: c.full_name }))}
            selectedValue={clienteId}
            onSelect={(value) => setClienteId(value as string)}
            placeholder="Selecciona un cliente"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Documentos Asociados (Opcional)</label>
          <Combobox
            items={documentos.map(d => ({ value: d.id, label: d.name }))}
            selectedValue={documentoIds}
            onSelect={(selected: string | string[]) => {
              const newSelection = Array.isArray(selected) ? selected : [selected].filter(Boolean) as string[];
              setDocumentoIds(newSelection);
            }}
            placeholder="Selecciona documentos"
            multiple
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Descripción</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2">Estado</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
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
            {loading ? 'Guardando...' : 'Guardar Expediente'}
          </button>
        </div>
      </form>
    </div>
  )
}
