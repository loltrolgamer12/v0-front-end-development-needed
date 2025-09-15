
import React, { useState, useMemo, useEffect } from 'react';
import { AlertTriangle, Filter, User, FileText, CheckCircle, Activity, BarChart3 } from 'lucide-react';
import SearchSelect from './SearchSelect';

export interface InspectionData {
  FECHA: string;
  CONDUCTOR: string;
  '¿Ha dormido al menos 7 horas en las últimas 24 horas?': string;
  '¿Se encuentra libre de síntomas de fatiga (Somnolencia, dolor de cabeza, irritabilidad)?': string;
  '¿Se siente en condiciones físicas y mentales para conducir?': string;
  '¿Ha consumido medicamentos o sustancias que afecten su estado de alerta?*': string;
}

interface FatigueData {
  fecha: string;
  conductor: string;
  horasSueno: boolean;
  sinSintomas: boolean;
  condicionesOptimas: boolean;
  sinSustancias: boolean;
  esFalla: boolean;
}

interface FatigueControlProps {
  inspectionData: InspectionData[];
}

const normalizeAnswer = (answer: string | undefined): boolean => {
  if (!answer || typeof answer !== 'string') {
    return false;
  }
  
  const positiveAnswers = ['sí', 'si', 's', 'yes', 'y', 'true', '1', 'verdadero', 'cumple'];
  return positiveAnswers.includes(answer.toLowerCase().trim());
};

const isFatigueFailure = (record: InspectionData): boolean => {
  return !normalizeAnswer(record['¿Ha dormido al menos 7 horas en las últimas 24 horas?']) ||
         !normalizeAnswer(record['¿Se encuentra libre de síntomas de fatiga (Somnolencia, dolor de cabeza, irritabilidad)?']) ||
         !normalizeAnswer(record['¿Se siente en condiciones físicas y mentales para conducir?']) ||
         normalizeAnswer(record['¿Ha consumido medicamentos o sustancias que afecten su estado de alerta?*']);
};

const FatigueControl: React.FC<FatigueControlProps> = ({ inspectionData }) => {
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [showFailures, setShowFailures] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    const savedDriver = localStorage.getItem('selectedDriver');
    const savedShowFailures = localStorage.getItem('showFailures');
    const savedShowDetails = localStorage.getItem('showDetails');

    if (savedDriver) setSelectedDriver(savedDriver);
    if (savedShowFailures) setShowFailures(savedShowFailures === 'true');
    if (savedShowDetails) setShowDetails(savedShowDetails === 'true');

    const handleUnload = () => {
      localStorage.clear();
      sessionStorage.clear();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        localStorage.clear();
        sessionStorage.clear();
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const getDrivers = useMemo(() => {
    const drivers = new Set<string>();
    inspectionData.forEach((record: InspectionData) => {
      if (record.CONDUCTOR) {
        drivers.add(record.CONDUCTOR);
      }
    });
    return Array.from(drivers);
  }, [inspectionData]);

  const mapRecordToFatigueData = (record: InspectionData): FatigueData => ({
    fecha: record.FECHA,
    conductor: record.CONDUCTOR,
    horasSueno: normalizeAnswer(record['¿Ha dormido al menos 7 horas en las últimas 24 horas?']),
    sinSintomas: normalizeAnswer(record['¿Se encuentra libre de síntomas de fatiga (Somnolencia, dolor de cabeza, irritabilidad)?']),
    condicionesOptimas: normalizeAnswer(record['¿Se siente en condiciones físicas y mentales para conducir?']),
    sinSustancias: !normalizeAnswer(record['¿Ha consumido medicamentos o sustancias que afecten su estado de alerta?*']),
    esFalla: isFatigueFailure(record)
  });

  const fatigueFailures = useMemo(() => 
    inspectionData
      .filter((record: InspectionData) => isFatigueFailure(record))
      .map(mapRecordToFatigueData),
    [inspectionData]
  );

  const driverFatigueData = useMemo(() => 
    selectedDriver
      ? inspectionData
          .filter((record: InspectionData) => record.CONDUCTOR === selectedDriver)
          .map(mapRecordToFatigueData)
      : [],
    [inspectionData, selectedDriver]
  );

  const handleDriverSelect = (driver: string) => {
    setSelectedDriver(driver);
    setShowFailures(false);
    setShowDetails(true);
    localStorage.setItem('selectedDriver', driver);
    localStorage.setItem('showFailures', 'false');
    localStorage.setItem('showDetails', 'true');
  };

  const calculateStats = () => {
    const total = inspectionData.length;
    const failures = fatigueFailures.length;
    const compliance = total > 0 ? ((total - failures) / total) * 100 : 0;
    
    return {
      total,
      failures,
      compliance
    };
  };

  const stats = calculateStats();

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Inspecciones</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="bg-blue-100 rounded-lg p-3">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Cumplimiento</p>
              <p className="text-2xl font-bold text-green-600">{stats.compliance.toFixed(1)}%</p>
              <p className="text-xs text-gray-400">
                {stats.compliance >= 95 ? 'Excelente' : 
                 stats.compliance >= 85 ? 'Bueno' : 'Requiere atención'}
              </p>
            </div>
            <div className="bg-green-100 rounded-lg p-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Fallas Detectadas</p>
              <p className="text-2xl font-bold text-red-600">{stats.failures}</p>
              <p className="text-xs text-gray-400">
                {((stats.failures / stats.total) * 100).toFixed(1)}% del total
              </p>
            </div>
            <div className="bg-red-100 rounded-lg p-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-500" />
          Actividad Reciente
        </h3>
        <div className="space-y-4">
          {fatigueFailures.slice(0, 5).map((failure: FatigueData, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center space-x-4">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-medium text-gray-800">{failure.conductor}</p>
                  <p className="text-sm text-gray-500">{failure.fecha}</p>
                </div>
              </div>
              <div className="text-red-600 text-sm font-medium">
                Falla detectada
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDrivers = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Lista de Conductores</h3>
        <div className="space-y-4">
          {getDrivers.map((driver: string) => {
            const driverRecords = inspectionData.filter((record: InspectionData) => record.CONDUCTOR === driver);
            const failureCount = driverRecords.filter(record => isFatigueFailure(record)).length;
            const compliance = driverRecords.length > 0 
              ? ((driverRecords.length - failureCount) / driverRecords.length) * 100 
              : 0;
            
            return (
              <div key={driver} 
                   className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                   onClick={() => handleDriverSelect(driver)}
                   role="button"
                   tabIndex={0}
                   onKeyPress={(e) => e.key === 'Enter' && handleDriverSelect(driver)}
                   aria-label={`${driver} - ${driverRecords.length} inspecciones, ${compliance.toFixed(1)}% cumplimiento`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <User className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-800">{driver}</p>
                      <p className="text-sm text-gray-500">
                        {driverRecords.length} inspecciones
                      </p>
                    </div>
                  </div>
                  <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                    compliance >= 95 ? 'bg-green-100 text-green-700' :
                    compliance >= 85 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {compliance.toFixed(1)}% cumplimiento
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img src="/logo.jpeg" alt="Logo" className="h-12" />
              <div>
                <h1 className="text-xl font-bold text-gray-800">Control de Fatiga</h1>
                <p className="text-sm text-gray-500">
                  {inspectionData.length} inspecciones totales
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-pressed={showFilters ? 'true' : 'false'}
              aria-label="Mostrar filtros"
              type="button">
              <Filter className="w-4 h-4 mr-2" aria-hidden="true" />
              Filtros
            </button>
          </div>

          <div className="flex space-x-1 py-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'conductores', label: 'Conductores', icon: User }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-current={activeTab === tab.id ? 'page' : undefined}>
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showFilters && (
          <div className="mb-6 bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <SearchSelect
                  options={getDrivers}
                  onSelect={handleDriverSelect}
                  placeholder="Buscar conductor..."
                  value={selectedDriver}
                />
              </div>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                onClick={() => {
                  setShowFailures(!showFailures);
                  setShowDetails(false);
                }}
                aria-pressed={showFailures ? 'true' : 'false'}
                type="button">
                {showFailures ? 'Ver Todos los Registros' : 'Ver Incumplimientos'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'conductores' && renderDrivers()}

        {showFailures && (
          <div className="mt-4 bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="font-bold mb-4 text-red-600 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Lista de Incumplimientos de Fatiga
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Conductor</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">7h Sueño</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Sin Síntomas</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Condiciones</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Medicamentos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {fatigueFailures.map((record: FatigueData, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="p-3 text-sm text-gray-500">{record.fecha}</td>
                      <td className="p-3 text-sm font-medium text-gray-800">{record.conductor}</td>
                      <td className={`p-3 text-sm ${!record.horasSueno ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {record.horasSueno ? 'Cumple' : 'No cumple'}
                      </td>
                      <td className={`p-3 text-sm ${!record.sinSintomas ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {record.sinSintomas ? 'Cumple' : 'No cumple'}
                      </td>
                      <td className={`p-3 text-sm ${!record.condicionesOptimas ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {record.condicionesOptimas ? 'Cumple' : 'No cumple'}
                      </td>
                      <td className={`p-3 text-sm ${!record.sinSustancias ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {record.sinSustancias ? 'Cumple' : 'No cumple'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showDetails && selectedDriver && (
          <div className="mt-4 bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-500" />
                Detalle del Conductor: {selectedDriver}
              </h3>
              <div className="text-sm text-gray-500">
                {driverFatigueData.length} inspecciones
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">7h Sueño</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Sin Síntomas</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Condiciones</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Medicamentos</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {driverFatigueData.map((record: FatigueData, index: number) => (
                    <tr key={index} className={`hover:bg-gray-50 ${record.esFalla ? 'bg-red-50' : ''}`}>
                      <td className="p-3 text-sm text-gray-500">{record.fecha}</td>
                      <td className={`p-3 text-sm ${!record.horasSueno ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {record.horasSueno ? 'Cumple' : 'No cumple'}
                      </td>
                      <td className={`p-3 text-sm ${!record.sinSintomas ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {record.sinSintomas ? 'Cumple' : 'No cumple'}
                      </td>
                      <td className={`p-3 text-sm ${!record.condicionesOptimas ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {record.condicionesOptimas ? 'Cumple' : 'No cumple'}
                      </td>
                      <td className={`p-3 text-sm ${!record.sinSustancias ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {record.sinSustancias ? 'Cumple' : 'No cumple'}
                      </td>
                      <td className={`p-3 text-sm font-medium ${record.esFalla ? 'text-red-600' : 'text-green-600'}`}>
                        {record.esFalla ? 'No cumple' : 'Cumple'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FatigueControl;