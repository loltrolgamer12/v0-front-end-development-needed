import React, { useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import AutocompleteSearch from './AutocompleteSearch';

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  suggestions: {
    conductores: string[];
    vehiculos: string[];
    ubicaciones: string[];
  };
}

interface SearchFilters {
  query: string;
  conductor: string;
  vehiculo: string;
  ubicacion: string;
  fechaInicio?: string;
  fechaFin?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, suggestions }) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    conductor: '',
    vehiculo: '',
    ubicacion: ''
  });

  const handleSearch = useCallback((type: keyof SearchFilters, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [type]: value };
      onSearch(newFilters);
      return newFilters;
    });
  }, [onSearch]);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AutocompleteSearch
            label="Buscar"
            placeholder="Buscar conductor, placa, campo..."
            onSearch={(value) => handleSearch('query', value)}
            suggestions={[
              ...suggestions.conductores,
              ...suggestions.vehiculos,
              ...suggestions.ubicaciones
            ]}
          />
          <AutocompleteSearch
            label="Conductor"
            placeholder="Buscar conductor"
            onSearch={(value) => handleSearch('conductor', value)}
            suggestions={suggestions.conductores}
          />
          <AutocompleteSearch
            label="Vehículo"
            placeholder="Buscar por placa"
            onSearch={(value) => handleSearch('vehiculo', value)}
            suggestions={suggestions.vehiculos}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              title="Fecha de inicio"
              placeholder="Seleccione fecha de inicio"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onChange={(e) => handleSearch('fechaInicio', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              title="Fecha de fin"
              placeholder="Seleccione fecha de fin"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onChange={(e) => handleSearch('fechaFin', e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-500">
          <Search className="w-4 h-4 mr-2" />
          <span>
            Escriba para buscar y seleccione de las sugerencias
          </span>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;