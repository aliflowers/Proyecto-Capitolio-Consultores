'use client'

import { useState } from 'react'

type SearchResult = {
  id: string;
  document_id: string;
  content: string;
  similarity: number;
};

export default function SemanticSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query) return

    setLoading(true)
    setError(null)
    setResults([])

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Something went wrong')
      }

      const data = await response.json()
      setResults(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded-md bg-slate-50">
      <form onSubmit={handleSearch} className="flex items-center space-x-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar en documentos usando lenguaje natural..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400 hover:bg-indigo-700 transition-colors"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {error && <p className="text-red-500">Error: {error}</p>}

      <div className="space-y-4">
        {results.length > 0 ? (
          results.map((result) => (
            <div key={result.id} className="p-4 border rounded-md bg-white shadow">
              <p className="text-gray-800">{result.content}</p>
              <p className="text-sm text-gray-500 mt-2">
                Relevancia: {Math.round(result.similarity * 100)}%
              </p>
            </div>
          ))
        ) : (
          !loading && <p className="text-gray-500">Los resultados de la búsqueda aparecerán aquí.</p>
        )}
      </div>
    </div>
  )
}
