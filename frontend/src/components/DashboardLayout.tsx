import React, { useState, useEffect } from 'react';
import { CircleDot, Download, LogOut, Upload, Clock } from 'lucide-react';
import SearchBar from './SearchBar';
import ProblematicItems from './ProblematicItems';
import ReportModal, { ReportParams } from './ReportModal';
import FatigueControlCard from './FatigueControlCard';
import FailuresSummary from './FailuresSummary';

interface DashboardLayoutProps {
  onLogout: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ onLogout }) => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState({
    conductores: ['Juan Pérez', 'María García', 'Carlos López'],
    vehiculos: ['ABC-123', 'XYZ-789', 'DEF-456'],
    ubicaciones: ['Campo A', 'Campo B', 'Campo C']
  });

  // Datos de ejemplo para los items que fallan y vehículos críticos
  const [failureData] = useState({
    failureItems: [
      {
        id: '1',
        name: '¿Ha consumido medicamentos o sustancias que afecten su estado de alerta?',
        failureCount: 2618,
        vehiclesAffected: ['FWX428', 'FWX437', 'LUQ-221']
      },
      {
        id: '2',
        name: 'Kit ambiental',
        failureCount: 1934,
        vehiclesAffected: ['FWX428', 'LJP105', 'LUQ-221']
      },
      {
        id: '3',
        name: 'Sistema de monitoreo GPS',
        failureCount: 1219,
        vehiclesAffected: ['FWX437', 'FWX428']
      }
    ],
    criticalVehicles: [
      {
        plate: 'FWX428',
        failureCount: 961,
        criticalFailures: 435,
        compliance: 92.1
      },
      {
        plate: 'FWX437',
        failureCount: 855,
        criticalFailures: 411,
        compliance: 91.8
      },
      {
        plate: 'WTP239',
        failureCount: 742,
        criticalFailures: 389,
        compliance: 90.5
      }
    ]
  });

  const [conductoresFatiga, setConductoresFatiga] = useState<Array<{
    nombre: string;
    ultimoDescanso: string;
    horasConducidas: number;
    horasDescanso: number;
    alertas: string[];
    riesgoFatiga: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
    ubicacionActual: string;
    vehiculo: string;
    turno: string;
  }>>([
    {
      nombre: 'Hector Hernan Acevedo luna',
      ultimoDescanso: '14:30',
      horasConducidas: 9.5,
      horasDescanso: 4,
      alertas: [
        'Excede límite recomendado de horas conducidas',
        'Descanso insuficiente en último turno'
      ],
      riesgoFatiga: 'Alto',
      ubicacionActual: 'Ruta A4 - Km 127',
      vehiculo: 'ABC-123',
      turno: 'Diurno (06:00 - 18:00)'
    },
    {
      nombre: 'Sebastian rivas camacho',
      ultimoDescanso: '12:15',
      horasConducidas: 11,
      horasDescanso: 2,
      alertas: [
        'Riesgo crítico de fatiga',
        'Requiere descanso inmediato',
        'Excede máximo de horas permitidas'
      ],
      riesgoFatiga: 'Crítico',
      ubicacionActual: 'Terminal Norte',
      vehiculo: 'XYZ-789',
      turno: 'Nocturno (18:00 - 06:00)'
    },
    {
      nombre: 'Yesid García Rodriguez',
      ultimoDescanso: '16:45',
      horasConducidas: 6.5,
      horasDescanso: 6,
      alertas: [],
      riesgoFatiga: 'Bajo',
      ubicacionActual: 'Ruta B7 - Km 45',
      vehiculo: 'DEF-456',
      turno: 'Diurno (06:00 - 18:00)'
    }
  ]);

  const [problematicItems, setProblematicItems] = useState([
    {
      id: 1,
      name: 'Cinturón de seguridad',
      count: '15',
      percentage: 25,
      vehicles: [
        { plate: 'ABC-123', lastInspection: '2024-01-15', status: 'Crítico' },
        { plate: 'XYZ-789', lastInspection: '2024-01-16', status: 'Crítico' }
      ]
    },
    {
      id: 2,
      name: 'Luces delanteras',
      count: '12',
      percentage: 20,
      vehicles: [
        { plate: 'DEF-456', lastInspection: '2024-01-14', status: 'Alto' }
      ]
    },
    {
      id: 3,
      name: 'Frenos',
      count: '8',
      percentage: 15,
      vehicles: [
        { plate: 'ABC-123', lastInspection: '2024-01-13', status: 'Alto' }
      ]
    }
  ]);

  const handleSearch = (filters: any) => {
    console.log('Aplicando filtros:', filters);
    // Aquí implementaremos la lógica de filtrado
  };

  const handleFileUpload = () => {
    // Implementar lógica de carga de archivos
  };

  const handleGenerateReport = (params: ReportParams) => {
    console.log('Generando informe con parámetros:', params);
    // TODO: Implementar lógica de generación de informes
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <img
                src="/logo.png"
                alt="Logo Inspector Vehicular"
                className="h-10 w-auto"
              />
              <h1 className="ml-4 text-2xl font-semibold text-gray-900">
                Inspector Vehicular
              </h1>
            </div>
            <button
              onClick={onLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Barra de búsqueda */}
          <SearchBar onSearch={handleSearch} suggestions={searchSuggestions} />

          {/* Acciones */}
          <div className="flex space-x-4">
            <button
              onClick={handleFileUpload}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              title="Cargar archivo de inspección"
            >
              <Upload className="w-4 h-4 mr-2" />
              Cargar Archivo
            </button>
            <button
              onClick={() => setShowReportModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              title="Generar informe"
            >
              <Download className="w-4 h-4 mr-2" />
              Generar Informe
            </button>
            
            {/* Modal de Generación de Informes */}
            <ReportModal
              isOpen={showReportModal}
              onClose={() => setShowReportModal(false)}
              onGenerate={handleGenerateReport}
            />
          </div>

          {/* Estado General */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center">
                <CircleDot className="w-8 h-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Vehículos Inspeccionados
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">128</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center">
                <CircleDot className="w-8 h-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Alertas Pendientes
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">23</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center">
                <CircleDot className="w-8 h-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Ítems Críticos
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">7</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ítems Problemáticos */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Ítems más Problemáticos
              </h2>
              <ProblematicItems items={problematicItems} />
            </div>
          </div>

          {/* Resumen de Fallas y Vehículos Críticos */}
          <FailuresSummary
            failureItems={failureData.failureItems}
            criticalVehicles={failureData.criticalVehicles}
          />

          {/* Control de Fatiga */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Control de Fatiga
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    Actualizado hace 5 minutos
                  </span>
                  <Clock className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              
              <div className="space-y-6">
                {conductoresFatiga.map((conductor, index) => (
                  <FatigueControlCard key={index} conductor={conductor} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;