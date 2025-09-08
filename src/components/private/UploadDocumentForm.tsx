'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Combobox from './Combobox';
import AssociationSearch from './AssociationSearch';

const documentTypes = {
  contrato_arrendamiento: 'Contrato de Arrendamiento',
  contrato_compra_venta: 'Contrato de Compra-Venta',
  sentencia_tribunal: 'Sentencia de Tribunal',
  documento_privado: 'Documento Privado',
  documento_publico: 'Documento Público',
  otro: 'Otro',
};

export default function UploadDocumentForm({ userId, onUploadSuccess }: { userId: string, onUploadSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('otro');
  const [selectedExpedienteId, setSelectedExpedienteId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Por favor, selecciona un archivo.');
      return;
    }
    if (!userId) {
      setError('No se pudo identificar al usuario. Por favor, inicia sesión de nuevo.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      formData.append('fileName', file.name);
      formData.append('fileType', file.type);
      formData.append('documentType', documentType);
      if (selectedExpedienteId) {
        formData.append('expedienteId', selectedExpedienteId);
      }
      if (selectedClientId) {
        formData.append('clientId', selectedClientId);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al subir el archivo');
      }

      setFile(null);
      setDocumentType('otro');
      setSelectedExpedienteId(null);
      setSelectedClientId(null);
      if (onUploadSuccess) {
        onUploadSuccess();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(`Error al subir el archivo: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="document_type" className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de Documento
        </label>
        <Combobox
          items={Object.entries(documentTypes).map(([value, label]) => ({ value, label }))}
          selectedValue={documentType}
          onSelect={(value) => setDocumentType(value as string)}
        />
      </div>
      <div>
        <label htmlFor="expediente_association" className="block text-sm font-medium text-gray-700 mb-1">
          Asociar a un Expediente (Opcional)
        </label>
        <AssociationSearch 
          documentId=""
          searchType="expedientes"
          onSelect={(id) => setSelectedExpedienteId(id)}
          currentAssociationName={null}
          clientId={selectedClientId}
        />
      </div>
      <div>
        <label htmlFor="client_association" className="block text-sm font-medium text-gray-700 mb-1">
          Asociar a un Cliente (Opcional)
        </label>
        <AssociationSearch 
          documentId=""
          searchType="clients"
          onSelect={(id) => setSelectedClientId(id)}
          currentAssociationName={null}
        />
      </div>
      <div>
        <label htmlFor="document" className="block text-sm font-medium text-gray-700">
          Seleccionar archivo
        </label>
        <input 
          type="file" 
          id="document" 
          onChange={handleFileChange} 
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
        />
      </div>
      <div className="flex justify-end">
        <button 
          type="submit" 
          disabled={!file || uploading}
          className="px-4 py-2 bg-primary text-white rounded-md disabled:bg-gray-400 hover:bg-secondary transition-colors"
        >
          {uploading ? 'Subiendo...' : 'Subir Documento'}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </form>
  );
}
