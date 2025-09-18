import React, { useState, useCallback } from 'react';
import './FileUploader.css';
import { API_ENDPOINTS } from '../config/api';
import { uploadWithLogging } from '../utils/fetchWithLogging';

interface UploadResult {
  success: boolean;
  message?: string;
  data?: any;
  summary?: any;
  error?: string;
}

interface FileUploaderProps {
  onUploadSuccess?: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  onUploadSuccess, 
  onUploadError 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const validateFile = (file: File): string | null => {
    // Validar tipo de archivo
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return 'Tipo de archivo no válido. Solo se permiten archivos Excel (.xlsx, .xls)';
    }
    
    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return 'El archivo es demasiado grande. Máximo 10MB permitido.';
    }
    
    // Validar que contenga "HQ-FO-40" en el nombre (opcional pero recomendado)
    if (!file.name.toLowerCase().includes('hq-fo-40') && 
        !file.name.toLowerCase().includes('inspeccion') &&
        !file.name.toLowerCase().includes('vehiculo')) {
      console.warn('El archivo no parece ser un formato HQ-FO-40 estándar');
    }
    
    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadResult({ success: false, error });
      if (onUploadError) onUploadError(error);
      return;
    }
    
    setSelectedFile(file);
    setUploadResult(null);
  }, [onUploadError]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadResult(null);
    
    console.log('📤 FileUploader: Iniciando subida de archivo...', {
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      fileType: selectedFile.type,
      endpoint: API_ENDPOINTS.upload
    });
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      const result = await uploadWithLogging(API_ENDPOINTS.upload, formData);
      
      console.log('📊 FileUploader: Respuesta recibida:', result);
      
      if (result.success) {
        setUploadResult(result);
        console.log('✅ FileUploader: Archivo subido exitosamente');
        if (onUploadSuccess) onUploadSuccess(result);
      } else {
        const error = result.error || 'Error desconocido al procesar el archivo';
        setUploadResult({ success: false, error });
        console.error('❌ FileUploader: Error en respuesta del servidor:', result);
        if (onUploadError) onUploadError(error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de conexión';
      setUploadResult({ success: false, error: errorMessage });
      console.error('💥 FileUploader: Error crítico de subida:', {
        error,
        fileName: selectedFile.name,
        endpoint: API_ENDPOINTS.upload,
        timestamp: new Date().toISOString()
      });
      if (onUploadError) onUploadError(errorMessage);
    } finally {
      setIsUploading(false);
      console.log('🏁 FileUploader: Proceso de subida finalizado');
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setUploadResult(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const testAllEndpoints = async () => {
    console.log('🔧 DIAGNÓSTICO: Probando todos los endpoints...');
    
    const endpoints = [
      { name: 'Dashboard', url: API_ENDPOINTS.dashboard },
      { name: 'Conductores Fatiga', url: API_ENDPOINTS.conductores.fatiga },
      { name: 'Conductores Compliance', url: API_ENDPOINTS.conductores.compliance },
      { name: 'Vehículos', url: API_ENDPOINTS.vehiculos },
      { name: 'Fallas', url: API_ENDPOINTS.fallas },
      { name: 'Gráficas Estado', url: API_ENDPOINTS.graficas.estadoVehiculos },
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Probando ${endpoint.name}: ${endpoint.url}`);
        const response = await fetch(endpoint.url);
        const text = await response.text();
        
        if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
          console.error(`❌ ${endpoint.name}: Devuelve HTML en lugar de JSON`);
          console.log(`📄 HTML Preview: ${text.substring(0, 100)}...`);
        } else {
          console.log(`✅ ${endpoint.name}: Respuesta JSON correcta`);
          try {
            const json = JSON.parse(text);
            console.log(`📊 ${endpoint.name} Data:`, json);
          } catch (e) {
            console.warn(`⚠️ ${endpoint.name}: No es JSON válido: ${text.substring(0, 100)}...`);
          }
        }
      } catch (error) {
        console.error(`💥 ${endpoint.name}: Error de conexión:`, error);
      }
    }
  };

  return (
    <div className="file-uploader">
      <div className="uploader-header">
        <h2>📄 Subir Archivo HQ-FO-40</h2>
        <p>Selecciona o arrastra un archivo Excel de inspección de vehículos</p>
      </div>

      <div
        className={`upload-zone ${isDragOver ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!selectedFile ? (
          <>
            <div className="upload-icon">📁</div>
            <div className="upload-text">
              <p><strong>Arrastra tu archivo aquí</strong></p>
              <p>o</p>
              <label htmlFor="file-input" className="file-input-label">
                Seleccionar archivo
              </label>
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInputChange}
                className="file-input"
              />
            </div>
            <div className="upload-requirements">
              <p><small>Formatos soportados: .xlsx, .xls (máximo 10MB)</small></p>
            </div>
          </>
        ) : (
          <div className="selected-file">
            <div className="file-icon">📋</div>
            <div className="file-info">
              <div className="file-name">{selectedFile.name}</div>
              <div className="file-size">{formatFileSize(selectedFile.size)}</div>
              <div className="file-type">{selectedFile.type}</div>
            </div>
            <div className="file-actions">
              <button
                onClick={uploadFile}
                disabled={isUploading}
                className="upload-btn"
              >
                {isUploading ? '⏳ Procesando...' : '📤 Analizar Archivo'}
              </button>
              <button
                onClick={clearSelection}
                disabled={isUploading}
                className="clear-btn"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Barra de progreso durante la carga */}
      {isUploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          <p>Analizando archivo Excel y extrayendo datos...</p>
        </div>
      )}

      {/* Resultados del análisis */}
      {uploadResult && (
        <div className={`upload-result ${uploadResult.success ? 'success' : 'error'}`}>
          {uploadResult.success ? (
            <>
              <div className="result-header">
                <span className="result-icon">✅</span>
                <h3>Archivo procesado exitosamente</h3>
              </div>
              
              {uploadResult.summary && (
                <div className="result-summary">
                  <h4>📊 Resumen del Análisis:</h4>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span className="summary-label">Vehículos analizados:</span>
                      <span className="summary-value">{uploadResult.summary.total_vehiculos}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Conductores registrados:</span>
                      <span className="summary-value">{uploadResult.summary.total_conductores}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Fallas detectadas:</span>
                      <span className="summary-value">{uploadResult.summary.total_fallas}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Vehículos operativos:</span>
                      <span className="summary-value summary-success">{uploadResult.summary.vehiculos_operativos}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Vehículos en alerta:</span>
                      <span className="summary-value summary-warning">{uploadResult.summary.vehiculos_alerta}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Vehículos críticos:</span>
                      <span className="summary-value summary-danger">{uploadResult.summary.vehiculos_criticos}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="result-actions">
                <button onClick={() => window.location.href = '/dashboard'} className="view-dashboard-btn">
                  📊 Ver Dashboard
                </button>
                <button onClick={() => window.location.href = '/search'} className="view-data-btn">
                  🔍 Explorar Datos
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="result-header">
                <span className="result-icon">❌</span>
                <h3>Error al procesar archivo</h3>
              </div>
              <div className="error-message">
                <p>{uploadResult.error}</p>
              </div>
              <div className="error-tips">
                <h4>💡 Consejos:</h4>
                <ul>
                  <li>Verifica que sea un archivo Excel válido (.xlsx o .xls)</li>
                  <li>Asegúrate de que contenga datos de inspección HQ-FO-40</li>
                  <li>El archivo no debe estar corrupto o protegido</li>
                  <li>Revisa que el formato siga la estructura estándar</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}

      {/* Botón de diagnóstico de endpoints */}
      <div className="diagnostic-section">
        <h3>🔧 Diagnóstico de Backend</h3>
        <button 
          onClick={() => testAllEndpoints()}
          className="diagnostic-btn"
        >
          🔍 Probar Todos los Endpoints
        </button>
      </div>

      {/* Información sobre el formato HQ-FO-40 */}
      <div className="format-info">
        <h3>ℹ️ Sobre el formato HQ-FO-40</h3>
        <p>
          Este sistema está optimizado para procesar archivos de "Inspección Diaria de Vehículo Liviano" 
          que contengan información separada de vehículos y conductores, incluyendo:
        </p>
        <ul>
          <li>Datos del vehículo (código, placa, kilometraje, combustible)</li>
          <li>Información del conductor (nombre, horarios, horas trabajadas)</li>
          <li>Registro de fallas mecánicas y su categorización</li>
          <li>Estados operativos y niveles de alerta</li>
          <li>Control de fatiga y recomendaciones</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUploader;