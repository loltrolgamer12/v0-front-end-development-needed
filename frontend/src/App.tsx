import React, { useState, useEffect } from 'react';
import './App.css';
import { User, Truck, FileText, BarChart2, Upload } from 'lucide-react';
import FatigueControl, { InspectionData } from './components/FatigueControl/index';
import FileUpload from './components/FileUpload';



function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const sessionData = sessionStorage.getItem('session');
    if (sessionData) {
      try {
        const { expiresAt } = JSON.parse(sessionData);
        if (new Date().getTime() < expiresAt) {
          return true;
        }
        sessionStorage.removeItem('session');
      } catch (err) {
        sessionStorage.removeItem('session');
      }
    }
    return false;
  });
  
  const [password, setPassword] = useState<string>('');
  const [attempts, setAttempts] = useState<number>(() => {
    return parseInt(sessionStorage.getItem('attempts') || '3');
  });
  const [error, setError] = useState<string>('');
  const [activeSection, setActiveSection] = useState<string>('conductores');

  // Efecto para gestionar la sesión
  React.useEffect(() => {
    const checkAndUpdateSession = () => {
      const sessionData = sessionStorage.getItem('session');
      if (sessionData) {
        try {
          const { expiresAt } = JSON.parse(sessionData);
          if (new Date().getTime() >= expiresAt) {
            setIsAuthenticated(false);
            sessionStorage.removeItem('session');
            return false;
          }
          return true;
        } catch (err) {
          sessionStorage.removeItem('session');
          setIsAuthenticated(false);
          return false;
        }
      }
      return false;
    };

    if (isAuthenticated) {
      const sessionData = {
        expiresAt: new Date().getTime() + (8 * 60 * 60 * 1000) // 8 horas en milisegundos
      };
      sessionStorage.setItem('session', JSON.stringify(sessionData));

      const checkSession = setInterval(checkAndUpdateSession, 60000); // Revisar cada minuto
      return () => clearInterval(checkSession);
    }
  }, [isAuthenticated]);

  // Efecto para persistir los intentos
  React.useEffect(() => {
    sessionStorage.setItem('attempts', attempts.toString());
  }, [attempts]);

  const handleLogin = () => {
    if (password === 'InspectorVehicular2024!') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setAttempts(prev => prev - 1);
      setError(`Contraseña incorrecta. Intentos restantes: ${attempts - 1}`);
      if (attempts <= 1) {
        setError('Has excedido el número máximo de intentos. Recarga la página para intentar de nuevo.');
      }
    }
    setPassword('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Inspector Vehicular</h2>
              <p className="text-gray-500 text-sm mb-4">Sistema de Análisis v2.0</p>
            </div>
            <div className="w-28 h-28 mb-4">
              <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clave de Acceso
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese la clave del sistema"
                  disabled={attempts <= 0}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 mt-1">
                {error}
              </p>
            )}

            <button
              onClick={handleLogin}
              disabled={attempts <= 0 || !password}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Acceder al Sistema
            </button>

            <p className="text-xs text-center text-gray-500 mt-4">
              Sesión válida por 8 horas
              <br />
              Intentos restantes: {attempts}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const [inspectionData, setInspectionData] = useState<InspectionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setUploadError(null);
    try {
      setIsLoading(true);
      
      // Validar tipo de archivo
      const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Tipo de archivo no válido. Por favor, sube un archivo Excel (.xlsx) o CSV.');
      }

      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('El archivo es demasiado grande. El tamaño máximo permitido es 10MB.');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al procesar el archivo');
      }

      const data = await response.json();
      setInspectionData(data);
    } catch (error) {
      console.error('Error:', error);
      setUploadError(error instanceof Error ? error.message : 'Error desconocido al procesar el archivo');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Sistema de Análisis Vehicular v2.0</h2>
              <p className="text-gray-500 mb-6">Cargue su archivo Excel/CSV para análisis automático completo</p>
              {uploadError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{uploadError}</p>
                </div>
              )}
              <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} />
            </div>
          </div>
        );
      case 'conductores':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lista de Conductores */}
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-500" />
                  Lista de Conductores
                </h3>
                <div className="space-y-4">
                  {inspectionData.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No hay datos disponibles. Por favor, cargue un archivo.
                    </p>
                  ) : (
                    // Aquí irá la lista de conductores cuando haya datos
                    <div className="space-y-2">
                      {Array.from(new Set(inspectionData.map(d => d.CONDUCTOR))).map(conductor => (
                        <div key={conductor} className="p-3 bg-gray-50 rounded-lg">
                          <p className="font-medium text-gray-700">{conductor}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Panel de Control de Fatiga */}
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-500" />
                  Control de Fatiga
                </h3>
                <FatigueControl inspectionData={inspectionData} />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex justify-between items-center">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-4">
                <img src="/logo.jpeg" alt="Logo" className="h-12" />
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Sistema de Control Vehicular</h1>
                  <p className="text-sm text-gray-500">Panel de Administración</p>
                </div>
              </div>
              <button
                onClick={() => {
                  sessionStorage.clear();
                  setIsAuthenticated(false);
                  setAttempts(3);
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg flex items-center"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <svg 
                  className="w-4 h-4 mr-2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  role="img"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                  />
                </svg>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>

                    {/* Navigation */}
          <div className="flex space-x-1 py-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
              { id: 'conductores', label: 'Conductores', icon: User },
              { id: 'vehiculos', label: 'Vehículos', icon: Truck }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  activeSection === tab.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
