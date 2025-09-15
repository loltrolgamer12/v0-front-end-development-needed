import React, { useState } from 'react';
import {
  AlertTriangle,
  BarChart2,
  PieChart,
  Calendar,
  Download,
  Filter,
  Info,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface CriticalItemsAnalysisProps {
  data: {
    conductores: number;
    vehiculos: number;
    ubicaciones: number;
    items: number;
  };
}

const CriticalItemsAnalysis: React.FC<CriticalItemsAnalysisProps> = ({ data }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [sortBy, setSortBy] = useState<'frequency' | 'impact' | 'trend'>('frequency');

  return (
    <div className="space-y-8">
      {/* Header y Filtros */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Análisis de Items Críticos
          </h1>
          <button
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            title="Exportar análisis"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Análisis
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-red-600">Items Críticos</p>
                <p className="text-2xl font-semibold text-red-900">42</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +5%
              </span>
            </div>
            <p className="text-sm text-red-500">items de inspección</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-orange-600">Fallas Críticas</p>
                <p className="text-2xl font-semibold text-orange-900">5,462</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                <ArrowDownRight className="w-3 h-3 mr-1" />
                -2%
              </span>
            </div>
            <p className="text-sm text-orange-500">en el período</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-yellow-600">Total Fallas</p>
                <p className="text-2xl font-semibold text-yellow-900">14,547</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <ArrowDownRight className="w-3 h-3 mr-1" />
                -8%
              </span>
            </div>
            <p className="text-sm text-yellow-500">en el período</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-green-600">Cumplimiento</p>
                <p className="text-2xl font-semibold text-green-900">98.64%</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +1.2%
              </span>
            </div>
            <p className="text-sm text-green-500">promedio general</p>
          </div>
        </div>
      </div>

      {/* Controles de Análisis */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                timeRange === '7d'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Última Semana
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                timeRange === '30d'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Último Mes
            </button>
            <button
              onClick={() => setTimeRange('90d')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                timeRange === '90d'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Último Trimestre
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="border-gray-300 rounded-md text-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              title="Ordenar por"
            >
              <option value="frequency">Frecuencia</option>
              <option value="impact">Impacto</option>
              <option value="trend">Tendencia</option>
            </select>
          </div>
        </div>

        {/* Análisis Visual */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4 h-80">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Distribución de Fallas Críticas
            </h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <PieChart className="w-8 h-8" />
              <span className="ml-2">Gráfico circular de distribución</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 h-80">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Top 10 Items Críticos
            </h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <BarChart2 className="w-8 h-8" />
              <span className="ml-2">Gráfico de barras horizontal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Items Críticos */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Items Críticos Detallados
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100"
            >
              <div className="flex items-center space-x-4">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Item Crítico #{item}
                  </h3>
                  <p className="text-sm text-gray-500">
                    238 vehículos afectados
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-red-600">2,618 fallas</p>
                  <p className="text-xs text-gray-500">Último reporte: hoy</p>
                </div>
                <button
                  className="flex items-center px-3 py-1 text-sm text-red-600 hover:bg-red-100 rounded-md"
                  title="Ver más información"
                >
                  <Info className="w-4 h-4 mr-1" />
                  Detalles
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendario de Eventos Críticos */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Calendario de Eventos Críticos
        </h2>
        <div className="flex items-center justify-center text-gray-500 h-96">
          <Calendar className="w-8 h-8" />
          <span className="ml-2">Calendario de eventos críticos</span>
        </div>
      </div>
    </div>
  );
};

export default CriticalItemsAnalysis;