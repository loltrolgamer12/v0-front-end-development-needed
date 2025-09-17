import React from 'react';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/pages.css';

const NotFound: React.FC = () => {
  return (
    <div className="not-found">
      <div className="not-found-content">
        <div className="not-found-icon">
          <AlertTriangle size={64} />
        </div>
        
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">Página no encontrada</h2>
        
        <p className="not-found-message">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>
        
        <div className="not-found-actions">
          <Link to="/dashboard" className="btn-primary">
            <Home size={18} />
            Ir al Dashboard
          </Link>
          
          <button 
            onClick={() => window.history.back()} 
            className="btn-secondary"
          >
            <ArrowLeft size={18} />
            Volver Atrás
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;