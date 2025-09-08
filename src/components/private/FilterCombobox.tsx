'use client';

import { useState, useEffect, useCallback } from 'react';

interface SearchResult {
  id: string;
  name: string;
}

interface FilterComboboxProps {
  searchUrl: string;
  placeholder: string;
  onSelectionChange: (id: string | null, name: string | null) => void;
}

export default function FilterCombobox({ searchUrl, placeholder, onSelectionChange }: FilterComboboxProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);

  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${searchUrl}?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data.success) {
        setResults(data.data);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error(`Search error for ${searchUrl}:`, err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchUrl]);

  useEffect(() => {
    if (selectedItem && query === selectedItem.name) {
      return;
    }
    
    const debounce = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, search, selectedItem]);

  const handleSelect = (item: SearchResult) => {
    setSelectedItem(item);
    setQuery(item.name);
    onSelectionChange(item.id, item.name);
    setResults([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    if (newQuery === '') {
      setSelectedItem(null);
      onSelectionChange(null, null);
      setResults([]);
    }
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {isLoading && <p className="text-xs text-gray-500 mt-1">Buscando...</p>}
      {results.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto">
          {results.map((result) => (
            <li
              key={result.id}
              onClick={() => handleSelect(result)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              {result.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
