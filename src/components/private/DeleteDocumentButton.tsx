'use client'

import { useState } from 'react';

export default function DeleteDocumentButton({ documentId, onDeleteSuccess }: { documentId: string, onDeleteSuccess: () => void }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este documento? Esta acción no se puede deshacer.')) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/crud/documentos?id=${documentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar el documento');
      }

      alert('Documento eliminado exitosamente.');
      onDeleteSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
    >
      {isDeleting ? 'Eliminando...' : 'Eliminar'}
    </button>
  );
}
