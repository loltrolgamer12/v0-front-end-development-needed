import React from 'react';
import { FileText } from 'lucide-react';
import '../styles/pages.css';

const Reports: React.FC = () => {
  return (
    <div className="reports-page">
      <div className="page-header">
        <div className="page-title">
          <FileText size={32} />
          <div>
            <h1>Reportes</h1>
            <p>Generación y gestión de reportes del sistema</p>
          </div>
        </div>
      </div>
      
      <div className="page-content">
        <div className="coming-soon">
          <FileText size={64} />
          <h2>Módulo en Desarrollo</h2>
          <p>Los reportes estarán disponibles próximamente.</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;