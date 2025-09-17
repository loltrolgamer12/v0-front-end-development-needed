import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Obtener el título de la página basado en la ruta actual
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Dashboard HQ-FO-40';
      case '/upload':
        return 'Carga de Archivos Excel';
      case '/search':
        return 'Búsqueda y Filtros';
      case '/fatigue':
        return 'Control de Fatiga';
      case '/failures':
        return 'Fallas Mecánicas';
      case '/charts':
        return 'Gráficas Interactivas';
      case '/reports':
        return 'Sistema de Reportes';
      default:
        return 'Sistema HQ-FO-40';
    }
  };

  return (
    <div className="layout">
      {/* Overlay para cerrar sidebar en móvil */}
      {sidebarOpen && (
        <div 
          className="layout-overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {/* Contenido principal */}
      <div className="layout-main">
        {/* Header */}
        <Header 
          title={getPageTitle()}
          onMenuClick={toggleSidebar}
        />

        {/* Contenido de las páginas */}
        <main className="layout-content">
          <div className="layout-content-inner">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;