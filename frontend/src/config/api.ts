// Configuración de API para el frontend
// Maneja diferentes entornos: desarrollo, producción, etc.

const getApiBaseUrl = (): string => {
  // En desarrollo usa el backend local
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000';
  }
  
  // En producción usa la URL del backend deployado
  return process.env.REACT_APP_API_URL || 'https://analisis-exel-5boy5faui-loltrolgamer12s-projects.vercel.app';
};

export const API_BASE_URL = getApiBaseUrl();

// URLs específicas de endpoints
export const API_ENDPOINTS = {
  upload: `${API_BASE_URL}/api/upload`,
  dashboard: `${API_BASE_URL}/api/dashboard`,
  search: `${API_BASE_URL}/api/search`,
  conductores: {
    fatiga: `${API_BASE_URL}/api/conductores/fatiga`,
    compliance: `${API_BASE_URL}/api/conductores/compliance`,
  },
  vehiculos: `${API_BASE_URL}/api/vehiculos`,
  fallas: `${API_BASE_URL}/api/fallas`,
  graficas: {
    estadoVehiculos: `${API_BASE_URL}/api/graficas/estado_vehiculos`,
    fatigaConductores: `${API_BASE_URL}/api/graficas/fatiga_conductores`,
    severidadFallas: `${API_BASE_URL}/api/graficas/severidad_fallas`,
    fallasCategoria: `${API_BASE_URL}/api/graficas/fallas_categoria`,
  },
  reports: {
    history: `${API_BASE_URL}/api/reports/history`,
    generate: `${API_BASE_URL}/api/reports/generate`,
  },
  normalization: `${API_BASE_URL}/api/normalization`,
  notifications: `${API_BASE_URL}/api/notifications`,
};

export default API_ENDPOINTS;