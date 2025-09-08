'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaEye, FaPencilAlt, FaTrash } from 'react-icons/fa';
import DeleteClientButton from './DeleteClientButton';

interface Cliente {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  tipo_documento: string;
  numero_documento: string;
  nacionalidad: string;
  direccion: string;
  expedientes: string[];
  documentos_count: number;
  created_at: string;
}

export default function ClientTable({ initialClients }: { initialClients: Cliente[] }) {
  const [clients, setClients] = useState(initialClients);

  const handleDeleteSuccess = (clientId: string) => {
    setClients(prevClients => prevClients.filter(client => client.id !== clientId));
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Identificación</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expedientes</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documentos</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha de Registro</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {clients.map((client) => (
            <tr key={client.id}>
              <td className="px-6 py-4 whitespace-nowrap">{client.full_name}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {client.tipo_documento === 'cedula' ? `${client.nacionalidad}-${client.numero_documento}` : client.numero_documento}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div>{client.email}</div>
                <div>{client.phone}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {client.expedientes && client.expedientes.filter(Boolean).length > 0 ? (
                  <div className="flex flex-col">
                    {client.expedientes.filter(Boolean).slice(0, 2).map(exp => <span key={exp}>{exp}</span>)}
                    {client.expedientes.filter(Boolean).length > 2 && <span className="text-xs text-gray-500">y {client.expedientes.filter(Boolean).length - 2} más...</span>}
                  </div>
                ) : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {client.documentos_count > 0 ? client.documentos_count : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{new Date(client.created_at).toLocaleDateString()}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-4">
                  <Link href={`/private/clientes/${client.id}/edit`} className="text-gray-500 hover:text-indigo-900">
                    <FaPencilAlt />
                  </Link>
                  <DeleteClientButton clientId={client.id} onDeleteSuccess={() => handleDeleteSuccess(client.id)} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
