import React, { useState, useEffect, useCallback } from 'react';
import './DriverCompliance.css';

interface Driver {
  id: string;
  nombre: string;
  dias_desde_inspeccion: number;
  nivel_fatiga: string;
  status_color: string;
  fecha_inspeccion: string;
  horas_trabajadas: number;
  vehiculo_asignado?: string;
}

interface ComplianceStats {
  total: number;
  cumple: number;
  alerta: number;
  critico: number;
  porcentaje_cumplimiento: number;
}

const DriverCompliance: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'dias' | 'nombre' | 'fatiga'>('dias');

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Obtener datos específicos de conductores
      const response = await fetch('/api/drivers');
      if (!response.ok) {
        throw new Error('Error al obtener datos de conductores');
      }

      const result = await response.json();
      
      if (result.success && result.data.conductores) {
        let driverData = result.data.conductores;
        
        // Filtrar por status si se especifica
        if (filterStatus !== 'todos') {
          driverData = driverData.filter((driver: Driver) => driver.status_color === filterStatus);
        }

        // Ordenar según criterio seleccionado
        driverData = sortDrivers(driverData, sortBy);
        
        setDrivers(driverData);
        
        // Usar estadísticas del backend
        if (result.data.estadisticas) {
          setStats(result.data.estadisticas);
        } else {
          // Calcular estadísticas localmente como fallback
          const calculatedStats = calculateStats(result.data.conductores);
          setStats(calculatedStats);
        }
      } else {
        setDrivers([]);
        setStats({
          total: 0,
          cumple: 0,
          alerta: 0,
          critico: 0,
          porcentaje_cumplimiento: 0
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, sortBy]);

  const sortDrivers = (driverList: Driver[], criteria: string): Driver[] => {
    return [...driverList].sort((a, b) => {
      switch (criteria) {
        case 'dias':
          return (b.dias_desde_inspeccion || 0) - (a.dias_desde_inspeccion || 0);
        
        case 'nombre':
          return (a.nombre || '').localeCompare(b.nombre || '');
        
        case 'fatiga':
          const fatigueOrder = { critico: 0, alto: 1, alerta: 2, normal: 3 };
          return (fatigueOrder[a.nivel_fatiga as keyof typeof fatigueOrder] || 4) - 
                 (fatigueOrder[b.nivel_fatiga as keyof typeof fatigueOrder] || 4);
        
        default:
          return 0;
      }
    });
  };

  const calculateStats = (allDrivers: Driver[]): ComplianceStats => {
    const total = allDrivers.length;
    const cumple = allDrivers.filter(d => d.status_color === 'verde').length;
    const alerta = allDrivers.filter(d => d.status_color === 'amarillo').length;
    const critico = allDrivers.filter(d => d.status_color === 'rojo').length;
    
    return {
      total,
      cumple,
      alerta,
      critico,
      porcentaje_cumplimiento: total > 0 ? Math.round((cumple / total) * 100) : 0
    };
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'verde': return '✅';
      case 'amarillo': return '⚠️';
      case 'rojo': return '🚨';
      default: return '❓';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'verde': return 'CUMPLE';
      case 'amarillo': return 'ALERTA';
      case 'rojo': return 'CRÍTICO';
      default: return 'SIN ESTADO';
    }
  };

  const getDaysLabel = (days: number): string => {
    if (days <= 5) return `${days} días - OK`;
    if (days <= 10) return `${days} días - Alerta`;
    return `${days} días - CRÍTICO`;
  };

  const getFatigueLabel = (level: string): string => {
    switch (level) {
      case 'normal': return 'Normal';
      case 'alerta': return 'Alerta';
      case 'alto': return 'Alto';
      case 'critico': return 'Crítico';
      default: return 'N/A';
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  if (loading) {
    return (
      <div className="driver-compliance">
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando cumplimiento de conductores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="driver-compliance">
        <div className="error">
          <h3>❌ Error</h3>
          <p>{error}</p>
          <button onClick={fetchDrivers} className="retry-btn">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="driver-compliance">
      <div className="compliance-header">
        <h2>👥 Cumplimiento de Conductores HQ-FO-40</h2>
        {stats && (
          <div className="stats-summary">
            <div className="stat-card total">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-card success">
              <span className="stat-number">{stats.cumple}</span>
              <span className="stat-label">Cumplen</span>
            </div>
            <div className="stat-card warning">
              <span className="stat-number">{stats.alerta}</span>
              <span className="stat-label">Alerta</span>
            </div>
            <div className="stat-card critical">
              <span className="stat-number">{stats.critico}</span>
              <span className="stat-label">Críticos</span>
            </div>
            <div className="compliance-percentage">
              <div className="percentage-circle">
                <span className="percentage-number">{stats.porcentaje_cumplimiento}%</span>
                <span className="percentage-label">Cumplimiento</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="controls-section">
        <div className="filters">
          <label>
            Filtrar por estado:
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="todos">Todos los estados</option>
              <option value="verde">✅ Cumple (≤5 días)</option>
              <option value="amarillo">⚠️ Alerta (6-10 días)</option>
              <option value="rojo">🚨 Crítico ({'>'}10 días)</option>
            </select>
          </label>

          <label>
            Ordenar por:
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as 'dias' | 'nombre' | 'fatiga')}
              className="sort-select"
            >
              <option value="dias">Días desde inspección</option>
              <option value="nombre">Nombre del conductor</option>
              <option value="fatiga">Nivel de fatiga</option>
            </select>
          </label>
        </div>

        <button onClick={fetchDrivers} className="refresh-btn">
          🔄 Actualizar Datos
        </button>
      </div>

      {drivers.length === 0 ? (
        <div className="no-data">
          <h3>📋 Sin Datos de Conductores</h3>
          <p>No se encontraron conductores registrados.</p>
          <p className="hint">Cargue un archivo Excel HQ-FO-40 para ver el cumplimiento de conductores.</p>
        </div>
      ) : (
        <div className="drivers-grid">
          {drivers.map((driver) => (
            <div key={driver.id} className={`driver-card status-${driver.status_color}`}>
              <div className="driver-header">
                <div className="driver-name">
                  <span className="name-text">{driver.nombre}</span>
                  <span className="driver-id">ID: {driver.id}</span>
                </div>
                <div className={`status-badge status-${driver.status_color}`}>
                  <span className="status-icon">{getStatusIcon(driver.status_color)}</span>
                  <span className="status-text">{getStatusLabel(driver.status_color)}</span>
                </div>
              </div>

              <div className="driver-details">
                <div className="detail-row">
                  <span className="detail-label">📅 Última Inspección:</span>
                  <span className="detail-value">{driver.fecha_inspeccion || 'N/A'}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">📊 Días Transcurridos:</span>
                  <span className={`detail-value days-${driver.status_color}`}>
                    {getDaysLabel(driver.dias_desde_inspeccion || 0)}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">😴 Nivel de Fatiga:</span>
                  <span className={`detail-value fatigue-${driver.nivel_fatiga}`}>
                    {getFatigueLabel(driver.nivel_fatiga)}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">⏰ Horas Trabajadas:</span>
                  <span className="detail-value">{driver.horas_trabajadas || 0}h</span>
                </div>

                {driver.vehiculo_asignado && (
                  <div className="detail-row">
                    <span className="detail-label">🚗 Vehículo:</span>
                    <span className="detail-value">{driver.vehiculo_asignado}</span>
                  </div>
                )}
              </div>

              <div className="driver-actions">
                <button 
                  className="action-btn details"
                  onClick={() => console.log('Ver detalles:', driver)}
                >
                  👁️ Ver Detalles
                </button>
                {driver.status_color === 'rojo' && (
                  <button 
                    className="action-btn urgent"
                    onClick={() => console.log('Acción urgente:', driver)}
                  >
                    🚨 Acción Urgente
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverCompliance;