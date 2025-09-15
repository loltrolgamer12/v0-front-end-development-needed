import React, { useState } from 'react';
import {
  LineChart,
  BarChart,
  Calendar,
  AlertTriangle,
  Filter,
  Map,
  Download
} from 'lucide-react';

interface TrendsAnalysisProps {
  data: {
    conductores: number;
    vehiculos: number;
    ubicaciones: number;
    items: number;
  };
}

const TrendsAnalysis: React.FC<TrendsAnalysisProps> = ({ data }) => {
  const [selectedView, setSelectedView] = useState<'diario' | 'semanal' | 'mensual'>('diario');
  const [selectedMetric, setSelectedMetric] = useState<'cumplimiento' | 'fallas' | 'criticidad'>('cumplimiento');

  return (
    <div className="space-y-8">
      {/* Header y Filtros */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Análisis de Tendencias Temporales
          </h1>
          <button
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Análisis
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-600">Conductores</p>
            <p className="text-2xl font-semibold text-blue-900">{data.conductores}</p>
            <p className="text-sm text-blue-500">conductores únicos</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm font-medium text-green-600">Vehículos</p>
            <p className="text-2xl font-semibold text-green-900">{data.vehiculos}</p>
            <p className="text-sm text-green-500">vehículos únicos</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm font-medium text-purple-600">Ubicaciones</p>
            <p className="text-2xl font-semibold text-purple-900">{data.ubicaciones}</p>
            <p className="text-sm text-purple-500">ubicaciones activas</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-600">Items</p>
            <p className="text-2xl font-semibold text-yellow-900">{data.items}</p>
            <p className="text-sm text-yellow-500">items de inspección</p>
          </div>
        </div>
      </div>

      {/* Controles de Vista */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setSelectedView('diario')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedView === 'diario'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Vista Diaria
            </button>
            <button
              onClick={() => setSelectedView('semanal')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedView === 'semanal'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Vista Semanal
            </button>
            <button
              onClick={() => setSelectedView('mensual')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedView === 'mensual'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Vista Mensual
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="border-gray-300 rounded-md text-sm"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              aria-label="Seleccionar métrica"
              title="Seleccionar métrica para el análisis"
            >
              <option value="cumplimiento">% Cumplimiento</option>
              <option value="fallas">Fallas Totales</option>
              <option value="criticidad">Nivel de Criticidad</option>
            </select>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4 h-80">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Tendencia de {selectedMetric === 'cumplimiento' ? 'Cumplimiento' : selectedMetric === 'fallas' ? 'Fallas' : 'Criticidad'}
            </h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <LineChart className="w-8 h-8" />
              <span className="ml-2">Gráfico de tendencia temporal</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 h-80">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Distribución por {selectedMetric === 'cumplimiento' ? 'Rango' : 'Categoría'}
            </h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <BarChart className="w-8 h-8" />
              <span className="ml-2">Gráfico de distribución</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendario de Eventos */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Calendario de Eventos
          </h2>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Eventos Críticos
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Mantenimientos
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Inspecciones OK
            </span>
          </div>
        </div>
        <div className="flex items-center justify-center text-gray-500 h-96">
          <Calendar className="w-8 h-8" />
          <span className="ml-2">Calendario interactivo de eventos</span>
        </div>
      </div>

      {/* Mapa de Calor */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Mapa de Calor por Ubicación
        </h2>
        <div className="flex items-center justify-center text-gray-500 h-96">
          <Map className="w-8 h-8" />
          <span className="ml-2">Mapa interactivo con distribución de eventos</span>
        </div>
      </div>
    </div>
  );
};

export default TrendsAnalysis;