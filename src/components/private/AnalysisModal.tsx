'use client';

import { useState } from 'react';

interface AnalysisModalProps {
  documentId: string;
  documentName: string;
  isOpen: boolean;
  onClose: () => void;
}

const PREDEFINED_PROMPTS = {
  summary: 'Genera un resumen ejecutivo conciso de este documento.',
  key_dates: 'Extrae todas las fechas importantes, plazos o vencimientos mencionados en este documento y lístalos.',
  involved_parties: 'Identifica y lista a todas las personas, empresas u organizaciones mencionadas en este documento.',
};

export default function AnalysisModal({ documentId, documentName, isOpen, onClose }: AnalysisModalProps) {
  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAnalysis = async (prompt: string) => {
    if (!prompt) return;

    setIsLoading(true);
    setError(null);
    setAnalysisResult('');

    try {
      const response = await fetch('/api/ai/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, prompt }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error en el análisis');
      }
      setAnalysisResult(result.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-primary">Analizar Documento: {documentName}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>

        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold">Acciones Rápidas</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PREDEFINED_PROMPTS).map(([key, value]) => (
              <button
                key={key}
                onClick={() => handleAnalysis(value)}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200"
              >
                {value.split(' ')[0]}...
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold">Solicitud Personalizada</h3>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Ej: ¿Cuál es la fecha de vencimiento del contrato?"
          />
          <button
            onClick={() => handleAnalysis(customPrompt)}
            disabled={!customPrompt || isLoading}
            className="mt-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary disabled:bg-gray-400"
          >
            {isLoading ? 'Analizando...' : 'Enviar Solicitud'}
          </button>
        </div>

        <div className="border-t pt-4 flex-1 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-2">Resultado del Análisis</h3>
          <div className="bg-gray-50 p-4 rounded-md min-h-[150px] whitespace-pre-wrap">
            {isLoading && <p>Procesando...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {analysisResult && <p>{analysisResult}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
