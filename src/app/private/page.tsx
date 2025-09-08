'use client'

import { useState, useEffect } from 'react';
import { FaFolderOpen, FaFileAlt, FaUsers, FaTasks } from 'react-icons/fa'; // Iconos para las métricas
import CasesByMonthChart from '@/components/private/CasesByMonthChart'; // Importar el nuevo componente de gráfico

interface Metrics {
  totalCases: number;
  openCases: number;
  totalDocuments: number;
  totalClients: number;
  pendingTasks: number;
}

export default function PrivateRootPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch('/api/metrics/summary');
        const data = await response.json();

        if (response.ok) {
          setMetrics(data.data);
        } else {
          setError(data.error || 'Error desconocido al cargar métricas');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de red o desconocido');
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="w-full p-8 text-center text-gray-500">
        Cargando métricas del dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-8 text-center text-red-500">
        Error al cargar el dashboard: {error}
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">Dashboard Principal</h1>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title="Casos Totales" 
          value={metrics?.totalCases || 0} 
          icon={<FaFolderOpen className="text-blue-500" />} 
        />
        <MetricCard 
          title="Documentos Totales" 
          value={metrics?.totalDocuments || 0} 
          icon={<FaFileAlt className="text-green-500" />} 
        />
        <MetricCard 
          title="Clientes Totales" 
          value={metrics?.totalClients || 0} 
          icon={<FaUsers className="text-purple-500" />} 
        />
        <MetricCard 
          title="Tareas Pendientes" 
          value={metrics?.pendingTasks || 0} 
          icon={<FaTasks className="text-orange-500" />} 
        />
      </div>

      {/* Sección de Gráficos */}
      <div className="mt-8">
        <CasesByMonthChart />
      </div>
    </div>
  );
}

// Componente auxiliar para las tarjetas de métricas
function MetricCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-light p-6 rounded-lg shadow-md flex items-center space-x-4">
      <div className="text-4xl">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">{title}</h3>
        <p className="text-3xl font-bold text-gray-800 dark:text-white">{value}</p>
      </div>
    </div>
  );
}
