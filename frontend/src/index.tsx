import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';
import App from './App';
import './index.css';

// Configuración global para producción

// Crear root de React 18
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Configuración de toast notifications
const toasterConfig = {
  duration: 4000,
  position: 'top-right' as const,
  reverseOrder: false,
  gutter: 8,
  containerClassName: '',
  containerStyle: {
    top: 20,
    right: 20,
  },
  toastOptions: {
    // Estilos por defecto para todos los toasts
    className: '',
    duration: 4000,
    style: {
      background: '#ffffff',
      color: '#374151',
      fontSize: '14px',
      fontWeight: '500',
      padding: '12px 16px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      maxWidth: '400px',
    },
    // Estilos específicos por tipo
    success: {
      style: {
        border: '1px solid #10b981',
        backgroundColor: '#f0fdf4',
      },
      iconTheme: {
        primary: '#10b981',
        secondary: '#ffffff',
      },
    },
    error: {
      style: {
        border: '1px solid #ef4444',
        backgroundColor: '#fef2f2',
      },
      iconTheme: {
        primary: '#ef4444',
        secondary: '#ffffff',
      },
    },
    loading: {
      style: {
        border: '1px solid #3b82f6',
        backgroundColor: '#eff6ff',
      },
      iconTheme: {
        primary: '#3b82f6',
        secondary: '#ffffff',
      },
    },
  },
};

// Renderizar la aplicación
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster {...toasterConfig} />
    </BrowserRouter>
  </React.StrictMode>
);

// Ocultar el loading spinner cuando React carga
document.body.classList.add('app-loaded');

// Service Worker para PWA (opcional)
// Si quieres que tu app funcione offline, cambia unregister() por register()
// Learn more about service workers: https://cra.link/PWA
// serviceWorker.unregister();

// Reportar métricas web vitals en desarrollo
if (process.env.NODE_ENV === 'development') {
  import('./reportWebVitals').then(({ default: reportWebVitals }) => {
    reportWebVitals();
  });
}

// Configuración global de axios para interceptors

// Configurar base URL
axios.defaults.baseURL = process.env.REACT_APP_API_URL || '/api';

// Interceptor para requests
axios.interceptors.request.use(
  (config) => {
    // Agregar token de autenticación si existe
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Agregar timestamp para debugging en desarrollo
    if (process.env.NODE_ENV === 'development') {
      (config as any).metadata = { startTime: new Date() };
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para responses
axios.interceptors.response.use(
  (response) => {
    // Log de performance en desarrollo
    if (process.env.NODE_ENV === 'development' && (response.config as any).metadata) {
      const endTime = new Date();
      const duration = endTime.getTime() - (response.config as any).metadata.startTime.getTime();
      console.log(`API call took ${duration}ms`);
    }
    
    return response;
  },
  (error) => {
    // Manejo global de errores
    if (error.response) {
      // El servidor respondió con un estado de error
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Token expirado o inválido
          localStorage.removeItem('authToken');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
        case 403:
          console.error('❌ Acceso denegado');
          break;
        case 404:
          console.error('❌ Recurso no encontrado');
          break;
        case 500:
          console.error('❌ Error interno del servidor');
          break;
        default:
          console.error(`❌ Error ${status}:`, data?.message || error.message);
      }
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      console.error('❌ Error de conexión:', error.message);
    } else {
      // Algo más causó el error
      console.error('❌ Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Configurar manejo de errores no capturados
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Promesa no capturada:', event.reason);
  
  // En desarrollo, mostrar el error completo
  if (process.env.NODE_ENV === 'development') {
    console.error('🔍 Stack trace:', event.reason);
  }
});

// Configurar manejo de errores de JavaScript
window.addEventListener('error', (event) => {
  console.error('❌ Error de JavaScript:', event.error);
  
  // En desarrollo, mostrar detalles adicionales
  if (process.env.NODE_ENV === 'development') {
    console.error('📍 Archivo:', event.filename);
    console.error('📍 Línea:', event.lineno);
    console.error('📍 Columna:', event.colno);
  }
});