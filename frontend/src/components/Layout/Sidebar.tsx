import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Upload, 
  Search, 
  AlertTriangle, 
  Wrench, 
  BarChart3, 
  FileText,
  Settings,
  X
} from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const menuItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Panel principal HQ-FO-40'
    },
    {
      path: '/upload',
      label: 'Cargar Excel',
      icon: Upload,
      description: 'Subir archivos de inspección'
    },
    {
      path: '/search',
      label: 'Buscar y Filtrar',
      icon: Search,
      description: 'Búsqueda avanzada de datos'
    },
    {
      path: '/fatigue',
      label: 'Control Fatiga',
      icon: AlertTriangle,
      description: 'Supervisión de conductores'
    },
    {
      path: '/failures',
      label: 'Fallas Mecánicas',
      icon: Wrench,
      description: 'Categorización de fallas'
    },
    {
      path: '/charts',
      label: 'Gráficas',
      icon: BarChart3,
      description: 'Visualización interactiva'
    },
    {
      path: '/reports',
      label: 'Reportes',
      icon: FileText,
      description: 'Generación de reportes PDF/Excel'
    },
    {
      path: '/normalization',
      label: 'Normalización',
      icon: Settings,
      description: 'Reporte de datos normalizados'
    }
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      {/* Header del sidebar */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <FileText size={32} className="logo-icon" />
          </div>
          <div className="sidebar-brand-text">
            <h1 className="sidebar-title">HQ-FO-40</h1>
            <p className="sidebar-subtitle">Sistema v1.0</p>
          </div>
        </div>
        
        {/* Botón para cerrar en móvil */}
        <button 
          className="sidebar-close-button"
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navegación principal */}
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path} className="sidebar-menu-item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) => 
                    `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                  }
                  onClick={onClose} // Cerrar sidebar en móvil al hacer click
                >
                  <Icon size={20} className="sidebar-icon" />
                  <span className="sidebar-text">
                    <span className="sidebar-label">{item.label}</span>
                    <span className="sidebar-description">{item.description}</span>
                  </span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer del sidebar */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            <span>AI</span>
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">Sistema Automatizado</p>
            <p className="sidebar-user-role">Administrador</p>
          </div>
        </div>
        
        <div className="sidebar-version">
          <p>Versión 2.0.0</p>
          <p>© 2024 InspectAuto</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;