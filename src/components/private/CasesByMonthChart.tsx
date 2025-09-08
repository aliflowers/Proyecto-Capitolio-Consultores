'use client'

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CaseData {
  month: string;
  count: number;
}

export default function CasesByMonthChart() {
  const [data, setData] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCasesByMonth() {
      try {
        const response = await fetch('/api/metrics/cases-by-month');
        const result = await response.json();

        if (response.ok) {
          setData(result.data);
        } else {
          setError(result.error || 'Error desconocido al cargar datos del gráfico');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de red o desconocido');
      } finally {
        setLoading(false);
      }
    }

    fetchCasesByMonth();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-gray-500">
        Cargando datos del gráfico...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-red-500">
        Error al cargar el gráfico: {error}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Casos Creados por Mes</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{
          top: 5, right: 30, left: 20, bottom: 5,
        }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" name="Número de Casos" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
