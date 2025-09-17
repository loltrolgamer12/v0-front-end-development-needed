import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard';
import FileUploader from './components/FileUploader';
import SearchFilter from './components/SearchFilter';
import FatigueControl from './components/FatigueControl';
import VehicleFailures from './components/VehicleFailures';
import Charts from './components/Charts';
import Reports from './components/Reports';
import NormalizationReport from './components/NormalizationReport';
import DriverCompliance from './components/DriverCompliance';
import NotFound from './pages/NotFound';
import './App.css';

// Configuración de rutas de la aplicación
const App: React.FC = () => {
  // Solo limpiar cache temporal al iniciar
  React.useEffect(() => {
    // Limpiar solo datos temporales de uploads
    sessionStorage.removeItem('lastUploadResult');
    sessionStorage.removeItem('tempAnalysisData');
  }, []);

  return (
    <div className="App">
      <Layout>
        <Routes>
          {/* Ruta por defecto - redirige al dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Rutas principales del sistema HQ-FO-40 */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<FileUploader />} />
          <Route path="/search" element={<SearchFilter />} />
          <Route path="/fatigue" element={<FatigueControl />} />
          <Route path="/failures" element={<VehicleFailures />} />
          <Route path="/charts" element={<Charts />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/normalization" element={<NormalizationReport />} />
          <Route path="/drivers" element={<DriverCompliance />} />
          
          {/* Ruta 404 - debe estar al final */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </div>
  );
};

export default App;