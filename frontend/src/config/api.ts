// Configuración de API para el frontend
// Maneja diferentes entornos: desarrollo, producción, etc.

const getApiBaseUrl = (): string => {
  // En desarrollo usa el backend local
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000';
  }
  
  // En producción usa la URL fija del backend (sin hash dinámico)
  return process.env.REACT_APP_API_URL || 'https://back-analicis-exel.vercel.app';
};

export const API_BASE_URL = getApiBaseUrl();

// URLs específicas de endpoints (corregidas para coincidir con el backend)
export const API_ENDPOINTS = {
  // Endpoints principales
  health: `${API_BASE_URL}/api/health`,
  upload: `${API_BASE_URL}/api/upload`,
  validateFile: `${API_BASE_URL}/api/validate-file`,
  dashboard: `${API_BASE_URL}/api/dashboard`,
  search: `${API_BASE_URL}/api/search`,
  
  // Conductores
  conductores: `${API_BASE_URL}/api/conductores`,
  conductoresCompliance: `${API_BASE_URL}/api/conductores/compliance`,
  
  // Vehículos y fallas
  vehiculos: `${API_BASE_URL}/api/vehiculos`,
  fallas: `${API_BASE_URL}/api/fallas`,
  
  // Control de fatiga (endpoint corregido)
  fatiga: `${API_BASE_URL}/api/fatiga`,
  
  // Endpoints legacy (mantener compatibilidad)
  conductores_legacy: {
    fatiga: `${API_BASE_URL}/api/fatiga`, // Corrección: fatiga está en /api/fatiga, no /api/conductores/fatiga
    compliance: `${API_BASE_URL}/api/conductores/compliance`,
  },
  
  // Gráficas (endpoints implementados en el backend)
  graficas: {
    estadoVehiculos: `${API_BASE_URL}/api/graficas/estado-vehiculos`,
    fatigaConductores: `${API_BASE_URL}/api/graficas/fatiga-conductores`, 
    severidadFallas: `${API_BASE_URL}/api/graficas/severidad-fallas`,
    // Compatibilidad con nombres alternativos
    fallasCategoria: `${API_BASE_URL}/api/graficas/severidad-fallas`, // Alias
  },
};

export default API_ENDPOINTS;