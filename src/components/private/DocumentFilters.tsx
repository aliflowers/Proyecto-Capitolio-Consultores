'use client';

import { useState } from 'react';
import Combobox from './Combobox';
import FilterCombobox from './FilterCombobox';

const documentTypes = {
  contrato_arrendamiento: 'Contrato de Arrendamiento',
  contrato_compra_venta: 'Contrato de Compra-Venta',
  sentencia_tribunal: 'Sentencia de Tribunal',
  documento_privado: 'Documento Privado',
  documento_publico: 'Documento Público',
  otro: 'Otro',
};

interface FilterState {
  name: string;
  document_type: string;
  date_from: string;
  date_to: string;
  expediente_id: string;
  client_id: string;
}

interface DocumentFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export default function DocumentFilters({ onFilterChange }: DocumentFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    name: '',
    document_type: '',
    date_from: '',
    date_to: '',
    expediente_id: '',
    client_id: '',
  });

  const handleInputChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange(filters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      name: '',
      document_type: '',
      date_from: '',
      date_to: '',
      expediente_id: '',
      client_id: '',
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  return (
    <form onSubmit={handleFilterSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Filtro por Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre del Documento</label>
          <input
            type="text"
            value={filters.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Buscar por nombre..."
          />
        </div>

        {/* Filtro por Tipo de Documento */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo de Documento</label>
          <select
            value={filters.document_type}
            onChange={(e) => handleInputChange('document_type', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Todos</option>
            {Object.entries(documentTypes).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
        </div>

        {/* Filtro por Cliente */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Cliente Asociado</label>
          <FilterCombobox
            searchUrl="/api/search/clients"
            placeholder="Buscar por cliente..."
            onSelectionChange={(id) => handleInputChange('client_id', id || '')}
          />
        </div>

        {/* Filtro por Expediente */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Expediente Asociado</label>
          <FilterCombobox
            searchUrl="/api/search/expedientes"
            placeholder="Buscar por expediente..."
            onSelectionChange={(id) => handleInputChange('expediente_id', id || '')}
          />
        </div>

        {/* Filtro por Rango de Fechas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Desde</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleInputChange('date_from', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Hasta</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleInputChange('date_to', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={handleClearFilters}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
        >
          Limpiar Filtros
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary transition-colors"
        >
          Filtrar
        </button>
      </div>
    </form>
  );
}
