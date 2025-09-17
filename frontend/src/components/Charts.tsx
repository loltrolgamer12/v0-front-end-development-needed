import React, { useState, useEffect } from 'react';
import './Charts.css';

interface ChartData {
  chart_data: string; // Base64 image data
  chart_type: string;
}

interface ChartsProps {
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

const Charts: React.FC<ChartsProps> = ({ 
  autoRefresh = false, 
  refreshInterval = 30000 
}) => {
  const [charts, setCharts] = useState<{ [key: string]: ChartData }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [activeChart, setActiveChart] = useState<string>('estado_vehiculos');

  const chartTypes = [
    {
      id: 'estado_vehiculos',
      title: 'Estado de Vehículos',
      icon: '🚗',
      description: 'Distribución del estado operativo de los vehículos'
    },
    {
      id: 'fatiga_conductores',
      title: 'Fatiga de Conductores',
      icon: '👥',
      description: 'Niveles de fatiga de los conductores analizados'
    },
    {
      id: 'fallas_categoria',
      title: 'Fallas por Categoría',
      icon: '🔧',
      description: 'Distribución de fallas mecánicas por tipo'
    },
    {
      id: 'severidad_fallas',
      title: 'Severidad de Fallas',
      icon: '⚠️',
      description: 'Niveles de severidad de las fallas detectadas'
    }
  ];

  const fetchChart = async (chartType: string) => {
    setLoading(prev => ({ ...prev, [chartType]: true }));
    setErrors(prev => ({ ...prev, [chartType]: '' }));

    try {
      const response = await fetch(`/api/graficas/${chartType}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setCharts(prev => ({ 
          ...prev, 
          [chartType]: {
            chart_data: result.chart_data,
            chart_type: result.chart_type
          }
        }));
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setErrors(prev => ({ ...prev, [chartType]: errorMessage }));
    } finally {
      setLoading(prev => ({ ...prev, [chartType]: false }));
    }
  };

  const fetchAllCharts = async () => {
    const promises = chartTypes.map(chart => fetchChart(chart.id));
    await Promise.all(promises);
  };

  const refreshChart = (chartType: string) => {
    fetchChart(chartType);
  };

  const downloadChart = (chartType: string) => {
    const chart = charts[chartType];
    if (!chart) return;

    // Crear enlace de descarga
    const link = document.createElement('a');
    link.href = chart.chart_data;
    link.download = `grafica_${chartType}_${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    // Cargar gráficas iniciales
    fetchAllCharts();

    // Configurar auto-refresh si está habilitado
    if (autoRefresh) {
      const interval = setInterval(fetchAllCharts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  return (
    <div className="charts-container">
      <div className="charts-header">
        <div className="header-content">
          <h2>📈 Gráficas Interactivas</h2>
          <p>Visualización de datos del análisis HQ-FO-40</p>
        </div>
        
        <div className="header-actions">
          <button 
            onClick={fetchAllCharts} 
            className="refresh-all-btn"
            disabled={Object.values(loading).some(l => l)}
          >
            🔄 Actualizar Todas
          </button>
        </div>
      </div>

      {/* Navegación de gráficas */}
      <div className="chart-navigation">
        {chartTypes.map(chart => (
          <button
            key={chart.id}
            className={`nav-btn ${activeChart === chart.id ? 'active' : ''} ${loading[chart.id] ? 'loading' : ''}`}
            onClick={() => setActiveChart(chart.id)}
          >
            <span className="nav-icon">{chart.icon}</span>
            <span className="nav-title">{chart.title}</span>
            {loading[chart.id] && <span className="nav-loading">⏳</span>}
          </button>
        ))}
      </div>

      {/* Visualización de gráfica activa */}
      <div className="chart-display">
        {chartTypes.map(chart => (
          <div
            key={chart.id}
            className={`chart-panel ${activeChart === chart.id ? 'active' : ''}`}
          >
            <div className="chart-panel-header">
              <div className="panel-info">
                <h3>{chart.icon} {chart.title}</h3>
                <p>{chart.description}</p>
              </div>
              
              <div className="panel-actions">
                <button
                  onClick={() => refreshChart(chart.id)}
                  className="action-btn refresh"
                  disabled={loading[chart.id]}
                  title="Actualizar gráfica"
                >
                  {loading[chart.id] ? '⏳' : '🔄'}
                </button>
                
                <button
                  onClick={() => downloadChart(chart.id)}
                  className="action-btn download"
                  disabled={!charts[chart.id] || loading[chart.id]}
                  title="Descargar gráfica"
                >
                  📥
                </button>
              </div>
            </div>

            <div className="chart-content">
              {loading[chart.id] && (
                <div className="chart-loading">
                  <div className="loading-spinner"></div>
                  <p>Generando gráfica...</p>
                </div>
              )}

              {errors[chart.id] && (
                <div className="chart-error">
                  <div className="error-icon">❌</div>
                  <h4>Error al cargar gráfica</h4>
                  <p>{errors[chart.id]}</p>
                  <button
                    onClick={() => refreshChart(chart.id)}
                    className="retry-btn"
                  >
                    Reintentar
                  </button>
                </div>
              )}

              {charts[chart.id] && !loading[chart.id] && !errors[chart.id] && (
                <div className="chart-image-container">
                  <img
                    src={charts[chart.id].chart_data}
                    alt={chart.title}
                    className="chart-image"
                  />
                  <div className="chart-timestamp">
                    Actualizado: {new Date().toLocaleString()}
                  </div>
                </div>
              )}

              {!charts[chart.id] && !loading[chart.id] && !errors[chart.id] && (
                <div className="chart-empty">
                  <div className="empty-icon">📊</div>
                  <h4>Gráfica no disponible</h4>
                  <p>No hay datos suficientes para generar esta gráfica</p>
                  <button
                    onClick={() => refreshChart(chart.id)}
                    className="load-btn"
                  >
                    Cargar Gráfica
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Información adicional sobre las gráficas */}
      <div className="charts-info">
        <h3>ℹ️ Información sobre las Gráficas</h3>
        
        <div className="info-grid">
          <div className="info-card">
            <h4>🚗 Estado de Vehículos</h4>
            <p>
              Muestra la cantidad de vehículos en cada estado: operativo (verde), 
              alerta (amarillo) y crítico (rojo). Ayuda a identificar rápidamente 
              la situación general de la flota.
            </p>
          </div>
          
          <div className="info-card">
            <h4>👥 Fatiga de Conductores</h4>
            <p>
              Representa los niveles de fatiga detectados en los conductores: 
              normal, alerta, alto y crítico. Esencial para la seguridad vial 
              y el cumplimiento de normativas laborales.
            </p>
          </div>
          
          <div className="info-card">
            <h4>🔧 Fallas por Categoría</h4>
            <p>
              Distribución de las fallas mecánicas por categorías (motor, frenos, 
              suspensión, etc.). Permite identificar patrones de mantenimiento 
              y planificar recursos de reparación.
            </p>
          </div>
          
          <div className="info-card">
            <h4>⚠️ Severidad de Fallas</h4>
            <p>
              Clasificación de las fallas por nivel de severidad (bajo, medio, 
              alto, crítico). Fundamental para priorizar las reparaciones y 
              garantizar la seguridad operacional.
            </p>
          </div>
        </div>
        
        <div className="usage-tips">
          <h4>💡 Consejos de Uso</h4>
          <ul>
            <li>Las gráficas se actualizan automáticamente cada 30 segundos si está habilitado</li>
            <li>Puedes descargar cualquier gráfica haciendo clic en el botón de descarga</li>
            <li>Use las gráficas para presentaciones y reportes ejecutivos</li>
            <li>Los colores siguen el sistema estándar: verde (normal), amarillo (alerta), rojo (crítico)</li>
            <li>Las gráficas se generan en tiempo real basadas en los datos más recientes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Charts;