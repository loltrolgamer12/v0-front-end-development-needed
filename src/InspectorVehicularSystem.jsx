import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Upload, LogOut, Search, Filter, Download, Eye, EyeOff, 
  BarChart3, PieChart, TrendingUp, Users, Car, AlertTriangle,
  Calendar, MapPin, Clock, Building, ChevronDown, X, FileText,
  Shield, CheckCircle, XCircle, AlertCircle, Target, Loader2,
  ArrowUpDown, TrendingDown, Award, Zap, Settings, RefreshCw,
  User, Activity, Flag, Gauge
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter,
  AreaChart, Area, ComposedChart
} from 'recharts';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const InspectorVehicularSystem = () => {
  // Estados principales
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [sessionTimeout, setSessionTimeout] = useState(null);
  
  // Estados de datos
  const [rawData, setRawData] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  // Estados de UI y filtros
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filters, setFilters] = useState({
    search: '',
    inspector: '',
    vehicle: '',
    location: '',
    contract: '',
    shift: '',
    year: '',
    month: '',
    day: '',
    complianceMin: 0,
    complianceMax: 100,
    dateStart: '',
    dateEnd: '',
    riskLevel: '',
    criticalItemsOnly: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  
  // Colores del sistema
  const colors = {
    primary: '#2563eb',
    success: '#10b981',
    warning: '#f59e0b', 
    danger: '#ef4444',
    critical: '#dc2626',
    info: '#06b6d4',
    gray: '#6b7280'
  };

  // Datos filtrados
  const filteredData = useMemo(() => {
    if (!processedData) return null;
    
    let filtered = [...processedData.inspections];
    
    // Búsqueda global
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(insp => 
        (insp.inspector && insp.inspector.toLowerCase().includes(searchTerm)) ||
        (insp.vehicle && insp.vehicle.toLowerCase().includes(searchTerm)) ||
        (insp.location && insp.location.toLowerCase().includes(searchTerm)) ||
        (insp.contract && insp.contract.toLowerCase().includes(searchTerm)) ||
        (insp.observations && insp.observations.toLowerCase().includes(searchTerm))
      );
    }
    
    // Filtros específicos
    if (filters.inspector && filters.inspector !== '') {
      filtered = filtered.filter(insp => insp.inspector === filters.inspector);
    }
    if (filters.vehicle && filters.vehicle !== '') {
      filtered = filtered.filter(insp => insp.vehicle === filters.vehicle);
    }
    if (filters.location && filters.location !== '') {
      filtered = filtered.filter(insp => insp.location === filters.location);
    }
    if (filters.contract && filters.contract !== '') {
      filtered = filtered.filter(insp => insp.contract === filters.contract);
    }
    if (filters.shift && filters.shift !== '') {
      filtered = filtered.filter(insp => insp.shift === filters.shift);
    }
    if (filters.riskLevel && filters.riskLevel !== '') {
      filtered = filtered.filter(insp => insp.riskLevel === filters.riskLevel);
    }
    
    // Filtros por fecha
    if (filters.year && filters.year !== '') {
      filtered = filtered.filter(insp => {
        if (!insp.timestamp) return false;
        try {
          const date = new Date(insp.timestamp);
          if (isNaN(date.getTime())) return false;
          return date.getFullYear().toString() === filters.year;
        } catch {
          return false;
        }
      });
    }
    
    if (filters.month && filters.month !== '') {
      filtered = filtered.filter(insp => {
        if (!insp.timestamp) return false;
        try {
          const date = new Date(insp.timestamp);
          if (isNaN(date.getTime())) return false;
          return (date.getMonth() + 1).toString() === filters.month;
        } catch {
          return false;
        }
      });
    }
    
    if (filters.day && filters.day !== '') {
      filtered = filtered.filter(insp => {
        if (!insp.timestamp) return false;
        try {
          const date = new Date(insp.timestamp);
          if (isNaN(date.getTime())) return false;
          return date.getDate().toString() === filters.day;
        } catch {
          return false;
        }
      });
    }
    
    // Filtro por rango de cumplimiento
    filtered = filtered.filter(insp => 
      insp.compliance >= filters.complianceMin && 
      insp.compliance <= filters.complianceMax
    );
    
    // Filtro de items críticos
    if (filters.criticalItemsOnly) {
      filtered = filtered.filter(insp => insp.criticalFailures > 0);
    }
    
    // Filtros por rango de fechas
    if (filters.dateStart || filters.dateEnd) {
      filtered = filtered.filter(insp => {
        if (!insp.timestamp) return false;
        try {
          const inspDate = new Date(insp.timestamp);
          if (isNaN(inspDate.getTime())) return false;
          
          const startDate = filters.dateStart ? new Date(filters.dateStart) : new Date('1900-01-01');
          const endDate = filters.dateEnd ? new Date(filters.dateEnd) : new Date('2100-12-31');
          
          return inspDate >= startDate && inspDate <= endDate;
        } catch {
          return false;
        }
      });
    }
    
    return filtered;
  }, [processedData, filters]);

  // Componente Modal para detalles de items problemáticos
  const ItemDetailModal = () => {
    if (!selectedItemDetail || !showItemModal || !processedData) return null;

    // Filtrar inspecciones que tuvieron falla en este item específico
    const itemFailures = processedData.inspections.filter(insp => {
      const itemData = insp.items[selectedItemDetail.name];
      return itemData && !itemData.compliant;
    });

    // Analizar vehículos afectados
    const affectedVehicles = {};
    const affectedConductors = {};
    const timelineData = [];

    itemFailures.forEach(insp => {
      // Análisis por vehículo
      if (!affectedVehicles[insp.vehicle]) {
        affectedVehicles[insp.vehicle] = {
          plate: insp.vehicle,
          failureCount: 0,
          lastFailure: null,
          conductors: new Set(),
          locations: new Set()
        };
      }
      affectedVehicles[insp.vehicle].failureCount++;
      affectedVehicles[insp.vehicle].conductors.add(insp.inspector);
      affectedVehicles[insp.vehicle].locations.add(insp.location);
      if (insp.timestamp) {
        const date = new Date(insp.timestamp);
        if (!affectedVehicles[insp.vehicle].lastFailure || date > affectedVehicles[insp.vehicle].lastFailure) {
          affectedVehicles[insp.vehicle].lastFailure = date;
        }
      }

      // Análisis por conductor
      if (!affectedConductors[insp.inspector]) {
        affectedConductors[insp.inspector] = {
          name: insp.inspector,
          failureCount: 0,
          vehicles: new Set(),
          locations: new Set()
        };
      }
      affectedConductors[insp.inspector].failureCount++;
      affectedConductors[insp.inspector].vehicles.add(insp.vehicle);
      affectedConductors[insp.inspector].locations.add(insp.location);

      // Timeline data
      if (insp.timestamp) {
        timelineData.push({
          date: insp.timestamp,
          vehicle: insp.vehicle,
          conductor: insp.inspector,
          location: insp.location
        });
      }
    });

    const vehicleList = Object.values(affectedVehicles).sort((a, b) => b.failureCount - a.failureCount);
    const conductorList = Object.values(affectedConductors).sort((a, b) => b.failureCount - a.failureCount);
    const sortedTimeline = timelineData.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                {selectedItemDetail.isCritical && (
                  <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
                )}
                Detalle: {selectedItemDetail.name}
              </h2>
              <p className="text-gray-600 mt-1">
                {selectedItemDetail.nonCompliant} fallas de {selectedItemDetail.total} inspecciones 
                ({selectedItemDetail.failureRate.toFixed(1)}% tasa de falla)
              </p>
            </div>
            <button
              onClick={() => setShowItemModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Estadísticas generales */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-3">Resumen de Fallas</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-red-700 font-medium">Total de Fallas:</span>
                    <div className="text-2xl font-bold text-red-800">{itemFailures.length}</div>
                  </div>
                  <div>
                    <span className="text-red-700 font-medium">Vehículos Afectados:</span>
                    <div className="text-2xl font-bold text-red-800">{vehicleList.length}</div>
                  </div>
                  <div>
                    <span className="text-red-700 font-medium">Conductores Involucrados:</span>
                    <div className="text-2xl font-bold text-red-800">{conductorList.length}</div>
                  </div>
                  <div>
                    <span className="text-red-700 font-medium">Tipo de Item:</span>
                    <div className="text-lg font-bold text-red-800">
                      {selectedItemDetail.isCritical ? 'CRÍTICO' : 'Estándar'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Impacto operacional */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-3">Impacto Operacional</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Ubicaciones Afectadas:</span>
                    <span className="font-semibold text-blue-800">
                      {[...new Set(itemFailures.map(f => f.location))].length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Tasa de Falla:</span>
                    <span className="font-semibold text-blue-800">
                      {selectedItemDetail.failureRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Frecuencia:</span>
                    <span className="font-semibold text-blue-800">
                      {itemFailures.length > 100 ? 'Muy Alta' : 
                       itemFailures.length > 50 ? 'Alta' : 
                       itemFailures.length > 20 ? 'Media' : 'Baja'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Vehículos más afectados */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Car className="w-5 h-5 mr-2 text-red-500" />
                  Todos los Vehículos Afectados ({vehicleList.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {vehicleList.map((vehicle, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{vehicle.plate}</div>
                        <div className="text-xs text-gray-600">
                          {vehicle.conductors.size} conductores • {vehicle.locations.size} ubicaciones
                        </div>
                        <div className="text-xs text-gray-500">
                          Última falla: {vehicle.lastFailure ? 
                            vehicle.lastFailure.toLocaleDateString('es-CO') : 'N/A'}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          Conductores: {Array.from(vehicle.conductors).slice(0, 3).join(', ')}
                          {vehicle.conductors.size > 3 && ` (+${vehicle.conductors.size - 3} más)`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-600">{vehicle.failureCount}</div>
                        <div className="text-xs text-red-500">fallas</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {vehicleList.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay vehículos con fallas en este item</p>
                  </div>
                )}
              </div>

              {/* Conductores más involucrados */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-orange-500" />
                  Todos los Conductores Involucrados ({conductorList.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {conductorList.map((conductor, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{conductor.name}</div>
                        <div className="text-xs text-gray-600">
                          {conductor.vehicles.size} vehículos • {conductor.locations.size} ubicaciones
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          Vehículos: {Array.from(conductor.vehicles).slice(0, 3).join(', ')}
                          {conductor.vehicles.size > 3 && ` (+${conductor.vehicles.size - 3} más)`}
                        </div>
                        <div className="text-xs text-purple-600">
                          Ubicaciones: {Array.from(conductor.locations).slice(0, 2).join(', ')}
                          {conductor.locations.size > 2 && ` (+${conductor.locations.size - 2} más)`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-orange-600">{conductor.failureCount}</div>
                        <div className="text-xs text-orange-500">fallas</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {conductorList.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay conductores involucrados en este item</p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline reciente */}
            <div className="mt-6 bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-500" />
                Fallas Recientes (Últimas 20)
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sortedTimeline.map((event, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="text-sm font-medium text-gray-800">
                        {new Date(event.date).toLocaleDateString('es-CO')}
                      </div>
                      <div className="text-sm text-blue-600">{event.vehicle}</div>
                      <div className="text-sm text-gray-600">{event.conductor}</div>
                    </div>
                    <div className="text-xs text-gray-500">{event.location}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones recomendadas */}
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Acciones Recomendadas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-yellow-700 mb-2">Mantenimiento Preventivo:</h4>
                  <ul className="list-disc list-inside space-y-1 text-yellow-800">
                    {vehicleList.slice(0, 3).map(v => (
                      <li key={v.plate}>Revisar {selectedItemDetail.name} en {v.plate}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-yellow-700 mb-2">Capacitación:</h4>
                  <ul className="list-disc list-inside space-y-1 text-yellow-800">
                    {conductorList.slice(0, 3).map(c => (
                      <li key={c.name}>Capacitar a {c.name} en verificación de {selectedItemDetail.name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Función para abrir modal de detalle
  const openItemDetail = (item) => {
    setSelectedItemDetail(item);
    setShowItemModal(true);
  };

  // Función auxiliar para obtener nombre del mes
  const getMonthName = (month) => {
    const months = [
      '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month] || '';
  };

  // Componente de Login
  const LoginForm = () => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
      if (loginAttempts >= 3) {
        setError('Máximo 3 intentos alcanzado. Recargue la página.');
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        if (password === 'InspectorVehicular2024!') {
          setIsAuthenticated(true);
          setSessionTimeout(Date.now() + 8 * 60 * 60 * 1000);
        } else {
          setLoginAttempts(prev => prev + 1);
          setError('Clave incorrecta. Intento ' + (loginAttempts + 1) + ' de 3.');
        }
      } catch (err) {
        setError('Error en la autenticación');
      }
      
      setIsLoading(false);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-blue-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Shield className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Inspector Vehicular</h1>
            <p className="text-gray-600 mt-2">Sistema de Análisis v2.0</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clave de Acceso
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ingrese la clave del sistema"
                  disabled={loginAttempts >= 3}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={!password || isLoading || loginAttempts >= 3}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Verificando...
                </>
              ) : (
                'Acceder al Sistema'
              )}
            </button>

            <div className="text-center text-sm text-gray-500">
              <p>Sesión válida por 8 horas</p>
              <p className="mt-1">Intentos restantes: {3 - loginAttempts}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Procesador de archivos Excel
  const processRealExcelData = useCallback(async (file) => {
    console.log('Iniciando procesamiento de archivo Excel:', file.name);
    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const arrayBuffer = await file.arrayBuffer();
      setProcessingProgress(10);
      
      const workbook = XLSX.read(arrayBuffer, { 
        type: 'array',
        cellDates: true,
        cellStyles: true 
      });
      setProcessingProgress(20);

      let mainSheetName = workbook.SheetNames[0];
      if (workbook.SheetNames.includes('Respuestas de formulario 1')) {
        mainSheetName = 'Respuestas de formulario 1';
      }

      const worksheet = workbook.Sheets[mainSheetName];
      const rawSheetData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        raw: false,
        dateNF: 'yyyy-mm-dd'
      });
      
      setProcessingProgress(30);
      
      if (!rawSheetData || rawSheetData.length < 2) {
        throw new Error('El archivo no contiene datos válidos');
      }

      const headers = rawSheetData[0];
      const dataRows = rawSheetData.slice(1).filter(row => 
        row && row.length > 0 && row.some(cell => cell && cell.toString().trim() !== '')
      );

      console.log('Análisis inicial:', dataRows.length, 'filas de datos,', headers.length, 'columnas');
      setProcessingProgress(40);

      // Detección automática de columnas
      const detectedColumns = {
        timestamp: null,
        inspector: null,
        vehicle: null,
        contract: null,
        location: null,
        mileage: null,
        shift: null,
        observations: null,
        inspectionItems: [],
        fatigueQuestions: []
      };

      headers.forEach((header, index) => {
        if (!header) return;
        const headerStr = header.toString().toLowerCase().trim();
        
        if (headerStr.includes('nombre') && 
            (headerStr.includes('inspector') || headerStr.includes('realiza') || 
             headerStr.includes('inspeccion') || headerStr.includes('conductor') || 
             headerStr.includes('operador'))) {
          detectedColumns.inspector = index;
        }
        else if ((headerStr.includes('marca') && headerStr.includes('temporal')) || 
                 headerStr.includes('timestamp') || headerStr.includes('fecha')) {
          detectedColumns.timestamp = index;
        }
        else if (headerStr.includes('placa') || 
                 (headerStr.includes('vehiculo') || headerStr.includes('vehicle'))) {
          detectedColumns.vehicle = index;
        }
        else if (headerStr.includes('contrato') || headerStr.includes('contract')) {
          detectedColumns.contract = index;
        }
        else if (headerStr.includes('campo') || 
                 headerStr.includes('coordinacion') || 
                 headerStr.includes('ubicacion') || 
                 headerStr.includes('location')) {
          detectedColumns.location = index;
        }
        else if (headerStr.includes('kilometraje') || 
                 headerStr.includes('km') || 
                 headerStr.includes('mileage') || 
                 headerStr.includes('odometer')) {
          detectedColumns.mileage = index;
        }
        else if (headerStr.includes('turno') || 
                 headerStr.includes('shift') || 
                 headerStr.includes('jornada')) {
          detectedColumns.shift = index;
        }
        else if (headerStr.includes('observacion') || 
                 headerStr.includes('comentario') || 
                 headerStr.includes('notas')) {
          detectedColumns.observations = index;
        }
        else if (header.toString().length > 3 && 
                 !headerStr.includes('score') && 
                 !headerStr.includes('total') &&
                 headerStr !== 'cumple' &&
                 headerStr !== 'no cumple') {
          detectedColumns.inspectionItems.push({
            index: index,
            name: header.toString(),
            isCritical: header.toString().startsWith('**'),
            cleanName: header.toString().replace(/^\*\*/, '').trim()
          });
        }
      });

      setProcessingProgress(50);

      // Procesamiento de inspecciones
      const processedInspections = [];
      
      dataRows.forEach((row, index) => {
        let inspectorName = 'Sin especificar';
        if (detectedColumns.inspector !== null) {
          const inspectorValue = row[detectedColumns.inspector];
          if (inspectorValue && 
              inspectorValue.toString().trim() !== '' &&
              inspectorValue.toString().toLowerCase() !== 'cumple' &&
              inspectorValue.toString().toLowerCase() !== 'no cumple') {
            inspectorName = inspectorValue.toString().trim();
          }
        }
        
        let timestamp = null;
        if (detectedColumns.timestamp !== null) {
          const timestampValue = row[detectedColumns.timestamp];
          if (timestampValue) {
            timestamp = timestampValue;
          }
        }
        
        const inspection = {
          id: index + 1,
          timestamp: timestamp,
          inspector: inspectorName,
          vehicle: row[detectedColumns.vehicle] ? row[detectedColumns.vehicle].toString().trim().toUpperCase() : 'Sin especificar',
          contract: row[detectedColumns.contract] ? row[detectedColumns.contract].toString().trim() : 'Sin especificar',
          location: row[detectedColumns.location] ? row[detectedColumns.location].toString().trim().toUpperCase() : 'Sin especificar',
          mileage: parseInt(row[detectedColumns.mileage]) || 0,
          shift: row[detectedColumns.shift] ? row[detectedColumns.shift].toString().trim().toUpperCase() : 'Sin especificar',
          observations: row[detectedColumns.observations] ? row[detectedColumns.observations].toString().trim() : '',
          items: {},
          compliance: 0,
          criticalFailures: 0,
          totalItems: 0,
          compliantItems: 0,
          riskLevel: 'Bajo'
        };

        let totalItems = 0;
        let compliantItems = 0;
        let criticalFailures = 0;

        detectedColumns.inspectionItems.forEach(item => {
          const value = row[item.index];
          if (value && value.toString().trim() !== '') {
            totalItems++;
            const normalizedValue = value.toString().trim().toUpperCase();
            
            let isCompliant = false;
            if (normalizedValue === 'CUMPLE' || normalizedValue === 'SI' || normalizedValue === 'SÍ' || 
                normalizedValue === 'YES' || normalizedValue === 'OK' || normalizedValue === 'BIEN' ||
                normalizedValue === 'BUENO' || normalizedValue === 'CORRECTO' || normalizedValue === 'PASS') {
              isCompliant = true;
            } else if (normalizedValue === 'NO CUMPLE' || normalizedValue === 'NO' || 
                       normalizedValue === 'FAIL' || normalizedValue === 'FALLA' || 
                       normalizedValue === 'MAL' || normalizedValue === 'MALO' || 
                       normalizedValue === 'INCORRECTO' || normalizedValue === 'DEFICIENTE') {
              isCompliant = false;
            } else {
              const numValue = parseFloat(normalizedValue);
              if (!isNaN(numValue)) {
                isCompliant = numValue > 0;
              } else {
                const negativeWords = ['NO', 'FALTA', 'MALO', 'DEFICIENTE', 'INCORRECTO', 'FAIL'];
                isCompliant = !negativeWords.some(word => normalizedValue.includes(word));
              }
            }
            
            inspection.items[item.cleanName] = {
              value: isCompliant ? 'CUMPLE' : 'NO CUMPLE',
              isCritical: item.isCritical,
              compliant: isCompliant,
              originalValue: value.toString()
            };
            
            if (isCompliant) {
              compliantItems++;
            } else if (item.isCritical) {
              criticalFailures++;
            }
          }
        });

        inspection.totalItems = totalItems;
        inspection.compliantItems = compliantItems;
        inspection.criticalFailures = criticalFailures;
        
        if (totalItems > 0) {
          inspection.compliance = (compliantItems / totalItems) * 100;
          
          if (inspection.compliance >= 98) inspection.riskLevel = 'Bajo';
          else if (inspection.compliance >= 95) inspection.riskLevel = 'Medio';
          else if (inspection.compliance >= 90) inspection.riskLevel = 'Alto';
          else inspection.riskLevel = 'Crítico';
        }

        processedInspections.push(inspection);
        
        const progress = 50 + ((index + 1) / dataRows.length) * 30;
        setProcessingProgress(Math.min(progress, 80));
      });

      setProcessingProgress(85);

      const validInspections = processedInspections.filter(i => 
        i.inspector !== 'Sin especificar' && 
        i.vehicle !== 'Sin especificar' &&
        i.inspector.toLowerCase() !== 'cumple' &&
        i.inspector.toLowerCase() !== 'no cumple'
      );

      const uniqueValues = {
        inspectors: [...new Set(validInspections.map(i => i.inspector))].sort(),
        vehicles: [...new Set(validInspections.map(i => i.vehicle))].sort(),
        locations: [...new Set(validInspections.map(i => i.location))].filter(l => l !== 'Sin especificar').sort(),
        contracts: [...new Set(validInspections.map(i => i.contract))].filter(c => c !== 'Sin especificar').sort(),
        shifts: [...new Set(validInspections.map(i => i.shift))].filter(s => s !== 'Sin especificar').sort(),
        inspectionItems: detectedColumns.inspectionItems.map(i => i.cleanName),
        years: [...new Set(validInspections.map(i => i.timestamp ? new Date(i.timestamp).getFullYear() : null))].filter(y => y).sort(),
        months: [...new Set(validInspections.map(i => i.timestamp ? new Date(i.timestamp).getMonth() + 1 : null))].filter(m => m).sort(),
        days: [...new Set(validInspections.map(i => i.timestamp ? new Date(i.timestamp).getDate() : null))].filter(d => d).sort((a, b) => a - b)
      };

      const totalCompliance = validInspections.reduce((sum, i) => sum + i.compliance, 0);
      const averageCompliance = totalCompliance / validInspections.length;
      const totalCriticalFailures = validInspections.reduce((sum, i) => sum + i.criticalFailures, 0);

      const riskDistribution = {
        Bajo: validInspections.filter(i => i.riskLevel === 'Bajo').length,
        Medio: validInspections.filter(i => i.riskLevel === 'Medio').length,
        Alto: validInspections.filter(i => i.riskLevel === 'Alto').length,
        Crítico: validInspections.filter(i => i.riskLevel === 'Crítico').length
      };

      const timestamps = validInspections.map(i => i.timestamp).filter(t => t).sort();

      const stats = {
        totalInspections: validInspections.length,
        totalRawRecords: processedInspections.length,
        dateRange: {
          start: timestamps[0] || null,
          end: timestamps[timestamps.length - 1] || null
        },
        averageCompliance: averageCompliance,
        criticalFailures: totalCriticalFailures,
        riskDistribution: riskDistribution,
        uniqueCounts: {
          inspectors: uniqueValues.inspectors.length,
          vehicles: uniqueValues.vehicles.length,
          locations: uniqueValues.locations.length,
          contracts: uniqueValues.contracts.length,
          shifts: uniqueValues.shifts.length,
          inspectionItems: uniqueValues.inspectionItems.length,
          criticalItems: detectedColumns.inspectionItems.filter(i => i.isCritical).length
        }
      };

      setProcessingProgress(90);

      const itemAnalysis = {};
      detectedColumns.inspectionItems.forEach(item => {
        const itemValues = validInspections.map(insp => insp.items[item.cleanName]).filter(Boolean);
        const compliant = itemValues.filter(i => i.compliant).length;
        const total = itemValues.length;
        
        if (total > 10) {
          itemAnalysis[item.cleanName] = {
            name: item.cleanName,
            isCritical: item.isCritical,
            total: total,
            compliant: compliant,
            nonCompliant: total - compliant,
            complianceRate: (compliant / total) * 100,
            failureRate: ((total - compliant) / total) * 100
          };
        }
      });

      const finalData = {
        inspections: validInspections,
        rawInspections: processedInspections,
        columns: detectedColumns,
        uniqueValues: uniqueValues,
        stats: stats,
        itemAnalysis: itemAnalysis,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          processedAt: new Date().toISOString(),
          processingTime: Date.now()
        }
      };

      setRawData(rawSheetData);
      setProcessedData(finalData);
      setSystemStats(stats);
      setProcessingProgress(100);

    } catch (error) {
      console.error('Error procesando archivo:', error);
      alert('Error procesando el archivo: ' + error.message);
    }

    setTimeout(() => {
      setIsProcessing(false);
      setProcessingProgress(0);
    }, 1000);
  }, []);

  // Componente de carga de archivos
  const FileUpload = () => {
    const [isDragging, setIsDragging] = useState(false);

    const handleFileUpload = async (file) => {
      if (!file) return;
      
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];

      if (!validTypes.includes(file.type) && !file.name.toLowerCase().match(/\.(xlsx|xls|csv)$/)) {
        alert('Formato de archivo no soportado. Use archivos .xlsx, .xls o .csv');
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 50MB permitido.');
        return;
      }

      if (file.name.toLowerCase().endsWith('.csv')) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const headers = Object.keys(results.data[0] || {});
            const rows = results.data.map(row => headers.map(h => row[h]));
            const mockFile = { 
              name: file.name, 
              size: file.size,
              arrayBuffer: () => Promise.resolve([headers, ...rows])
            };
            processRealExcelData(mockFile);
          },
          error: (error) => {
            console.error('Error procesando CSV:', error);
            alert('Error procesando archivo CSV');
          }
        });
      } else {
        await processRealExcelData(file);
      }
    };

    return (
      <div className="max-w-2xl mx-auto">
        <div 
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) handleFileUpload(files[0]);
          }}
        >
          <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Cargar Archivo de Inspecciones
          </h3>
          <p className="text-gray-500 mb-6">
            Arrastre su archivo Excel/CSV aquí o haga clic para seleccionar
          </p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => handleFileUpload(e.target.files[0])}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
          >
            <Upload className="w-5 h-5 mr-2" />
            Seleccionar Archivo
          </label>
          <p className="text-sm text-gray-400 mt-4">
            Formatos soportados: .xlsx, .xls, .csv (max. 50MB)
          </p>
        </div>
      </div>
    );
  };

  // Componente de filtros avanzados
  const AdvancedFilters = () => {
    const [searchText, setSearchText] = useState(filters.search);
    
    const handleInputChange = useCallback((field, value) => {
      setFilters(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSearch = () => {
      setFilters(prev => ({ ...prev, search: searchText }));
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    };
    
    if (!processedData) return null;
    
    const getAvailableDays = () => {
      if (!filters.year || !filters.month) {
        return processedData.uniqueValues.days || [];
      }
      
      const year = parseInt(filters.year);
      const month = parseInt(filters.month);
      
      const availableDays = [...new Set(
        processedData.inspections
          .filter(insp => {
            if (!insp.timestamp) return false;
            const date = new Date(insp.timestamp);
            return date.getFullYear() === year && (date.getMonth() + 1) === month;
          })
          .map(insp => new Date(insp.timestamp).getDate())
      )].sort((a, b) => a - b);
      
      return availableDays;
    };

    const availableDays = getAvailableDays();
    
    return (
      <div className={`bg-white rounded-lg border p-4 mb-6 transition-all duration-300 ${showFilters ? 'block' : 'hidden'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div className="flex">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conductor/Inspector</label>
            <select
              value={filters.inspector}
              onChange={(e) => handleInputChange('inspector', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los conductores</option>
              {processedData.uniqueValues.inspectors.map(inspector => (
                <option key={inspector} value={inspector}>{inspector}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehículo (Placa)</label>
            <select
              value={filters.vehicle}
              onChange={(e) => handleInputChange('vehicle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los vehículos</option>
              {processedData.uniqueValues.vehicles.map(vehicle => (
                <option key={vehicle} value={vehicle}>{vehicle}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campo/Ubicación</label>
            <select
              value={filters.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas las ubicaciones</option>
              {processedData.uniqueValues.locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contrato</label>
            <select
              value={filters.contract}
              onChange={(e) => handleInputChange('contract', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los contratos</option>
              {processedData.uniqueValues.contracts.map(contract => (
                <option key={contract} value={contract}>{contract}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de Riesgo</label>
            <select
              value={filters.riskLevel}
              onChange={(e) => handleInputChange('riskLevel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los niveles</option>
              <option value="Bajo">Bajo</option>
              <option value="Medio">Medio</option>
              <option value="Alto">Alto</option>
              <option value="Crítico">Crítico</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
            <select
              value={filters.shift}
              onChange={(e) => handleInputChange('shift', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los turnos</option>
              {processedData.uniqueValues.shifts.map(shift => (
                <option key={shift} value={shift}>{shift}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
            <select
              value={filters.year}
              onChange={(e) => handleInputChange('year', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los años</option>
              {processedData.uniqueValues.years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
            <select
              value={filters.month}
              onChange={(e) => handleInputChange('month', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los meses</option>
              <option value="1">Enero</option>
              <option value="2">Febrero</option>
              <option value="3">Marzo</option>
              <option value="4">Abril</option>
              <option value="5">Mayo</option>
              <option value="6">Junio</option>
              <option value="7">Julio</option>
              <option value="8">Agosto</option>
              <option value="9">Septiembre</option>
              <option value="10">Octubre</option>
              <option value="11">Noviembre</option>
              <option value="12">Diciembre</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Día {filters.year && filters.month && `(${getMonthName(parseInt(filters.month))} ${filters.year})`}
            </label>
            <select
              value={filters.day}
              onChange={(e) => handleInputChange('day', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={availableDays.length === 0}
            >
              <option value="">Todos los días</option>
              {availableDays.map(day => (
                <option key={day} value={day}>
                  {day} {filters.year && filters.month && `(${day} de ${getMonthName(parseInt(filters.month))})`}
                </option>
              ))}
            </select>
            {availableDays.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Seleccione año y mes para ver días disponibles
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input
              type="date"
              value={filters.dateStart}
              onChange={(e) => handleInputChange('dateStart', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
            <input
              type="date"
              value={filters.dateEnd}
              onChange={(e) => handleInputChange('dateEnd', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.criticalItemsOnly}
                onChange={(e) => handleInputChange('criticalItemsOnly', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Solo fallas críticas</span>
            </label>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setSearchText('');
                setFilters({
                  search: '',
                  inspector: '',
                  vehicle: '',
                  location: '',
                  contract: '',
                  shift: '',
                  year: '',
                  month: '',
                  day: '',
                  complianceMin: 0,
                  complianceMax: 100,
                  dateStart: '',
                  dateEnd: '',
                  riskLevel: '',
                  criticalItemsOnly: false
                });
              }}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Limpiar Filtros
            </button>
            
            {filteredData && (
              <div className="px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                {filteredData.length} resultados
                {filteredData.length !== systemStats?.totalInspections && 
                  ` de ${systemStats?.totalInspections || 0} totales`}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Dashboard principal
  const Dashboard = () => {
    if (!systemStats || !processedData || !filteredData) return null;

    const currentStats = {
      totalInspections: filteredData.length,
      averageCompliance: filteredData.length > 0 ? filteredData.reduce((sum, i) => sum + i.compliance, 0) / filteredData.length : 0,
      criticalFailures: filteredData.reduce((sum, i) => sum + i.criticalFailures, 0),
      riskDistribution: {
        Bajo: filteredData.filter(i => i.riskLevel === 'Bajo').length,
        Medio: filteredData.filter(i => i.riskLevel === 'Medio').length,
        Alto: filteredData.filter(i => i.riskLevel === 'Alto').length,
        Crítico: filteredData.filter(i => i.riskLevel === 'Crítico').length
      }
    };

    const complianceDistribution = [];
    if (filteredData && filteredData.length > 0) {
      for (let i = 0; i <= 90; i += 10) {
        let count;
        if (i === 90) {
          count = filteredData.filter(insp => insp.compliance >= i && insp.compliance <= 100).length;
          complianceDistribution.push({
            range: `${i}-100%`,
            count: count,
            percentage: (count / filteredData.length) * 100
          });
        } else {
          count = filteredData.filter(insp => insp.compliance >= i && insp.compliance < i + 10).length;
          complianceDistribution.push({
            range: `${i}-${i+9}%`,
            count: count,
            percentage: (count / filteredData.length) * 100
          });
        }
      }
    }

    // Análisis de items basado en datos filtrados
    const filteredItemAnalysis = {};
    
    if (processedData && processedData.columns && filteredData.length > 0) {
      processedData.columns.inspectionItems.forEach(item => {
        const itemValues = filteredData.map(insp => insp.items[item.cleanName]).filter(Boolean);
        const compliant = itemValues.filter(i => i.compliant).length;
        const total = itemValues.length;
        
        if (total >= 5) { // Reducimos el mínimo para filtros más específicos
          filteredItemAnalysis[item.cleanName] = {
            name: item.cleanName,
            isCritical: item.isCritical,
            total: total,
            compliant: compliant,
            nonCompliant: total - compliant,
            complianceRate: (compliant / total) * 100,
            failureRate: ((total - compliant) / total) * 100
          };
        }
      });
    }

    return (
      <div className="space-y-6">
        {/* Indicador de filtros activos */}
        {(filters.search || filters.inspector || filters.vehicle || filters.location || filters.contract || 
          filters.shift || filters.year || filters.month || filters.day || filters.dateStart || filters.dateEnd || 
          filters.riskLevel || filters.criticalItemsOnly) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Filter className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-800">Filtros Activos - Dashboard Filtrado</h3>
            </div>
            <div className="text-sm text-yellow-700">
              <span className="font-semibold">Mostrando:</span> {filteredData.length} de {processedData.inspections.length} inspecciones
              {filters.dateStart && <span className="ml-4"><strong>Desde:</strong> {filters.dateStart}</span>}
              {filters.dateEnd && <span className="ml-4"><strong>Hasta:</strong> {filters.dateEnd}</span>}
              {filters.inspector && <span className="ml-4"><strong>Conductor:</strong> {filters.inspector}</span>}
              {filters.contract && <span className="ml-4"><strong>Contrato:</strong> {filters.contract}</span>}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Inspecciones</p>
                <p className="text-2xl font-bold text-gray-800">
                  {currentStats.totalInspections.toLocaleString()}
                </p>
                {filteredData && filteredData.length !== systemStats.totalInspections && (
                  <p className="text-xs text-blue-600">
                    de {systemStats.totalInspections.toLocaleString()} totales
                  </p>
                )}
              </div>
              <div className="bg-blue-100 rounded-lg p-3">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Cumplimiento Promedio</p>
                <p className="text-2xl font-bold text-green-600">
                  {currentStats.averageCompliance.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400">
                  {currentStats.averageCompliance >= 95 ? 'Excelente' : 
                   currentStats.averageCompliance >= 85 ? 'Bueno' : 'Requiere atención'}
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
                <p className="text-sm text-gray-500">Fallas Críticas</p>
                <p className="text-2xl font-bold text-red-600">
                  {currentStats.criticalFailures.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">
                  {systemStats.uniqueCounts.criticalItems} items críticos
                </p>
              </div>
              <div className="bg-red-100 rounded-lg p-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Conductores/Inspectores</p>
                <p className="text-2xl font-bold text-purple-600">
                  {[...new Set(filteredData.map(i => i.inspector))].length}
                </p>
                <p className="text-xs text-gray-400">
                  {[...new Set(filteredData.map(i => i.vehicle))].length} vehículos (filtrados)
                </p>
              </div>
              <div className="bg-purple-100 rounded-lg p-3">
                <User className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Distribución de Niveles de Riesgo
              {filteredData.length !== systemStats.totalInspections && (
                <span className="text-sm font-normal text-blue-600 ml-2">(Filtrado)</span>
              )}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={[
                    { name: 'Bajo', value: currentStats.riskDistribution.Bajo, color: colors.success },
                    { name: 'Medio', value: currentStats.riskDistribution.Medio, color: colors.warning },
                    { name: 'Alto', value: currentStats.riskDistribution.Alto, color: colors.danger },
                    { name: 'Crítico', value: currentStats.riskDistribution.Crítico, color: colors.critical }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {[colors.success, colors.warning, colors.danger, colors.critical].map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Distribución de Cumplimiento
              {filteredData.length !== systemStats.totalInspections && (
                <span className="text-sm font-normal text-blue-600 ml-2">(Filtrado)</span>
              )}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={complianceDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'count' ? `${value} inspecciones` : `${value.toFixed(1)}%`,
                    name === 'count' ? 'Cantidad' : 'Porcentaje'
                  ]}
                />
                <Bar dataKey="count" fill={colors.primary} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Items Más Problemáticos
            {filteredData.length !== systemStats.totalInspections && (
              <span className="text-sm font-normal text-blue-600 ml-2">(Datos Filtrados)</span>
            )}
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {Object.values(filteredItemAnalysis)
              .sort((a, b) => b.failureRate - a.failureRate)
              .slice(0, 15)
              .map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3 flex-1">
                    {item.isCritical && (
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <span className="text-sm text-gray-700 font-medium block">
                        {item.name}
                      </span>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {item.nonCompliant}/{item.total} fallas
                        </span>
                        {item.isCritical && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                            CRÍTICO
                          </span>
                        )}
                        {filteredData.length !== systemStats.totalInspections && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                            FILTRADO
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-red-600">
                        {item.failureRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        tasa de falla
                      </div>
                    </div>
                    <button
                      onClick={() => openItemDetail(item)}
                      className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                      title="Ver detalles completos"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Detalles
                    </button>
                  </div>
                </div>
              ))}
          </div>
          
          {Object.keys(filteredItemAnalysis).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay suficientes datos para análisis de items</p>
              <p className="text-sm mt-1">
                {filteredData.length === 0 ? 
                  'No hay inspecciones que coincidan con los filtros aplicados' :
                  'Se requieren al menos 5 inspecciones por item en los datos filtrados'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Análisis de conductores
  const ConductorAnalysis = () => {
    if (!processedData || !filteredData) return null;

    const today = new Date();
    const conductorDataFiltered = {};
    const conductorDataAll = {};
    
    // Usar datos filtrados para mostrar solo conductores en el rango de fechas
    filteredData.forEach(insp => {
      if (insp.inspector && insp.inspector !== 'Sin especificar') {
        if (!conductorDataFiltered[insp.inspector]) {
          conductorDataFiltered[insp.inspector] = {
            name: insp.inspector,
            inspections: [],
            vehicles: new Set(),
            locations: new Set()
          };
        }
        
        conductorDataFiltered[insp.inspector].inspections.push(insp);
        conductorDataFiltered[insp.inspector].vehicles.add(insp.vehicle);
        conductorDataFiltered[insp.inspector].locations.add(insp.location);
      }
    });

    // Usar TODOS los datos para calcular la última fecha de inspección
    processedData.inspections.forEach(insp => {
      if (insp.inspector && insp.inspector !== 'Sin especificar') {
        if (!conductorDataAll[insp.inspector]) {
          conductorDataAll[insp.inspector] = {
            name: insp.inspector,
            inspections: []
          };
        }
        conductorDataAll[insp.inspector].inspections.push(insp);
      }
    });

    const conductores = Object.values(conductorDataFiltered).map(conductor => {
      let totalItems = 0;
      let compliantItems = 0;
      let criticalFailures = 0;
      let lastDateGlobal = null;

      // Calcular estadísticas basadas en datos FILTRADOS
      conductor.inspections.forEach(insp => {
        totalItems += insp.totalItems || 0;
        compliantItems += insp.compliantItems || 0;
        criticalFailures += insp.criticalFailures || 0;
      });

      // Calcular última fecha de inspección usando TODOS los datos
      const allInspectionsForConductor = conductorDataAll[conductor.name];
      if (allInspectionsForConductor) {
        allInspectionsForConductor.inspections.forEach(insp => {
          if (insp.timestamp) {
            let date;
            try {
              date = new Date(insp.timestamp);
              if (!isNaN(date.getTime())) {
                if (!lastDateGlobal || date > lastDateGlobal) {
                  lastDateGlobal = date;
                }
              }
            } catch (error) {
              console.log('Error procesando fecha para conductor:', conductor.name, insp.timestamp);
            }
          }
        });
      }

      const compliance = totalItems > 0 ? (compliantItems / totalItems) * 100 : 0;
      
      let daysSince = 999;
      if (lastDateGlobal && !isNaN(lastDateGlobal.getTime())) {
        const timeDiff = today.getTime() - lastDateGlobal.getTime();
        daysSince = Math.floor(timeDiff / (1000 * 3600 * 24));
        if (daysSince < 0) daysSince = 0;
      }

      // Lógica de categorización
      let status = 'rojo';
      if (daysSince <= 5) {
        status = 'verde';
      } else if (daysSince <= 10) {
        status = 'amarillo';
      }

      let risk = 'Bajo';
      if (compliance < 70) risk = 'Crítico';
      else if (compliance < 85) risk = 'Alto';
      else if (compliance < 95) risk = 'Medio';

      return {
        name: conductor.name,
        totalInspections: conductor.inspections.length,
        totalInspectionsGlobal: allInspectionsForConductor ? allInspectionsForConductor.inspections.length : 0,
        compliance: Math.round(compliance * 100) / 100,
        totalItems,
        compliantItems,
        criticalFailures,
        vehicleCount: conductor.vehicles.size,
        locationCount: conductor.locations.size,
        lastDate: lastDateGlobal,
        daysSince,
        status,
        risk
      };
    }).sort((a, b) => a.daysSince - b.daysSince);

    const verdes = conductores.filter(c => c.status === 'verde');
    const amarillos = conductores.filter(c => c.status === 'amarillo');
    const rojos = conductores.filter(c => c.status === 'rojo');

    if (conductores.length === 0) {
      return (
        <div className="bg-white rounded-xl p-8 shadow-sm border text-center">
          <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No hay conductores en el rango de fechas seleccionado
          </h3>
          <p className="text-gray-500">
            {filters.dateStart || filters.dateEnd ? 
              `Rango: ${filters.dateStart || 'Sin inicio'} - ${filters.dateEnd || 'Sin fin'}` :
              'Ajuste los filtros para ver resultados'
            }
          </p>
        </div>
      );
    }

    const renderConductorSection = (conductorList, sectionConfig) => {
      const { color, title, icon: Icon, status } = sectionConfig;
      
      let bgColorClass = 'bg-gray-50';
      let borderColorClass = 'border-gray-300';
      let iconBgColorClass = 'bg-gray-600';
      let titleColorClass = 'text-gray-800';
      let complianceColorClass = 'text-gray-600';
      let daysSinceColorClass = 'text-gray-600';
      let statusBgColorClass = 'bg-gray-100';
      let statusTextColorClass = 'text-gray-700';
      let statusBorderColorClass = 'border-gray-300';
      let centerTextColorClass = 'text-gray-800';

      if (color === 'green') {
        bgColorClass = 'bg-green-50';
        borderColorClass = 'border-green-300';
        iconBgColorClass = 'bg-green-600';
        titleColorClass = 'text-green-800';
        complianceColorClass = 'text-green-600';
        daysSinceColorClass = 'text-green-600';
        statusBgColorClass = 'bg-green-100';
        statusTextColorClass = 'text-green-700';
        statusBorderColorClass = 'border-green-300';
        centerTextColorClass = 'text-green-800';
      } else if (color === 'yellow') {
        bgColorClass = 'bg-yellow-50';
        borderColorClass = 'border-yellow-300';
        iconBgColorClass = 'bg-yellow-600';
        titleColorClass = 'text-yellow-800';
        complianceColorClass = 'text-yellow-600';
        daysSinceColorClass = 'text-yellow-600';
        statusBgColorClass = 'bg-yellow-100';
        statusTextColorClass = 'text-yellow-700';
        statusBorderColorClass = 'border-yellow-300';
        centerTextColorClass = 'text-yellow-800';
      } else if (color === 'red') {
        bgColorClass = 'bg-red-50';
        borderColorClass = 'border-red-300';
        iconBgColorClass = 'bg-red-600';
        titleColorClass = 'text-red-800';
        complianceColorClass = 'text-red-600';
        daysSinceColorClass = 'text-red-600';
        statusBgColorClass = 'bg-red-100';
        statusTextColorClass = 'text-red-700';
        statusBorderColorClass = 'border-red-300';
        centerTextColorClass = 'text-red-800';
      }

      return (
        <div className={`${bgColorClass} border-2 ${borderColorClass} rounded-xl p-6`}>
          <div className="flex items-center space-x-3 mb-6">
            <div className={`w-6 h-6 rounded-full ${iconBgColorClass} flex items-center justify-center`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <h3 className={`text-xl font-bold ${titleColorClass}`}>
              {title}
            </h3>
            <div className={`px-3 py-1 rounded-full text-sm font-bold ${iconBgColorClass} text-white`}>
              {conductorList.length}
            </div>
          </div>
          
          {conductorList.length === 0 ? (
            <div className="text-center py-8">
              <p className={`text-lg ${centerTextColorClass} opacity-75`}>
                No hay conductores en esta categoría (en el período filtrado)
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {conductorList.map(conductor => (
                <div key={conductor.name} className="bg-white rounded-lg p-5 border-2 border-gray-200 shadow-md">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-800 mb-1">{conductor.name}</h4>
                      <div className="flex items-center space-x-4">
                        <div className={`text-lg font-bold ${complianceColorClass}`}>
                          {conductor.compliance.toFixed(1)}% cumplimiento
                        </div>
                        <div className="text-sm text-gray-600">
                          ({conductor.compliantItems}/{conductor.totalItems} items)
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-1">Última inspección global:</div>
                      <div className="font-bold text-gray-800">
                        {conductor.lastDate ? 
                          conductor.lastDate.toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 
                          'Sin registro'
                        }
                      </div>
                      <div className={`text-xl font-bold mt-1 ${daysSinceColorClass}`}>
                        {conductor.daysSince === 999 ? 
                          'Sin fecha' : 
                          `${conductor.daysSince} días atrás`
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <div><span className="font-semibold">Inspecciones (período):</span> {conductor.totalInspections}</div>
                    <div><span className="font-semibold">Inspecciones (total):</span> {conductor.totalInspectionsGlobal}</div>
                    <div><span className="font-semibold">Vehículos:</span> {conductor.vehicleCount}</div>
                    <div>
                      <span className="font-semibold">Fallas críticas:</span> 
                      <span className={conductor.criticalFailures > 0 ? 'text-red-600 font-bold ml-1' : 'ml-1'}>
                        {conductor.criticalFailures}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      conductor.risk === 'Bajo' ? 'bg-green-100 text-green-800 border border-green-300' :
                      conductor.risk === 'Medio' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                      conductor.risk === 'Alto' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                      'bg-red-100 text-red-800 border border-red-300'
                    }`}>
                      Riesgo: {conductor.risk}
                    </span>
                    <span className={`text-sm ${statusTextColorClass} font-bold ${statusBgColorClass} px-3 py-1 rounded border ${statusBorderColorClass}`}>
                      {status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-6">
        {/* Información de filtros aplicados */}
        {(filters.dateStart || filters.dateEnd || filters.search || filters.inspector || filters.vehicle) && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Filter className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-indigo-800">Filtros Aplicados</h3>
            </div>
            <div className="text-sm text-indigo-700">
              {filters.dateStart && <span className="mr-4"><strong>Desde:</strong> {filters.dateStart}</span>}
              {filters.dateEnd && <span className="mr-4"><strong>Hasta:</strong> {filters.dateEnd}</span>}
              {filters.search && <span className="mr-4"><strong>Búsqueda:</strong> "{filters.search}"</span>}
              {filters.inspector && <span className="mr-4"><strong>Conductor:</strong> {filters.inspector}</span>}
              {filters.vehicle && <span className="mr-4"><strong>Vehículo:</strong> {filters.vehicle}</span>}
              <div className="mt-2">
                <strong>Mostrando:</strong> {filteredData.length} inspecciones de {processedData.inspections.length} totales
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Conductores en Filtro</p>
                <p className="text-xl font-bold text-gray-800">{conductores.length}</p>
                <p className="text-xs text-gray-500">
                  de {Object.keys(conductorDataAll).length} totales
                </p>
              </div>
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 shadow-sm border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Al Día (≤5 días)</p>
                <p className="text-xl font-bold text-green-800">{verdes.length}</p>
                <p className="text-xs text-green-600">
                  {verdes.length > 0 && `${verdes[0].daysSince} días mín.`}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4 shadow-sm border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700">Próximo Vencimiento (6-10 días)</p>
                <p className="text-xl font-bold text-yellow-800">{amarillos.length}</p>
                <p className="text-xs text-yellow-600">
                  {amarillos.length > 0 && `${amarillos[0].daysSince} días mín.`}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4 shadow-sm border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Vencidos (&gt;10 días)</p>
                <p className="text-xl font-bold text-red-800">{rojos.length}</p>
                <p className="text-xs text-red-600">
                  {rojos.length > 0 && rojos.filter(r => r.daysSince < 999).length > 0 && 
                    `${Math.min(...rojos.filter(r => r.daysSince < 999).map(r => r.daysSince))} días mín.`}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">Validación de Datos Filtrados</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-blue-700">
                <span className="font-semibold">Cumplimiento en Período:</span><br />
                {conductores.length > 0 ? 
                  (conductores.reduce((sum, c) => sum + c.compliance, 0) / conductores.length).toFixed(2) : 0
                }%
              </p>
            </div>
            <div>
              <p className="text-blue-700">
                <span className="font-semibold">Items Evaluados (Filtro):</span><br />
                {conductores.reduce((sum, c) => sum + c.totalItems, 0).toLocaleString()} totales
              </p>
            </div>
            <div>
              <p className="text-blue-700">
                <span className="font-semibold">Items Cumplidos (Filtro):</span><br />
                {conductores.reduce((sum, c) => sum + c.compliantItems, 0).toLocaleString()} cumplidos
              </p>
            </div>
          </div>
        </div>

        {renderConductorSection(verdes, { 
          color: 'green', 
          title: 'Conductores Al Día (≤5 días)', 
          icon: CheckCircle, 
          status: 'Al día' 
        })}
        
        {renderConductorSection(amarillos, { 
          color: 'yellow', 
          title: 'Conductores Próximos a Vencer (6-10 días)', 
          icon: Clock, 
          status: 'Próximo a vencer' 
        })}
        
        {renderConductorSection(rojos, { 
          color: 'red', 
          title: 'Conductores con Inspecciones Vencidas (>10 días)', 
          icon: AlertTriangle, 
          status: 'INSPECCIÓN URGENTE' 
        })}
      </div>
    );
  };

  // Análisis de vehículos
  const VehicleAnalysis = () => {
    if (!processedData || !filteredData) return null;

    const vehicleDataFiltered = {};
    const vehicleDataAll = {};
    
    // Usar datos filtrados para mostrar solo vehículos en el rango de fechas
    filteredData.forEach(insp => {
      if (insp.vehicle && insp.vehicle !== 'Sin especificar') {
        if (!vehicleDataFiltered[insp.vehicle]) {
          vehicleDataFiltered[insp.vehicle] = {
            plate: insp.vehicle,
            inspections: [],
            inspectors: new Set(),
            locations: new Set(),
            contracts: new Set(),
            shifts: new Set(),
            failedItems: {},
            criticalFailures: 0,
            totalFailures: 0,
            lastInspection: null
          };
        }
        
        vehicleDataFiltered[insp.vehicle].inspections.push(insp);
        vehicleDataFiltered[insp.vehicle].inspectors.add(insp.inspector);
        vehicleDataFiltered[insp.vehicle].locations.add(insp.location);
        vehicleDataFiltered[insp.vehicle].contracts.add(insp.contract);
        vehicleDataFiltered[insp.vehicle].shifts.add(insp.shift);
        
        // Analizar items fallidos en el período filtrado
        Object.entries(insp.items || {}).forEach(([itemName, itemData]) => {
          if (!itemData.compliant) {
            if (!vehicleDataFiltered[insp.vehicle].failedItems[itemName]) {
              vehicleDataFiltered[insp.vehicle].failedItems[itemName] = {
                name: itemName,
                isCritical: itemData.isCritical,
                failureCount: 0,
                totalChecks: 0,
                recentFailures: []
              };
            }
            
            vehicleDataFiltered[insp.vehicle].failedItems[itemName].failureCount++;
            vehicleDataFiltered[insp.vehicle].failedItems[itemName].recentFailures.push({
              date: insp.timestamp,
              inspector: insp.inspector,
              location: insp.location
            });
            
            vehicleDataFiltered[insp.vehicle].totalFailures++;
            
            if (itemData.isCritical) {
              vehicleDataFiltered[insp.vehicle].criticalFailures++;
            }
          }
          
          if (vehicleDataFiltered[insp.vehicle].failedItems[itemName]) {
            vehicleDataFiltered[insp.vehicle].failedItems[itemName].totalChecks++;
          }
        });
      }
    });

    // Usar todos los datos para calcular última inspección global
    processedData.inspections.forEach(insp => {
      if (insp.vehicle && insp.vehicle !== 'Sin especificar') {
        if (!vehicleDataAll[insp.vehicle]) {
          vehicleDataAll[insp.vehicle] = {
            inspections: [],
            lastInspection: null
          };
        }
        
        vehicleDataAll[insp.vehicle].inspections.push(insp);
        
        if (insp.timestamp) {
          const date = new Date(insp.timestamp);
          if (!vehicleDataAll[insp.vehicle].lastInspection || date > vehicleDataAll[insp.vehicle].lastInspection) {
            vehicleDataAll[insp.vehicle].lastInspection = date;
          }
        }
      }
    });

    const vehicles = Object.values(vehicleDataFiltered).map(vehicle => {
      let totalItems = 0;
      let compliantItems = 0;
      
      // Calcular estadísticas basadas en datos filtrados
      vehicle.inspections.forEach(insp => {
        totalItems += insp.totalItems || 0;
        compliantItems += insp.compliantItems || 0;
      });

      const compliance = totalItems > 0 ? (compliantItems / totalItems) * 100 : 0;
      const failureRate = totalItems > 0 ? (vehicle.totalFailures / totalItems) * 100 : 0;
      
      // Usar última inspección global para calcular días
      const vehicleGlobal = vehicleDataAll[vehicle.plate];
      const today = new Date();
      let daysSince = 999;
      if (vehicleGlobal && vehicleGlobal.lastInspection) {
        const timeDiff = today.getTime() - vehicleGlobal.lastInspection.getTime();
        daysSince = Math.floor(timeDiff / (1000 * 3600 * 24));
      }

      // Determinar estado de mantenimiento basado en datos filtrados
      let maintenanceStatus = 'critico';
      if (vehicle.criticalFailures === 0 && compliance >= 95) maintenanceStatus = 'excelente';
      else if (vehicle.criticalFailures <= 1 && compliance >= 90) maintenanceStatus = 'bueno';
      else if (vehicle.criticalFailures <= 3 && compliance >= 80) maintenanceStatus = 'regular';

      const topFailedItems = Object.values(vehicle.failedItems)
        .sort((a, b) => b.failureCount - a.failureCount)
        .slice(0, 5);

      return {
        plate: vehicle.plate,
        totalInspections: vehicle.inspections.length,
        totalInspectionsGlobal: vehicleGlobal ? vehicleGlobal.inspections.length : 0,
        compliance: Math.round(compliance * 100) / 100,
        failureRate: Math.round(failureRate * 100) / 100,
        totalItems,
        compliantItems,
        totalFailures: vehicle.totalFailures,
        criticalFailures: vehicle.criticalFailures,
        inspectorCount: vehicle.inspectors.size,
        locationCount: vehicle.locations.size,
        contractCount: vehicle.contracts.size,
        shiftCount: vehicle.shifts.size,
        lastInspection: vehicleGlobal ? vehicleGlobal.lastInspection : null,
        daysSince,
        maintenanceStatus,
        topFailedItems,
        failedItemsCount: Object.keys(vehicle.failedItems).length
      };
    }).sort((a, b) => b.totalFailures - a.totalFailures);

    // Análisis global de items problemáticos (basado en datos filtrados)
    const globalFailedItems = {};
    Object.values(vehicleDataFiltered).forEach(vehicle => {
      Object.values(vehicle.failedItems).forEach(item => {
        if (!globalFailedItems[item.name]) {
          globalFailedItems[item.name] = {
            name: item.name,
            isCritical: item.isCritical,
            totalFailures: 0,
            affectedVehicles: new Set(),
            failureRate: 0
          };
        }
        
        globalFailedItems[item.name].totalFailures += item.failureCount;
        globalFailedItems[item.name].affectedVehicles.add(vehicle.plate);
      });
    });

    const topProblematicItems = Object.values(globalFailedItems)
      .map(item => ({
        ...item,
        affectedVehicleCount: item.affectedVehicles.size,
        affectedVehicles: Array.from(item.affectedVehicles)
      }))
      .sort((a, b) => b.totalFailures - a.totalFailures)
      .slice(0, 10);

    const excelentes = vehicles.filter(v => v.maintenanceStatus === 'excelente');
    const buenos = vehicles.filter(v => v.maintenanceStatus === 'bueno');
    const regulares = vehicles.filter(v => v.maintenanceStatus === 'regular');
    const criticos = vehicles.filter(v => v.maintenanceStatus === 'critico');

    if (vehicles.length === 0) {
      return (
        <div className="bg-white rounded-xl p-8 shadow-sm border text-center">
          <Car className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No hay vehículos en el rango de fechas seleccionado
          </h3>
          <p className="text-gray-500">
            {filters.dateStart || filters.dateEnd ? 
              `Rango: ${filters.dateStart || 'Sin inicio'} - ${filters.dateEnd || 'Sin fin'}` :
              'Ajuste los filtros para ver resultados'
            }
          </p>
        </div>
      );
    }

    const renderVehicleSection = (vehicleGroup, sectionConfig, groupIndex) => {
      const { color, title, icon: Icon, status } = sectionConfig;
      
      let bgColorClass = 'bg-gray-50';
      let borderColorClass = 'border-gray-300';
      let iconBgColorClass = 'bg-gray-600';
      let titleColorClass = 'text-gray-800';
      let centerTextColorClass = 'text-gray-800';
      let itemsLabelColorClass = 'text-gray-700';
      let complianceColorClass = 'text-gray-600';
      let failuresColorClass = 'text-gray-600';
      let criticalFailuresColorClass = 'text-gray-600';
      let statusTextColorClass = 'text-gray-700';
      let statusBgColorClass = 'bg-gray-100';
      let statusBorderColorClass = 'border-gray-300';

      if (color === 'red') {
        bgColorClass = 'bg-red-50';
        borderColorClass = 'border-red-300';
        iconBgColorClass = 'bg-red-600';
        titleColorClass = 'text-red-800';
        centerTextColorClass = 'text-red-800';
        itemsLabelColorClass = 'text-red-700';
        complianceColorClass = 'text-red-600';
        failuresColorClass = 'text-red-600';
        criticalFailuresColorClass = 'text-red-600';
        statusTextColorClass = 'text-red-700';
        statusBgColorClass = 'bg-red-100';
        statusBorderColorClass = 'border-red-300';
      } else if (color === 'yellow') {
        bgColorClass = 'bg-yellow-50';
        borderColorClass = 'border-yellow-300';
        iconBgColorClass = 'bg-yellow-600';
        titleColorClass = 'text-yellow-800';
        centerTextColorClass = 'text-yellow-800';
        itemsLabelColorClass = 'text-yellow-700';
        complianceColorClass = 'text-yellow-600';
        failuresColorClass = 'text-yellow-600';
        criticalFailuresColorClass = 'text-yellow-600';
        statusTextColorClass = 'text-yellow-700';
        statusBgColorClass = 'bg-yellow-100';
        statusBorderColorClass = 'border-yellow-300';
      } else if (color === 'blue') {
        bgColorClass = 'bg-blue-50';
        borderColorClass = 'border-blue-300';
        iconBgColorClass = 'bg-blue-600';
        titleColorClass = 'text-blue-800';
        centerTextColorClass = 'text-blue-800';
        itemsLabelColorClass = 'text-blue-700';
        complianceColorClass = 'text-blue-600';
        failuresColorClass = 'text-blue-600';
        criticalFailuresColorClass = 'text-blue-600';
        statusTextColorClass = 'text-blue-700';
        statusBgColorClass = 'bg-blue-100';
        statusBorderColorClass = 'border-blue-300';
      } else if (color === 'green') {
        bgColorClass = 'bg-green-50';
        borderColorClass = 'border-green-300';
        iconBgColorClass = 'bg-green-600';
        titleColorClass = 'text-green-800';
        centerTextColorClass = 'text-green-800';
        itemsLabelColorClass = 'text-green-700';
        complianceColorClass = 'text-green-600';
        failuresColorClass = 'text-green-600';
        criticalFailuresColorClass = 'text-green-600';
        statusTextColorClass = 'text-green-700';
        statusBgColorClass = 'bg-green-100';
        statusBorderColorClass = 'border-green-300';
      }

      return (
        <div className={`${bgColorClass} border-2 ${borderColorClass} rounded-xl p-6`}>
          <div className="flex items-center space-x-3 mb-6">
            <div className={`w-6 h-6 rounded-full ${iconBgColorClass} flex items-center justify-center`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <h3 className={`text-xl font-bold ${titleColorClass}`}>
              {title} (en período filtrado)
            </h3>
            <div className={`px-3 py-1 rounded-full text-sm font-bold ${iconBgColorClass} text-white`}>
              {vehicleGroup.length}
            </div>
          </div>
          
          {vehicleGroup.length === 0 ? (
            <div className="text-center py-8">
              <p className={`text-lg ${centerTextColorClass} opacity-75`}>
                No hay vehículos en esta categoría (en el período filtrado)
              </p>
            </div>
          ) : groupIndex < 2 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {vehicleGroup.slice(0, groupIndex === 0 ? 20 : 10).map(vehicle => (
                <div key={vehicle.plate} className="bg-white rounded-lg p-5 border-2 border-red-200 shadow-md">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-xl text-gray-800 mb-1">{vehicle.plate}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className={`font-semibold ${itemsLabelColorClass}`}>Cumplimiento (período):</span>
                          <div className={`text-lg font-bold ${complianceColorClass}`}>{vehicle.compliance.toFixed(1)}%</div>
                        </div>
                        <div>
                          <span className={`font-semibold ${itemsLabelColorClass}`}>Fallas (período):</span>
                          <div className={`text-lg font-bold ${failuresColorClass}`}>{vehicle.totalFailures}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-1">Fallas Críticas:</div>
                      <div className={`text-2xl font-bold ${criticalFailuresColorClass}`}>{vehicle.criticalFailures}</div>
                      {groupIndex === 0 && <div className="text-xs text-red-500">URGENTE</div>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                    <div><span className="font-semibold">Inspecciones (período):</span> {vehicle.totalInspections}</div>
                    <div><span className="font-semibold">Inspecciones (total):</span> {vehicle.totalInspectionsGlobal}</div>
                    <div><span className="font-semibold">Conductores:</span> {vehicle.inspectorCount}</div>
                  </div>

                  {vehicle.topFailedItems.length > 0 && (
                    <div className="mb-3">
                      <h5 className={`font-semibold ${itemsLabelColorClass} text-sm mb-2`}>Items que más fallan (período):</h5>
                      <div className="flex flex-wrap gap-1">
                        {vehicle.topFailedItems.slice(0, groupIndex === 0 ? 3 : 4).map((item, idx) => (
                          <span key={idx} className={`text-xs px-2 py-1 rounded ${
                            item.isCritical 
                              ? 'bg-red-200 text-red-800 border border-red-300' 
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {item.name} ({item.failureCount}x)
                            {item.isCritical && ' ⚠️'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      {groupIndex === 0 ? (
                        `Última inspección global: ${vehicle.lastInspection ? 
                          vehicle.lastInspection.toLocaleDateString('es-CO') : 
                          'Sin registro'
                        }`
                      ) : (
                        `${vehicle.totalInspections} insp. período | ${vehicle.inspectorCount} conductores`
                      )}
                    </div>
                    <span className={`text-sm ${statusTextColorClass} font-bold ${statusBgColorClass} px-3 py-1 rounded border ${statusBorderColorClass}`}>
                      {status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto">
              {vehicleGroup.map(vehicle => {
                let vehicleBgColorClass = 'bg-gray-100';
                let vehicleTextColorClass = 'text-gray-800';
                
                if (color === 'green') {
                  vehicleBgColorClass = 'bg-green-100';
                  vehicleTextColorClass = 'text-green-800';
                } else if (color === 'blue') {
                  vehicleBgColorClass = 'bg-blue-100';
                  vehicleTextColorClass = 'text-blue-800';
                }
                
                return (
                  <div key={vehicle.plate} className={`bg-white rounded-lg p-4 border ${borderColorClass}`}>
                    {groupIndex === 3 ? (
                      <div className="text-center">
                        <h4 className="font-bold text-gray-800 mb-1">{vehicle.plate}</h4>
                        <div className="text-lg font-bold text-green-600">{vehicle.compliance.toFixed(1)}%</div>
                        <div className="text-xs text-green-700">
                          {vehicle.criticalFailures === 0 ? 'Sin fallas críticas (período)' : `${vehicle.criticalFailures} fallas críticas (período)`}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {vehicle.totalInspections} inspecciones en período
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-gray-800">{vehicle.plate}</h4>
                          <span className={`text-sm ${vehicleBgColorClass} ${vehicleTextColorClass} px-2 py-1 rounded`}>
                            {vehicle.compliance.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Fallas: {vehicle.totalFailures} | Críticas: {vehicle.criticalFailures}</p>
                          <p>{vehicle.totalInspections} insp. período | {vehicle.totalInspectionsGlobal} total</p>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-6">
        {/* Información de filtros aplicados */}
        {(filters.dateStart || filters.dateEnd || filters.search || filters.inspector || filters.vehicle) && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Filter className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-indigo-800">Filtros Aplicados - Análisis de Vehículos</h3>
            </div>
            <div className="text-sm text-indigo-700">
              {filters.dateStart && <span className="mr-4"><strong>Desde:</strong> {filters.dateStart}</span>}
              {filters.dateEnd && <span className="mr-4"><strong>Hasta:</strong> {filters.dateEnd}</span>}
              {filters.search && <span className="mr-4"><strong>Búsqueda:</strong> "{filters.search}"</span>}
              {filters.inspector && <span className="mr-4"><strong>Conductor:</strong> {filters.inspector}</span>}
              {filters.vehicle && <span className="mr-4"><strong>Vehículo:</strong> {filters.vehicle}</span>}
              <div className="mt-2">
                <strong>Mostrando:</strong> {filteredData.length} inspecciones de {processedData.inspections.length} totales
                | {vehicles.length} vehículos de {Object.keys(vehicleDataAll).length} totales
              </div>
            </div>
          </div>
        )}

        {/* Resumen ejecutivo */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Vehículos en Filtro</p>
                <p className="text-xl font-bold text-gray-800">{vehicles.length}</p>
                <p className="text-xs text-gray-500">
                  de {Object.keys(vehicleDataAll).length} totales
                </p>
              </div>
              <Car className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 shadow-sm border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Excelente Estado</p>
                <p className="text-xl font-bold text-green-800">{excelentes.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 shadow-sm border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Buen Estado</p>
                <p className="text-xl font-bold text-blue-800">{buenos.length}</p>
              </div>
              <Gauge className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4 shadow-sm border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700">Estado Regular</p>
                <p className="text-xl font-bold text-yellow-800">{regulares.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4 shadow-sm border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Estado Crítico</p>
                <p className="text-xl font-bold text-red-800">{criticos.length}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">Análisis de Fallas en Período Filtrado</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-blue-700">
                <span className="font-semibold">Total Fallas (Período):</span><br />
                {vehicles.reduce((sum, v) => sum + v.totalFailures, 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-blue-700">
                <span className="font-semibold">Fallas Críticas (Período):</span><br />
                {vehicles.reduce((sum, v) => sum + v.criticalFailures, 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-blue-700">
                <span className="font-semibold">Items Problemáticos:</span><br />
                {topProblematicItems.length} tipos identificados
              </p>
            </div>
            <div>
              <p className="text-blue-700">
                <span className="font-semibold">Cumplimiento en Período:</span><br />
                {vehicles.length > 0 ? 
                  (vehicles.reduce((sum, v) => sum + v.compliance, 0) / vehicles.length).toFixed(2) : 0
                }%
              </p>
            </div>
          </div>
        </div>

        {topProblematicItems.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
              Items que Más Fallan (en período filtrado)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {topProblematicItems.map((item, index) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {item.isCritical && (
                        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      )}
                      <h4 className="font-semibold text-red-900">{item.name}</h4>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-700">{item.totalFailures}</div>
                      <div className="text-xs text-red-600">fallas en período</div>
                    </div>
                  </div>
                  <div className="text-sm text-red-800">
                    <p><span className="font-semibold">Vehículos afectados:</span> {item.affectedVehicleCount}</p>
                    <p className="text-xs text-red-600 mt-1">
                      {item.affectedVehicles.slice(0, 3).join(', ')}
                      {item.affectedVehicles.length > 3 && ` (+${item.affectedVehicles.length - 3} más)`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {renderVehicleSection(criticos, { 
          color: 'red', 
          title: 'Vehículos en Estado Crítico - Mantenimiento URGENTE', 
          icon: XCircle, 
          status: 'MANTENIMIENTO INMEDIATO' 
        }, 0)}
        
        {renderVehicleSection(regulares, { 
          color: 'yellow', 
          title: 'Vehículos en Estado Regular - Mantenimiento Requerido', 
          icon: AlertTriangle, 
          status: 'Mantenimiento programado' 
        }, 1)}
        
        {renderVehicleSection(buenos, { 
          color: 'blue', 
          title: 'Vehículos en Buen Estado', 
          icon: Gauge, 
          status: 'Buen estado' 
        }, 2)}
        
        {renderVehicleSection(excelentes, { 
          color: 'green', 
          title: 'Vehículos en Excelente Estado', 
          icon: CheckCircle, 
          status: 'Excelente' 
        }, 3)}
      </div>
    );
  };

  // Header del sistema
  const SystemHeader = () => (
    <div className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-100 rounded-lg p-2">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Inspector Vehicular v2.0</h1>
            {systemStats && (
              <p className="text-sm text-gray-500">
                {systemStats.totalInspections.toLocaleString()} inspecciones | 
                {systemStats.uniqueCounts.inspectors} conductores |
                {systemStats.uniqueCounts.vehicles} vehículos |
                Promedio: {systemStats.averageCompliance.toFixed(1)}%
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {processedData && (
            <>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  showFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </button>
              <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </button>
            </>
          )}
          <button
            onClick={() => {
              setIsAuthenticated(false);
              setProcessedData(null);
              setSystemStats(null);
            }}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Salir
          </button>
        </div>
      </div>
    </div>
  );

  // Verificación de sesión
  useEffect(() => {
    const sessionData = '';
    if (sessionData) {
      try {
        const session = JSON.parse(atob(sessionData));
        if (session.authenticated && Date.now() < session.expires) {
          setIsAuthenticated(true);
          setSessionTimeout(session.expires);
        }
      } catch (error) {
        console.log('Session invalid');
      }
    }
  }, []);

  // Timeout de sesión
  useEffect(() => {
    if (sessionTimeout) {
      const timeLeft = sessionTimeout - Date.now();
      if (timeLeft > 0) {
        const timer = setTimeout(() => {
          setIsAuthenticated(false);
          setProcessedData(null);
          setSystemStats(null);
          alert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
        }, timeLeft);
        
        return () => clearTimeout(timer);
      }
    }
  }, [sessionTimeout]);

  // Render principal
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SystemHeader />
      
      <div className="flex">
        <div className="w-64 bg-white shadow-sm h-screen sticky top-0">
          <div className="p-4 space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'conductores', label: 'Conductores', icon: User },
              { id: 'vehicles', label: 'Vehículos', icon: Car },
              { id: 'trends', label: 'Tendencias', icon: TrendingUp },
              { id: 'critical', label: 'Items Críticos', icon: AlertTriangle }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-3" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 p-6">
          {!processedData ? (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Sistema de Análisis Vehicular v2.0
                </h2>
                <p className="text-gray-600">
                  Cargue su archivo Excel/CSV para análisis automático completo
                </p>
              </div>
              
              <FileUpload />
              
              {isProcessing && (
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-700">Procesando archivo Excel...</p>
                      <p className="text-sm text-blue-600">Análisis automático en progreso</p>
                    </div>
                  </div>
                  
                  <div className="w-full bg-blue-200 rounded-full h-2.5 mb-2">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-center text-sm text-blue-600">
                    {processingProgress}% completado
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <AdvancedFilters />
              
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'conductores' && <ConductorAnalysis />}
              {activeTab === 'vehicles' && <VehicleAnalysis />}
              
              {!['dashboard', 'conductores', 'vehicles'].includes(activeTab) && (
                <div className="bg-white rounded-xl p-8 shadow-sm border text-center">
                  <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    {activeTab === 'trends' && 'Análisis de Tendencias Temporales'}
                    {activeTab === 'critical' && 'Análisis de Items Críticos'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Sección en desarrollo
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                    <p className="font-semibold mb-2">Datos procesados:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <p>• {systemStats.uniqueCounts.inspectors} conductores únicos</p>
                      <p>• {systemStats.uniqueCounts.vehicles} vehículos únicos</p>
                      <p>• {systemStats.uniqueCounts.locations} ubicaciones</p>
                      <p>• {systemStats.uniqueCounts.inspectionItems} items de inspección</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalle de items */}
      <ItemDetailModal />
    </div>
  );
};

export default InspectorVehicularSystem;
