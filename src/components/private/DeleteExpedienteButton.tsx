'use client'

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaTrash } from 'react-icons/fa';

interface DeleteExpedienteButtonProps {
  expedienteId: string;
  onDeleteSuccess: () => void;
}

export default function DeleteExpedienteButton({ expedienteId, onDeleteSuccess }: DeleteExpedienteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este expediente? Esta acción no se puede deshacer.')) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/crud/expedientes?id=${expedienteId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar el expediente');
      }

      onDeleteSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Eliminar expediente"
    >
      {isDeleting ? 'Eliminando...' : <FaTrash />}
    </button>
  );
}
