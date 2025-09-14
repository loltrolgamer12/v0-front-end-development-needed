import React from 'react';
import { Filter, Search } from 'lucide-react';
import type { Filters } from '../../context/DataContext';

interface DateRange {
  start: string;
  end: string;
}

interface FilterOption {
  value: string;
  label: string;
  count?: number;
  status?: 'active' | 'inactive';
  lastInspection?: string;
}

interface AdvancedFiltersProps {
  filters: Filters;
  options: {
    inspectors: FilterOption[];
    vehicles: FilterOption[];
    locations: FilterOption[];
    contracts: FilterOption[];
    shifts: FilterOption[];
    years: FilterOption[];
    status: FilterOption[];
    riskLevels: FilterOption[];
  };
  onFilterChange: (key: keyof Filters, value: string | number | boolean | DateRange) => void;
  onSearchSubmit: (searchText: string) => void;
  onClearFilters: () => void;
  totalResults: number;
  totalItems: number;
  showFilters: boolean;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  options,
  onFilterChange,
  onSearchSubmit,
  onClearFilters,
  totalResults,
  totalItems,
  showFilters
}) => {
  const [searchText, setSearchText] = React.useState(filters.search);

  const handleSearch = () => {
    onSearchSubmit(searchText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (!showFilters) return null;

  return (
    <div className="bg-white rounded-lg border p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
          <div className="flex">
            <input
              type="text"
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Buscar conductor, placa, campo..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleSearch}
              className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 border border-blue-600"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nivel de Riesgo y Estado */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de Riesgo</label>
            <select
              value={filters.riskLevel}
              onChange={(e) => onFilterChange('riskLevel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los niveles</option>
              {options.riskLevels.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} {option.count ? `(${option.count})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los estados</option>
              {options.status.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} {option.count ? `(${option.count})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ordenamiento */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">Fecha</option>
              <option value="compliance">Cumplimiento</option>
              <option value="criticalFailures">Fallas Críticas</option>
              <option value="inspector">Inspector</option>
              <option value="vehicle">Vehículo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
            <select
              value={filters.sortOrder}
              onChange={(e) => onFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="desc">Descendente</option>
              <option value="asc">Ascendente</option>
            </select>
          </div>
        </div>

        {/* Rango de Fechas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rango de Fechas</label>
          <div className="flex space-x-2">
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => onFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => onFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Inspector Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Conductor/Inspector</label>
          <select
            value={filters.inspector}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onFilterChange('inspector', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los conductores</option>
            {options.inspectors.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* More filter controls... */}
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t col-span-full">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.criticalItemsOnly}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFilterChange('criticalItemsOnly', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Solo fallas críticas</span>
            </label>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={onClearFilters}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Limpiar Filtros
            </button>
            
            <div className="px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-md border border-blue-200">
              {totalResults} resultados
              {totalResults !== totalItems && ` de ${totalItems} totales`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilters;