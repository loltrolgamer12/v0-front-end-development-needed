import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { API_ENDPOINTS } from '../config/api';
import { fetchWithLogging } from '../utils/fetchWithLogging';
import { logger } from '../utils/logger';

interface DashboardData {
  resumen: {
    vehiculos: { [key: string]: number };
    conductores: { [key: string]: number };
    fallas: { [key: string]: number };
    total_vehiculos: number;
    total_conductores: number;
    total_fallas: number;
  };
  alertas: Array<{
    tipo: string;
    mensaje: string;
    accion: string;
  }>;
  tendencias: {};
}

interface StatusCardProps {
  title: string;
  data: { [key: string]: number };
  total: number;
  colorMap: { [key: string]: string };
}

const StatusCard: React.FC<StatusCardProps> = ({ title, data, total, colorMap }) => {
  return (
    <div className="status-card">
      <h3>{title}</h3>
      <div className="status-total">Total: {total}</div>
      <div className="status-breakdown">
        {Object.entries(data).map(([status, count]) => (
          <div key={status} className={`status-item status-${status}`}>
            <span className={`status-label status-color-${status}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
            <span className="status-count">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface AlertCardProps {
  alertas: Array<{
    tipo: string;
    mensaje: string;
    accion: string;
  }>;
}

const AlertCard: React.FC<AlertCardProps> = ({ alertas }) => {
  return (
    <div className="alert-card">
      <h3>🚨 Alertas Críticas</h3>
      {alertas.length === 0 ? (
        <div className="alert-item alert-success">
          <span>✅ Sin alertas críticas</span>
        </div>
      ) : (
        alertas.map((alerta, index) => (
          <div key={index} className={`alert-item alert-${alerta.tipo}`}>
            <div className="alert-message">{alerta.mensaje}</div>
            <div className="alert-action">{alerta.accion}</div>
          </div>
        ))
      )}
    </div>
  );
};

interface QuickActionsProps {
  onViewFatiguedDrivers: () => void;
  onViewVehiclesWithFailures: () => void;
  onGenerateReport: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onViewFatiguedDrivers,
  onViewVehiclesWithFailures,
  onGenerateReport
}) => {
  return (
    <div className="quick-actions">
      <h3>Acciones Rápidas</h3>
      <div className="action-buttons">
        <button className="action-btn btn-warning" onClick={onViewFatiguedDrivers}>
          👥 Conductores con Fatiga
        </button>
        <button className="action-btn btn-danger" onClick={onViewVehiclesWithFailures}>
          🚗 Vehículos con Fallas
        </button>
        <button className="action-btn btn-info" onClick={onGenerateReport}>
          📊 Generar Reporte
        </button>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const colorMaps = {
    vehiculos: { verde: '#28a745', amarillo: '#ffc107', rojo: '#dc3545' },
    conductores: { normal: '#28a745', alerta: '#ffc107', alto: '#fd7e14', critico: '#dc3545' },
    fallas: { bajo: '#28a745', medio: '#ffc107', alto: '#fd7e14', critico: '#dc3545' }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Dashboard: Iniciando carga de datos...');
      logger.logBackendStatus();
      
      const response = await fetchWithLogging(API_ENDPOINTS.dashboard);
      
      if (!response.ok) {
        throw new Error(`Error al cargar datos del dashboard: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📊 Dashboard: Datos recibidos:', result);
      
      if (result.success) {
        setDashboardData(result.data);
        
        // Usar el timestamp del backend si está disponible
        const backendTimestamp = result.timestamp || result.data?.timestamp;
        setLastUpdate(backendTimestamp 
          ? new Date(backendTimestamp).toLocaleString('es-ES', {
              year: 'numeric',
              month: '2-digit', 
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })
          : new Date().toLocaleString()
        );
        
        setError(null);
        console.log('✅ Dashboard: Datos cargados exitosamente');
        console.log('📅 Backend timestamp:', backendTimestamp);
      } else {
        const errorMsg = `Error en la respuesta del servidor: ${result.message || 'Sin mensaje de error'}`;
        setError(errorMsg);
        console.error('❌ Dashboard: Error en respuesta:', result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('💥 Dashboard: Error crítico:', {
        error: err,
        message: errorMessage,
        endpoint: API_ENDPOINTS.dashboard,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
      console.log('🏁 Dashboard: Carga finalizada');
    }
  };

  const handleViewFatiguedDrivers = () => {
    // Navegar a la vista de conductores con fatiga
    window.open('/conductores-fatiga', '_blank');
  };

  const handleViewVehiclesWithFailures = () => {
    // Navegar a la vista de vehículos con fallas
    window.open('/vehiculos-fallas', '_blank');
  };

  const handleGenerateReport = () => {
    // Abrir modal o navegar a generador de reportes
    const fechaInicio = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const fechaFin = new Date().toISOString().split('T')[0];
    
    window.open(`/reportes?inicio=${fechaInicio}&fin=${fechaFin}`, '_blank');
  };

  const refreshData = () => {
    fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-icon">❌</div>
        <h3>Error al cargar dashboard</h3>
        <p>{error}</p>
        <button onClick={refreshData} className="retry-btn">
          Reintentar
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-empty">
        <div className="empty-icon">📊</div>
        <h3>Sin datos disponibles</h3>
        <p>Sube un archivo Excel para ver el análisis</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Dashboard HQ-FO-40</h1>
          <div className="header-actions">
            <span className="last-update">
              Última actualización: {lastUpdate}
            </span>
            <button onClick={refreshData} className="refresh-btn">
              🔄 Actualizar
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Fila superior - Resumen de estados */}
        <div className="dashboard-row">
          <StatusCard
            title="🚗 Estado de Vehículos"
            data={dashboardData.resumen.vehiculos}
            total={dashboardData.resumen.total_vehiculos}
            colorMap={colorMaps.vehiculos}
          />
          
          <StatusCard
            title="👥 Nivel de Fatiga"
            data={dashboardData.resumen.conductores}
            total={dashboardData.resumen.total_conductores}
            colorMap={colorMaps.conductores}
          />
          
          <StatusCard
            title="⚠️ Severidad de Fallas"
            data={dashboardData.resumen.fallas}
            total={dashboardData.resumen.total_fallas}
            colorMap={colorMaps.fallas}
          />
        </div>

        {/* Fila intermedia - Alertas y acciones */}
        <div className="dashboard-row">
          <AlertCard alertas={dashboardData.alertas} />
          <QuickActions
            onViewFatiguedDrivers={handleViewFatiguedDrivers}
            onViewVehiclesWithFailures={handleViewVehiclesWithFailures}
            onGenerateReport={handleGenerateReport}
          />
        </div>

        {/* Fila inferior - Gráficas (placeholder) */}
        <div className="dashboard-row">
          <div className="chart-placeholder">
            <h3>📈 Gráficas Interactivas</h3>
            <p>Las gráficas se cargarán aquí cuando estén implementadas</p>
            <div className="chart-buttons">
              <button className="chart-btn">Estado Vehículos</button>
              <button className="chart-btn">Fatiga Conductores</button>
              <button className="chart-btn">Fallas por Categoría</button>
              <button className="chart-btn">Severidad de Fallas</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;