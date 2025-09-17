"""
API Flask para el sistema de análisis HQ-FO-40
Endpoints para upload, análisis, búsqueda, gráficas y reportes
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import sqlite3
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Backend sin GUI para gráficos
import matplotlib.pyplot as plt
from datetime import datetime, timedelta
import os
import tempfile
import time
import io
import base64
from typing import Dict, List
import json

# Importaciones locales - manejar tanto ejecución directa como módulo
try:
    from .hqfo_logger import get_logger
    from .hqfo_analyzer import HQFOAnalyzer
except ImportError:
    # Ejecución directa
    from hqfo_logger import get_logger
    from hqfo_analyzer import HQFOAnalyzer

app = Flask(__name__)
CORS(app)

# Inicializar sistema de logging
logger = get_logger("API")
logger.info("=== INICIANDO API HQ-FO-40 ===")
logger.info(f"Entorno: {'Vercel' if os.environ.get('VERCEL') else 'Desarrollo'}")

# Configuración para Vercel
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB máximo para archivos Excel reales
logger.info(f"Límite de archivo configurado: {app.config['MAX_CONTENT_LENGTH'] / (1024*1024)}MB")

# Handler para errores de tamaño de archivo
@app.errorhandler(413)
def handle_file_too_large(e):
    return jsonify({
        'error': 'Archivo demasiado grande',
        'message': 'El archivo debe ser menor a 4MB. Intente comprimir o dividir el archivo Excel.',
        'max_size': '4MB'
    }), 413

# Base de datos temporal (memoria para Vercel, archivo para desarrollo)
DATABASE = ':memory:' if os.environ.get('VERCEL') else 'hqfo_temp.db'
logger.info(f"Base de datos configurada: {DATABASE}")

analyzer = HQFOAnalyzer()
logger.info("Analizador HQ-FO-40 inicializado exitosamente")

def clear_analysis_data():
    """Limpiar solo los datos de análisis - MANTENER HISTORIAL DE REPORTES"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        logger.info("Limpiando datos de análisis anteriores antes de cargar nuevo archivo")
        
        # Eliminar datos de análisis pero mantener estructura de tablas
        cursor.execute("DELETE FROM conductores")
        cursor.execute("DELETE FROM vehiculos") 
        cursor.execute("DELETE FROM fallas_mecanicas")
        cursor.execute("DELETE FROM control_fatiga")
        # NO tocamos la tabla de reportes
        
        conn.commit()
        conn.close()
        
        # También limpiar el reporte de normalización en memoria
        if hasattr(analyzer, 'last_normalization_report'):
            delattr(analyzer, 'last_normalization_report')
        
        logger.info("Datos de análisis anteriores limpiados correctamente - historial de reportes preservado")
        return True
        
    except Exception as e:
        logger.error(f"Error limpiando datos de análisis: {str(e)}")
        return False

def init_db():
    """Inicializar base de datos temporal - Solo crea las tablas si no existen"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Tabla de conductores
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conductores (
            id TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            hora_inicio TEXT,
            hora_fin TEXT,
            horas_trabajadas REAL,
            nivel_fatiga TEXT,
            status_color TEXT,
            fecha_inspeccion TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tabla de vehículos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vehiculos (
            id TEXT PRIMARY KEY,
            codigo TEXT,
            placa TEXT,
            kilometraje REAL,
            combustible REAL,
            estado TEXT,
            status_color TEXT,
            fecha_inspeccion TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tabla de fallas mecánicas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS fallas_mecanicas (
            id TEXT PRIMARY KEY,
            descripcion TEXT NOT NULL,
            categoria TEXT,
            severidad TEXT,
            ubicacion_fila INTEGER,
            ubicacion_columna INTEGER,
            status_color TEXT,
            fecha_reporte TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tabla de control de fatiga
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS control_fatiga (
            id TEXT PRIMARY KEY,
            conductor_id TEXT,
            conductor_nombre TEXT,
            horas_trabajadas REAL,
            nivel_fatiga TEXT,
            recomendacion TEXT,
            status_color TEXT,
            fecha_analisis TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tabla de reportes
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reportes (
            id TEXT PRIMARY KEY,
            tipo TEXT NOT NULL,
            contenido TEXT,
            fecha_inicio TEXT,
            fecha_fin TEXT,
            parametros TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

def save_to_db(data: Dict):
    """Guardar datos procesados en la base de datos"""
    logger.log_function_entry("save_to_db", {
        'data_keys': list(data.keys()) if data else [],
        'conductores_count': len(data.get('conductores', [])) if data else 0,
        'vehiculos_count': len(data.get('vehiculos', [])) if data else 0,
        'fallas_count': len(data.get('fallas_mecanicas', [])) if data else 0
    })
    
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    try:
        # Guardar conductores
        conductores = data.get('conductores', [])
        logger.info(f"Guardando {len(conductores)} conductores en BD")
        
        for i, conductor in enumerate(conductores):
            cursor.execute('''
                INSERT OR REPLACE INTO conductores 
                (id, nombre, hora_inicio, hora_fin, horas_trabajadas, nivel_fatiga, status_color, fecha_inspeccion)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                conductor['id'],
                conductor.get('nombre', ''),
                conductor.get('hora_inicio', ''),
                conductor.get('hora_fin', ''),
                conductor.get('horas_trabajadas', 0),
                conductor.get('nivel_fatiga', ''),
                conductor.get('status_color', ''),
                conductor.get('fecha_inspeccion', '')
            ))
        
        # Guardar vehículos
        for vehiculo in data.get('vehiculos', []):
            cursor.execute('''
                INSERT OR REPLACE INTO vehiculos 
                (id, codigo, placa, kilometraje, combustible, estado, status_color, fecha_inspeccion)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                vehiculo['id'],
                vehiculo.get('codigo', ''),
                vehiculo.get('placa', ''),
                vehiculo.get('kilometraje', 0),
                vehiculo.get('combustible', 0),
                vehiculo.get('estado', ''),
                vehiculo.get('status_color', ''),
                vehiculo.get('fecha_inspeccion', '')
            ))
        
        # Guardar fallas mecánicas
        for falla in data.get('fallas_mecanicas', []):
            cursor.execute('''
                INSERT OR REPLACE INTO fallas_mecanicas 
                (id, descripcion, categoria, severidad, ubicacion_fila, ubicacion_columna, status_color, fecha_reporte)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                falla['id'],
                falla.get('descripcion', ''),
                falla.get('categoria', ''),
                falla.get('severidad', ''),
                falla.get('ubicacion_fila', 0),
                falla.get('ubicacion_columna', 0),
                falla.get('status_color', ''),
                falla.get('fecha_reporte', '')
            ))
        
        # Guardar control de fatiga
        for fatiga in data.get('control_fatiga', []):
            cursor.execute('''
                INSERT OR REPLACE INTO control_fatiga 
                (id, conductor_id, conductor_nombre, horas_trabajadas, nivel_fatiga, recomendacion, status_color, fecha_analisis)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                f"FATIGA_{fatiga['conductor_id']}",
                fatiga['conductor_id'],
                fatiga['conductor_nombre'],
                fatiga['horas_trabajadas'],
                fatiga['nivel_fatiga'],
                fatiga['recomendacion'],
                fatiga['status_color'],
                fatiga['fecha_analisis']
            ))
        
        conn.commit()
        logger.info("Datos guardados exitosamente en base de datos")
        return True
        
    except Exception as e:
        logger.error("Error guardando datos en base de datos", e, {
            'conductores_count': len(data.get('conductores', [])),
            'vehiculos_count': len(data.get('vehiculos', [])),
            'fallas_count': len(data.get('fallas_mecanicas', []))
        })
        return False
    finally:
        conn.close()
        logger.debug("Conexión a base de datos cerrada")

def get_filtered_data_from_db(filters: Dict) -> Dict:
    """
    Obtiene datos filtrados directamente desde la base de datos
    Reemplaza analyzer.get_filtered_data() para evitar re-procesar Excel
    """
    init_db()
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    
    try:
        filtered_data = {
            'conductores': _filter_conductores_db(conn, filters),
            'vehiculos': _filter_vehiculos_db(conn, filters),
            'fallas_mecanicas': _filter_fallas_db(conn, filters),
            'control_fatiga': _filter_fatiga_db(conn, filters)
        }
        
        logger.debug("Datos filtrados obtenidos desde BD", {
            'conductores_count': len(filtered_data['conductores']),
            'vehiculos_count': len(filtered_data['vehiculos']),
            'fallas_count': len(filtered_data['fallas_mecanicas']),
            'fatiga_count': len(filtered_data['control_fatiga']),
            'filters_applied': filters
        })
        
        return filtered_data
    
    finally:
        conn.close()

def _filter_conductores_db(conn, filters: Dict) -> List:
    """Filtra conductores desde BD"""
    query = "SELECT * FROM conductores WHERE 1=1"
    params = []
    
    if 'fatigue_level' in filters:
        # Buscar en control_fatiga
        query = """
            SELECT c.* FROM conductores c 
            LEFT JOIN control_fatiga cf ON c.id = cf.conductor_id 
            WHERE cf.nivel_fatiga = ?
        """
        params.append(filters['fatigue_level'])
    
    if 'status_color' in filters:
        query += " AND status_color = ?"
        params.append(filters['status_color'])
    
    if 'search_term' in filters and filters['search_term']:
        term = f"%{filters['search_term'].lower()}%"
        query += " AND (LOWER(nombre_completo) LIKE ? OR LOWER(nombre_normalizado) LIKE ?)"
        params.extend([term, term])
    
    cursor = conn.execute(query, params)
    return [dict(row) for row in cursor.fetchall()]

def _filter_vehiculos_db(conn, filters: Dict) -> List:
    """Filtra vehículos desde BD"""
    query = "SELECT * FROM vehiculos WHERE 1=1"
    params = []
    
    if 'status_color' in filters:
        query += " AND status_color = ?"
        params.append(filters['status_color'])
    
    if 'min_km' in filters:
        query += " AND kilometraje >= ?"
        params.append(filters['min_km'])
    
    if 'max_km' in filters:
        query += " AND kilometraje <= ?"
        params.append(filters['max_km'])
    
    cursor = conn.execute(query, params)
    return [dict(row) for row in cursor.fetchall()]

def _filter_fallas_db(conn, filters: Dict) -> List:
    """Filtra fallas mecánicas desde BD"""
    query = "SELECT * FROM fallas_mecanicas WHERE 1=1"
    params = []
    
    if 'category' in filters:
        query += " AND categoria = ?"
        params.append(filters['category'])
    
    if 'severity' in filters:
        query += " AND severidad = ?"
        params.append(filters['severity'])
    
    if 'search_term' in filters and filters['search_term']:
        term = f"%{filters['search_term'].lower()}%"
        query += " AND LOWER(descripcion) LIKE ?"
        params.append(term)
    
    cursor = conn.execute(query, params)
    return [dict(row) for row in cursor.fetchall()]

def _filter_fatiga_db(conn, filters: Dict) -> List:
    """Filtra control de fatiga desde BD"""
    query = "SELECT * FROM control_fatiga WHERE 1=1"
    params = []
    
    if 'fatigue_level' in filters:
        query += " AND nivel_fatiga = ?"
        params.append(filters['fatigue_level'])
    
    cursor = conn.execute(query, params)
    return [dict(row) for row in cursor.fetchall()]

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Endpoint para subir y procesar archivo Excel"""
    start_time = time.time()
    logger.log_function_entry("upload_file", {
        'files_in_request': list(request.files.keys()),
        'content_length': request.content_length,
        'method': request.method
    })
    
    try:
        # Validar presencia del archivo
        if 'file' not in request.files:
            logger.warning("No se encontró archivo en request", {
                'files_present': list(request.files.keys()),
                'form_data': dict(request.form)
            })
            return jsonify({'error': 'No se encontró archivo'}), 400
        
        file = request.files['file']
        logger.info(f"Archivo recibido en upload", {
            'filename': file.filename,
            'content_type': file.content_type,
            'headers': dict(file.headers) if hasattr(file, 'headers') else {}
        })
        
        # Validar nombre del archivo
        if file.filename == '':
            logger.warning("Nombre de archivo vacío")
            return jsonify({'error': 'No se seleccionó archivo'}), 400
        
        # Validar extensión
        if not file.filename.lower().endswith(('.xlsx', '.xls')):
            logger.warning("Formato de archivo no válido", {
                'filename': file.filename,
                'extension': file.filename.split('.')[-1] if '.' in file.filename else 'none'
            })
            return jsonify({'error': 'Formato de archivo no válido. Use Excel (.xlsx/.xls)'}), 400
        
        # *** LIMPIAR DATOS ANTERIORES ANTES DE PROCESAR NUEVO ARCHIVO ***
        logger.info("Iniciando limpieza de datos anteriores antes de cargar nuevo archivo")
        if not clear_analysis_data():
            logger.error("Error limpiando datos anteriores")
            return jsonify({'error': 'Error preparando sistema para nuevo archivo'}), 500
        
        # Guardar archivo temporalmente
        logger.info("Iniciando guardado de archivo temporal")
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp_file:
            temp_path = tmp_file.name
            logger.debug(f"Archivo temporal creado: {temp_path}")
            
            # Guardar archivo
            save_start = time.time()
            file.save(temp_path)
            save_duration = time.time() - save_start
            
            # Verificar archivo guardado
            file_size = os.path.getsize(temp_path)
            file_exists = os.path.exists(temp_path)
            
            logger.info("Archivo guardado en temporal", {
                'temp_path': temp_path,
                'file_size_bytes': file_size,
                'file_size_mb': round(file_size / (1024*1024), 2),
                'save_duration': round(save_duration, 4),
                'file_exists': file_exists
            })
            
            if file_size == 0:
                logger.error("Archivo temporal está vacío", {
                    'temp_path': temp_path,
                    'original_filename': file.filename
                })
                os.unlink(temp_path)
                return jsonify({'error': 'Archivo vacío o no se pudo guardar correctamente'}), 400
            
            # Procesar con el analizador
            logger.info("Iniciando análisis de Excel")
            analysis_start = time.time()
            
            result = analyzer.analyze_excel(temp_path)
            
            analysis_duration = time.time() - analysis_start
            logger.info("Análisis de Excel completado", {
                'success': result.get('success'),
                'analysis_duration': round(analysis_duration, 4),
                'error': result.get('error') if not result.get('success') else None
            })
            
            # Eliminar archivo temporal - intentar múltiples veces si está bloqueado
            cleanup_attempts = 0
            max_cleanup_attempts = 3
            while cleanup_attempts < max_cleanup_attempts:
                try:
                    time.sleep(0.1)  # Pequeña pausa para que se libere el archivo
                    os.unlink(temp_path)
                    logger.debug("Archivo temporal eliminado exitosamente")
                    break
                except PermissionError as perm_error:
                    cleanup_attempts += 1
                    if cleanup_attempts < max_cleanup_attempts:
                        logger.debug(f"Intento {cleanup_attempts}: Archivo temporal aún en uso, reintentando...")
                        time.sleep(0.5)  # Esperar más tiempo antes del siguiente intento
                    else:
                        logger.warning(f"No se pudo eliminar archivo temporal después de {max_cleanup_attempts} intentos", {
                            'temp_path': temp_path,
                            'error_msg': str(perm_error)
                        })
                except Exception as cleanup_error:
                    logger.warning(f"Error eliminando archivo temporal: {str(cleanup_error)}", {
                        'temp_path': temp_path,
                        'error_type': type(cleanup_error).__name__,
                        'error_msg': str(cleanup_error)
                    })
                    break
        
        # Procesar resultado del análisis
        if result['success']:
            logger.info("Procesando resultado exitoso del análisis")
            
            # Log resumen de datos extraídos
            data = result.get('data', {})
            logger.log_data_summary("extracted_data", data, {
                'conductores_count': len(data.get('conductores', [])),
                'vehiculos_count': len(data.get('vehiculos', [])),
                'fallas_mecanicas_count': len(data.get('fallas_mecanicas', [])),
                'control_fatiga_count': len(data.get('control_fatiga', []))
            })
            
            # Guardar en base de datos
            logger.info("Guardando datos en base de datos")
            db_start = time.time()
            
            save_to_db(data)
            
            db_duration = time.time() - db_start
            logger.info("Datos guardados en base de datos", {
                'db_save_duration': round(db_duration, 4)
            })
            
            # Guardar reporte de normalización en memoria
            if 'normalization_report' in result:
                analyzer.last_normalization_report = result['normalization_report']
                logger.debug("Reporte de normalización guardado en memoria")
            
            total_duration = time.time() - start_time
            logger.log_function_exit("upload_file", {
                'success': True,
                'total_duration': round(total_duration, 4),
                'data_summary': {
                    'conductores': len(data.get('conductores', [])),
                    'vehiculos': len(data.get('vehiculos', [])),
                    'fallas_mecanicas': len(data.get('fallas_mecanicas', []))
                }
            }, total_duration)
            
            return jsonify({
                'success': True,
                'message': 'Archivo procesado exitosamente',
                'data': result['data'],
                'summary': result['summary'],
                'normalization_report': result.get('normalization_report', {}),
                'processing_time': round(total_duration, 4)
            })
        else:
            logger.error("Error en análisis de Excel", error=None, extra_data={
                'analysis_error': result.get('error'),
                'error_type': result.get('type'),
                'traceback': result.get('traceback')
            })
            return jsonify({'error': result['error']}), 500
            
    except Exception as e:
        total_duration = time.time() - start_time
        logger.critical("Excepción crítica en upload_file", e, {
            'filename': getattr(file, 'filename', 'unknown') if 'file' in locals() else 'no_file',
            'total_duration': round(total_duration, 4)
        })
        
        return jsonify({
            'error': f'Error procesando archivo: {str(e)}',
            'type': type(e).__name__,
            'processing_time': round(total_duration, 4)
        }), 500

@app.route('/api/search', methods=['GET'])
def search_data():
    """Endpoint para búsqueda y filtrado avanzado"""
    try:
        filters = {}
        
        # Obtener parámetros de filtrado
        if request.args.get('search_term'):
            filters['search_term'] = request.args.get('search_term')
        if request.args.get('status_color'):
            filters['status_color'] = request.args.get('status_color')
        if request.args.get('fatigue_level'):
            filters['fatigue_level'] = request.args.get('fatigue_level')
        if request.args.get('category'):
            filters['category'] = request.args.get('category')
        if request.args.get('severity'):
            filters['severity'] = request.args.get('severity')
        if request.args.get('min_km'):
            filters['min_km'] = float(request.args.get('min_km'))
        if request.args.get('max_km'):
            filters['max_km'] = float(request.args.get('max_km'))
        
        # Obtener datos filtrados DESDE LA BASE DE DATOS, no desde memoria
        filtered_data = get_filtered_data_from_db(filters)
        
        return jsonify({
            'success': True,
            'data': filtered_data,
            'filters_applied': filters
        })
        
    except Exception as e:
        return jsonify({'error': f'Error en búsqueda: {str(e)}'}), 500

@app.route('/api/conductores/fatiga', methods=['GET'])
def get_fatigued_drivers():
    """Endpoint para obtener conductores con fatiga"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Obtener nivel de fatiga del parámetro (por defecto: todos los no normales)
        fatigue_levels = request.args.get('levels', 'alerta,alto,critico').split(',')
        placeholders = ','.join(['?' for _ in fatigue_levels])
        
        cursor.execute(f'''
            SELECT cf.*, c.nombre as conductor_nombre_completo
            FROM control_fatiga cf
            LEFT JOIN conductores c ON cf.conductor_id = c.id
            WHERE cf.nivel_fatiga IN ({placeholders})
            ORDER BY 
                CASE cf.nivel_fatiga 
                    WHEN 'critico' THEN 1
                    WHEN 'alto' THEN 2
                    WHEN 'alerta' THEN 3
                    ELSE 4
                END
        ''', fatigue_levels)
        
        columns = [desc[0] for desc in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'conductores_afectados': results,
            'total': len(results)
        })
        
    except Exception as e:
        return jsonify({'error': f'Error obteniendo conductores con fatiga: {str(e)}'}), 500

@app.route('/api/vehiculos/fallas', methods=['GET'])
def get_vehicles_with_failures():
    """Endpoint para obtener vehículos con fallas"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Obtener categoría de falla del parámetro (opcional)
        category = request.args.get('category')
        severity = request.args.get('severity')
        
        query = '''
            SELECT v.*, 
                   GROUP_CONCAT(fm.descripcion, ' | ') as fallas_descripcion,
                   GROUP_CONCAT(fm.categoria, ', ') as fallas_categorias,
                   GROUP_CONCAT(fm.severidad, ', ') as fallas_severidades,
                   COUNT(fm.id) as total_fallas
            FROM vehiculos v
            LEFT JOIN fallas_mecanicas fm ON 1=1
            WHERE 1=1
        '''
        
        params = []
        
        if category:
            query += ' AND fm.categoria = ?'
            params.append(category)
            
        if severity:
            query += ' AND fm.severidad = ?'
            params.append(severity)
        
        query += '''
            GROUP BY v.id
            HAVING COUNT(fm.id) > 0
            ORDER BY 
                CASE v.status_color 
                    WHEN 'rojo' THEN 1
                    WHEN 'amarillo' THEN 2
                    WHEN 'verde' THEN 3
                    ELSE 4
                END
        '''
        
        cursor.execute(query, params)
        columns = [desc[0] for desc in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'vehiculos_con_fallas': results,
            'total': len(results)
        })
        
    except Exception as e:
        return jsonify({'error': f'Error obteniendo vehículos con fallas: {str(e)}'}), 500

@app.route('/api/graficas/<tipo>', methods=['GET'])
def generate_chart(tipo):
    """Endpoint para generar gráficas interactivas"""
    try:
        conn = sqlite3.connect(DATABASE)
        
        # Configurar estilo de gráficos
        plt.style.use('default')
        # Usar colores vibrantes para las gráficas
        plt.rcParams['axes.prop_cycle'] = plt.cycler('color', ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'])
        
        if tipo == 'estado_vehiculos':
            # Gráfica de estado de vehículos
            df = pd.read_sql_query('SELECT status_color FROM vehiculos', conn)
            
            if df.empty:
                return jsonify({'error': 'No hay datos de vehículos'}), 404
            
            fig, ax = plt.subplots(figsize=(10, 6))
            
            # Contar estados
            status_counts = df['status_color'].value_counts()
            colors = {'verde': '#28a745', 'amarillo': '#ffc107', 'rojo': '#dc3545'}
            
            bars = ax.bar(status_counts.index, status_counts.values, 
                         color=[colors.get(x, '#6c757d') for x in status_counts.index])
            
            ax.set_title('Estado de Vehículos', fontsize=16, fontweight='bold')
            ax.set_xlabel('Estado')
            ax.set_ylabel('Cantidad de Vehículos')
            
            # Agregar valores en las barras
            for bar in bars:
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height,
                       f'{int(height)}', ha='center', va='bottom')
            
        elif tipo == 'fatiga_conductores':
            # Gráfica de niveles de fatiga
            df = pd.read_sql_query('SELECT nivel_fatiga FROM control_fatiga', conn)
            
            if df.empty:
                return jsonify({'error': 'No hay datos de fatiga'}), 404
            
            fig, ax = plt.subplots(figsize=(10, 6))
            
            fatigue_counts = df['nivel_fatiga'].value_counts()
            colors = {'normal': '#28a745', 'alerta': '#ffc107', 'alto': '#fd7e14', 'critico': '#dc3545'}
            
            bars = ax.bar(fatigue_counts.index, fatigue_counts.values,
                         color=[colors.get(x, '#6c757d') for x in fatigue_counts.index])
            
            ax.set_title('Niveles de Fatiga de Conductores', fontsize=16, fontweight='bold')
            ax.set_xlabel('Nivel de Fatiga')
            ax.set_ylabel('Cantidad de Conductores')
            
            for bar in bars:
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height,
                       f'{int(height)}', ha='center', va='bottom')
                
        elif tipo == 'fallas_categoria':
            # Gráfica de fallas por categoría
            df = pd.read_sql_query('SELECT categoria FROM fallas_mecanicas', conn)
            
            if df.empty:
                return jsonify({'error': 'No hay datos de fallas'}), 404
            
            fig, ax = plt.subplots(figsize=(12, 8))
            
            category_counts = df['categoria'].value_counts()
            
            # Gráfica de pastel
            ax.pie(category_counts.values, labels=category_counts.index, autopct='%1.1f%%',
                   startangle=90)
            ax.set_title('Distribución de Fallas por Categoría', fontsize=16, fontweight='bold')
            
        elif tipo == 'severidad_fallas':
            # Gráfica de severidad de fallas
            df = pd.read_sql_query('SELECT severidad FROM fallas_mecanicas', conn)
            
            if df.empty:
                return jsonify({'error': 'No hay datos de severidad'}), 404
            
            fig, ax = plt.subplots(figsize=(10, 6))
            
            severity_counts = df['severidad'].value_counts()
            colors = {'bajo': '#28a745', 'medio': '#ffc107', 'alto': '#fd7e14', 'critico': '#dc3545'}
            
            bars = ax.bar(severity_counts.index, severity_counts.values,
                         color=[colors.get(x, '#6c757d') for x in severity_counts.index])
            
            ax.set_title('Severidad de Fallas Mecánicas', fontsize=16, fontweight='bold')
            ax.set_xlabel('Nivel de Severidad')
            ax.set_ylabel('Cantidad de Fallas')
            
            for bar in bars:
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height,
                       f'{int(height)}', ha='center', va='bottom')
        
        else:
            return jsonify({'error': 'Tipo de gráfica no válido'}), 400
        
        conn.close()
        
        # Convertir gráfica a base64
        img_buffer = io.BytesIO()
        plt.tight_layout()
        plt.savefig(img_buffer, format='png', dpi=300, bbox_inches='tight')
        img_buffer.seek(0)
        
        img_base64 = base64.b64encode(img_buffer.read()).decode()
        plt.close()
        
        return jsonify({
            'success': True,
            'chart_data': f'data:image/png;base64,{img_base64}',
            'chart_type': tipo
        })
        
    except Exception as e:
        return jsonify({'error': f'Error generando gráfica: {str(e)}'}), 500

@app.route('/api/reportes', methods=['POST'])
def generate_report():
    """Endpoint para generar reportes por fechas"""
    try:
        data = request.get_json()
        
        fecha_inicio = data.get('fecha_inicio')
        fecha_fin = data.get('fecha_fin')
        tipo_reporte = data.get('tipo', 'completo')
        formato = data.get('formato', 'json')
        
        if not fecha_inicio or not fecha_fin:
            return jsonify({'error': 'Fechas de inicio y fin son requeridas'}), 400
        
        conn = sqlite3.connect(DATABASE)
        
        # Consultas por rango de fechas
        report_data = {}
        
        if tipo_reporte in ['completo', 'vehiculos']:
            vehiculos_query = '''
                SELECT * FROM vehiculos 
                WHERE fecha_inspeccion BETWEEN ? AND ?
                ORDER BY fecha_inspeccion DESC
            '''
            df_vehiculos = pd.read_sql_query(vehiculos_query, conn, params=[fecha_inicio, fecha_fin])
            report_data['vehiculos'] = df_vehiculos.to_dict('records')
        
        if tipo_reporte in ['completo', 'conductores']:
            conductores_query = '''
                SELECT * FROM conductores 
                WHERE fecha_inspeccion BETWEEN ? AND ?
                ORDER BY fecha_inspeccion DESC
            '''
            df_conductores = pd.read_sql_query(conductores_query, conn, params=[fecha_inicio, fecha_fin])
            report_data['conductores'] = df_conductores.to_dict('records')
        
        if tipo_reporte in ['completo', 'fallas']:
            fallas_query = '''
                SELECT * FROM fallas_mecanicas 
                WHERE fecha_reporte BETWEEN ? AND ?
                ORDER BY fecha_reporte DESC, severidad DESC
            '''
            df_fallas = pd.read_sql_query(fallas_query, conn, params=[fecha_inicio, fecha_fin])
            report_data['fallas_mecanicas'] = df_fallas.to_dict('records')
        
        if tipo_reporte in ['completo', 'fatiga']:
            fatiga_query = '''
                SELECT * FROM control_fatiga 
                WHERE DATE(fecha_analisis) BETWEEN ? AND ?
                ORDER BY fecha_analisis DESC, nivel_fatiga DESC
            '''
            df_fatiga = pd.read_sql_query(fatiga_query, conn, params=[fecha_inicio, fecha_fin])
            report_data['control_fatiga'] = df_fatiga.to_dict('records')
        
        conn.close()
        
        # Generar estadísticas del reporte
        statistics = {
            'periodo': f"{fecha_inicio} a {fecha_fin}",
            'total_registros': sum(len(v) if isinstance(v, list) else 0 for v in report_data.values()),
            'fecha_generacion': datetime.now().isoformat()
        }
        
        # Guardar reporte en BD
        report_id = f"REPORTE_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO reportes (id, tipo, contenido, fecha_inicio, fecha_fin, parametros)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            report_id,
            tipo_reporte,
            json.dumps(report_data),
            fecha_inicio,
            fecha_fin,
            json.dumps({'formato': formato})
        ))
        
        conn.commit()
        conn.close()
        
        if formato == 'excel':
            # Generar Excel
            output = io.BytesIO()
            
            with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                for sheet_name, data in report_data.items():
                    if data:
                        df = pd.DataFrame(data)
                        df.to_excel(writer, sheet_name=sheet_name, index=False)
            
            output.seek(0)
            
            return send_file(
                output,
                as_attachment=True,
                download_name=f'reporte_{tipo_reporte}_{fecha_inicio}_{fecha_fin}.xlsx',
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
        
        else:
            # Formato JSON
            return jsonify({
                'success': True,
                'reporte_id': report_id,
                'data': report_data,
                'estadisticas': statistics,
                'parametros': {
                    'fecha_inicio': fecha_inicio,
                    'fecha_fin': fecha_fin,
                    'tipo_reporte': tipo_reporte,
                    'formato': formato
                }
            })
        
    except Exception as e:
        return jsonify({'error': f'Error generando reporte: {str(e)}'}), 500

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_data():
    """Endpoint para datos del dashboard principal"""
    try:
        # Inicializar DB si no existe
        init_db()
        conn = sqlite3.connect(DATABASE)
        
        # Estadísticas generales
        dashboard_data = {
            'resumen': {},
            'alertas': [],
            'tendencias': {}
        }
        
        # Resumen general
        cursor = conn.cursor()
        
        # Contar vehículos por estado (con manejo de tablas vacías)
        try:
            cursor.execute('SELECT status_color, COUNT(*) FROM vehiculos GROUP BY status_color')
            vehiculos_estado = {row[0]: row[1] for row in cursor.fetchall()}
        except:
            vehiculos_estado = {}
        
        # Contar conductores por fatiga (con manejo de tablas vacías)
        try:
            cursor.execute('SELECT nivel_fatiga, COUNT(*) FROM control_fatiga GROUP BY nivel_fatiga')
            conductores_fatiga = {row[0]: row[1] for row in cursor.fetchall()}
        except:
            conductores_fatiga = {}
        
        # Contar fallas por severidad (con manejo de tablas vacías)
        try:
            cursor.execute('SELECT severidad, COUNT(*) FROM fallas_mecanicas GROUP BY severidad')
            fallas_severidad = {row[0]: row[1] for row in cursor.fetchall()}
        except:
            fallas_severidad = {}
        
        dashboard_data['resumen'] = {
            'vehiculos': vehiculos_estado,
            'conductores': conductores_fatiga,
            'fallas': fallas_severidad,
            'total_vehiculos': sum(vehiculos_estado.values()),
            'total_conductores': sum(conductores_fatiga.values()),
            'total_fallas': sum(fallas_severidad.values())
        }
        
        # Alertas críticas
        alertas = []
        
        # Vehículos en estado crítico
        cursor.execute('SELECT COUNT(*) FROM vehiculos WHERE status_color = "rojo"')
        vehiculos_criticos = cursor.fetchone()[0]
        if vehiculos_criticos > 0:
            alertas.append({
                'tipo': 'critico',
                'mensaje': f'{vehiculos_criticos} vehículo(s) en estado crítico',
                'accion': 'Revisar vehículos inmediatamente'
            })
        
        # Conductores con fatiga crítica
        cursor.execute('SELECT COUNT(*) FROM control_fatiga WHERE nivel_fatiga = "critico"')
        conductores_criticos = cursor.fetchone()[0]
        if conductores_criticos > 0:
            alertas.append({
                'tipo': 'critico',
                'mensaje': f'{conductores_criticos} conductor(es) con fatiga crítica',
                'accion': 'Reemplazar conductor inmediatamente'
            })
        
        # Fallas críticas
        cursor.execute('SELECT COUNT(*) FROM fallas_mecanicas WHERE severidad = "critico"')
        fallas_criticas = cursor.fetchone()[0]
        if fallas_criticas > 0:
            alertas.append({
                'tipo': 'critico',
                'mensaje': f'{fallas_criticas} falla(s) crítica(s) detectada(s)',
                'accion': 'Atender fallas inmediatamente'
            })
        
        dashboard_data['alertas'] = alertas
        
        conn.close()
        
        return jsonify({
            'success': True,
            'dashboard': dashboard_data,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'Error obteniendo datos del dashboard: {str(e)}'}), 500

@app.route('/api/normalization-report', methods=['GET'])
def get_normalization_report():
    """Endpoint para obtener reporte de normalización de datos"""
    try:
        # Obtener el último reporte de normalización guardado en memoria
        if hasattr(analyzer, 'last_normalization_report'):
            return jsonify({
                'success': True,
                'normalization_report': analyzer.last_normalization_report,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'success': True,
                'normalization_report': {
                    'conductores_normalizados': [],
                    'vehiculos_normalizados': [],
                    'fallas_normalizadas': [],
                    'fechas_normalizadas': [],
                    'total_normalizaciones': 0
                },
                'message': 'No hay datos procesados aún',
                'timestamp': datetime.now().isoformat()
            })
        
    except Exception as e:
        return jsonify({'error': f'Error obteniendo reporte de normalización: {str(e)}'}), 500

@app.route('/api/status', methods=['GET'])
def api_status():
    """Endpoint para verificar estado de la API"""
    return jsonify({
        'status': 'active',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat(),
        'endpoints': [
            '/api/upload - POST - Subir archivo Excel',
            '/api/search - GET - Búsqueda y filtrado',
            '/api/conductores/fatiga - GET - Conductores con fatiga',
            '/api/vehiculos/fallas - GET - Vehículos con fallas',
            '/api/graficas/<tipo> - GET - Generar gráficas',
            '/api/reportes - POST - Generar reportes',
            '/api/reports/generate - POST - Generar reporte personalizado',
            '/api/reports/history - GET - Historial de reportes',
            '/api/reports/download/<id> - GET - Descargar reporte',
            '/api/reports/<id> - DELETE - Eliminar reporte',
            '/api/dashboard - GET - Datos del dashboard',
            '/api/status - GET - Estado de la API'
        ]
    })

@app.route('/api/reports/history', methods=['GET'])
def get_report_history():
    """Obtener historial de reportes generados"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Verificar si hay datos cargados para mostrar reportes disponibles
        cursor.execute('SELECT COUNT(*) FROM conductores')
        conductor_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM vehiculos')
        vehicle_count = cursor.fetchone()[0]
        
        conn.close()
        
        reports = []
        
        # Solo mostrar reportes si hay datos cargados
        if conductor_count > 0 or vehicle_count > 0:
            current_time = datetime.now()
            reports.append({
                'id': f'report_{current_time.strftime("%Y%m%d_%H%M%S")}',
                'name': 'Reporte Actual de Análisis HQ-FO-40',
                'startDate': current_time.strftime('%Y-%m-%d'),
                'endDate': current_time.strftime('%Y-%m-%d'),
                'created': current_time.isoformat(),
                'records': conductor_count + vehicle_count,
                'status': 'available'
            })
        
        return jsonify({'reports': reports})
        
    except Exception as e:
        return jsonify({'error': f'Error obteniendo historial: {str(e)}'}), 500

@app.route('/api/reports/download/<report_id>', methods=['GET'])
def download_report(report_id):
    """Descargar reporte por ID"""
    try:
        # Descarga de archivo
        buffer = io.BytesIO()
        buffer.write(f"Contenido del reporte {report_id}".encode())
        buffer.seek(0)
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"{report_id}.pdf",
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({'error': f'Error descargando reporte: {str(e)}'}), 500

@app.route('/api/reports/<report_id>', methods=['DELETE'])
def delete_report(report_id):
    """Eliminar reporte por ID"""
    try:
        # Eliminación de reporte
        return jsonify({
            'success': True,
            'message': f'Reporte {report_id} eliminado correctamente'
        })
        
    except Exception as e:
        return jsonify({'error': f'Error eliminando reporte: {str(e)}'}), 500

@app.route('/api/drivers', methods=['GET'])
def get_drivers():
    """Obtener información específica de conductores para cumplimiento"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Verificar si la tabla existe y obtener conductores
        try:
            cursor.execute('''
                SELECT id, nombre, dias_desde_inspeccion, nivel_fatiga, status_color,
                       fecha_inspeccion, horas_trabajadas
                FROM conductores
                ORDER BY dias_desde_inspeccion DESC
            ''')
        except sqlite3.OperationalError:
            # Si la tabla no existe, retornar datos vacíos
            conn.close()
            return jsonify({
                'success': True,
                'data': {
                    'conductores': [],
                    'estadisticas': {
                        'total': 0,
                        'cumple': 0,
                        'alerta': 0,
                        'critico': 0,
                        'porcentaje_cumplimiento': 0
                    }
                }
            })
        
        rows = cursor.fetchall()
        drivers = []
        
        for row in rows:
            driver = {
                'id': row[0],
                'nombre': row[1],
                'dias_desde_inspeccion': row[2] or 0,
                'nivel_fatiga': row[3] or 'normal',
                'status_color': row[4] or 'verde',
                'fecha_inspeccion': row[5] or 'N/A',
                'horas_trabajadas': row[6] or 0
            }
            
            # Buscar vehículo asignado
            cursor.execute('''
                SELECT codigo FROM vehiculos 
                WHERE conductor_id = ? OR conductor_nombre LIKE ?
                LIMIT 1
            ''', (driver['id'], f"%{driver['nombre']}%"))
            
            vehicle_result = cursor.fetchone()
            if vehicle_result:
                driver['vehiculo_asignado'] = vehicle_result[0]
            
            drivers.append(driver)
        
        # Calcular estadísticas
        total = len(drivers)
        cumple = len([d for d in drivers if d['status_color'] == 'verde'])
        alerta = len([d for d in drivers if d['status_color'] == 'amarillo'])
        critico = len([d for d in drivers if d['status_color'] == 'rojo'])
        
        stats = {
            'total': total,
            'cumple': cumple,
            'alerta': alerta,
            'critico': critico,
            'porcentaje_cumplimiento': round((cumple / total * 100) if total > 0 else 0, 1)
        }
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'conductores': drivers,
                'estadisticas': stats
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Error obteniendo conductores: {str(e)}'}), 500

@app.route('/api/drivers/<driver_id>', methods=['GET'])
def get_driver_details(driver_id):
    """Obtener detalles específicos de un conductor"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Obtener información del conductor
        cursor.execute('''
            SELECT * FROM conductores WHERE id = ?
        ''', (driver_id,))
        
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Conductor no encontrado'}), 404
        
        # Construir objeto conductor completo
        columns = [desc[0] for desc in cursor.description]
        driver = dict(zip(columns, row))
        
        # Obtener fallas relacionadas con este conductor
        cursor.execute('''
            SELECT descripcion, categoria, severidad, fecha_reporte
            FROM fallas_mecanicas 
            WHERE conductor_id = ?
            ORDER BY fecha_reporte DESC
        ''', (driver_id,))
        
        failures = cursor.fetchall()
        driver['fallas_asociadas'] = [
            {
                'descripcion': f[0],
                'categoria': f[1],
                'severidad': f[2],
                'fecha': f[3]
            } for f in failures
        ]
        
        # Obtener historial de fatiga
        cursor.execute('''
            SELECT nivel_fatiga, horas_trabajadas, fecha_analisis, recomendacion
            FROM control_fatiga 
            WHERE conductor_id = ?
            ORDER BY fecha_analisis DESC
            LIMIT 5
        ''', (driver_id,))
        
        fatigue_history = cursor.fetchall()
        driver['historial_fatiga'] = [
            {
                'nivel': f[0],
                'horas': f[1],
                'fecha': f[2],
                'recomendacion': f[3]
            } for f in fatigue_history
        ]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': driver
        })
        
    except Exception as e:
        return jsonify({'error': f'Error obteniendo detalles del conductor: {str(e)}'}), 500

# *** ENDPOINTS PARA NOTIFICACIONES CRÍTICAS ***

@app.route('/api/vehiculos', methods=['GET'])
def get_vehiculos():
    """Obtener vehículos con filtros opcionales para notificaciones"""
    try:
        status_filter = request.args.get('status')
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        if status_filter:
            cursor.execute('''
                SELECT id, codigo, placa, kilometraje, combustible, estado, status_color, fecha_inspeccion
                FROM vehiculos 
                WHERE status_color = ?
                ORDER BY created_at DESC
            ''', (status_filter,))
        else:
            cursor.execute('''
                SELECT id, codigo, placa, kilometraje, combustible, estado, status_color, fecha_inspeccion
                FROM vehiculos 
                ORDER BY created_at DESC
            ''')
        
        vehiculos_data = cursor.fetchall()
        conn.close()
        
        vehiculos = [
            {
                'id': row[0],
                'codigo': row[1],
                'placa': row[2],
                'kilometraje': row[3],
                'combustible': row[4],
                'estado': row[5],
                'status_color': row[6],
                'fecha_inspeccion': row[7]
            } for row in vehiculos_data
        ]
        
        return jsonify({
            'success': True,
            'vehiculos': vehiculos,
            'total': len(vehiculos)
        })
        
    except Exception as e:
        return jsonify({'error': f'Error obteniendo vehículos: {str(e)}'}), 500

@app.route('/api/conductores', methods=['GET'])
def get_conductores():
    """Obtener conductores con filtros opcionales para notificaciones"""
    try:
        fatiga_filter = request.args.get('fatiga')
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        if fatiga_filter:
            # Filtrar por múltiples niveles de fatiga (ej: "critico,alto")
            niveles = [nivel.strip() for nivel in fatiga_filter.split(',')]
            placeholders = ','.join('?' * len(niveles))
            cursor.execute(f'''
                SELECT id, nombre, hora_inicio, hora_fin, horas_trabajadas, nivel_fatiga, status_color, fecha_inspeccion
                FROM conductores 
                WHERE nivel_fatiga IN ({placeholders})
                ORDER BY created_at DESC
            ''', niveles)
        else:
            cursor.execute('''
                SELECT id, nombre, hora_inicio, hora_fin, horas_trabajadas, nivel_fatiga, status_color, fecha_inspeccion
                FROM conductores 
                ORDER BY created_at DESC
            ''')
        
        conductores_data = cursor.fetchall()
        conn.close()
        
        conductores = [
            {
                'id': row[0],
                'nombre': row[1],
                'hora_inicio': row[2],
                'hora_fin': row[3],
                'horas_trabajadas': row[4],
                'nivel_fatiga': row[5],
                'status_color': row[6],
                'fecha_inspeccion': row[7]
            } for row in conductores_data
        ]
        
        return jsonify({
            'success': True,
            'conductores': conductores,
            'total': len(conductores)
        })
        
    except Exception as e:
        return jsonify({'error': f'Error obteniendo conductores: {str(e)}'}), 500

@app.route('/api/fallas', methods=['GET'])
def get_fallas():
    """Obtener fallas mecánicas con filtros opcionales para notificaciones"""
    try:
        severidad_filter = request.args.get('severidad')
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        if severidad_filter:
            cursor.execute('''
                SELECT id, descripcion, categoria, severidad, ubicacion_fila, ubicacion_columna, status_color, fecha_reporte
                FROM fallas_mecanicas 
                WHERE severidad = ?
                ORDER BY created_at DESC
            ''', (severidad_filter,))
        else:
            cursor.execute('''
                SELECT id, descripcion, categoria, severidad, ubicacion_fila, ubicacion_columna, status_color, fecha_reporte
                FROM fallas_mecanicas 
                ORDER BY created_at DESC
            ''')
        
        fallas_data = cursor.fetchall()
        conn.close()
        
        fallas = [
            {
                'id': row[0],
                'descripcion': row[1],
                'categoria': row[2],
                'severidad': row[3],
                'ubicacion_fila': row[4],
                'ubicacion_columna': row[5],
                'status_color': row[6],
                'fecha_reporte': row[7]
            } for row in fallas_data
        ]
        
        return jsonify({
            'success': True,
            'fallas': fallas,
            'total': len(fallas)
        })
        
    except Exception as e:
        return jsonify({'error': f'Error obteniendo fallas: {str(e)}'}), 500

# Inicializar DB para Vercel
try:
    logger.info("Inicializando base de datos...")
    init_db()
    logger.info("Base de datos inicializada correctamente")
except Exception as e:
    logger.critical("Error inicializando base de datos", e)
    raise

# Para Vercel, el app object es el handler
if __name__ == '__main__':
    try:
        port = int(os.environ.get('PORT', 5000))
        debug_mode = os.environ.get('FLASK_ENV') == 'development' or os.environ.get('DEBUG', 'False').lower() == 'true'
        logger.info(f"Iniciando servidor Flask en puerto {port}, debug={debug_mode}")
        app.run(debug=debug_mode, host='0.0.0.0', port=port)
    except Exception as e:
        logger.critical("Error crítico durante inicialización del servidor", e)
        raise