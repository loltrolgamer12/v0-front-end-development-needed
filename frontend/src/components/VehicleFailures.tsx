import React, { useState, useEffect, useCallback } from 'react';
import './VehicleFailures.css';

interface VehicleWithFailures {
  id: string;
  codigo: string;
  placa: string;
  kilometraje: number;
  combustible: number;
  estado: string;
  status_color: string;
  fecha_inspeccion: string;
  fallas_descripcion: string;
  fallas_categorias: string;
  fallas_severidades: string;
  total_fallas: number;
}

interface FailureFilter {
  category?: string;
  severity?: string;
}

interface VehicleFailuresProps {
  onVehicleSelect?: (vehicleId: string) => void;
}

const VehicleFailures: React.FC<VehicleFailuresProps> = ({ onVehicleSelect }) => {
  const [vehicles, setVehicles] = useState<VehicleWithFailures[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FailureFilter>({});
  const [sortBy, setSortBy] = useState<'severity' | 'failures' | 'km' | 'placa'>('severity');
  
  const failureCategories = [
    { value: 'motor', label: 'Motor', icon: '🔧' },
    { value: 'frenos', label: 'Frenos', icon: '🛑' },
    { value: 'suspension', label: 'Suspensión', icon: '🚗' },
    { value: 'electrico', label: 'Eléctrico', icon: '⚡' },
    { value: 'neumaticos', label: 'Neumáticos', icon: '🛞' },
    { value: 'carroceria', label: 'Carrocería', icon: '🚙' },
    { value: 'transmision', label: 'Transmisión', icon: '⚙️' },
    { value: 'otros', label: 'Otros', icon: '🔨' }
  ];

  const severityLevels = [
    { value: 'critico', label: 'Crítico', icon: '🚨', color: '#dc3545' },
    { value: 'alto', label: 'Alto', icon: '⚠️', color: '#fd7e14' },
    { value: 'medio', label: 'Medio', icon: '⏰', color: '#ffc107' },
    { value: 'bajo', label: 'Bajo', icon: '✅', color: '#28a745' }
  ];

  const sortVehicles = useCallback((vehicleList: VehicleWithFailures[], criteria: string): VehicleWithFailures[] => {
    return [...vehicleList].sort((a, b) => {
      switch (criteria) {
        case 'severity':
          // Ordenar por severidad crítica primero
          const severityOrder = { critico: 0, alto: 1, medio: 2, bajo: 3 };
          const aSeverities = a.fallas_severidades.split(', ').map(s => s.trim());
          const bSeverities = b.fallas_severidades.split(', ').map(s => s.trim());
          
          const aMaxSeverity = Math.min(...aSeverities.map(s => severityOrder[s as keyof typeof severityOrder] || 4));
          const bMaxSeverity = Math.min(...bSeverities.map(s => severityOrder[s as keyof typeof severityOrder] || 4));
          
          return aMaxSeverity - bMaxSeverity;
        
        case 'failures':
          return (b.total_fallas || 0) - (a.total_fallas || 0);
        
        case 'km':
          return (b.kilometraje || 0) - (a.kilometraje || 0);
        
        case 'placa':
          return (a.placa || '').localeCompare(b.placa || '');
        
        default:
          return 0;
      }
    });
  }, []);

  const fetchVehiclesWithFailures = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.severity) queryParams.append('severity', filters.severity);

      const response = await fetch(`/api/vehiculos/fallas?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener vehículos con fallas');
      }

      const result = await response.json();
      
      if (result.success) {
        let vehicleList = result.vehiculos_con_fallas || [];
        
        // Ordenar según criterio seleccionado
        vehicleList = sortVehicles(vehicleList, sortBy);
        
        setVehicles(vehicleList);
      } else {
        setError('Error en la respuesta del servidor');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortVehicles]);

  const handleFilterChange = (key: keyof FailureFilter, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const getStatusColor = (color: string): string => {
    switch (color) {
      case 'verde': return '#28a745';
      case 'amarillo': return '#ffc107';
      case 'rojo': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (color: string): string => {
    switch (color) {
      case 'verde': return '✅';
      case 'amarillo': return '⚠️';
      case 'rojo': return '🚨';
      default: return '❓';
    }
  };

  const getSeverityStats = (): { [key: string]: number } => {
    const stats = { critico: 0, alto: 0, medio: 0, bajo: 0 };
    
    vehicles.forEach(vehicle => {
      const severities = vehicle.fallas_severidades.split(', ').map(s => s.trim());
      severities.forEach(severity => {
        if (stats.hasOwnProperty(severity)) {
          stats[severity as keyof typeof stats]++;
        }
      });
    });
    
    return stats;
  };

  const getCategoryStats = (): { [key: string]: number } => {
    const stats: { [key: string]: number } = {};
    
    vehicles.forEach(vehicle => {
      const categories = vehicle.fallas_categorias.split(', ').map(c => c.trim());
      categories.forEach(category => {
        stats[category] = (stats[category] || 0) + 1;
      });
    });
    
    return stats;
  };

  const formatFailureDescription = (description: string, maxLength: number = 100): string => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  useEffect(() => {
    fetchVehiclesWithFailures();
  }, [filters, sortBy, fetchVehiclesWithFailures]);

  if (loading) {
    return (
      <div className="vehicle-failures loading">
        <div className="loading-spinner"></div>
        <p>Cargando vehículos con fallas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vehicle-failures error">
        <div className="error-icon">❌</div>
        <h3>Error al cargar datos</h3>
        <p>{error}</p>
        <button onClick={fetchVehiclesWithFailures} className="retry-btn">
          Reintentar
        </button>
      </div>
    );
  }

  const severityStats = getSeverityStats();
  const categoryStats = getCategoryStats();

  return (
    <div className="vehicle-failures">
      <div className="failures-header">
        <div className="header-content">
          <h2>🚗 Vehículos con Fallas Mecánicas</h2>
          <p>Gestión y seguimiento de fallas por categoría y severidad</p>
        </div>
        
        <div className="failure-summary">
          {severityLevels.map(level => (
            <div key={level.value} className={`summary-item severity-${level.value}`}>
              <span className="summary-icon">{level.icon}</span>
              <span className="summary-count">
                {severityStats[level.value] || 0}
              </span>
              <span className="summary-label">{level.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="failures-controls">
        <div className="filter-section">
          <h4>Filtrar por Categoría:</h4>
          <select
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="filter-select"
            title="Filtrar por categoría de falla"
          >
            <option value="">Todas las categorías</option>
            {failureCategories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-section">
          <h4>Filtrar por Severidad:</h4>
          <select
            value={filters.severity || ''}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
            className="filter-select"
            title="Filtrar por nivel de severidad"
          >
            <option value="">Todas las severidades</option>
            {severityLevels.map(level => (
              <option key={level.value} value={level.value}>
                {level.icon} {level.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sort-section">
          <h4>Ordenar por:</h4>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'severity' | 'failures' | 'km' | 'placa')}
            className="sort-select"
            title="Criterio de ordenamiento"
          >
            <option value="severity">Severidad</option>
            <option value="failures">Cantidad de Fallas</option>
            <option value="km">Kilometraje</option>
            <option value="placa">Placa</option>
          </select>
        </div>

        <div className="actions-section">
          <button onClick={clearFilters} className="clear-btn">
            🗑️ Limpiar Filtros
          </button>
          <button onClick={fetchVehiclesWithFailures} className="refresh-btn">
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Estadísticas por categoría */}
      <div className="category-stats">
        <h3>📊 Fallas por Categoría</h3>
        <div className="stats-grid">
          {failureCategories.map(category => {
            const count = categoryStats[category.value] || 0;
            return (
              <div key={category.value} className="stat-item">
                <span className="stat-icon">{category.icon}</span>
                <span className="stat-label">{category.label}</span>
                <span className="stat-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {vehicles.length === 0 ? (
        <div className="no-failures">
          <div className="no-failures-icon">🎉</div>
          <h3>¡Excelente!</h3>
          <p>No hay vehículos con fallas en los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="vehicles-grid">
          {vehicles.map(vehicle => (
            <div
              key={vehicle.id}
              className={`vehicle-card status-${vehicle.status_color}`}
              onClick={() => onVehicleSelect && onVehicleSelect(vehicle.id)}
            >
              <div className="vehicle-header">
                <div className="vehicle-info">
                  <div className="vehicle-placa">{vehicle.placa}</div>
                  <div className="vehicle-codigo">Código: {vehicle.codigo}</div>
                </div>
                
                <div className="status-indicator">
                  <span className="status-icon">
                    {getStatusIcon(vehicle.status_color)}
                  </span>
                  <span 
                    className="status-text"
                    style={{ color: getStatusColor(vehicle.status_color) }}
                  >
                    {vehicle.status_color.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="vehicle-content">
                <div className="metric-row">
                  <span className="metric-label">🛞 Kilometraje:</span>
                  <span className="metric-value">
                    {vehicle.kilometraje?.toLocaleString() || 'N/A'} km
                  </span>
                </div>

                <div className="metric-row">
                  <span className="metric-label">⛽ Combustible:</span>
                  <span className="metric-value">
                    {vehicle.combustible || 'N/A'}%
                  </span>
                </div>

                <div className="metric-row">
                  <span className="metric-label">⚠️ Total Fallas:</span>
                  <span className="metric-value failure-count">
                    {vehicle.total_fallas}
                  </span>
                </div>

                <div className="failures-section">
                  <h4>🔧 Fallas Detectadas:</h4>
                  <div className="failure-description">
                    {formatFailureDescription(vehicle.fallas_descripcion)}
                  </div>
                  
                  <div className="failure-categories">
                    <strong>Categorías:</strong> {vehicle.fallas_categorias}
                  </div>
                  
                  <div className="failure-severities">
                    <strong>Severidades:</strong> 
                    <span className="severities-list">
                      {vehicle.fallas_severidades.split(', ').map((severity, index) => (
                        <span
                          key={index}
                          className={`severity-tag severity-${severity.trim()}`}
                        >
                          {severity.trim()}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>

                <div className="inspection-info">
                  <span className="inspection-date">
                    📅 Inspección: {vehicle.fecha_inspeccion}
                  </span>
                </div>
              </div>

              <div className="vehicle-actions">
                <button 
                  className="action-btn primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Ver detalles del vehículo
                  }}
                >
                  🔍 Ver Detalles
                </button>
                
                {vehicle.status_color === 'rojo' && (
                  <button 
                    className="action-btn danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Marcar para mantenimiento
                    }}
                  >
                    🔧 Mantenimiento
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Información sobre categorías de fallas */}
      <div className="failure-categories-info">
        <h3>ℹ️ Categorías de Fallas Mecánicas</h3>
        <div className="categories-grid">
          {failureCategories.map(category => (
            <div key={category.value} className="category-info-card">
              <div className="category-header">
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.label}</span>
              </div>
              <div className="category-description">
                {getCategoryDescription(category.value)}
              </div>
            </div>
          ))}
        </div>
        
        <div className="maintenance-reminder">
          <h4>🔧 Recordatorio de Mantenimiento</h4>
          <p>
            Las fallas críticas requieren atención inmediata antes de que el vehículo vuelva 
            a circular. Las fallas de nivel alto y medio deben programarse para mantenimiento 
            en la próxima disponibilidad del vehículo.
          </p>
        </div>
      </div>
    </div>
  );
};

const getCategoryDescription = (category: string): string => {
  const descriptions: { [key: string]: string } = {
    motor: 'Problemas relacionados con el motor, aceite, refrigerante, correas y filtros.',
    frenos: 'Fallas en el sistema de frenado, pastillas, discos y líquido de frenos.',
    suspension: 'Problemas en amortiguadores, resortes, rótulas y componentes de suspensión.',
    electrico: 'Fallas eléctricas en batería, alternador, luces, fusibles y cableado.',
    neumaticos: 'Problemas con neumáticos, presión, desgaste y balanceado de ruedas.',
    carroceria: 'Daños en carrocería, puertas, ventanas, espejos y parabrisas.',
    transmision: 'Fallas en transmisión, embrague, caja de cambios y diferencial.',
    otros: 'Otras fallas no clasificadas en las categorías principales.'
  };
  return descriptions[category] || 'Sin descripción disponible.';
};

export default VehicleFailures;