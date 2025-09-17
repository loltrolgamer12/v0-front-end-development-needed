import React, { useState, useEffect } from 'react';
import './FatigueControl.css';

interface FatiguedDriver {
  id: string;
  conductor_id: string;
  conductor_nombre: string;
  horas_trabajadas: number;
  nivel_fatiga: string;
  recomendacion: string;
  status_color: string;
  fecha_analisis: string;
  created_at?: string;
}

interface FatigueControlProps {
  onDriverSelect?: (driverId: string) => void;
}

const FatigueControl: React.FC<FatigueControlProps> = ({ onDriverSelect }) => {
  const [fatiguedDrivers, setFatiguedDrivers] = useState<FatiguedDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevels, setSelectedLevels] = useState<string[]>(['alerta', 'alto', 'critico']);
  const [sortBy, setSortBy] = useState<'fatigue' | 'hours' | 'name'>('fatigue');

  const fetchFatiguedDrivers = async () => {
    setLoading(true);
    setError(null);

    try {
      const levelsParam = selectedLevels.join(',');
      const response = await fetch(`/api/conductores/fatiga?levels=${levelsParam}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener conductores con fatiga');
      }

      const result = await response.json();
      
      if (result.success) {
        let drivers = result.conductores_afectados || [];
        
        // Ordenar según criterio seleccionado
        drivers = sortDrivers(drivers, sortBy);
        
        setFatiguedDrivers(drivers);
      } else {
        setError('Error en la respuesta del servidor');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const sortDrivers = (drivers: FatiguedDriver[], criteria: string): FatiguedDriver[] => {
    return [...drivers].sort((a, b) => {
      switch (criteria) {
        case 'fatigue':
          const fatigueOrder = { critico: 0, alto: 1, alerta: 2, normal: 3 };
          return (fatigueOrder[a.nivel_fatiga as keyof typeof fatigueOrder] || 4) - 
                 (fatigueOrder[b.nivel_fatiga as keyof typeof fatigueOrder] || 4);
        
        case 'hours':
          return (b.horas_trabajadas || 0) - (a.horas_trabajadas || 0);
        
        case 'name':
          return (a.conductor_nombre || '').localeCompare(b.conductor_nombre || '');
        
        default:
          return 0;
      }
    });
  };

  const handleLevelFilter = (level: string) => {
    setSelectedLevels(prev => {
      const newLevels = prev.includes(level) 
        ? prev.filter(l => l !== level)
        : [...prev, level];
      return newLevels;
    });
  };

  const getFatigueIcon = (level: string): string => {
    switch (level) {
      case 'critico': return '🚨';
      case 'alto': return '⚠️';
      case 'alerta': return '⏰';
      case 'normal': return '✅';
      default: return '❓';
    }
  };

  const getFatigueColor = (level: string): string => {
    switch (level) {
      case 'critico': return '#dc3545';
      case 'alto': return '#fd7e14';
      case 'alerta': return '#ffc107';
      case 'normal': return '#28a745';
      default: return '#6c757d';
    }
  };

  const formatHours = (hours: number): string => {
    if (hours === 0) return '0h';
    
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const getRecommendationIcon = (level: string): string => {
    switch (level) {
      case 'critico': return '🛑';
      case 'alto': return '⏸️';
      case 'alerta': return '⏰';
      default: return '👍';
    }
  };

  useEffect(() => {
    fetchFatiguedDrivers();
  }, [selectedLevels, sortBy, fetchFatiguedDrivers]);

  if (loading) {
    return (
      <div className="fatigue-control loading">
        <div className="loading-spinner"></div>
        <p>Cargando conductores con fatiga...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fatigue-control error">
        <div className="error-icon">❌</div>
        <h3>Error al cargar datos</h3>
        <p>{error}</p>
        <button onClick={fetchFatiguedDrivers} className="retry-btn">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="fatigue-control">
      <div className="fatigue-header">
        <div className="header-content">
          <h2>👥 Control de Fatiga de Conductores</h2>
          <p>Monitoreo y gestión de niveles de fatiga para garantizar la seguridad</p>
        </div>
        
        <div className="fatigue-summary">
          <div className="summary-item critico">
            <span className="summary-icon">🚨</span>
            <span className="summary-count">
              {fatiguedDrivers.filter(d => d.nivel_fatiga === 'critico').length}
            </span>
            <span className="summary-label">Crítico</span>
          </div>
          
          <div className="summary-item alto">
            <span className="summary-icon">⚠️</span>
            <span className="summary-count">
              {fatiguedDrivers.filter(d => d.nivel_fatiga === 'alto').length}
            </span>
            <span className="summary-label">Alto</span>
          </div>
          
          <div className="summary-item alerta">
            <span className="summary-icon">⏰</span>
            <span className="summary-count">
              {fatiguedDrivers.filter(d => d.nivel_fatiga === 'alerta').length}
            </span>
            <span className="summary-label">Alerta</span>
          </div>
        </div>
      </div>

      <div className="fatigue-controls">
        <div className="filter-section">
          <h4>Filtrar por Nivel:</h4>
          <div className="level-filters">
            {['alerta', 'alto', 'critico'].map(level => (
              <button
                key={level}
                className={`level-filter ${selectedLevels.includes(level) ? 'active' : ''} level-${level}`}
                onClick={() => handleLevelFilter(level)}
              >
                {getFatigueIcon(level)} {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="sort-section">
          <h4>Ordenar por:</h4>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'fatigue' | 'hours' | 'name')}
            className="sort-select"
            title="Ordenar conductores"
          >
            <option value="fatigue">Nivel de Fatiga</option>
            <option value="hours">Horas Trabajadas</option>
            <option value="name">Nombre</option>
          </select>
        </div>

        <div className="refresh-section">
          <button onClick={fetchFatiguedDrivers} className="refresh-btn">
            🔄 Actualizar
          </button>
        </div>
      </div>

      {fatiguedDrivers.length === 0 ? (
        <div className="no-fatigue">
          <div className="no-fatigue-icon">😊</div>
          <h3>¡Excelente!</h3>
          <p>No hay conductores con niveles de fatiga preocupantes en los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="drivers-grid">
          {fatiguedDrivers.map(driver => (
            <div
              key={driver.id}
              className={`driver-card fatigue-${driver.nivel_fatiga}`}
              onClick={() => onDriverSelect && onDriverSelect(driver.conductor_id)}
            >
              <div className="driver-header">
                <div className="driver-info">
                  <div className="driver-name">{driver.conductor_nombre}</div>
                  <div className="driver-id">ID: {driver.conductor_id}</div>
                </div>
                
                <div className="fatigue-indicator">
                  <span 
                    className="fatigue-level"
                    style={{ color: getFatigueColor(driver.nivel_fatiga) }}
                  >
                    {getFatigueIcon(driver.nivel_fatiga)} {driver.nivel_fatiga.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="driver-content">
                <div className="metric-row">
                  <span className="metric-label">⏱️ Horas Trabajadas:</span>
                  <span className="metric-value hours-worked">
                    {formatHours(driver.horas_trabajadas)}
                  </span>
                </div>

                <div className="metric-row">
                  <span className="metric-label">📅 Fecha Análisis:</span>
                  <span className="metric-value">
                    {new Date(driver.fecha_analisis).toLocaleDateString()}
                  </span>
                </div>

                <div className="recommendation-section">
                  <div className="recommendation-header">
                    <span className="recommendation-icon">
                      {getRecommendationIcon(driver.nivel_fatiga)}
                    </span>
                    <span className="recommendation-title">Recomendación:</span>
                  </div>
                  <div className="recommendation-text">
                    {driver.recomendacion}
                  </div>
                </div>

                {driver.nivel_fatiga === 'critico' && (
                  <div className="critical-alert">
                    <span className="alert-icon">🚨</span>
                    <span className="alert-text">
                      ¡ACCIÓN INMEDIATA REQUERIDA!
                    </span>
                  </div>
                )}
              </div>

              <div className="driver-actions">
                <button 
                  className="action-btn primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Aquí se podría implementar funcionalidad adicional
                    // Ver detalles del conductor
                  }}
                >
                  👤 Ver Detalles
                </button>
                
                {driver.nivel_fatiga === 'critico' && (
                  <button 
                    className="action-btn danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Aquí se podría implementar funcionalidad de reemplazo
                      // Marcar para reemplazo
                    }}
                  >
                    🔄 Reemplazar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Información adicional sobre fatiga */}
      <div className="fatigue-info">
        <h3>ℹ️ Información sobre Fatiga</h3>
        <div className="info-grid">
          <div className="info-card">
            <h4>🟢 Normal (≤8 horas)</h4>
            <p>Conductor descansado, puede continuar con actividades normales.</p>
          </div>
          
          <div className="info-card">
            <h4>🟡 Alerta (8-10 horas)</h4>
            <p>Primeros signos de fatiga, considerar descanso en la próxima parada.</p>
          </div>
          
          <div className="info-card">
            <h4>🟠 Alto (10-12 horas)</h4>
            <p>Nivel de fatiga significativo, descanso obligatorio recomendado.</p>
          </div>
          
          <div className="info-card">
            <h4>🔴 Crítico (&gt;12 horas)</h4>
            <p>Fatiga peligrosa, descanso inmediato obligatorio - Reemplazar conductor.</p>
          </div>
        </div>
        
        <div className="safety-reminder">
          <h4>⚠️ Recordatorio de Seguridad</h4>
          <p>
            La fatiga del conductor es una de las principales causas de accidentes. 
            Es responsabilidad de la empresa garantizar que los conductores no operen 
            vehículos cuando presenten niveles críticos de fatiga.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FatigueControl;