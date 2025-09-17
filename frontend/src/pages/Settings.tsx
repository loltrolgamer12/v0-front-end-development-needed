import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import '../styles/pages.css';

const Settings: React.FC = () => {
  return (
    <div className="settings-page">
      <div className="page-header">
        <div className="page-title">
          <SettingsIcon size={32} />
          <div>
            <h1>Configuración</h1>
            <p>Configuración del sistema y preferencias</p>
          </div>
        </div>
      </div>
      
      <div className="page-content">
        <div className="coming-soon">
          <SettingsIcon size={64} />
          <h2>Módulo en Desarrollo</h2>
          <p>La configuración del sistema estará disponible próximamente.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;