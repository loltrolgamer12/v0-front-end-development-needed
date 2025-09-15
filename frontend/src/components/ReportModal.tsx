import React, { useState } from 'react';
import { X, FileSpreadsheet, FileCheck } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (params: ReportParams) => void;
}

export interface ReportParams {
  month: string;
  year: string;
  format: 'pdf' | 'excel';
  includeCharts: boolean;
  includeTables: boolean;
  includeAnalysis: boolean;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, onGenerate }) => {
  const [params, setParams] = useState<ReportParams>({
    month: new Date().toLocaleString('es', { month: 'long' }),
    year: new Date().getFullYear().toString(),
    format: 'pdf',
    includeCharts: true,
    includeTables: true,
    includeAnalysis: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(params);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Generar Informe
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mes
              </label>
              <select
                value={params.month}
                onChange={(e) => setParams({ ...params, month: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                title="Seleccionar mes"
              >
                {[
                  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
                ].map((month) => (
                  <option key={month} value={month}>
                    {month.charAt(0).toUpperCase() + month.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Año
              </label>
              <select
                value={params.year}
                onChange={(e) => setParams({ ...params, year: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                title="Seleccionar año"
              >
                {[2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Formato
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setParams({ ...params, format: 'pdf' })}
                className={`flex items-center justify-center px-4 py-2 border rounded-lg ${
                  params.format === 'pdf'
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <FileCheck className="w-5 h-5 mr-2" />
                PDF
              </button>
              <button
                type="button"
                onClick={() => setParams({ ...params, format: 'excel' })}
                className={`flex items-center justify-center px-4 py-2 border rounded-lg ${
                  params.format === 'excel'
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 mr-2" />
                Excel
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeCharts"
                checked={params.includeCharts}
                onChange={(e) =>
                  setParams({ ...params, includeCharts: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label
                htmlFor="includeCharts"
                className="ml-2 block text-sm text-gray-700"
              >
                Incluir gráficos y estadísticas
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeTables"
                checked={params.includeTables}
                onChange={(e) =>
                  setParams({ ...params, includeTables: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label
                htmlFor="includeTables"
                className="ml-2 block text-sm text-gray-700"
              >
                Incluir tablas detalladas
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeAnalysis"
                checked={params.includeAnalysis}
                onChange={(e) =>
                  setParams({ ...params, includeAnalysis: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label
                htmlFor="includeAnalysis"
                className="ml-2 block text-sm text-gray-700"
              >
                Incluir análisis y recomendaciones
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Generar Informe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;