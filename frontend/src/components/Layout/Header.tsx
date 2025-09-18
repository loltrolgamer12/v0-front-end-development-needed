import React, { useState, useEffect } from 'react';
import { Menu, Bell, User, Search, X, AlertTriangle, Car, Users } from 'lucide-react';
import './Header.css';
import { API_ENDPOINTS } from '../../config/api';
import { fetchWithLogging } from '../../utils/fetchWithLogging';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

interface CriticalNotification {
  id: string;
  type: 'vehiculo' | 'conductor' | 'falla';
  title: string;
  message: string;
  timestamp: string;
  priority: 'critico' | 'alto';
}

const Header: React.FC<HeaderProps> = ({ title, onMenuClick }) => {
  const [notifications, setNotifications] = useState<CriticalNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);

  // Función para obtener notificaciones críticas
  const fetchCriticalNotifications = async () => {
    setLoading(true);
    console.log('🔔 Header: Iniciando carga de notificaciones críticas...');
    
    try {
      // Obtener datos críticos de vehículos, conductores y fallas
      console.log('📡 Header: Realizando llamadas paralelas a APIs...');
      
      const [vehiculosRes, conductoresRes, fallasRes] = await Promise.all([
        fetchWithLogging(`${API_ENDPOINTS.vehiculos}?status=rojo`),
        fetchWithLogging(`${API_ENDPOINTS.conductores.compliance}?fatiga=critico,alto`), 
        fetchWithLogging(`${API_ENDPOINTS.fallas}?severidad=critico`)
      ]);

      const criticalNotifications: CriticalNotification[] = [];

      // Procesar vehículos críticos
      if (vehiculosRes.ok) {
        const vehiculosData = await vehiculosRes.json();
        if (vehiculosData.success && vehiculosData.vehiculos) {
          vehiculosData.vehiculos.forEach((vehiculo: any) => {
            if (vehiculo.status_color === 'rojo') {
              criticalNotifications.push({
                id: `veh-${vehiculo.id}`,
                type: 'vehiculo',
                title: `Vehículo ${vehiculo.placa}`,
                message: 'Estado crítico - Requiere inspección inmediata',
                timestamp: new Date().toLocaleTimeString(),
                priority: 'critico'
              });
            }
          });
        }
      }

      // Procesar conductores con fatiga crítica
      if (conductoresRes.ok) {
        const conductoresData = await conductoresRes.json();
        if (conductoresData.success && conductoresData.conductores) {
          conductoresData.conductores.forEach((conductor: any) => {
            if (conductor.nivel_fatiga === 'critico' || conductor.nivel_fatiga === 'alto') {
              criticalNotifications.push({
                id: `cond-${conductor.id}`,
                type: 'conductor',
                title: `Conductor ${conductor.nombre}`,
                message: `Nivel de fatiga: ${conductor.nivel_fatiga.toUpperCase()}`,
                timestamp: new Date().toLocaleTimeString(),
                priority: conductor.nivel_fatiga === 'critico' ? 'critico' : 'alto'
              });
            }
          });
        }
      }

      // Procesar fallas críticas
      if (fallasRes.ok) {
        const fallasData = await fallasRes.json();
        if (fallasData.success && fallasData.fallas) {
          fallasData.fallas.forEach((falla: any) => {
            if (falla.severidad === 'critico') {
              criticalNotifications.push({
                id: `falla-${falla.id}`,
                type: 'falla',
                title: 'Falla Crítica',
                message: falla.descripcion.substring(0, 50) + '...',
                timestamp: new Date().toLocaleTimeString(),
                priority: 'critico'
              });
            }
          });
        }
      }

      setNotifications(criticalNotifications.slice(0, 10)); // Máximo 10 notificaciones
      console.log(`✅ Header: ${criticalNotifications.length} notificaciones críticas procesadas`);
    } catch (error) {
      console.error('💥 Header: Error crítico obteniendo notificaciones:', {
        error,
        endpoints: {
          vehiculos: `${API_ENDPOINTS.vehiculos}?status=rojo`,
          conductores: `${API_ENDPOINTS.conductores.compliance}?fatiga=critico,alto`,
          fallas: `${API_ENDPOINTS.fallas}?severidad=critico`
        },
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
      console.log('🏁 Header: Carga de notificaciones finalizada');
    }
  };

  // Obtener notificaciones al montar el componente y cada 30 segundos
  useEffect(() => {
    fetchCriticalNotifications();
    const interval = setInterval(fetchCriticalNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const getNotificationIcon = (type: CriticalNotification['type']) => {
    switch (type) {
      case 'vehiculo':
        return <Car size={16} />;
      case 'conductor':
        return <Users size={16} />;
      case 'falla':
        return <AlertTriangle size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };
  return (
    <header className="header">
      <div className="header-left">
        <button 
          className="menu-button"
          onClick={onMenuClick}
          aria-label="Abrir menú lateral"
        >
          <Menu size={20} />
        </button>
        
        <div className="header-title">
          <h1>{title}</h1>
        </div>
      </div>

      <div className="header-center">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="search-input"
            aria-label="Buscar en el sistema"
          />
        </div>
      </div>

      <div className="header-right">
        <div className="notifications-container">
          <button 
            className="header-button notifications-button" 
            onClick={toggleNotifications}
            aria-label="Notificaciones críticas"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="notification-badge notification-badge-critical">
                {notifications.length}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <h3>Notificaciones Críticas</h3>
                <button 
                  className="close-notifications"
                  onClick={() => setShowNotifications(false)}
                  aria-label="Cerrar notificaciones"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="notifications-content">
                {loading ? (
                  <div className="notifications-loading">
                    <span>Cargando notificaciones...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="notifications-empty">
                    <AlertTriangle size={24} />
                    <span>No hay alertas críticas</span>
                  </div>
                ) : (
                  <div className="notifications-list">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`notification-item notification-${notification.priority}`}
                      >
                        <div className="notification-icon">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="notification-content">
                          <div className="notification-title">{notification.title}</div>
                          <div className="notification-message">{notification.message}</div>
                          <div className="notification-timestamp">{notification.timestamp}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="notifications-footer">
                  <button 
                    className="refresh-notifications-btn"
                    onClick={fetchCriticalNotifications}
                    disabled={loading}
                  >
                    {loading ? 'Actualizando...' : 'Actualizar'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="user-menu">
          <button className="user-button" aria-label="Menú de usuario">
            <User size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;