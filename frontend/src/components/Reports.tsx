import React, { useState, useEffect } from 'react';
import './Reports.css';
import { API_ENDPOINTS } from '../config/api';

interface ReportData {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  created: string;
  records: number;
  status: string;
  downloadUrl?: string;
}

interface FilterOptions {
  startDate: string;
  endDate: string;
  reportType: string;
  format: string;
  includeGraphics: boolean;
  includeDetails: boolean;
}

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    startDate: '',
    endDate: '',
    reportType: 'complete',
    format: 'pdf',
    includeGraphics: true,
    includeDetails: true
  });

  useEffect(() => {
    loadReportHistory();
  }, []);

  const loadReportHistory = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.reports.history);
      if (!response.ok) {
        throw new Error('Error al cargar historial de reportes');
      }
      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error('Error loading report history:', err);
      setReports([]);
    }
  };

  const generateReport = async () => {
    if (!filters.startDate || !filters.endDate) {
      setError('Por favor selecciona las fechas de inicio y fin');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.reports.generate, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(filters)
      });

      if (!response.ok) {
        throw new Error('Error al generar reporte');
      }

      if (filters.format === 'pdf' || filters.format === 'excel') {
        // Download file directly
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_${filters.startDate}_${filters.endDate}.${filters.format === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // JSON response - data processed internally
        await response.json();
      }

      await loadReportHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al generar reporte');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/download/${reportId}`);
      if (!response.ok) {
        throw new Error('Error al descargar reporte');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading report:', err);
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este reporte?')) {
      return;
    }

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar reporte');
      }

      await loadReportHistory();
    } catch (err) {
      console.error('Error deleting report:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'processing': return 'Procesando';
      case 'error': return 'Error';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="reports-container">
      {/* Header */}
      <div className="reports-header">
        <div className="header-content">
          <h2>📊 Sistema de Reportes</h2>
          <p>Genera y gestiona reportes personalizados de análisis vehicular</p>
        </div>
        <div className="header-actions">
          <button
            className="refresh-btn"
            onClick={loadReportHistory}
            disabled={loading}
          >
            🔄
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          <span className="tab-icon">📝</span>
          <span className="tab-title">Generar Reporte</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <span className="tab-icon">📋</span>
          <span className="tab-title">Historial</span>
          {reports.length > 0 && (
            <span className="tab-badge">{reports.length}</span>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button
            className="error-close"
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Generate Report Tab */}
      {activeTab === 'generate' && (
        <div className="generate-panel">
          <div className="panel-header">
            <h3>Configuración del Reporte</h3>
            <p>Personaliza los parámetros del reporte según tus necesidades</p>
          </div>

          <div className="form-grid">
            {/* Date Range */}
            <div className="form-section">
              <h4>📅 Rango de Fechas</h4>
              <div className="date-inputs">
                <div className="input-group">
                  <label>Fecha de Inicio</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      startDate: e.target.value
                    }))}
                    title="Selecciona la fecha de inicio del período a reportar"
                    placeholder="dd/mm/aaaa"
                  />
                </div>
                <div className="input-group">
                  <label>Fecha de Fin</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      endDate: e.target.value
                    }))}
                    title="Selecciona la fecha de fin del período a reportar"
                    placeholder="dd/mm/aaaa"
                  />
                </div>
              </div>
            </div>

            {/* Report Type */}
            <div className="form-section">
              <h4>📋 Tipo de Reporte</h4>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="reportType"
                    value="complete"
                    checked={filters.reportType === 'complete'}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      reportType: e.target.value
                    }))}
                  />
                  <span className="radio-label">Completo</span>
                  <span className="radio-desc">Incluye todos los datos y análisis</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="reportType"
                    value="fatigue"
                    checked={filters.reportType === 'fatigue'}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      reportType: e.target.value
                    }))}
                  />
                  <span className="radio-label">Control de Fatiga</span>
                  <span className="radio-desc">Solo conductores con fatiga detectada</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="reportType"
                    value="failures"
                    checked={filters.reportType === 'failures'}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      reportType: e.target.value
                    }))}
                  />
                  <span className="radio-label">Fallas Mecánicas</span>
                  <span className="radio-desc">Solo vehículos con fallas reportadas</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="reportType"
                    value="summary"
                    checked={filters.reportType === 'summary'}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      reportType: e.target.value
                    }))}
                  />
                  <span className="radio-label">Resumen Ejecutivo</span>
                  <span className="radio-desc">Solo métricas y estadísticas principales</span>
                </label>
              </div>
            </div>

            {/* Export Format */}
            <div className="form-section">
              <h4>💾 Formato de Exportación</h4>
              <div className="format-options">
                <label className="format-option">
                  <input
                    type="radio"
                    name="format"
                    value="pdf"
                    checked={filters.format === 'pdf'}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      format: e.target.value
                    }))}
                  />
                  <span className="format-icon">📄</span>
                  <span className="format-label">PDF</span>
                </label>
                <label className="format-option">
                  <input
                    type="radio"
                    name="format"
                    value="excel"
                    checked={filters.format === 'excel'}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      format: e.target.value
                    }))}
                  />
                  <span className="format-icon">📊</span>
                  <span className="format-label">Excel</span>
                </label>
                <label className="format-option">
                  <input
                    type="radio"
                    name="format"
                    value="json"
                    checked={filters.format === 'json'}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      format: e.target.value
                    }))}
                  />
                  <span className="format-icon">📋</span>
                  <span className="format-label">JSON</span>
                </label>
              </div>
            </div>

            {/* Additional Options */}
            <div className="form-section">
              <h4>⚙️ Opciones Adicionales</h4>
              <div className="checkbox-group">
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={filters.includeGraphics}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      includeGraphics: e.target.checked
                    }))}
                  />
                  <span className="checkbox-label">Incluir Gráficas</span>
                  <span className="checkbox-desc">Añadir visualizaciones y charts al reporte</span>
                </label>
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={filters.includeDetails}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      includeDetails: e.target.checked
                    }))}
                  />
                  <span className="checkbox-label">Incluir Detalles</span>
                  <span className="checkbox-desc">Mostrar información detallada de cada registro</span>
                </label>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="generate-actions">
            <button
              className="generate-btn"
              onClick={generateReport}
              disabled={loading || !filters.startDate || !filters.endDate}
            >
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  Generando...
                </>
              ) : (
                <>
                  <span className="btn-icon">📊</span>
                  Generar Reporte
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Report History Tab */}
      {activeTab === 'history' && (
        <div className="history-panel">
          <div className="panel-header">
            <h3>Historial de Reportes</h3>
            <p>Gestiona y descarga reportes previamente generados</p>
          </div>

          {reports.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <h4>No hay reportes generados</h4>
              <p>Los reportes que generes aparecerán aquí para su descarga posterior</p>
              <button
                className="empty-action"
                onClick={() => setActiveTab('generate')}
              >
                Generar Primer Reporte
              </button>
            </div>
          ) : (
            <div className="reports-list">
              {reports.map((report) => (
                <div key={report.id} className="report-card">
                  <div className="report-info">
                    <div className="report-main">
                      <h4 className="report-name">{report.name}</h4>
                      <p className="report-period">
                        {formatDate(report.startDate)} - {formatDate(report.endDate)}
                      </p>
                    </div>
                    <div className="report-meta">
                      <div className="report-stats">
                        <span className="stat">
                          <span className="stat-label">Registros:</span>
                          <span className="stat-value">{report.records}</span>
                        </span>
                        <span className="stat">
                          <span className="stat-label">Creado:</span>
                          <span className="stat-value">{formatDate(report.created)}</span>
                        </span>
                      </div>
                      <div
                        className={`report-status ${report.status}`}
                      >
                        {getStatusText(report.status)}
                      </div>
                    </div>
                  </div>
                  <div className="report-actions">
                    <button
                      className="action-btn download"
                      onClick={() => downloadReport(report.id)}
                      disabled={report.status !== 'completed'}
                      title="Descargar reporte"
                    >
                      ⬇️
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => deleteReport(report.id)}
                      title="Eliminar reporte"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Report Information */}
      <div className="reports-info">
        <h3>ℹ️ Información sobre Reportes</h3>
        <div className="info-grid">
          <div className="info-card">
            <h4>📊 Tipos de Reporte</h4>
            <p><strong>Completo:</strong> Incluye todos los datos, análisis de fatiga, fallas mecánicas y estadísticas generales.</p>
            <p><strong>Control de Fatiga:</strong> Se enfoca únicamente en conductores que presentan signos de fatiga.</p>
            <p><strong>Fallas Mecánicas:</strong> Lista solo vehículos con fallas reportadas y su categorización.</p>
            <p><strong>Resumen Ejecutivo:</strong> Métricas clave y estadísticas para toma de decisiones.</p>
          </div>
          <div className="info-card">
            <h4>💾 Formatos Disponibles</h4>
            <p><strong>PDF:</strong> Ideal para presentaciones formales, incluye formato profesional y gráficas.</p>
            <p><strong>Excel:</strong> Perfecto para análisis adicional, permite filtrado y manipulación de datos.</p>
            <p><strong>JSON:</strong> Para integración con otros sistemas o procesamiento automatizado.</p>
          </div>
          <div className="info-card">
            <h4>⚙️ Opciones de Personalización</h4>
            <p><strong>Gráficas:</strong> Incluye visualizaciones de datos para mejor comprensión.</p>
            <p><strong>Detalles:</strong> Añade información detallada de cada registro de inspección.</p>
            <p><strong>Período:</strong> Filtra datos por rango de fechas específico.</p>
          </div>
          <div className="info-card">
            <h4>🔄 Gestión de Reportes</h4>
            <p>Los reportes se mantienen disponibles durante la sesión actual.</p>
            <p>Puedes descargar reportes múltiples veces desde el historial.</p>
            <p>Los reportes se eliminan automáticamente al cerrar la aplicación.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;