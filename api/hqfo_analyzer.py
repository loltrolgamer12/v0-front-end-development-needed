"""
Analizador especializado para archivos Excel tipo HQ-FO-40 INSPECCIÓN DIARIA DE VEHÍCULO LIVIANO
Extrae y procesa información de vehículos y conductores con lógica de categorización avanzada
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import re
import os
import time
from typing import Dict, List, Tuple, Optional
import json

# Importar logger - manejar tanto ejecución desde directorio api como desde raíz
try:
    from hqfo_logger import get_logger
except ImportError:
    try:
        from api.hqfo_logger import get_logger
    except ImportError:
        # Fallback si no se puede importar el logger
        class DummyLogger:
            def info(self, msg, *args, **kwargs): print(f"INFO: {msg}")
            def debug(self, msg, *args, **kwargs): print(f"DEBUG: {msg}")
            def warning(self, msg, *args, **kwargs): print(f"WARNING: {msg}")
            def error(self, msg, *args, **kwargs): print(f"ERROR: {msg}")
            def critical(self, msg, *args, **kwargs): print(f"CRITICAL: {msg}")
            def log_function_entry(self, *args, **kwargs): pass
            def log_function_exit(self, *args, **kwargs): pass
        
        def get_logger(component):
            return DummyLogger()

def convert_numpy_types(obj):
    """
    Convierte recursivamente tipos numpy/pandas a tipos Python nativos para serialización JSON
    """
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, (pd.Timestamp, pd.Timedelta)):
        return str(obj)
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [convert_numpy_types(item) for item in obj]
    elif pd.isna(obj):
        return None
    else:
        return obj

class HQFOAnalyzer:
    def __init__(self):
        self.logger = get_logger("ANALYZER")
        self.logger.info("=== INICIALIZANDO ANALIZADOR HQ-FO-40 ===")
        
        self.raw_data = None
        self.processed_data = {
            'conductores': [],
            'vehiculos': [],
            'fallas_mecanicas': [],
            'control_fatiga': [],
            'reportes': []
        }
        
        # Patrones para identificar secciones
        self.section_patterns = {
            'conductor': r'(?i)(conductor|chofer|operador|nombre del conductor)',
            'vehiculo': r'(?i)(vehiculo|vehículo|placa|patente|código del vehículo)',
            'fecha': r'(?i)(fecha|date)',
            'hora': r'(?i)(hora|time)',
            'kilometraje': r'(?i)(kilometraje|km|odómetro)',
            'combustible': r'(?i)(combustible|gasolina|diesel)',
            'fallas': r'(?i)(falla|defecto|problema|avería|daño)',
            'estado': r'(?i)(estado|condición|status)'
        }
        
        # Patrones específicos para preguntas de fatiga HQ-FO-40
        self.fatigue_patterns = {
            'horas_sueno': r'(?i)(dormido.*7.*horas|ha dormido al menos 7|descansado.*7.*horas|sueño.*7.*horas)',
            'sintomas_fatiga': r'(?i)(síntomas.*fatiga|somnolencia.*dolor|libre.*fatiga|irritabilidad|cansancio)',
            'condiciones_fisicas': r'(?i)(condiciones.*físicas.*mentales|apto.*conducir|estado.*físico|capacidad.*conducir)',
            'medicamentos': r'(?i)(medicamentos.*sustancias|consumido.*medicamentos|sustancias.*alerta|drogas.*alcohol)'
        }
        
        # Categorías de fallas mecánicas
        self.failure_categories = {
            'motor': ['motor', 'aceite', 'refrigerante', 'correa', 'filtro'],
            'frenos': ['freno', 'pastilla', 'disco', 'líquido de frenos'],
            'suspension': ['suspensión', 'amortiguador', 'resorte', 'rotula'],
            'electrico': ['batería', 'alternador', 'luces', 'eléctrico', 'fusible'],
            'neumaticos': ['neumático', 'llanta', 'rueda', 'presión'],
            'carroceria': ['carrocería', 'puerta', 'ventana', 'espejo', 'parabrisas'],
            'transmision': ['transmisión', 'embrague', 'caja', 'diferencial'],
            'otros': []
        }
        
        # Niveles de severidad
        self.severity_levels = {
            'critico': ['no funciona', 'roto', 'averiado', 'falla total', 'inoperante'],
            'alto': ['mal estado', 'deteriorado', 'requiere atención', 'urgente'],
            'medio': ['desgaste', 'revisar', 'mantenimiento', 'atención'],
            'bajo': ['normal', 'operativo', 'funcionando', 'ok', 'bien']
        }
        
        # Diccionarios para normalización de datos de encuestas
        self.name_normalizations = {
            # Abreviaciones comunes
            'jn': 'juan',
            'jc': 'juan carlos',
            'ma': 'maria',
            'js': 'jose',
            'ant': 'antonio',
            'fco': 'francisco',
            'paco': 'francisco',
            'pepe': 'jose',
            'memo': 'guillermo',
            'lalo': 'eduardo',
            'alex': 'alejandro',
            'seba': 'sebastian',
            'ferna': 'fernando',
            'cris': 'cristian',
            'dani': 'daniel'
        }
        
        self.yes_no_normalizations = {
            # Variaciones de SÍ
            'si': 'si', 'sí': 'si', 'yes': 'si', 'y': 'si', 'ok': 'si', 'x': 'si',
            '✓': 'si', '✔': 'si', 'true': 'si', '1': 'si', 'positivo': 'si',
            'afirmativo': 'si', 'correcto': 'si', 'bien': 'si', 'bueno': 'si',
            # Variaciones de NO
            'no': 'no', 'n': 'no', 'false': 'no', '0': 'no', 'negativo': 'no',
            '✗': 'no', '✘': 'no', 'mal': 'no', 'malo': 'no', 'incorrecto': 'no'
        }
        
        self.vehicle_code_patterns = [
            r'^[A-Z]{2,3}-?\d{3,4}$',  # ABC-123, AB123
            r'^[A-Z]{3}\d{3}$',        # ABC123  
            r'^\d{3,4}[A-Z]{2,3}$',    # 123ABC
            r'^V-?\d{3,4}$',           # V123, V-123
            r'^VEH-?\d{3,4}$'          # VEH123, VEH-123
        ]

    # ==================== MÉTODOS DE NORMALIZACIÓN ====================
    
    def normalize_name(self, name: str) -> str:
        """
        Normaliza nombres de conductores eliminando discrepancias de encuesta
        """
        if not name or pd.isna(name):
            return ""
        
        # Convertir a string y limpiar
        name = str(name).strip()
        
        # Remover caracteres especiales y números
        name = re.sub(r'[^\w\s\áéíóúüñÁÉÍÓÚÜÑ]', '', name)
        
        # Convertir a minúsculas para normalización
        name_lower = name.lower()
        
        # Expandir abreviaciones comunes
        words = name_lower.split()
        normalized_words = []
        
        for word in words:
            # Buscar abreviación exacta
            if word in self.name_normalizations:
                normalized_words.append(self.name_normalizations[word])
            else:
                # Buscar abreviaciones parciales
                found = False
                for abbr, full in self.name_normalizations.items():
                    if word.startswith(abbr) and len(word) <= len(abbr) + 2:
                        normalized_words.append(full)
                        found = True
                        break
                if not found:
                    normalized_words.append(word)
        
        # Unir y capitalizar correctamente
        normalized_name = ' '.join(normalized_words)
        return self._capitalize_name_properly(normalized_name)
    
    def _capitalize_name_properly(self, name: str) -> str:
        """
        Capitaliza nombres correctamente respetando reglas españolas
        """
        # Palabras que deben ir en minúsculas
        lowercase_words = ['de', 'del', 'la', 'las', 'el', 'los', 'y']
        
        words = name.split()
        capitalized = []
        
        for i, word in enumerate(words):
            if i > 0 and word in lowercase_words:
                capitalized.append(word)
            else:
                capitalized.append(word.capitalize())
        
        return ' '.join(capitalized)
    
    def normalize_yes_no_response(self, response) -> Optional[str]:
        """
        Normaliza respuestas Sí/No de encuestas con múltiples variaciones
        """
        if pd.isna(response) or response == '':
            return None
        
        response_str = str(response).strip().lower()
        
        # Buscar en diccionario de normalizaciones
        if response_str in self.yes_no_normalizations:
            return self.yes_no_normalizations[response_str]
        
        # Detectar patrones adicionales
        if any(pattern in response_str for pattern in ['si', 'yes', 'correcto', 'bien']):
            return 'si'
        elif any(pattern in response_str for pattern in ['no', 'mal', 'incorrecto', 'negat']):
            return 'no'
        
        return None
    
    def normalize_vehicle_code(self, code: str) -> str:
        """
        Normaliza códigos de vehículos eliminando inconsistencias
        """
        if not code or pd.isna(code):
            return ""
        
        # Convertir a string y limpiar
        code = str(code).strip().upper()
        
        # Remover espacios internos y caracteres extraños
        code = re.sub(r'[^\w-]', '', code)
        
        # Intentar detectar y corregir patrones comunes
        for pattern in self.vehicle_code_patterns:
            if re.match(pattern, code):
                return code
        
        # Si no coincide con patrones, intentar corregir
        # Separar letras y números
        letters = re.findall(r'[A-Z]+', code)
        numbers = re.findall(r'\d+', code)
        
        if letters and numbers:
            # Formato estándar: ABC-123
            return f"{letters[0]}-{numbers[0]}"
        
        return code
    
    def normalize_failure_description(self, description: str) -> str:
        """
        Normaliza descripciones de fallas para mejor categorización
        """
        # Validar tipo y valores nulos
        if description is None or pd.isna(description):
            return ""
        
        # Asegurar que sea string
        if not isinstance(description, str):
            description = str(description)
            
        description = description.strip().lower()
        
        # Correcciones ortográficas comunes
        corrections = {
            'neumatico': 'neumático',
            'bateria': 'batería',
            'electrico': 'eléctrico',
            'mecanico': 'mecánico',
            'hidraulico': 'hidráulico',
            'acelerador': 'acelerador',
            'direccion': 'dirección',
            'transmision': 'transmisión',
            'suspension': 'suspensión',
            'refrigeracion': 'refrigeración',
            'no funciona': 'no funciona',
            'mal estado': 'mal estado',
            'esta roto': 'roto',
            'no sirve': 'no funciona',
            'falla': 'falla',
            'problema': 'falla',
            'averia': 'avería',
            'defecto': 'falla'
        }
        
        # Aplicar correcciones
        for error, correction in corrections.items():
            description = description.replace(error, correction)
        
        # Eliminar palabras redundantes
        description = re.sub(r'\b(el|la|los|las|un|una|tiene|esta|está)\b', '', description)
        description = re.sub(r'\s+', ' ', description).strip()
        
        return description
    
    def normalize_time_format(self, time_str: str) -> str:
        """
        Normaliza formatos de tiempo de encuestas
        """
        if not time_str or pd.isna(time_str):
            return ""
        
        time_str = str(time_str).strip()
        
        # Patrones comunes de tiempo mal escritos
        time_patterns = [
            (r'(\d{1,2})[:.](\d{2})\s*([ap]m?)', r'\1:\2 \3'),  # 2:30pm -> 2:30 pm
            (r'(\d{1,2}):(\d{2}):(\d{2})', r'\1:\2'),           # 14:30:00 -> 14:30
            (r'(\d{1,2})(\d{2})(?!:)', r'\1:\2'),               # 1430 -> 14:30
            (r'(\d{1,2})\s*h\s*(\d{2})', r'\1:\2'),             # 14h30 -> 14:30
        ]
        
        for pattern, replacement in time_patterns:
            time_str = re.sub(pattern, replacement, time_str, flags=re.IGNORECASE)
        
        return time_str.strip()
    
    def normalize_date_format(self, date_str: str) -> str:
        """
        Normaliza formatos de fecha de encuestas a formato estándar YYYY-MM-DD
        """
        if not date_str or pd.isna(date_str):
            return ""
        
        date_str = str(date_str).strip()
        
        # Patrones de fecha comunes
        date_patterns = [
            (r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})', r'\3-\2-\1'),      # DD/MM/YYYY -> YYYY-MM-DD
            (r'(\d{1,2})[/-](\d{1,2})[/-](\d{2})$', r'20\3-\2-\1'),   # DD/MM/YY -> 20YY-MM-DD
            (r'(\d{4})[/-](\d{1,2})[/-](\d{1,2})', r'\1-\2-\3'),      # YYYY/MM/DD -> YYYY-MM-DD
        ]
        
        for pattern, replacement in date_patterns:
            match = re.match(pattern, date_str)
            if match:
                # Asegurar formato de dos dígitos para mes y día
                parts = replacement.format(*match.groups()).split('-')
                if len(parts) == 3:
                    year, month, day = parts
                    return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
        
        return date_str
    
    def generate_normalization_report(self) -> Dict:
        """
        Genera un reporte de todas las normalizaciones aplicadas
        """
        report = {
            'conductores_normalizados': [],
            'vehiculos_normalizados': [],
            'fallas_normalizadas': [],
            'fechas_normalizadas': [],
            'total_normalizaciones': 0
        }
        
        # Revisar conductores normalizados
        for conductor in self.processed_data.get('conductores', []):
            if 'nombre_original' in conductor:
                if conductor['nombre'] != conductor['nombre_original']:
                    report['conductores_normalizados'].append({
                        'original': conductor['nombre_original'],
                        'normalizado': conductor['nombre'],
                        'tipo': 'nombre'
                    })
            
            if 'hora_inicio_original' in conductor:
                if conductor['hora_inicio'] != conductor['hora_inicio_original']:
                    report['conductores_normalizados'].append({
                        'original': conductor['hora_inicio_original'],
                        'normalizado': conductor['hora_inicio'],
                        'tipo': 'hora_inicio'
                    })
                    
            if 'hora_fin_original' in conductor:
                if conductor['hora_fin'] != conductor['hora_fin_original']:
                    report['conductores_normalizados'].append({
                        'original': conductor['hora_fin_original'],
                        'normalizado': conductor['hora_fin'],
                        'tipo': 'hora_fin'
                    })
        
        # Revisar vehículos normalizados
        for vehiculo in self.processed_data.get('vehiculos', []):
            if 'codigo_original' in vehiculo:
                if vehiculo['codigo'] != vehiculo['codigo_original']:
                    report['vehiculos_normalizados'].append({
                        'original': vehiculo['codigo_original'],
                        'normalizado': vehiculo['codigo'],
                        'tipo': 'codigo'
                    })
        
        # Revisar fallas normalizadas
        for falla in self.processed_data.get('fallas_mecanicas', []):
            if 'descripcion_original' in falla:
                if falla['descripcion'] != falla['descripcion_original']:
                    report['fallas_normalizadas'].append({
                        'original': falla['descripcion_original'],
                        'normalizado': falla['descripcion'],
                        'tipo': 'descripcion'
                    })
        
        # Calcular total
        report['total_normalizaciones'] = (
            len(report['conductores_normalizados']) +
            len(report['vehiculos_normalizados']) + 
            len(report['fallas_normalizadas'])
        )
        
        return report

    def analyze_excel(self, file_path: str) -> Dict:
        """
        Análisis principal del archivo Excel HQ-FO-40
        """
        start_time = time.time()
        self.logger.log_function_entry("analyze_excel", {
            'file_path': file_path,
            'file_exists': os.path.exists(file_path) if file_path else False,
            'file_size': os.path.getsize(file_path) if file_path and os.path.exists(file_path) else 0
        })
        
        try:
            # Verificar que el archivo existe
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Archivo no encontrado: {file_path}")
            
            file_size = os.path.getsize(file_path)
            self.logger.info("Archivo Excel localizado", {
                'file_path': file_path,
                'file_size_bytes': file_size,
                'file_size_mb': round(file_size / (1024*1024), 2)
            })
            
            # Leer todas las hojas del Excel
            self.logger.info("Iniciando lectura de hojas Excel")
            read_start = time.time()
            
            excel_file = pd.ExcelFile(file_path)
            read_duration = time.time() - read_start
            
            self.logger.info("Excel file opened", {
                'sheet_names': excel_file.sheet_names,
                'sheet_count': len(excel_file.sheet_names),
                'read_duration': round(read_duration, 4)
            })
            
            all_sheets = {}
            try:
                for i, sheet_name in enumerate(excel_file.sheet_names):
                    sheet_start = time.time()
                    self.logger.debug(f"Procesando hoja {i+1}/{len(excel_file.sheet_names)}: {sheet_name}")
                    
                    try:
                        # Leer con header=0 para usar los nombres de columna reales
                        df = pd.read_excel(file_path, sheet_name=sheet_name, header=0)
                        sheet_duration = time.time() - sheet_start
                        
                        self.logger.info(f"Hoja procesada: {sheet_name}", {
                            'rows': df.shape[0],
                            'columns': df.shape[1],
                            'processing_duration': round(sheet_duration, 4),
                            'has_data': not df.empty,
                            'memory_usage': f"{df.memory_usage(deep=True).sum() / 1024:.2f} KB"
                        })
                        
                        all_sheets[sheet_name] = df
                        
                    except Exception as sheet_error:
                        self.logger.warning(f"Error procesando hoja {sheet_name}", sheet_error)
                        continue
            finally:
                # Cerrar el ExcelFile explícitamente
                try:
                    excel_file.close()
                    self.logger.debug("ExcelFile cerrado correctamente")
                except Exception as close_error:
                    self.logger.warning(f"Error cerrando ExcelFile: {str(close_error)}")
            
            if not all_sheets:
                raise ValueError("No se pudieron leer hojas del archivo Excel")
            
            # Buscar la hoja principal de inspección
            self.logger.info("Identificando hoja principal de inspección")
            main_sheet = self._identify_main_sheet(all_sheets)
            
            if main_sheet is None or main_sheet.empty:
                raise ValueError("No se pudo identificar la hoja principal de inspección")
            
            log_data = {
                'shape': main_sheet.shape,
                'non_null_cells': main_sheet.count().sum(),
                'null_cells': main_sheet.isnull().sum().sum()
            }
            self.logger.info("Hoja principal identificada", convert_numpy_types(log_data))
            
            self.raw_data = main_sheet
            
            # Procesar datos por secciones con timing individual
            sections = [
                ("vehículos", self._extract_vehicle_info),
                ("conductores", self._extract_driver_info), 
                ("fallas mecánicas", self._extract_mechanical_failures),
                ("control de fatiga", self._analyze_fatigue_control),
                ("colores de estado", self._generate_status_colors)
            ]
            
            for section_name, section_func in sections:
                section_start = time.time()
                self.logger.info(f"Extrayendo información de {section_name}")
                
                try:
                    section_func()
                    section_duration = time.time() - section_start
                    self.logger.info(f"Sección {section_name} completada", {
                        'duration': round(section_duration, 4)
                    })
                except Exception as section_error:
                    self.logger.error(f"Error en sección {section_name}", section_error)
                    # Continuar con las demás secciones
            
            # Generar reporte de normalización
            self.logger.info("Generando reporte de normalización")
            norm_start = time.time()
            normalization_report = self.generate_normalization_report()
            norm_duration = time.time() - norm_start
            
            total_duration = time.time() - start_time
            
            # Log resumen final
            data_summary = {
                'conductores': len(self.processed_data.get('conductores', [])),
                'vehiculos': len(self.processed_data.get('vehiculos', [])),
                'fallas_mecanicas': len(self.processed_data.get('fallas_mecanicas', [])),
                'control_fatiga': len(self.processed_data.get('control_fatiga', []))
            }
            
            self.logger.info("Análisis completado exitosamente", {
                'total_duration': round(total_duration, 4),
                'norm_duration': round(norm_duration, 4),
                'data_extracted': data_summary
            })
            
            result = {
                'success': True,
                'data': self.processed_data,
                'summary': self._generate_summary(),
                'normalization_report': normalization_report,
                'timestamp': datetime.now().isoformat(),
                'processing_stats': {
                    'total_duration_seconds': round(total_duration, 4),
                    'file_size_mb': round(file_size / (1024*1024), 2),
                    'sheets_processed': len(all_sheets),
                    'data_points_extracted': sum(data_summary.values())
                }
            }
            
            # Convertir tipos numpy a tipos Python nativos para serialización JSON
            result = convert_numpy_types(result)
            
            self.logger.log_function_exit("analyze_excel", result, total_duration)
            return result
            
        except Exception as e:
            total_duration = time.time() - start_time
            self.logger.critical("Error crítico en análisis de Excel", e, {
                'file_path': file_path,
                'total_duration': round(total_duration, 4),
                'processed_data_keys': list(self.processed_data.keys()) if hasattr(self, 'processed_data') else []
            })
            
            error_result = {
                'success': False,
                'error': f"Error procesando archivo: {str(e)}",
                'type': type(e).__name__,
                'timestamp': datetime.now().isoformat(),
                'processing_stats': {
                    'total_duration_seconds': round(total_duration, 4),
                    'failed_at': 'analysis'
                }
            }
            
            # Convertir tipos numpy a tipos Python nativos para serialización JSON
            return convert_numpy_types(error_result)

    def _identify_main_sheet(self, sheets: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        """
        Identifica la hoja principal de inspección
        """
        entry_data = {
            'sheet_count': len(sheets),
            'sheet_names': list(sheets.keys())
        }
        self.logger.log_function_entry("_identify_main_sheet", convert_numpy_types(entry_data))
        
        # Buscar por nombre de hoja
        priority_names = ['inspeccion', 'hq-fo-40', 'vehiculo', 'diaria']
        
        for priority_name in priority_names:
            for sheet_name in sheets.keys():
                if priority_name.lower() in sheet_name.lower():
                    log_data = {
                        'matched_priority': priority_name,
                        'sheet_shape': sheets[sheet_name].shape
                    }
                    self.logger.info(f"Hoja principal identificada por nombre: {sheet_name}", convert_numpy_types(log_data))
                    return sheets[sheet_name]
        
        # Si no encuentra, usar la primera hoja con más datos
        self.logger.info("Identificando hoja por contenido de datos")
        max_cells = 0
        main_sheet = None
        sheet_analysis = {}
        
        for sheet_name, df in sheets.items():
            non_null_cells = df.count().sum()
            total_cells = df.size
            sheet_analysis[sheet_name] = {
                'non_null_cells': int(non_null_cells),
                'total_cells': int(total_cells),
                'fill_ratio': round(non_null_cells / total_cells * 100, 2) if total_cells > 0 else 0,
                'shape': df.shape
            }
            
            if non_null_cells > max_cells:
                max_cells = non_null_cells
                main_sheet = df
        
        log_data = {
            'sheet_analysis': sheet_analysis,
            'selected_sheet_cells': int(max_cells)
        }
        self.logger.info("Análisis de hojas completado", convert_numpy_types(log_data))
        
        result = main_sheet if main_sheet is not None else list(sheets.values())[0]
        log_data = {
            'selection_method': 'by_content' if main_sheet is not None else 'first_available',
            'final_shape': result.shape if result is not None else None
        }
        self.logger.info("Hoja principal seleccionada", convert_numpy_types(log_data))
        
        return result

    def _extract_vehicle_info(self):
        """
        Extrae información de vehículos desde una base de datos tabular
        """
        if self.raw_data is None:
            return
            
        vehicles = []
        
        # Procesar cada fila como una inspección completa
        for i, row in self.raw_data.iterrows():
            vehicle = {}
            
            try:
                # Columna 5: PLACA DEL VEHICULO
                if 'PLACA DEL VEHICULO' in self.raw_data.columns:
                    placa_raw = row['PLACA DEL VEHICULO']
                    if not pd.isna(placa_raw):
                        placa_normalizada = self.normalize_vehicle_code(str(placa_raw))
                        vehicle['codigo'] = placa_normalizada
                        vehicle['placa'] = placa_normalizada
                        vehicle['codigo_original'] = str(placa_raw).strip()
                
                # Columna 6: KILOMETRAJE  
                if 'KILOMETRAJE' in self.raw_data.columns:
                    km_raw = row['KILOMETRAJE']
                    if not pd.isna(km_raw):
                        vehicle['kilometraje'] = float(km_raw) if isinstance(km_raw, (int, float)) else self._extract_number(str(km_raw))
                
                # Columna 1: Marca temporal (fecha de inspección)
                if 'Marca temporal' in self.raw_data.columns:
                    fecha_raw = row['Marca temporal']
                    if not pd.isna(fecha_raw):
                        vehicle['fecha_inspeccion'] = str(fecha_raw)[:10]  # Solo fecha YYYY-MM-DD
                
                # Columna 4: CAMPO/COORDINACIÓN
                if 'CAMPO/COORDINACIÓN' in self.raw_data.columns:
                    campo_raw = row['CAMPO/COORDINACIÓN']
                    if not pd.isna(campo_raw):
                        vehicle['campo'] = str(campo_raw).strip()
                
                # Generar ID único por vehículo y fecha
                vehicle['id'] = f"VEH_{vehicle.get('placa', 'UNKNOWN')}_{i}"
                
                # Determinar estado basado en las verificaciones de la fila
                vehicle['status_color'] = self._determine_vehicle_status_color_from_row(row)
                
                # Solo agregar si tiene al menos placa
                if vehicle.get('codigo'):
                    vehicles.append(vehicle)
                    
            except Exception as e:
                self.logger.warning(f"Error procesando vehículo en fila {i}: {str(e)}")
                continue
        
        self.processed_data['vehiculos'] = vehicles

    def _extract_driver_info(self):
        """
        Extrae información de conductores desde una base de datos tabular
        """
        if self.raw_data is None:
            return
            
        drivers = []
        
        # Procesar cada fila como una inspección completa
        for i, row in self.raw_data.iterrows():
            driver = {}
            
            try:
                # Columna 2: NOMBRE DE QUIEN REALIZA LA INSPECCIÓN
                if 'NOMBRE DE QUIEN REALIZA LA INSPECCIÓN ' in self.raw_data.columns:
                    nombre_raw = row['NOMBRE DE QUIEN REALIZA LA INSPECCIÓN ']
                    if not pd.isna(nombre_raw):
                        driver['nombre'] = self.normalize_name(str(nombre_raw))
                        driver['nombre_original'] = str(nombre_raw).strip()
                
                # Columna 1: Marca temporal (fecha de inspección)
                if 'Marca temporal' in self.raw_data.columns:
                    fecha_raw = row['Marca temporal']
                    if not pd.isna(fecha_raw):
                        driver['fecha_inspeccion'] = str(fecha_raw)[:10]  # Solo fecha YYYY-MM-DD
                
                # Columna 7: TURNO
                if 'TURNO' in self.raw_data.columns:
                    turno_raw = row['TURNO']
                    if not pd.isna(turno_raw):
                        driver['turno'] = str(turno_raw).strip()
                
                # Columna 3: CONTRATO  
                if 'CONTRATO' in self.raw_data.columns:
                    contrato_raw = row['CONTRATO']
                    if not pd.isna(contrato_raw):
                        driver['contrato'] = str(contrato_raw).strip()
                
                # Calcular días desde inspección
                if driver.get('fecha_inspeccion'):
                    driver['dias_desde_inspeccion'] = self._calculate_days_since_inspection(driver['fecha_inspeccion'])
                
                # Extraer respuestas de fatiga (últimas 4 columnas)
                fatiga_cols = [col for col in self.raw_data.columns if 'hora' in col.lower() or 'fatiga' in col.lower() or 'síntoma' in col.lower() or 'condiciones' in col.lower() or 'medicamento' in col.lower()]
                
                for col in fatiga_cols[-4:]:  # Últimas 4 columnas relacionadas con fatiga
                    if col in row and not pd.isna(row[col]):
                        cell_value = row[col]
                        # Conversión robusta a string
                        if isinstance(cell_value, (int, float)):
                            response = str(cell_value).strip().lower()
                        elif isinstance(cell_value, str):
                            response = cell_value.strip().lower()
                        else:
                            response = str(cell_value).strip().lower()
                            
                        if 'hora' in col.lower():
                            if 'si' in response or 'sí' in response:
                                driver['horas_suficientes'] = 'si'
                            else:
                                driver['horas_suficientes'] = 'no'
                        elif 'fatiga' in col.lower() or 'síntoma' in col.lower():
                            driver['libre_fatiga'] = self.normalize_yes_no_response(response)
                        elif 'condiciones' in col.lower():
                            driver['condiciones_optimas'] = self.normalize_yes_no_response(response)
                        elif 'medicamento' in col.lower():
                            driver['medicamentos'] = self.normalize_yes_no_response(response)
                
                # Generar ID único por conductor y fecha
                driver['id'] = f"COND_{driver.get('nombre', 'UNKNOWN').replace(' ', '_')}_{i}"
                
                # Determinar estado de fatiga basado en respuestas
                driver['nivel_fatiga'] = self._determine_fatigue_level(driver)
                driver['status_color'] = self._determine_driver_status_color(driver)
                
                # Solo agregar si tiene nombre
                if driver.get('nombre'):
                    drivers.append(driver)
                    
            except Exception as e:
                self.logger.warning(f"Error procesando conductor en fila {i}: {str(e)}")
                continue
        
        self.processed_data['conductores'] = drivers

    def _determine_vehicle_status_color_from_row(self, row):
        """
        Determina el color de estado del vehículo basado en las verificaciones de la fila
        """
        # Buscar columnas que indiquen problemas (solo buscar en nombres de columnas, no en valores)
        problema_cols = [col for col in self.raw_data.columns if '**' in col or 'CUMPLE' in col.upper()]
        
        no_cumple_count = 0
        total_checks = 0
        
        for col in problema_cols:
            if col in row and not pd.isna(row[col]):
                total_checks += 1
                cell_value = row[col]
                # Asegurar conversión segura a string
                if isinstance(cell_value, (int, float)):
                    response = str(cell_value).strip().upper()
                elif isinstance(cell_value, str):
                    response = cell_value.strip().upper()
                else:
                    response = str(cell_value).strip().upper()
                    
                if 'NO CUMPLE' in response or 'NO' in response:
                    no_cumple_count += 1
        
        if total_checks == 0:
            return 'amarillo'  # Sin datos suficientes
        
        failure_rate = no_cumple_count / total_checks
        
        if failure_rate == 0:
            return 'verde'  # Todo cumple
        elif failure_rate <= 0.2:  # Hasta 20% de fallas
            return 'amarillo'  # Alerta
        else:
            return 'rojo'  # Crítico

    def _determine_fatigue_level(self, driver):
        """
        Determina el nivel de fatiga del conductor basado en sus respuestas
        """
        fatiga_score = 0
        
        # Evaluar cada factor de fatiga
        if driver.get('horas_suficientes') == 'no':
            fatiga_score += 3
        
        if driver.get('libre_fatiga') == 'no':
            fatiga_score += 2
            
        if driver.get('condiciones_optimas') == 'no':
            fatiga_score += 2
            
        if driver.get('medicamentos') == 'si':
            fatiga_score += 1
        
        # Clasificar nivel
        if fatiga_score == 0:
            return 'normal'
        elif fatiga_score <= 2:
            return 'alerta'
        elif fatiga_score <= 4:
            return 'alto'
        else:
            return 'critico'

    def _extract_mechanical_failures(self):
        """
        Extrae y categoriza fallas mecánicas desde una base de datos tabular
        """
        if self.raw_data is None:
            return
            
        failures = []
        
        # Procesar cada fila como una inspección completa
        for i, row in self.raw_data.iterrows():
            try:
                # Obtener info básica de la inspección
                placa = row.get('PLACA DEL VEHICULO', 'UNKNOWN')
                fecha = str(row.get('Marca temporal', ''))[:10] if not pd.isna(row.get('Marca temporal')) else ''
                inspector = row.get('NOMBRE DE QUIEN REALIZA LA INSPECCIÓN ', 'UNKNOWN')
                
                # Revisar todas las columnas de verificación (las que tienen **)
                for col_name in self.raw_data.columns:
                    if '**' in col_name:  # Columnas críticas
                        cell_value = row[col_name]
                        if not pd.isna(cell_value):
                            # Asegurar que el valor sea string antes de procesarlo
                            if isinstance(cell_value, (int, float)):
                                response = str(cell_value).strip().upper()
                            elif isinstance(cell_value, str):
                                response = cell_value.strip().upper()
                            else:
                                response = str(cell_value).strip().upper()
                            
                            # Si hay una falla (NO CUMPLE)
                            if 'NO CUMPLE' in response or response == 'NO':
                                # Extraer descripción de observaciones si existe
                                observaciones = ''
                                if 'OBSERVACIONES' in self.raw_data.columns:
                                    obs = row['OBSERVACIONES']
                                    if not pd.isna(obs):
                                        observaciones = str(obs).strip()
                                
                                # Crear descripción de la falla
                                descripcion_base = col_name.replace('**', '').strip()
                                descripcion_completa = f"{descripcion_base}"
                                if observaciones:
                                    descripcion_completa += f" - {observaciones}"
                                
                                # NORMALIZAR DESCRIPCIÓN DE FALLA
                                normalized_description = self.normalize_failure_description(descripcion_completa)
                                
                                failure = {
                                    'id': f"FALLA_{len(failures) + 1}_{i}",
                                    'descripcion': normalized_description,
                                    'descripcion_original': descripcion_completa,
                                    'categoria': self._categorize_failure(normalized_description),
                                    'severidad': 'critico' if '**' in col_name else 'medio',  # ** indica crítico
                                    'vehiculo_placa': placa,
                                    'inspector': inspector,
                                    'fecha_reporte': fecha,
                                    'columna_origen': col_name,
                                    'fila_origen': i,
                                    'status_color': self._determine_failure_status_color(normalized_description)
                                }
                                failures.append(failure)
                                
            except Exception as e:
                # Logging más detallado para debugging
                try:
                    row_info = f"Fila {i}, Placa: {row.get('PLACA DEL VEHICULO', 'N/A')}"
                    self.logger.warning(f"Error procesando fallas en {row_info}: {str(e)}")
                    # Logging simplificado para evitar errores con tipos de datos
                    critical_cols = [col for col in row.index if '**' in str(col)]
                    self.logger.debug(f"Columnas críticas en fila {i}: {critical_cols}")
                except Exception as log_error:
                    self.logger.warning(f"Error procesando fallas en fila {i}: {str(e)} (Error adicional en logging: {str(log_error)})")
                continue
        
        self.processed_data['fallas_mecanicas'] = failures

    def _extract_failure_description(self, row: pd.Series, start_col: int) -> str:
        """
        Extrae descripción completa de la falla
        """
        description_parts = []
        
        # Buscar en las siguientes 3 columnas
        for j in range(start_col + 1, min(start_col + 4, len(row))):
            if not pd.isna(row.iloc[j]):
                part = str(row.iloc[j]).strip()
                if part and part.lower() not in ['ok', 'bien', 'normal', 'n/a']:
                    description_parts.append(part)
        
        return ' '.join(description_parts) if description_parts else None

    def _categorize_failure(self, description: str) -> str:
        """
        Categoriza la falla mecánica
        """
        # Validar que description sea una cadena de texto
        if not isinstance(description, str):
            description = str(description) if description is not None else ""
        
        description_lower = description.lower()
        
        for category, keywords in self.failure_categories.items():
            if category == 'otros':
                continue
            for keyword in keywords:
                # Asegurar que keyword también sea string
                keyword_str = str(keyword) if keyword is not None else ""
                if keyword_str and keyword_str in description_lower:
                    return category
        
        return 'otros'

    def _determine_severity(self, description: str) -> str:
        """
        Determina el nivel de severidad de la falla
        """
        # Validar que description sea una cadena de texto
        if not isinstance(description, str):
            description = str(description) if description is not None else ""
            
        description_lower = description.lower()
        
        for severity, keywords in self.severity_levels.items():
            for keyword in keywords:
                # Asegurar que keyword también sea string
                keyword_str = str(keyword) if keyword is not None else ""
                if keyword_str and keyword_str in description_lower:
                    return severity
        
        return 'medio'  # Valor por defecto

    def _analyze_fatigue_control(self):
        """
        Analiza el control de fatiga de conductores basado en preguntas específicas HQ-FO-40
        """
        fatigue_analysis = []
        
        if self.raw_data is None:
            self.processed_data['control_fatiga'] = fatigue_analysis
            return
        
        # Columnas específicas de fatiga en el Excel tabular
        fatigue_columns = {
            'horas_sueno': '¿Ha dormido al menos 7 horas en las últimas 24 horas?',
            'sintomas_fatiga': '¿Se encuentra libre de síntomas de fatiga (Somnolencia, dolor de cabeza, irritabilidad)?',
            'condiciones_fisicas': '¿Se siente en condiciones físicas y mentales para conducir?',
            'medicamentos': '¿Ha consumido medicamentos o sustancias que afecten su estado de alerta?*'
        }
        
        # Verificar que las columnas existen y ajustar nombres si es necesario
        column_mapping = {}
        for col_key, expected_col in fatigue_columns.items():
            found = False
            for actual_col in self.raw_data.columns:
                actual_col_clean = str(actual_col).strip()
                if expected_col.strip() in actual_col_clean or actual_col_clean in expected_col.strip():
                    column_mapping[col_key] = actual_col
                    found = True
                    break
            if not found:
                self.logger.warning(f"Columna de fatiga no encontrada: {expected_col}")
        
        # Procesar cada fila como un conductor
        for index, row in self.raw_data.iterrows():
            conductor_name = row.get('NOMBRE DE QUIEN REALIZA LA INSPECCIÓN', f'Conductor_{index}')
            if pd.isna(conductor_name) or not str(conductor_name).strip():
                continue
                
            conductor_name = str(conductor_name).strip()
            
            # Extraer respuestas de fatiga directamente de las columnas
            fatigue_responses = self._extract_fatigue_responses_direct(row, column_mapping)
            
            driver_fatigue = {
                'conductor_id': f'driver_{index}',
                'conductor_nombre': self._normalize_name(conductor_name),
                'horas_trabajadas': 0,  # No disponible en este formato
                'fecha_analisis': self._get_row_date(row)
            }
            
            driver_fatigue.update(fatigue_responses)
            
            # Calcular nivel de fatiga basado en las 4 preguntas
            driver_fatigue['nivel_fatiga'] = self._calculate_comprehensive_fatigue_level(fatigue_responses)
            driver_fatigue['recomendacion'] = self._get_fatigue_recommendation(driver_fatigue['nivel_fatiga'])
            driver_fatigue['status_color'] = self._get_fatigue_status_color(driver_fatigue['nivel_fatiga'])
            
            # Log detallado para primeros conductores
            if len(fatigue_analysis) < 3:
                self.logger.info(f"Análisis fatiga conductor {conductor_name}:", {
                    'puntuacion': fatigue_responses.get('puntuacion_fatiga', 0),
                    'nivel_fatiga': driver_fatigue['nivel_fatiga'],
                    'respuestas': fatigue_responses,
                    'columnas_encontradas': list(column_mapping.keys())
                })
            
            fatigue_analysis.append(driver_fatigue)
        
        self.processed_data['control_fatiga'] = fatigue_analysis
        self.logger.info(f"Análisis de fatiga completado para {len(fatigue_analysis)} conductores")

    def _find_fatigue_questions(self) -> Dict:
        """
        Busca las preguntas específicas de fatiga en el Excel
        """
        questions_found = {}
        
        if self.raw_data is None:
            return questions_found
            
        # Buscar cada pregunta específica
        for question_key, pattern in self.fatigue_patterns.items():
            questions_found[question_key] = []
            
            # Buscar en todas las celdas
            for row_idx, row in self.raw_data.iterrows():
                for col_idx, cell_value in enumerate(row):
                    if pd.notna(cell_value):
                        cell_str = str(cell_value).strip()
                        if re.search(pattern, cell_str):
                            questions_found[question_key].append({
                                'row': row_idx,
                                'col': col_idx,
                                'text': cell_str
                            })
        
        return questions_found

    def _extract_fatigue_responses_direct(self, row: pd.Series, column_mapping: Dict) -> Dict:
        """
        Extrae las respuestas de fatiga directamente de las columnas del Excel
        """
        responses = {
            'dormir_7_horas': None,
            'libre_sintomas_fatiga': None,
            'condiciones_conducir': None,
            'sin_medicamentos': None,
            'puntuacion_fatiga': 0
        }
        
        # Mapeo de columnas a respuestas
        col_to_response = {
            'horas_sueno': 'dormir_7_horas',
            'sintomas_fatiga': 'libre_sintomas_fatiga',
            'condiciones_fisicas': 'condiciones_conducir',
            'medicamentos': 'sin_medicamentos'
        }
        
        # Extraer valores de las columnas
        for col_key, actual_col in column_mapping.items():
            if actual_col in row.index:
                value = row[actual_col]
                response_key = col_to_response.get(col_key)
                if response_key:
                    responses[response_key] = value
        
        # Calcular puntuación basada en valores específicos del Excel
        score = 0
        
        # Para las primeras 3 preguntas: "Cumple" = 1 punto, "No cumple" = 0 puntos
        for key in ['dormir_7_horas', 'libre_sintomas_fatiga', 'condiciones_conducir']:
            value = responses.get(key)
            if pd.notna(value):
                value_str = str(value).strip()
                # Manejo case-insensitive para "Cumple"
                if value_str.lower() == 'cumple':
                    score += 1
                    self.logger.debug(f"Pregunta {key}: {value_str} = +1 punto")
                else:
                    self.logger.debug(f"Pregunta {key}: {value_str} = 0 puntos")
        
        # Para medicamentos: "No" = 1 punto (bueno), "Sí" = 0 puntos (malo)
        medicamentos = responses.get('sin_medicamentos')
        if pd.notna(medicamentos):
            value_str = str(medicamentos).strip()
            # "No" es bueno (sin medicamentos), "Sí" es malo (con medicamentos)
            if value_str.lower() == 'no':
                score += 1
                self.logger.debug(f"Medicamentos: {value_str} = +1 punto (sin medicamentos)")
            else:
                self.logger.debug(f"Medicamentos: {value_str} = 0 puntos (con medicamentos)")
        
        responses['puntuacion_fatiga'] = score
        return responses
    
    def _get_row_date(self, row: pd.Series) -> str:
        """
        Extrae la fecha de la fila
        """
        if 'Marca temporal' in row.index and pd.notna(row['Marca temporal']):
            try:
                date_val = row['Marca temporal']
                if hasattr(date_val, 'strftime'):
                    return date_val.strftime('%Y-%m-%d %H:%M:%S')
                else:
                    return str(date_val)
            except:
                pass
        return datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
    def _get_fatigue_recommendation(self, fatigue_level: str) -> str:
        """
        Obtiene recomendación basada en el nivel de fatiga
        """
        recommendations = {
            'normal': 'Conductor en condiciones normales para operar',
            'alerta': 'Revisar condiciones del conductor antes de operar',
            'alto': 'Conductor requiere descanso antes de operar',
            'critico': 'Prohibido operar - conductor en estado crítico de fatiga'
        }
        return recommendations.get(fatigue_level, 'Evaluar condiciones del conductor')

    def _evaluate_fatigue_responses(self, driver_id: str, questions: Dict) -> Dict:
        """
        Evalúa las respuestas del conductor a las preguntas de fatiga (método legacy)
        """
        responses = {
            'dormir_7_horas': None,
            'libre_sintomas_fatiga': None,
            'condiciones_conducir': None,
            'sin_medicamentos': None,
            'puntuacion_fatiga': 0
        }
        
        # Buscar respuestas cerca de las preguntas encontradas
        for question_type, question_locations in questions.items():
            for location in question_locations:
                response = self._find_response_near_question(location, driver_id)
                
                if question_type == 'horas_sueno':
                    responses['dormir_7_horas'] = response
                elif question_type == 'sintomas_fatiga':
                    responses['libre_sintomas_fatiga'] = response  
                elif question_type == 'condiciones_fisicas':
                    responses['condiciones_conducir'] = response
                elif question_type == 'medicamentos':
                    responses['sin_medicamentos'] = response
        
        # Calcular puntuación (0-4, donde 4 es mejor)
        score = 0
        for key, value in responses.items():
            if key != 'puntuacion_fatiga':
                # Convertir value a string para hacer comparaciones seguras
                value_str = str(value).lower().strip() if value is not None else ""
                
                # Verificar si es una respuesta positiva
                if value_str in ['si', 'sí', 'yes', 'true', '1']:
                    if key == 'sin_medicamentos':
                        score += 0  # Para medicamentos, 'si' es negativo
                    else:
                        score += 1
                elif key == 'sin_medicamentos' and value_str in ['no', 'false', '0']:
                    score += 1  # Para medicamentos, 'no' es positivo
        
        responses['puntuacion_fatiga'] = score
        return responses

    def _find_response_near_question(self, question_location: Dict, driver_id: str) -> Optional[str]:
        """
        Busca la respuesta cerca de una pregunta específica
        """
        if self.raw_data is None:
            return None
            
        row = question_location['row']
        col = question_location['col']
        
        # Buscar en celdas adyacentes (derecha, abajo, diagonal)
        search_offsets = [(0, 1), (0, 2), (1, 0), (1, 1), (2, 0), (0, 3)]
        
        for row_offset, col_offset in search_offsets:
            try:
                target_row = row + row_offset
                target_col = col + col_offset
                
                if target_row < len(self.raw_data) and target_col < len(self.raw_data.columns):
                    response = self.raw_data.iloc[target_row, target_col]
                    
                    if pd.notna(response):
                        # NORMALIZAR RESPUESTA SÍ/NO
                        normalized_response = self.normalize_yes_no_response(response)
                        if normalized_response:
                            return normalized_response
                            
            except (IndexError, KeyError):
                continue
        
        return None

    def _calculate_comprehensive_fatigue_level(self, responses: Dict) -> str:
        """
        Calcula el nivel de fatiga basado en las 4 preguntas específicas
        """
        score = responses.get('puntuacion_fatiga', 0)
        
        if score >= 4:
            return 'normal'  # Verde: Todas las respuestas correctas
        elif score >= 3:
            return 'alerta'  # Amarillo: Una respuesta problemática  
        elif score >= 2:
            return 'alto'    # Naranja: Dos respuestas problemáticas
        else:
            return 'critico' # Rojo: Múltiples problemas de fatiga

    def _get_fatigue_status_color(self, fatigue_level: str) -> str:
        """
        Obtiene el color de estado según el nivel de fatiga
        """
        color_map = {
            'normal': 'verde',
            'alerta': 'amarillo', 
            'alto': 'naranja',
            'critico': 'rojo'
        }
        return color_map.get(fatigue_level, 'gris')

    def _calculate_work_hours(self, start_time: str, end_time: str) -> float:
        """
        Calcula las horas trabajadas
        """
        try:
            # Parsear formatos de hora comunes
            time_formats = ['%H:%M', '%H:%M:%S', '%I:%M %p', '%I:%M:%S %p']
            
            start_parsed = None
            end_parsed = None
            
            for fmt in time_formats:
                try:
                    start_parsed = datetime.strptime(start_time, fmt).time()
                    end_parsed = datetime.strptime(end_time, fmt).time()
                    break
                except ValueError:
                    continue
            
            if start_parsed and end_parsed:
                # Convertir a datetime para calcular diferencia
                start_dt = datetime.combine(datetime.today(), start_parsed)
                end_dt = datetime.combine(datetime.today(), end_parsed)
                
                # Si la hora de fin es menor, asumimos que cruza medianoche
                if end_dt < start_dt:
                    end_dt += timedelta(days=1)
                
                diff = end_dt - start_dt
                return round(diff.total_seconds() / 3600, 2)
            
            return 0.0
            
        except Exception:
            return 0.0

    def _calculate_fatigue_level(self, hours: float) -> str:
        """
        Calcula el nivel de fatiga basado en horas trabajadas
        """
        if hours <= 8:
            return 'normal'
        elif hours <= 10:
            return 'alerta'
        elif hours <= 12:
            return 'alto'
        else:
            return 'critico'

    def _get_fatigue_recommendation(self, fatigue_level: str) -> str:
        """
        Obtiene recomendación basada en el nivel de fatiga
        """
        recommendations = {
            'normal': 'Continuar con actividad normal',
            'alerta': 'Considerar descanso en la próxima parada',
            'alto': 'Descanso obligatorio recomendado',
            'critico': 'Descanso inmediato obligatorio - Reemplazar conductor'
        }
        return recommendations.get(fatigue_level, 'Evaluar situación')

    def _determine_vehicle_status_color(self, vehicle: Dict) -> str:
        """
        Determina el color de estado para vehículos
        """
        # Verificar fallas críticas
        vehicle_failures = [f for f in self.processed_data.get('fallas_mecanicas', []) 
                          if f.get('severidad') in ['critico', 'alto']]
        
        if vehicle_failures:
            return 'rojo'  # Crítico
        
        # Verificar combustible bajo
        fuel_level = vehicle.get('combustible', 100)
        if isinstance(fuel_level, (int, float)) and fuel_level < 25:
            return 'amarillo'  # Alerta
        
        # Verificar kilometraje alto
        km = vehicle.get('kilometraje', 0)
        if isinstance(km, (int, float)) and km > 200000:
            return 'amarillo'  # Alerta por kilometraje alto
        
        return 'verde'  # Operativo

    def _determine_driver_status_color(self, driver: Dict) -> str:
        """
        Determina el color de estado para conductores basado en días desde última inspección
        Verde: máximo 5 días desde su última inspección
        Amarillo: de 6 a 10 días 
        Rojo: más de 10 días (requiere acciones inmediatas)
        """
        fecha_inspeccion = driver.get('fecha_inspeccion')
        
        if fecha_inspeccion:
            dias_desde_inspeccion = self._calculate_days_since_inspection(fecha_inspeccion)
            
            if dias_desde_inspeccion <= 5:
                return 'verde'
            elif dias_desde_inspeccion <= 10:
                return 'amarillo'
            else:
                return 'rojo'
        
        # Si no hay fecha, considerar como crítico
        return 'rojo'

    def _calculate_days_since_inspection(self, inspection_date: str) -> int:
        """
        Calcula los días transcurridos desde la última inspección
        """
        try:
            # Intentar varios formatos de fecha
            date_formats = [
                '%Y-%m-%d',
                '%d/%m/%Y', 
                '%d-%m-%Y',
                '%m/%d/%Y',
                '%d/%m/%y',
                '%d-%m-%y',
                '%Y/%m/%d'
            ]
            
            inspection_dt = None
            for fmt in date_formats:
                try:
                    inspection_dt = datetime.strptime(str(inspection_date).strip(), fmt)
                    break
                except ValueError:
                    continue
            
            if inspection_dt:
                today = datetime.now()
                difference = today - inspection_dt
                return max(0, difference.days)
            
            return 999  # Si no se puede parsear, asumir muy antigua
            
        except Exception:
            return 999

    def _determine_failure_status_color(self, description: str) -> str:
        """
        Determina el color de estado para fallas según especificación:
        Verde: ninguna falla
        Amarillo: fallas no tan críticas
        Rojo: fallas críticas, camión inutilizado requiere atención
        """
        # Validar tipo y valores nulos
        if description is None or pd.isna(description):
            return 'verde'  # Sin fallas
            
        # Asegurar que sea string
        if not isinstance(description, str):
            description = str(description)
            
        if not description or description.strip() == '':
            return 'verde'  # Sin fallas
        
        severity = self._determine_severity(description)
        
        if severity == 'critico':
            return 'rojo'    # Fallas críticas - camión inutilizado
        elif severity in ['alto', 'medio']:
            return 'amarillo'  # Fallas no tan críticas
        else:
            return 'verde'   # Fallas menores o ninguna

    def _generate_status_colors(self):
        """
        Genera lógica de colores para todo el sistema
        """
        # Los colores ya se asignan individualmente en cada método
        pass

    def _extract_inspection_date(self) -> str:
        """
        Extrae la fecha de inspección del archivo
        """
        if self.raw_data is None:
            return datetime.now().strftime('%Y-%m-%d')
            
        # Buscar fecha en las primeras filas
        for i in range(min(10, len(self.raw_data))):
            for j in range(min(10, len(self.raw_data.columns))):
                cell = self.raw_data.iloc[i, j]
                if pd.isna(cell):
                    continue
                    
                cell_str = str(cell).strip()
                
                # NORMALIZAR FECHA encontrada
                normalized_date = self.normalize_date_format(cell_str)
                if normalized_date and normalized_date != cell_str:
                    return normalized_date
                
                # Intentar parsear como fecha con formatos comunes
                date_formats = ['%d/%m/%Y', '%d-%m-%Y', '%Y-%m-%d', '%m/%d/%Y']
                for fmt in date_formats:
                    try:
                        parsed_date = datetime.strptime(cell_str, fmt)
                        return parsed_date.strftime('%Y-%m-%d')
                    except ValueError:
                        continue
        
        return datetime.now().strftime('%Y-%m-%d')

    def _extract_number(self, text: str) -> Optional[float]:
        """
        Extrae número de un texto
        """
        try:
            # Buscar números en el texto
            numbers = re.findall(r'[\d,]+\.?\d*', text.replace(',', ''))
            if numbers:
                return float(numbers[0])
        except ValueError:
            pass
        return None

    def _generate_summary(self) -> Dict:
        """
        Genera resumen del análisis
        """
        summary = {
            'total_vehiculos': len(self.processed_data['vehiculos']),
            'total_conductores': len(self.processed_data['conductores']),
            'total_fallas': len(self.processed_data['fallas_mecanicas']),
            'vehiculos_operativos': len([v for v in self.processed_data['vehiculos'] if v.get('status_color') == 'verde']),
            'vehiculos_alerta': len([v for v in self.processed_data['vehiculos'] if v.get('status_color') == 'amarillo']),
            'vehiculos_criticos': len([v for v in self.processed_data['vehiculos'] if v.get('status_color') == 'rojo']),
            'conductores_normales': len([c for c in self.processed_data['conductores'] if c.get('status_color') == 'verde']),
            'conductores_alerta': len([c for c in self.processed_data['conductores'] if c.get('status_color') == 'amarillo']),
            'conductores_criticos': len([c for c in self.processed_data['conductores'] if c.get('status_color') == 'rojo']),
            'fallas_por_categoria': self._count_failures_by_category(),
            'fallas_por_severidad': self._count_failures_by_severity()
        }
        
        return summary

    def _count_failures_by_category(self) -> Dict:
        """
        Cuenta fallas por categoría
        """
        categories = {}
        for failure in self.processed_data['fallas_mecanicas']:
            category = failure.get('categoria', 'otros')
            categories[category] = categories.get(category, 0) + 1
        return categories

    def _count_failures_by_severity(self) -> Dict:
        """
        Cuenta fallas por severidad
        """
        severities = {}
        for failure in self.processed_data['fallas_mecanicas']:
            severity = failure.get('severidad', 'medio')
            severities[severity] = severities.get(severity, 0) + 1
        return severities

    def get_filtered_data(self, filters: Dict) -> Dict:
        """
        Filtra datos según criterios específicos
        """
        filtered_data = {
            'conductores': self._filter_drivers(filters),
            'vehiculos': self._filter_vehicles(filters),
            'fallas_mecanicas': self._filter_failures(filters),
            'control_fatiga': self._filter_fatigue(filters)
        }
        
        return filtered_data

    def _filter_drivers(self, filters: Dict) -> List:
        """
        Filtra conductores
        """
        drivers = self.processed_data['conductores']
        
        if 'fatigue_level' in filters:
            drivers = [d for d in drivers if d.get('nivel_fatiga') == filters['fatigue_level']]
        
        if 'status_color' in filters:
            drivers = [d for d in drivers if d.get('status_color') == filters['status_color']]
        
        if 'search_term' in filters and filters['search_term']:
            term = filters['search_term'].lower().strip()
            # Búsqueda inteligente: por inicio de nombre o contenido
            drivers = [d for d in drivers if (
                d.get('nombre', '').lower().startswith(term) or  # Empieza con el término
                term in d.get('nombre', '').lower()              # Contiene el término
            )]
        
        return drivers

    def _filter_vehicles(self, filters: Dict) -> List:
        """
        Filtra vehículos
        """
        vehicles = self.processed_data['vehiculos']
        
        if 'status_color' in filters:
            vehicles = [v for v in vehicles if v.get('status_color') == filters['status_color']]
        
        if 'min_km' in filters:
            vehicles = [v for v in vehicles if v.get('kilometraje', 0) >= filters['min_km']]
        
        if 'max_km' in filters:
            vehicles = [v for v in vehicles if v.get('kilometraje', 0) <= filters['max_km']]
        
        return vehicles

    def _filter_failures(self, filters: Dict) -> List:
        """
        Filtra fallas
        """
        failures = self.processed_data['fallas_mecanicas']
        
        if 'category' in filters:
            failures = [f for f in failures if f.get('categoria') == filters['category']]
        
        if 'severity' in filters:
            failures = [f for f in failures if f.get('severidad') == filters['severity']]
        
        if 'search_term' in filters and filters['search_term']:
            term = filters['search_term'].lower()
            failures = [f for f in failures if term in f.get('descripcion', '').lower()]
        
        return failures

    def _filter_fatigue(self, filters: Dict) -> List:
        """
        Filtra control de fatiga
        """
        fatigue_records = self.processed_data['control_fatiga']
        
        if 'fatigue_level' in filters:
            fatigue_records = [f for f in fatigue_records if f.get('nivel_fatiga') == filters['fatigue_level']]
        
        return fatigue_records