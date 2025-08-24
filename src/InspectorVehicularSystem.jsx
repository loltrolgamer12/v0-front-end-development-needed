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
    dayOfWeek: '',
    complianceMin: 0,
    complianceMax: 100,
    dateStart: '',
    dateEnd: '',
    riskLevel: '',
    criticalItemsOnly: false
  });
  const [showFilters, setShowFilters] = useState(false);
  
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

    // Filtro por día de la semana
    if (filters.dayOfWeek && filters.dayOfWeek !== '') {
      filtered = filtered.filter(insp => {
        if (!insp.timestamp) return false;
        try {
          const date = new Date(insp.timestamp);
          if (isNaN(date.getTime())) return false;
          return date.getDay().toString() === filters.dayOfWeek;
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

      console.log('Inspecciones válidas:', validInspections.length, 'de', processedInspections.length);

      const uniqueValues = {
        inspectors: [...new Set(validInspections.map(i => i.inspector))].sort(),
        vehicles: [...new Set(validInspections.map(i => i.vehicle))].sort(),
        locations: [...new Set(validInspections.map(i => i.location))].filter(l => l !== 'Sin especificar').sort(),
        contracts: [...new Set(validInspections.map(i => i.contract))].filter(c => c !== 'Sin especificar').sort(),
        shifts: [...new Set(validInspections.map(i => i.shift))].filter(s => s !== 'Sin especificar').sort(),
        inspectionItems: detectedColumns.inspectionItems.map(i => i.cleanName),
        years: [...new Set(validInspections.map(i => i.timestamp ? new Date(i.timestamp).getFullYear() : null))].filter(y => y).sort(),
        months: [...new Set(validInspections.map(i => i.timestamp ? new Date(i.timestamp).getMonth() + 1 : null))].filter(m => m).sort()
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
    if (!processedData) return null;
    
    return (
      <div className={`bg-white rounded-lg border p-4 mb-6 transition-all duration-300 ${showFilters ? 'block' : 'hidden'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Buscar conductor, placa, campo..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conductor/Inspector</label>
            <select
              value={filters.inspector}
              onChange={(e) => setFilters(prev => ({ ...prev, inspector: e.target.value }))}
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
              onChange={(e) => setFilters(prev => ({ ...prev, vehicle: e.target.value }))}
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
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas las ubicaciones</option>
              {processedData.uniqueValues.locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de Riesgo</label>
            <select
              value={filters.riskLevel}
              onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los niveles</option>
              <option value="Bajo">🟢 Bajo</option>
              <option value="Medio">🟡 Medio</option>
              <option value="Alto">🟠 Alto</option>
              <option value="Crítico">🔴 Crítico</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
            <select
              value={filters.shift}
              onChange={(e) => setFilters(prev => ({ ...prev, shift: e.target.value }))}
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
              onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
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
              onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Día de la Semana</label>
            <select
              value={filters.dayOfWeek}
              onChange={(e) => setFilters(prev => ({ ...prev, dayOfWeek: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los días</option>
              <option value="0">Domingo</option>
              <option value="1">Lunes</option>
              <option value="2">Martes</option>
              <option value="3">Miércoles</option>
              <option value="4">Jueves</option>
              <option value="5">Viernes</option>
              <option value="6">Sábado</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.criticalItemsOnly}
                onChange={(e) => setFilters(prev => ({ ...prev, criticalItemsOnly: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Solo fallas críticas</span>
            </label>
          </div>
          
          <button
            onClick={() => setFilters({
              search: '',
              inspector: '',
              vehicle: '',
              location: '',
              contract: '',
              shift: '',
              year: '',
              month: '',
              dayOfWeek: '',
              complianceMin: 0,
              complianceMax: 100,
              dateStart: '',
              dateEnd: '',
              riskLevel: '',
              criticalItemsOnly: false
            })}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Limpiar Filtros
          </button>
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

    return (
      <div className="space-y-6">
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
                  {systemStats.uniqueCounts.inspectors}
                </p>
                <p className="text-xs text-gray-400">
                  {systemStats.uniqueCounts.vehicles} vehículos
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
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {Object.values(processedData.itemAnalysis)
              .sort((a, b) => b.failureRate - a.failureRate)
              .slice(0, 10)
              .map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 flex-1">
                    {item.isCritical && (
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                    <span className="text-sm text-gray-700 truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-red-600">
                      {item.failureRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.nonCompliant}/{item.total}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  // Análisis de vehículos
  const VehicleAnalysisNuevo = () => {
    if (!processedData || !filteredData) return null;

    const vehicleData = {};
    
    filteredData.forEach(insp => {
      if (insp.vehicle && insp.vehicle !== 'Sin especificar') {
        if (!vehicleData[insp.vehicle]) {
          vehicleData[insp.vehicle] = {
            plate: insp.vehicle,
            inspections: [],
            inspectors: new Set(),
            locations: new Set(),
            failures: {},
            criticalFailures: {},
            mileages: []
          };
        }
        
        vehicleData[insp.vehicle].inspections.push(insp);
        vehicleData[insp.vehicle].inspectors.add(insp.inspector);
        vehicleData[insp.vehicle].locations.add(insp.location);
        vehicleData[insp.vehicle].mileages.push(insp.mileage || 0);
        
        Object.entries(insp.items || {}).forEach(([itemName, itemData]) => {
          if (!itemData.compliant) {
            if (!vehicleData[insp.vehicle].failures[itemName]) {
              vehicleData[insp.vehicle].failures[itemName] = 0;
            }
            vehicleData[insp.vehicle].failures[itemName]++;
            
            if (itemData.isCritical) {
              if (!vehicleData[insp.vehicle].criticalFailures[itemName]) {
                vehicleData[insp.vehicle].criticalFailures[itemName] = 0;
              }
              vehicleData[insp.vehicle].criticalFailures[itemName]++;
            }
          }
        });
      }
    });

    const vehiculos = Object.values(vehicleData).map(vehicle => {
      let totalItems = 0;
      let compliantItems = 0;
      let criticalFailures = 0;
      let lastDate = null;
      let totalFailures = 0;

      vehicle.inspections.forEach(insp => {
        totalItems += insp.totalItems || 0;
        compliantItems += insp.compliantItems || 0;
        criticalFailures += insp.criticalFailures || 0;
        
        if (insp.timestamp) {
          const date = new Date(insp.timestamp);
          if (!lastDate || date > lastDate) {
            lastDate = date;
          }
        }
      });

      totalFailures = Object.values(vehicle.failures).reduce((sum, count) => sum + count, 0);
      const compliance = totalItems > 0 ? (compliantItems / totalItems) * 100 : 0;
      
      let status = 'verde';
      if (criticalFailures > 5 || compliance < 70) status = 'rojo';
      else if (criticalFailures > 2 || compliance < 85) status = 'amarillo';

      let risk = 'Bajo';
      if (criticalFailures > 10 || compliance < 60) risk = 'Crítico';
      else if (criticalFailures > 5 || compliance < 75) risk = 'Alto';
      else if (criticalFailures > 2 || compliance < 90) risk = 'Medio';

      const validMileages = vehicle.mileages.filter(m => m > 0);
      const avgMileage = validMileages.length > 0 ? 
        validMileages.reduce((sum, m) => sum + m, 0) / validMileages.length : 0;

      const topFailures = Object.entries(vehicle.failures)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

      const topCriticalFailures = Object.entries(vehicle.criticalFailures)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);

      return {
        plate: vehicle.plate,
        totalInspections: vehicle.inspections.length,
        compliance: Math.round(compliance * 100) / 100,
        totalItems,
        compliantItems,
        criticalFailures,
        totalFailures,
        inspectorCount: vehicle.inspectors.size,
        locationCount: vehicle.locations.size,
        lastDate,
        status,
        risk,
        avgMileage: Math.round(avgMileage),
        topFailures,
        topCriticalFailures
      };
    }).sort((a, b) => b.criticalFailures - a.criticalFailures);

    const verdes = vehiculos.filter(v => v.status === 'verde');
    const amarillos = vehiculos.filter(v => v.status === 'amarillo');
    const rojos = vehiculos.filter(v => v.status === 'rojo');

    const globalFailures = {};
    const globalCriticalFailures = {};
    
    Object.values(vehicleData).forEach(vehicle => {
      Object.entries(vehicle.failures).forEach(([item, count]) => {
        globalFailures[item] = (globalFailures[item] || 0) + count;
      });
      Object.entries(vehicle.criticalFailures).forEach(([item, count]) => {
        globalCriticalFailures[item] = (globalCriticalFailures[item] || 0) + count;
      });
    });

    const topGlobalFailures = Object.entries(globalFailures)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    const topGlobalCriticalFailures = Object.entries(globalCriticalFailures)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    if (vehiculos.length === 0) {
      return (
        <div className="bg-white rounded-xl p-8 shadow-sm border text-center">
          <Car className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No hay datos de vehículos disponibles
          </h3>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Vehículos</p>
                <p className="text-xl font-bold text-gray-800">{vehiculos.length}</p>
              </div>
              <Car className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 shadow-sm border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Estado Óptimo</p>
                <p className="text-xl font-bold text-green-800">{verdes.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4 shadow-sm border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700">Requiere Atención</p>
                <p className="text-xl font-bold text-yellow-800">{amarillos.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4 shadow-sm border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Estado Crítico</p>
                <p className="text-xl font-bold text-red-800">{rojos.length}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-red-800 mb-4">
              Items Críticos Más Problemáticos
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {topGlobalCriticalFailures.map(([item, count], index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center space-x-2 flex-1">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">
                      {item.replace(/^\*\*/, '')}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-red-600">{count}</div>
                    <div className="text-xs text-gray-500">fallas</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-orange-800 mb-4">
              Todos los Items Problemáticos
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {topGlobalFailures.map(([item, count], index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center space-x-2 flex-1">
                    <div className={`w-4 h-4 rounded-full flex-shrink-0 ${
                      item.startsWith('**') ? 'bg-red-500' : 'bg-orange-400'
                    }`}></div>
                    <span className="text-sm text-gray-700 truncate">
                      {item.replace(/^\*\*/, '')}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-orange-600">{count}</div>
                    <div className="text-xs text-gray-500">fallas</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {rojos.length > 0 && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xl font-bold text-red-800">
                Vehículos en Estado Crítico
              </h3>
              <div className="px-3 py-1 rounded-full text-sm font-bold bg-red-600 text-white">
                {rojos.length}
              </div>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {rojos.slice(0, 10).map(vehicle => (
                <div key={vehicle.plate} className="bg-white rounded-lg p-5 border-2 border-gray-200 shadow-md">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-800 mb-1">
                        Placa: {vehicle.plate}
                      </h4>
                      <div className="flex items-center space-x-4">
                        <div className="text-lg font-bold text-red-600">
                          {vehicle.compliance.toFixed(1)}% cumplimiento
                        </div>
                        <div className="text-sm text-gray-600">
                          ({vehicle.compliantItems}/{vehicle.totalItems} items)
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-1">Fallas críticas:</div>
                      <div className="text-2xl font-bold text-red-600">
                        {vehicle.criticalFailures}
                      </div>
                      <div className="text-sm text-gray-500">
                        {vehicle.totalFailures} fallas totales
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <div><span className="font-semibold">Inspecciones:</span> {conductor.totalInspections}</div>
                    <div><span className="font-semibold">Vehículos:</span> {conductor.vehicleCount}</div>
                    <div>
                      <span className="font-semibold">Fallas críticas:</span> 
                      <span className={conductor.criticalFailures > 0 ? 'text-red-600 font-bold ml-1' : 'ml-1'}>
                        {conductor.criticalFailures}
                      </span>
                    </div>
                    <div><span className="font-semibold">Ubicaciones:</span> {conductor.locationCount}</div>
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
                    <span className="text-sm text-red-700 font-bold bg-red-100 px-3 py-1 rounded border border-red-300">
                      INSPECCIÓN URGENTE
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
    const sessionData = sessionStorage.getItem('inspector_session');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        if (session.authenticated && Date.now() < session.expires) {
          setIsAuthenticated(true);
          setSessionTimeout(session.expires);
        } else {
          sessionStorage.removeItem('inspector_session');
        }
      } catch (error) {
        sessionStorage.removeItem('inspector_session');
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
          sessionStorage.removeItem('inspector_session');
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
        {/* Panel de navegación lateral */}
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

        {/* Contenido principal */}
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
              {activeTab === 'conductores' && <ConductorAnalysisNuevo />}
              {activeTab === 'vehicles' && <VehicleAnalysisNuevo />}
              
              {/* Placeholders para otras tabs */}
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
    </div>
  );
};

export default InspectorVehicularSystem;
                    <div><span className="font-semibold">Inspecciones:</span> {vehicle.totalInspections}</div>
                    <div><span className="font-semibold">Kilometraje prom:</span> {vehicle.avgMileage.toLocaleString()}</div>
                    <div><span className="font-semibold">Conductores:</span> {vehicle.inspectorCount}</div>
                    <div><span className="font-semibold">Ubicaciones:</span> {vehicle.locationCount}</div>
                  </div>
                  
                  {vehicle.topCriticalFailures.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-red-700 mb-2">
                        Fallas críticas más frecuentes:
                      </p>
                      <div className="space-y-1">
                        {vehicle.topCriticalFailures.map(([item, count], index) => (
                          <div key={index} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            {item.replace(/^\*\*/, '')}: {count} veces
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      vehicle.risk === 'Bajo' ? 'bg-green-100 text-green-800 border border-green-300' :
                      vehicle.risk === 'Medio' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                      vehicle.risk === 'Alto' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                      'bg-red-100 text-red-800 border border-red-300'
                    }`}>
                      Riesgo: {vehicle.risk}
                    </span>
                    <span className="text-sm text-red-700 font-bold bg-red-100 px-3 py-1 rounded border border-red-300">
                      MANTENIMIENTO URGENTE
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {amarillos.length > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-6 h-6 rounded-full bg-yellow-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xl font-bold text-yellow-800">
                Vehículos que Requieren Atención
              </h3>
              <div className="px-3 py-1 rounded-full text-sm font-bold bg-yellow-600 text-white">
                {amarillos.length}
              </div>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {amarillos.slice(0, 10).map(vehicle => (
                <div key={vehicle.plate} className="bg-white rounded-lg p-5 border-2 border-gray-200 shadow-md">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-800 mb-1">
                        Placa: {vehicle.plate}
                      </h4>
                      <div className="flex items-center space-x-4">
                        <div className="text-lg font-bold text-yellow-600">
                          {vehicle.compliance.toFixed(1)}% cumplimiento
                        </div>
                        <div className="text-sm text-gray-600">
                          ({vehicle.compliantItems}/{vehicle.totalItems} items)
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-1">Fallas críticas:</div>
                      <div className="text-2xl font-bold text-yellow-600">
                        {vehicle.criticalFailures}
                      </div>
                      <div className="text-sm text-gray-500">
                        {vehicle.totalFailures} fallas totales
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <div><span className="font-semibold">Inspecciones:</span> {vehicle.totalInspections}</div>
                    <div><span className="font-semibold">Kilometraje prom:</span> {vehicle.avgMileage.toLocaleString()}</div>
                    <div><span className="font-semibold">Conductores:</span> {vehicle.inspectorCount}</div>
                    <div><span className="font-semibold">Ubicaciones:</span> {vehicle.locationCount}</div>
                  </div>
                  
                  {vehicle.topFailures.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-yellow-700 mb-2">
                        Fallas más frecuentes:
                      </p>
                      <div className="space-y-1">
                        {vehicle.topFailures.slice(0, 3).map(([item, count], index) => (
                          <div key={index} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            {item.replace(/^\*\*/, '')}: {count} veces
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      vehicle.risk === 'Bajo' ? 'bg-green-100 text-green-800 border border-green-300' :
                      vehicle.risk === 'Medio' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                      vehicle.risk === 'Alto' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                      'bg-red-100 text-red-800 border border-red-300'
                    }`}>
                      Riesgo: {vehicle.risk}
                    </span>
                    <span className="text-sm text-yellow-700 font-bold bg-yellow-100 px-3 py-1 rounded border border-yellow-300">
                      Programar Mantenimiento
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {verdes.length > 0 && (
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xl font-bold text-green-800">
                Vehículos en Estado Óptimo
              </h3>
              <div className="px-3 py-1 rounded-full text-sm font-bold bg-green-600 text-white">
                {verdes.length}
              </div>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {verdes.slice(0, 15).map(vehicle => (
                <div key={vehicle.plate} className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-md">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-800 mb-1">
                        Placa: {vehicle.plate}
                      </h4>
                      <div className="flex items-center space-x-4">
                        <div className="text-lg font-bold text-green-600">
                          {vehicle.compliance.toFixed(1)}% cumplimiento
                        </div>
                        <div className="text-sm text-gray-600">
                          ({vehicle.compliantItems}/{vehicle.totalItems} items)
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-1">Fallas críticas:</div>
                      <div className="text-2xl font-bold text-green-600">
                        {vehicle.criticalFailures}
                      </div>
                      <div className="text-sm text-gray-500">
                        {vehicle.totalFailures} fallas totales
                      </div>
                    </div>
                    
                    <span className="text-sm text-green-700 font-bold bg-green-100 px-3 py-1 rounded border border-green-300 ml-4">
                      Estado Óptimo
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Análisis de conductores
  const ConductorAnalysisNuevo = () => {
    if (!processedData || !filteredData) return null;

    const today = new Date();
    const conductorData = {};
    
    filteredData.forEach(insp => {
      if (insp.inspector && insp.inspector !== 'Sin especificar') {
        if (!conductorData[insp.inspector]) {
          conductorData[insp.inspector] = {
            name: insp.inspector,
            inspections: [],
            vehicles: new Set(),
            locations: new Set()
          };
        }
        
        conductorData[insp.inspector].inspections.push(insp);
        conductorData[insp.inspector].vehicles.add(insp.vehicle);
        conductorData[insp.inspector].locations.add(insp.location);
      }
    });

    const conductores = Object.values(conductorData).map(conductor => {
      let totalItems = 0;
      let compliantItems = 0;
      let criticalFailures = 0;
      let lastDate = null;

      conductor.inspections.forEach(insp => {
        totalItems += insp.totalItems || 0;
        compliantItems += insp.compliantItems || 0;
        criticalFailures += insp.criticalFailures || 0;
        
        if (insp.timestamp) {
          const date = new Date(insp.timestamp);
          if (!lastDate || date > lastDate) {
            lastDate = date;
          }
        }
      });

      const compliance = totalItems > 0 ? (compliantItems / totalItems) * 100 : 0;
      
      let daysSince = 999;
      if (lastDate) {
        const timeDiff = today.getTime() - lastDate.getTime();
        daysSince = Math.floor(timeDiff / (1000 * 3600 * 24));
      }

      let status = 'rojo';
      if (daysSince <= 5) status = 'verde';
      else if (daysSince <= 10) status = 'amarillo';

      let risk = 'Bajo';
      if (compliance < 70) risk = 'Crítico';
      else if (compliance < 85) risk = 'Alto';
      else if (compliance < 95) risk = 'Medio';

      return {
        name: conductor.name,
        totalInspections: conductor.inspections.length,
        compliance: Math.round(compliance * 100) / 100,
        totalItems,
        compliantItems,
        criticalFailures,
        vehicleCount: conductor.vehicles.size,
        locationCount: conductor.locations.size,
        lastDate,
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
            No hay datos de conductores disponibles
          </h3>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Conductores</p>
                <p className="text-xl font-bold text-gray-800">{conductores.length}</p>
              </div>
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 shadow-sm border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Al Día (≤5 días)</p>
                <p className="text-xl font-bold text-green-800">{verdes.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4 shadow-sm border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700">Próximo Vencimiento (6-10 días)</p>
                <p className="text-xl font-bold text-yellow-800">{amarillos.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4 shadow-sm border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Vencidos (&gt;10 días)</p>
                <p className="text-xl font-bold text-red-800">{rojos.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">Validación de Datos Completada</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-blue-700">
                <span className="font-semibold">Cumplimiento Real Promedio:</span><br />
                {conductores.length > 0 ? 
                  (conductores.reduce((sum, c) => sum + c.compliance, 0) / conductores.length).toFixed(2) : 0
                }%
              </p>
            </div>
            <div>
              <p className="text-blue-700">
                <span className="font-semibold">Items Evaluados:</span><br />
                {conductores.reduce((sum, c) => sum + c.totalItems, 0).toLocaleString()} totales
              </p>
            </div>
            <div>
              <p className="text-blue-700">
                <span className="font-semibold">Items Cumplidos:</span><br />
                {conductores.reduce((sum, c) => sum + c.compliantItems, 0).toLocaleString()} cumplidos
              </p>
            </div>
          </div>
        </div>

        {verdes.length > 0 && (
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xl font-bold text-green-800">
                Conductores Al Día (≤5 días)
              </h3>
              <div className="px-3 py-1 rounded-full text-sm font-bold bg-green-600 text-white">
                {verdes.length}
              </div>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {verdes.map(conductor => (
                <div key={conductor.name} className="bg-white rounded-lg p-5 border-2 border-gray-200 shadow-md">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-800 mb-1">{conductor.name}</h4>
                      <div className="flex items-center space-x-4">
                        <div className="text-lg font-bold text-green-600">
                          {conductor.compliance.toFixed(1)}% cumplimiento
                        </div>
                        <div className="text-sm text-gray-600">
                          ({conductor.compliantItems}/{conductor.totalItems} items)
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-1">Última inspección:</div>
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
                      <div className="text-xl font-bold mt-1 text-green-600">
                        {conductor.daysSince === 999 ? 
                          'Sin fecha' : 
                          `${conductor.daysSince} días atrás`
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <div><span className="font-semibold">Inspecciones:</span> {conductor.totalInspections}</div>
                    <div><span className="font-semibold">Vehículos:</span> {conductor.vehicleCount}</div>
                    <div>
                      <span className="font-semibold">Fallas críticas:</span> 
                      <span className={conductor.criticalFailures > 0 ? 'text-red-600 font-bold ml-1' : 'ml-1'}>
                        {conductor.criticalFailures}
                      </span>
                    </div>
                    <div><span className="font-semibold">Ubicaciones:</span> {conductor.locationCount}</div>
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
                    <span className="text-sm text-green-700 font-bold bg-green-100 px-3 py-1 rounded border border-green-300">
                      Al día
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {amarillos.length > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-6 h-6 rounded-full bg-yellow-600 flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xl font-bold text-yellow-800">
                Conductores Próximos a Vencer (6-10 días)
              </h3>
              <div className="px-3 py-1 rounded-full text-sm font-bold bg-yellow-600 text-white">
                {amarillos.length}
              </div>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {amarillos.map(conductor => (
                <div key={conductor.name} className="bg-white rounded-lg p-5 border-2 border-gray-200 shadow-md">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-800 mb-1">{conductor.name}</h4>
                      <div className="flex items-center space-x-4">
                        <div className="text-lg font-bold text-yellow-600">
                          {conductor.compliance.toFixed(1)}% cumplimiento
                        </div>
                        <div className="text-sm text-gray-600">
                          ({conductor.compliantItems}/{conductor.totalItems} items)
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-1">Última inspección:</div>
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
                      <div className="text-xl font-bold mt-1 text-yellow-600">
                        {conductor.daysSince === 999 ? 
                          'Sin fecha' : 
                          `${conductor.daysSince} días atrás`
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <div><span className="font-semibold">Inspecciones:</span> {conductor.totalInspections}</div>
                    <div><span className="font-semibold">Vehículos:</span> {conductor.vehicleCount}</div>
                    <div>
                      <span className="font-semibold">Fallas críticas:</span> 
                      <span className={conductor.criticalFailures > 0 ? 'text-red-600 font-bold ml-1' : 'ml-1'}>
                        {conductor.criticalFailures}
                      </span>
                    </div>
                    <div><span className="font-semibold">Ubicaciones:</span> {conductor.locationCount}</div>
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
                    <span className="text-sm text-yellow-700 font-bold bg-yellow-100 px-3 py-1 rounded border border-yellow-300">
                      Próximo a vencer
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {rojos.length > 0 && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xl font-bold text-red-800">
                Conductores con Inspecciones Vencidas (&gt;10 días)
              </h3>
              <div className="px-3 py-1 rounded-full text-sm font-bold bg-red-600 text-white">
                {rojos.length}
              </div>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {rojos.map(conductor => (
                <div key={conductor.name} className="bg-white rounded-lg p-5 border-2 border-gray-200 shadow-md">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-800 mb-1">{conductor.name}</h4>
                      <div className="flex items-center space-x-4">
                        <div className="text-lg font-bold text-red-600">
                          {conductor.compliance.toFixed(1)}% cumplimiento
                        </div>
                        <div className="text-sm text-gray-600">
                          ({conductor.compliantItems}/{conductor.totalItems} items)
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-1">Última inspección:</div>
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
                      <div className="text-xl font-bold mt-1 text-red-600">
                        {conductor.daysSince === 999 ? 
                          'Sin fecha' : 
                          `${conductor.daysSince} días atrás`
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
