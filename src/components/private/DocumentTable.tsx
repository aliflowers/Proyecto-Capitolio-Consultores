'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaFilePdf, FaFileWord, FaFileImage, FaFileAlt, FaSave, FaTimes, FaPencilAlt, FaBrain } from 'react-icons/fa';
import DeleteDocumentButton from './DeleteDocumentButton';
import AssociationSearch from './AssociationSearch';
import Combobox from './Combobox';
import AnalysisModal from './AnalysisModal'; // Importar el Modal

const documentTypes: { [key: string]: string } = {
  contrato_arrendamiento: 'Contrato de Arrendamiento',
  contrato_compra_venta: 'Contrato de Compra-Venta',
  sentencia_tribunal: 'Sentencia de Tribunal',
  documento_privado: 'Documento Privado',
  documento_publico: 'Documento Público',
  otro: 'Otro',
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('pdf')) return <FaFilePdf className="text-red-500" />;
  if (mimeType.includes('word')) return <FaFileWord className="text-blue-500" />;
  if (mimeType.startsWith('image')) return <FaFileImage className="text-purple-500" />;
  return <FaFileAlt className="text-gray-500" />;
};

export default function DocumentTable({ initialDocuments, onDeleteSuccess }: { initialDocuments: any[], onDeleteSuccess: () => void }) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editedType, setEditedType] = useState('');
  const [selectedExpedienteId, setSelectedExpedienteId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [analysisDoc, setAnalysisDoc] = useState<any | null>(null); // Estado para el modal de análisis
  const router = useRouter();

  const handleEditClick = (doc: any) => {
    setEditingRowId(doc.id);
    setEditedType(doc.document_type || 'otro');
    setSelectedExpedienteId(null); // Resetear al abrir
    setSelectedClientId(doc.client_id || null); // Cargar el cliente actual
  };

  const handleCancelClick = () => {
    setEditingRowId(null);
    setEditedType('');
  };

  const handleSaveClick = async (docId: string) => {
    const payload: { id: string; document_type?: string; client_id?: string | null } = { id: docId };
    if (editedType) payload.document_type = editedType;
    if (selectedClientId) payload.client_id = selectedClientId;

    try {
      const response = await fetch(`/api/crud/documentos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el documento');
      }
      
      // Si también se asoció un expediente, se hace una segunda llamada
      if (selectedExpedienteId) {
        await fetch('/api/crud/expedientes/associate-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: docId, expedienteId: selectedExpedienteId }),
        });
      }

      setEditingRowId(null);
      router.refresh(); // Recargar datos desde el servidor para ver todos los cambios
    } catch (error) {
      console.error('Failed to save document:', error);
      alert('No se pudo guardar el documento.');
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Documento</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expediente Asociado</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente Asociado</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Subida</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Análisis IA</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {documents && documents.length > 0 ? (
            documents.map((doc: any) => (
              <tr key={doc.id} className={`hover:bg-gray-50 ${editingRowId === doc.id ? 'relative z-10' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center" title={doc.name}>
                    <div className="text-2xl mr-3 flex-shrink-0">{getFileIcon(doc.mime_type || '')}</div>
                    <span className="text-sm font-medium text-gray-900 truncate max-w-xs">{doc.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {editingRowId === doc.id ? (
                    <Combobox
                      items={Object.entries(documentTypes).map(([value, label]) => ({ value, label }))}
                      selectedValue={editedType}
                      onSelect={(value) => setEditedType(value as string)}
                    />
                  ) : (
                    documentTypes[doc.document_type] || doc.document_type || 'No especificado'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {editingRowId === doc.id ? (
                    <AssociationSearch 
                      documentId={doc.id} 
                      searchType="expedientes"
                      onSelect={(id) => setSelectedExpedienteId(id)}
                      currentAssociationName={doc.expediente_name}
                      clientId={selectedClientId} // Pasar el cliente seleccionado
                    />
                  ) : (
                    doc.expediente_name || 'N/A'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {editingRowId === doc.id ? (
                    <AssociationSearch 
                      documentId={doc.id} 
                      searchType="clients"
                      onSelect={(id) => setSelectedClientId(id)}
                      currentAssociationName={doc.client_name}
                    />
                  ) : (
                    doc.client_name || 'N/A'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(doc.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button onClick={() => setAnalysisDoc(doc)} className="text-purple-600 hover:text-purple-900">
                    <FaBrain />
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {editingRowId === doc.id ? (
                    <div className="flex items-center space-x-4">
                      <button onClick={() => handleSaveClick(doc.id)} className="text-green-600 hover:text-green-900">
                        <FaSave />
                      </button>
                      <button onClick={handleCancelClick} className="text-red-600 hover:text-red-900">
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4">
                      <button onClick={() => handleEditClick(doc)} className="text-gray-500 hover:text-indigo-900">
                        <FaPencilAlt />
                      </button>
                      <Link href={`/private/documentos/${doc.id}/view`} className="text-blue-600 hover:text-blue-900">
                        Visualizar
                      </Link>
                      <DeleteDocumentButton documentId={doc.id} onDeleteSuccess={onDeleteSuccess} />
                    </div>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="px-6 py-4 text-center text-gray-500">No hay documentos registrados.</td>
            </tr>
          )}
        </tbody>
      </table>
      {analysisDoc && (
        <AnalysisModal
          documentId={analysisDoc.id}
          documentName={analysisDoc.name}
          isOpen={!!analysisDoc}
          onClose={() => setAnalysisDoc(null)}
        />
      )}
    </div>
  );
}
