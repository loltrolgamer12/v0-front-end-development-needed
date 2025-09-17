import React, { useState, useEffect, useCallback } from 'react';
import './SearchFilter.css';

interface SearchFilters {
  search_term?: string;
  status_color?: string;
  fatigue_level?: string;
  category?: string;
  severity?: string;
  min_km?: number;
  max_km?: number;
}

interface SearchResults {
  conductores: any[];
  vehiculos: any[];
  fallas_mecanicas: any[];
  control_fatiga: any[];
}

interface ColorIndicatorProps {
  color: string;
  label: string;
  count?: number;
}

const ColorIndicator: React.FC<ColorIndicatorProps> = ({ color, label, count }) => {
  const getColorClass = (colorName: string): string => {
    const colorMap: { [key: string]: string } = {
      verde: 'color-verde',
      amarillo: 'color-amarillo', 
      rojo: 'color-rojo',
      normal: 'color-normal',
      alerta: 'color-alerta',
      alto: 'color-alto',
      critico: 'color-critico',
      bajo: 'color-bajo',
      medio: 'color-medio'
    };
    return colorMap[colorName] || 'color-default';
  };

  return (
    <div className={`color-indicator ${getColorClass(color)}`}>
      <span className="color-dot"></span>
      <span className="color-label">{label}</span>
      {count !== undefined && <span className="color-count">{count}</span>}
    </div>
  );
};

const SearchFilter: React.FC = () => {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'vehiculos' | 'conductores' | 'fallas'>('vehiculos');

  const searchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/search?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Error en la búsqueda');
      }

      const result = await response.json();
      
      if (result.success) {
        setResults(result.data);
      } else {
        setError('Error en los resultados de búsqueda');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleFilterChange = (key: keyof SearchFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setResults(null);
  };

  const applyFilters = () => {
    if (Object.keys(filters).length > 0) {
      searchData();
    }
  };

  useEffect(() => {
    // Auto-search cuando cambian los filtros (con debounce)
    const timeoutId = setTimeout(() => {
      if (Object.keys(filters).length > 0) {
        searchData();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters, searchData]);

  const renderVehicleCard = (vehicle: any) => (
    <div key={vehicle.id} className="result-card vehicle-card">
      <div className="card-header">
        <ColorIndicator color={vehicle.status_color} label="Estado" />
        <span className="card-id">{vehicle.codigo || vehicle.placa}</span>
      </div>
      <div className="card-content">
        <div className="info-row">
          <span className="info-label">Placa:</span>
          <span className="info-value">{vehicle.placa}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Kilometraje:</span>
          <span className="info-value">{vehicle.kilometraje?.toLocaleString() || 'N/A'} km</span>
        </div>
        <div className="info-row">
          <span className="info-label">Combustible:</span>
          <span className="info-value">{vehicle.combustible || 'N/A'}%</span>
        </div>
        <div className="info-row">
          <span className="info-label">Estado:</span>
          <span className="info-value">{vehicle.estado}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Fecha Inspección:</span>
          <span className="info-value">{vehicle.fecha_inspeccion}</span>
        </div>
      </div>
    </div>
  );

  const renderDriverCard = (driver: any) => (
    <div key={driver.id} className="result-card driver-card">
      <div className="card-header">
        <ColorIndicator color={driver.status_color} label="Fatiga" />
        <span className="card-id">{driver.nombre}</span>
      </div>
      <div className="card-content">
        <div className="info-row">
          <span className="info-label">Hora Inicio:</span>
          <span className="info-value">{driver.hora_inicio}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Hora Fin:</span>
          <span className="info-value">{driver.hora_fin}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Horas Trabajadas:</span>
          <span className="info-value">{driver.horas_trabajadas}h</span>
        </div>
        <div className="info-row">
          <span className="info-label">Nivel Fatiga:</span>
          <span className={`info-value fatigue-${driver.nivel_fatiga}`}>
            {driver.nivel_fatiga?.toUpperCase()}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">Fecha Inspección:</span>
          <span className="info-value">{driver.fecha_inspeccion}</span>
        </div>
      </div>
    </div>
  );

  const renderFailureCard = (failure: any) => (
    <div key={failure.id} className="result-card failure-card">
      <div className="card-header">
        <ColorIndicator color={failure.status_color} label="Severidad" />
        <span className="card-category">{failure.categoria}</span>
      </div>
      <div className="card-content">
        <div className="info-row">
          <span className="info-label">Descripción:</span>
          <span className="info-value">{failure.descripcion}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Categoría:</span>
          <span className="info-value">{failure.categoria}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Severidad:</span>
          <span className={`info-value severity-${failure.severidad}`}>
            {failure.severidad?.toUpperCase()}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">Ubicación:</span>
          <span className="info-value">Fila {failure.ubicacion_fila}, Col {failure.ubicacion_columna}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Fecha Reporte:</span>
          <span className="info-value">{failure.fecha_reporte}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="search-filter">
      <div className="search-header">
        <h2>🔍 Búsqueda y Filtrado Avanzado</h2>
        <p>Filtra y busca información específica del análisis HQ-FO-40</p>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <h3>Filtros</h3>
        
        <div className="filters-grid">
          {/* Búsqueda general */}
          <div className="filter-group">
            <label>Búsqueda General:</label>
            <input
              type="text"
              placeholder="Buscar en nombres, descripciones, etc."
              value={filters.search_term || ''}
              onChange={(e) => handleFilterChange('search_term', e.target.value)}
              className="filter-input"
            />
          </div>

          {/* Estado/Color */}
          <div className="filter-group">
            <label>Estado:</label>
            <select
              value={filters.status_color || ''}
              onChange={(e) => handleFilterChange('status_color', e.target.value)}
              className="filter-select"
              title="Seleccionar estado del vehículo"
            >
              <option value="">Todos los estados</option>
              <option value="verde">🟢 Operativo</option>
              <option value="amarillo">🟡 Alerta</option>
              <option value="rojo">🔴 Crítico</option>
            </select>
          </div>

          {/* Nivel de Fatiga */}
          <div className="filter-group">
            <label>Nivel de Fatiga:</label>
            <select
              value={filters.fatigue_level || ''}
              onChange={(e) => handleFilterChange('fatigue_level', e.target.value)}
              className="filter-select"
              title="Seleccionar nivel de fatiga del conductor"
            >
              <option value="">Todos los niveles</option>
              <option value="normal">Normal</option>
              <option value="alerta">Alerta</option>
              <option value="alto">Alto</option>
              <option value="critico">Crítico</option>
            </select>
          </div>

          {/* Categoría de Falla */}
          <div className="filter-group">
            <label>Categoría de Falla:</label>
            <select
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="filter-select"
              title="Seleccionar categoría de falla mecánica"
            >
              <option value="">Todas las categorías</option>
              <option value="motor">Motor</option>
              <option value="frenos">Frenos</option>
              <option value="suspension">Suspensión</option>
              <option value="electrico">Eléctrico</option>
              <option value="neumaticos">Neumáticos</option>
              <option value="carroceria">Carrocería</option>
              <option value="transmision">Transmisión</option>
              <option value="otros">Otros</option>
            </select>
          </div>

          {/* Severidad */}
          <div className="filter-group">
            <label>Severidad:</label>
            <select
              value={filters.severity || ''}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
              className="filter-select"
              title="Seleccionar nivel de severidad de la falla"
            >
              <option value="">Todas las severidades</option>
              <option value="bajo">Bajo</option>
              <option value="medio">Medio</option>
              <option value="alto">Alto</option>
              <option value="critico">Crítico</option>
            </select>
          </div>

          {/* Kilometraje mínimo */}
          <div className="filter-group">
            <label>Kilometraje Mínimo:</label>
            <input
              type="number"
              placeholder="0"
              value={filters.min_km || ''}
              onChange={(e) => handleFilterChange('min_km', parseInt(e.target.value) || '')}
              className="filter-input"
            />
          </div>

          {/* Kilometraje máximo */}
          <div className="filter-group">
            <label>Kilometraje Máximo:</label>
            <input
              type="number"
              placeholder="999999"
              value={filters.max_km || ''}
              onChange={(e) => handleFilterChange('max_km', parseInt(e.target.value) || '')}
              className="filter-input"
            />
          </div>
        </div>

        <div className="filter-actions">
          <button onClick={applyFilters} className="apply-btn" disabled={loading}>
            {loading ? '🔄 Buscando...' : '🔍 Buscar'}
          </button>
          <button onClick={clearFilters} className="clear-btn">
            🗑️ Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Leyenda de Colores */}
      <div className="color-legend">
        <h3>Leyenda de Estados</h3>
        <div className="legend-grid">
          <div className="legend-section">
            <h4>Vehículos:</h4>
            <ColorIndicator color="verde" label="Operativo" />
            <ColorIndicator color="amarillo" label="Alerta" />
            <ColorIndicator color="rojo" label="Crítico" />
          </div>
          <div className="legend-section">
            <h4>Fatiga:</h4>
            <ColorIndicator color="normal" label="Normal" />
            <ColorIndicator color="alerta" label="Alerta" />
            <ColorIndicator color="alto" label="Alto" />
            <ColorIndicator color="critico" label="Crítico" />
          </div>
          <div className="legend-section">
            <h4>Severidad:</h4>
            <ColorIndicator color="bajo" label="Bajo" />
            <ColorIndicator color="medio" label="Medio" />
            <ColorIndicator color="alto" label="Alto" />
            <ColorIndicator color="critico" label="Crítico" />
          </div>
        </div>
      </div>

      {/* Resultados */}
      {error && (
        <div className="error-message">
          <span className="error-icon">❌</span>
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="loading-message">
          <div className="loading-spinner"></div>
          <span>Buscando datos...</span>
        </div>
      )}

      {results && (
        <div className="results-section">
          <div className="results-header">
            <h3>Resultados de Búsqueda</h3>
            <div className="results-tabs">
              <button
                className={`tab-btn ${activeTab === 'vehiculos' ? 'active' : ''}`}
                onClick={() => setActiveTab('vehiculos')}
              >
                🚗 Vehículos ({results.vehiculos.length})
              </button>
              <button
                className={`tab-btn ${activeTab === 'conductores' ? 'active' : ''}`}
                onClick={() => setActiveTab('conductores')}
              >
                👥 Conductores ({results.conductores.length})
              </button>
              <button
                className={`tab-btn ${activeTab === 'fallas' ? 'active' : ''}`}
                onClick={() => setActiveTab('fallas')}
              >
                ⚠️ Fallas ({results.fallas_mecanicas.length})
              </button>
            </div>
          </div>

          <div className="results-content">
            {activeTab === 'vehiculos' && (
              <div className="results-grid">
                {results.vehiculos.length > 0 ? (
                  results.vehiculos.map(renderVehicleCard)
                ) : (
                  <div className="no-results">No se encontraron vehículos</div>
                )}
              </div>
            )}

            {activeTab === 'conductores' && (
              <div className="results-grid">
                {results.conductores.length > 0 ? (
                  results.conductores.map(renderDriverCard)
                ) : (
                  <div className="no-results">No se encontraron conductores</div>
                )}
              </div>
            )}

            {activeTab === 'fallas' && (
              <div className="results-grid">
                {results.fallas_mecanicas.length > 0 ? (
                  results.fallas_mecanicas.map(renderFailureCard)
                ) : (
                  <div className="no-results">No se encontraron fallas</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilter;