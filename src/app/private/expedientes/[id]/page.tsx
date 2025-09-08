'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter, notFound } from 'next/navigation';
import { FaFilePdf, FaFileWord, FaFileImage, FaFileAlt, FaUser } from 'react-icons/fa';
import AddDocumentToExpediente from '@/components/private/AddDocumentToExpediente';
import DeleteExpedienteButton from '@/components/private/DeleteExpedienteButton';
import Link from 'next/link';

const getFileIcon = (mimeType: string | null) => {
  if (!mimeType) return <FaFileAlt className="text-gray-500" />;
  if (mimeType.includes('pdf')) return <FaFilePdf className="text-red-500" />;
  if (mimeType.includes('word')) return <FaFileWord className="text-blue-500" />;
  if (mimeType.startsWith('image')) return <FaFileImage className="text-purple-500" />;
  return <FaFileAlt className="text-gray-500" />;
};

interface Expediente {
  id: string;
  expediente_name: string;
  expediente_number: string;
  status: string;
  description: string;
}

interface Documento {
  id: string;
  name: string;
  mime_type: string;
}

interface Cliente {
  id: string;
  full_name: string;
}

export default function ExpedienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [expediente, setExpediente] = useState<Expediente | null>(null);
  const [documents, setDocuments] = useState<Documento[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpedienteData = useCallback(async () => {
    try {
      const res = await fetch(`/api/crud/expedientes/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      if (data.success) {
        setExpediente(data.data.expediente);
        setDocuments(data.data.documents);
        setClients(data.data.clients);
      } else {
        notFound();
      }
    } catch (error) {
      notFound();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchExpedienteData();
  }, [fetchExpedienteData]);

  if (loading) return <div>Cargando...</div>;
  if (!expediente) return notFound();

  const associatedDocumentIds = documents.map(d => d.id);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white shadow-lg rounded-lg p-8 mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-primary">{expediente.expediente_name}</h1>
            <p className="text-lg text-gray-600">Número de Expediente: {expediente.expediente_number || 'N/A'}</p>
          </div>
          <div className="flex space-x-2 flex-shrink-0 mt-1">
            <Link href={`/private/expedientes/${expediente.id}/edit`}>
              <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded transition-colors">
                Editar
              </button>
            </Link>
            <DeleteExpedienteButton expedienteId={expediente.id} onDeleteSuccess={() => router.push('/private/expedientes')} />
          </div>
        </div>
        <p className="text-sm text-gray-500 border-t pt-4 mt-4">Estado: <span className="font-medium capitalize px-2 py-1 bg-secondary text-white rounded-full">{expediente.status}</span></p>
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2 text-primary">Descripción</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{expediente.description || 'No hay descripción.'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h3 className="text-2xl font-semibold mb-4 text-primary">Documentos Asociados</h3>
          <ul className="space-y-2">
            {documents.length > 0 ? (
              documents.map((doc) => (
                <li key={doc.id} className="flex items-center text-gray-700">
                  <span className="mr-2 text-lg">{getFileIcon(doc.mime_type)}</span>
                  {doc.name}
                </li>
              ))
            ) : (
              <p className="text-gray-500">No hay documentos asociados.</p>
            )}
          </ul>
          <AddDocumentToExpediente expedienteId={id} associatedDocumentIds={associatedDocumentIds} onAssociationSuccess={fetchExpedienteData} />
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6">
          <h3 className="text-2xl font-semibold mb-4 text-primary">Clientes Asociados</h3>
          <ul className="space-y-2">
            {clients.length > 0 ? (
              clients.map((client) => (
                <li key={client.id} className="flex items-center text-gray-700">
                  <FaUser className="mr-2 text-secondary" />
                  {client.full_name}
                </li>
              ))
            ) : (
              <p className="text-gray-500">No hay clientes asociados.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
