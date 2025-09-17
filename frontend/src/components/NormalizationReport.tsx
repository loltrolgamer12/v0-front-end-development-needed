import React, { useState, useEffect } from 'react';
import './NormalizationReport.css';

interface NormalizationItem {
  original: string;
  normalizado: string;
  tipo: string;
}

interface NormalizationReport {
  conductores_normalizados: NormalizationItem[];
  vehiculos_normalizados: NormalizationItem[];
  fallas_normalizadas: NormalizationItem[];
  fechas_normalizadas: NormalizationItem[];
  total_normalizaciones: number;
}

const NormalizationReport: React.FC = () => {
  const [report, setReport] = useState<NormalizationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'conductores' | 'vehiculos' | 'fallas'>('conductores');

  useEffect(() => {
    fetchNormalizationReport();
  }, []);

  const fetchNormalizationReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/normalization-report');
      if (!response.ok) {
        throw new Error('Error al obtener reporte de normalización');
      }

      const result = await response.json();
      if (result.success) {
        setReport(result.normalization_report);
      } else {
        setError('Error en la respuesta del servidor');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (tipo: string): string => {
    switch (tipo) {
      case 'nombre': return '👤';
      case 'codigo': return '🚗';
      case 'descripcion': return '🔧';
      case 'hora_inicio':
      case 'hora_fin': return '⏰';
      case 'fecha': return '📅';
      default: return '📝';
    }
  };

  const getTypeLabel = (tipo: string): string => {
    const labels: { [key: string]: string } = {
      'nombre': 'Nombre',
      'codigo': 'Código',
      'descripcion': 'Descripción',
      'hora_inicio': 'Hora Inicio',
      'hora_fin': 'Hora Fin',
      'fecha': 'Fecha'
    };
    return labels[tipo] || tipo;
  };

  if (loading) {
    return (
      <div className="normalization-report">
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando reporte de normalización...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="normalization-report">
        <div className="error">
          <h3>❌ Error</h3>
          <p>{error}</p>
          <button onClick={fetchNormalizationReport} className="retry-btn">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!report || report.total_normalizaciones === 0) {
    return (
      <div className="normalization-report">
        <div className="no-data">
          <h3>📋 Reporte de Normalización</h3>
          <p>No se encontraron datos normalizados.</p>
          <p className="hint">Los datos serán normalizados automáticamente cuando se procese un archivo Excel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="normalization-report">
      <div className="report-header">
        <h2>📋 Reporte de Normalización de Datos</h2>
        <div className="summary">
          <span className="total-badge">
            Total de normalizaciones: {report.total_normalizaciones}
          </span>
        </div>
      </div>

      <div className="tabs-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'conductores' ? 'active' : ''}`}
            onClick={() => setActiveTab('conductores')}
          >
            👤 Conductores ({report.conductores_normalizados.length})
          </button>
          <button
            className={`tab ${activeTab === 'vehiculos' ? 'active' : ''}`}
            onClick={() => setActiveTab('vehiculos')}
          >
            🚗 Vehículos ({report.vehiculos_normalizados.length})
          </button>
          <button
            className={`tab ${activeTab === 'fallas' ? 'active' : ''}`}
            onClick={() => setActiveTab('fallas')}
          >
            🔧 Fallas ({report.fallas_normalizadas.length})
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'conductores' && (
            <div className="normalization-section">
              <h3>Conductores Normalizados</h3>
              {report.conductores_normalizados.length === 0 ? (
                <p className="no-items">No se normalizaron datos de conductores.</p>
              ) : (
                <div className="normalization-items">
                  {report.conductores_normalizados.map((item, index) => (
                    <div key={index} className="normalization-item">
                      <div className="item-header">
                        <span className="type-icon">{getTypeIcon(item.tipo)}</span>
                        <span className="type-label">{getTypeLabel(item.tipo)}</span>
                      </div>
                      <div className="comparison">
                        <div className="original">
                          <label>Original:</label>
                          <span className="value original-value">{item.original}</span>
                        </div>
                        <div className="arrow">→</div>
                        <div className="normalized">
                          <label>Normalizado:</label>
                          <span className="value normalized-value">{item.normalizado}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'vehiculos' && (
            <div className="normalization-section">
              <h3>Vehículos Normalizados</h3>
              {report.vehiculos_normalizados.length === 0 ? (
                <p className="no-items">No se normalizaron datos de vehículos.</p>
              ) : (
                <div className="normalization-items">
                  {report.vehiculos_normalizados.map((item, index) => (
                    <div key={index} className="normalization-item">
                      <div className="item-header">
                        <span className="type-icon">{getTypeIcon(item.tipo)}</span>
                        <span className="type-label">{getTypeLabel(item.tipo)}</span>
                      </div>
                      <div className="comparison">
                        <div className="original">
                          <label>Original:</label>
                          <span className="value original-value">{item.original}</span>
                        </div>
                        <div className="arrow">→</div>
                        <div className="normalized">
                          <label>Normalizado:</label>
                          <span className="value normalized-value">{item.normalizado}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'fallas' && (
            <div className="normalization-section">
              <h3>Fallas Normalizadas</h3>
              {report.fallas_normalizadas.length === 0 ? (
                <p className="no-items">No se normalizaron descripciones de fallas.</p>
              ) : (
                <div className="normalization-items">
                  {report.fallas_normalizadas.map((item, index) => (
                    <div key={index} className="normalization-item">
                      <div className="item-header">
                        <span className="type-icon">{getTypeIcon(item.tipo)}</span>
                        <span className="type-label">{getTypeLabel(item.tipo)}</span>
                      </div>
                      <div className="comparison">
                        <div className="original">
                          <label>Original:</label>
                          <span className="value original-value">{item.original}</span>
                        </div>
                        <div className="arrow">→</div>
                        <div className="normalized">
                          <label>Normalizado:</label>
                          <span className="value normalized-value">{item.normalizado}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="refresh-section">
        <button onClick={fetchNormalizationReport} className="refresh-btn">
          🔄 Actualizar Reporte
        </button>
      </div>
    </div>
  );
};

export default NormalizationReport;