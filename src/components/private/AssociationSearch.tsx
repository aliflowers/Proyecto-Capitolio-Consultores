'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  name: string;
}

interface AssociationSearchProps {
  documentId: string;
  searchType: 'expedientes' | 'clients';
  onSelect: (id: string, name: string) => void;
  currentAssociationName?: string | null;
  clientId?: string | null; // Nuevo: para filtrar por cliente
}

export default function AssociationSearch({ documentId, searchType, onSelect, currentAssociationName, clientId }: AssociationSearchProps) {
  const [query, setQuery] = useState(currentAssociationName || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      let url = `/api/search/${searchType}?query=${encodeURIComponent(searchQuery)}`;
      if (searchType === 'expedientes' && clientId) {
        url += `&clientId=${clientId}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setResults(data.data);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error(`Search error for ${searchType}:`, err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchType]);

  useEffect(() => {
    // No buscar si el query es el nombre de la asociación actual
    if (query === currentAssociationName) {
      return;
    }
    const debounce = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, search, currentAssociationName]);

  const handleSelect = (id: string, name: string) => {
    onSelect(id, name);
    setQuery(name);
    setResults([]);
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Buscar ${searchType === 'expedientes' ? 'expediente' : 'cliente'}...`}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {isLoading && <p className="text-xs text-gray-500 mt-1">Buscando...</p>}
      {results.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto">
          {results.map((result) => (
            <li
              key={result.id}
              onClick={() => handleSelect(result.id, result.name)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              {result.name}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
