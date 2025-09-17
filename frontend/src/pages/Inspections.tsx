import React from 'react';
import { ClipboardCheck } from 'lucide-react';
import '../styles/pages.css';

const Inspections: React.FC = () => {
  return (
    <div className="inspections-page">
      <div className="page-header">
        <div className="page-title">
          <ClipboardCheck size={32} />
          <div>
            <h1>Inspecciones</h1>
            <p>Gestión de inspecciones técnicas vehiculares</p>
          </div>
        </div>
      </div>
      
      <div className="page-content">
        <div className="coming-soon">
          <ClipboardCheck size={64} />
          <h2>Módulo en Desarrollo</h2>
          <p>La gestión de inspecciones estará disponible próximamente.</p>
        </div>
      </div>
    </div>
  );
};

export default Inspections;