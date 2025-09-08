'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface DeleteClientButtonProps {
  clientId: string;
  onDeleteSuccess: () => void;
}

export default function DeleteClientButton({ clientId, onDeleteSuccess }: DeleteClientButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirm('¿Está seguro de que desea eliminar este cliente? Esta acción no se puede deshacer.')) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/crud/clientes?id=${clientId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar el cliente');
      }

      onDeleteSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-4"
      >
        {isDeleting ? 'Eliminando...' : 'Eliminar'}
      </button>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </>
  );
}
