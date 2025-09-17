import React from 'react';
import { BarChart3 } from 'lucide-react';
import '../styles/pages.css';

const Analysis: React.FC = () => {
  return (
    <div className="analysis-page">
      <div className="page-header">
        <div className="page-title">
          <BarChart3 size={32} />
          <div>
            <h1>Análisis de Datos</h1>
            <p>Análisis estadístico y tendencias del sistema</p>
          </div>
        </div>
      </div>
      
      <div className="page-content">
        <div className="coming-soon">
          <BarChart3 size={64} />
          <h2>Módulo en Desarrollo</h2>
          <p>El análisis de datos estará disponible próximamente.</p>
        </div>
      </div>
    </div>
  );
};

export default Analysis;