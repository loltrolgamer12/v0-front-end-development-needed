"""
Analizador especializado para archivos Excel tipo HQ-FO-40 INSPECCIÓN DIARIA DE VEHÍCULO LIVIANO
Extrae y procesa información de vehículos y conductores con lógica de categorización avanzada
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import re
from typing import Dict, List, Tuple, Optional
import json

class HQFOAnalyzer:
    def __init__(self):
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
        if not description or pd.isna(description):
            return ""
        
        description = str(description).strip().lower()
        
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
        try:
            # Leer todas las hojas del Excel
            excel_file = pd.ExcelFile(file_path)
            all_sheets = {}
            
            for sheet_name in excel_file.sheet_names:
                df = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
                all_sheets[sheet_name] = df
            
            # Buscar la hoja principal de inspección
            main_sheet = self._identify_main_sheet(all_sheets)
            self.raw_data = main_sheet
            
            # Procesar datos por secciones
            self._extract_vehicle_info()
            self._extract_driver_info() 
            self._extract_mechanical_failures()
            self._analyze_fatigue_control()
            self._generate_status_colors()
            
            # Generar reporte de normalización
            normalization_report = self.generate_normalization_report()
            
            return {
                'success': True,
                'data': self.processed_data,
                'summary': self._generate_summary(),
                'normalization_report': normalization_report,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Error procesando archivo: {str(e)}",
                'timestamp': datetime.now().isoformat()
            }

    def _identify_main_sheet(self, sheets: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        """
        Identifica la hoja principal de inspección
        """
        # Buscar por nombre de hoja
        priority_names = ['inspeccion', 'hq-fo-40', 'vehiculo', 'diaria']
        
        for name in priority_names:
            for sheet_name in sheets.keys():
                if name.lower() in sheet_name.lower():
                    return sheets[sheet_name]
        
        # Si no encuentra, usar la primera hoja con más datos
        max_cells = 0
        main_sheet = None
        
        for sheet_name, df in sheets.items():
            non_null_cells = df.count().sum()
            if non_null_cells > max_cells:
                max_cells = non_null_cells
                main_sheet = df
                
        return main_sheet if main_sheet is not None else list(sheets.values())[0]

    def _extract_vehicle_info(self):
        """
        Extrae información de vehículos
        """
        if self.raw_data is None:
            return
            
        vehicles = []
        current_vehicle = {}
        
        # Buscar información de vehículos en todas las celdas
        for i, row in self.raw_data.iterrows():
            for j, cell in enumerate(row):
                if pd.isna(cell):
                    continue
                    
                cell_str = str(cell).strip().lower()
                
                # Identificar placa/código de vehículo
                if re.search(self.section_patterns['vehiculo'], cell_str):
                    if j + 1 < len(row) and not pd.isna(row.iloc[j + 1]):
                        raw_code = str(row.iloc[j + 1]).strip()
                        # NORMALIZAR CÓDIGO DE VEHÍCULO
                        normalized_code = self.normalize_vehicle_code(raw_code)
                        current_vehicle['codigo'] = normalized_code
                        current_vehicle['placa'] = normalized_code
                        current_vehicle['codigo_original'] = raw_code  # Guardar original
                
                # Identificar kilometraje
                elif re.search(self.section_patterns['kilometraje'], cell_str):
                    if j + 1 < len(row) and not pd.isna(row.iloc[j + 1]):
                        km_value = self._extract_number(str(row.iloc[j + 1]))
                        if km_value:
                            current_vehicle['kilometraje'] = km_value
                
                # Identificar nivel de combustible
                elif re.search(self.section_patterns['combustible'], cell_str):
                    if j + 1 < len(row) and not pd.isna(row.iloc[j + 1]):
                        fuel_value = self._extract_number(str(row.iloc[j + 1]))
                        if fuel_value:
                            current_vehicle['combustible'] = fuel_value
                
                # Identificar estado general
                elif re.search(self.section_patterns['estado'], cell_str):
                    if j + 1 < len(row) and not pd.isna(row.iloc[j + 1]):
                        current_vehicle['estado'] = str(row.iloc[j + 1]).strip()
        
        # Agregar fecha de inspección
        current_vehicle['fecha_inspeccion'] = self._extract_inspection_date()
        current_vehicle['id'] = f"VEH_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        current_vehicle['status_color'] = self._determine_vehicle_status_color(current_vehicle)
        
        if current_vehicle:
            vehicles.append(current_vehicle)
        
        self.processed_data['vehiculos'] = vehicles

    def _extract_driver_info(self):
        """
        Extrae información de conductores
        """
        if self.raw_data is None:
            return
            
        drivers = []
        current_driver = {}
        
        # Buscar información de conductores
        for i, row in self.raw_data.iterrows():
            for j, cell in enumerate(row):
                if pd.isna(cell):
                    continue
                    
                cell_str = str(cell).strip().lower()
                
                # Identificar nombre del conductor
                if re.search(self.section_patterns['conductor'], cell_str):
                    if j + 1 < len(row) and not pd.isna(row.iloc[j + 1]):
                        raw_name = str(row.iloc[j + 1]).strip()
                        # NORMALIZAR NOMBRE
                        current_driver['nombre'] = self.normalize_name(raw_name)
                        current_driver['nombre_original'] = raw_name  # Guardar original para auditoría
                        current_driver['id'] = f"COND_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                
                # Identificar hora de inicio/fin
                elif re.search(self.section_patterns['hora'], cell_str):
                    if j + 1 < len(row) and not pd.isna(row.iloc[j + 1]):
                        raw_time = str(row.iloc[j + 1]).strip()
                        # NORMALIZAR TIEMPO
                        normalized_time = self.normalize_time_format(raw_time)
                        if 'inicio' in cell_str or 'entrada' in cell_str:
                            current_driver['hora_inicio'] = normalized_time
                            current_driver['hora_inicio_original'] = raw_time
                        elif 'fin' in cell_str or 'salida' in cell_str:
                            current_driver['hora_fin'] = normalized_time
                            current_driver['hora_fin_original'] = raw_time
        
        # Obtener fecha de inspección primero
        current_driver['fecha_inspeccion'] = self._extract_inspection_date()
        current_driver['dias_desde_inspeccion'] = self._calculate_days_since_inspection(current_driver['fecha_inspeccion'])
        
        # Calcular horas trabajadas y fatiga
        if 'hora_inicio' in current_driver and 'hora_fin' in current_driver:
            horas_trabajadas = self._calculate_work_hours(
                current_driver['hora_inicio'], 
                current_driver['hora_fin']
            )
            current_driver['horas_trabajadas'] = horas_trabajadas
            current_driver['nivel_fatiga'] = self._calculate_fatigue_level(horas_trabajadas)
        
        # Determinar estado basado en días desde inspección
        current_driver['status_color'] = self._determine_driver_status_color(current_driver)
        
        if current_driver:
            drivers.append(current_driver)
        
        self.processed_data['conductores'] = drivers

    def _extract_mechanical_failures(self):
        """
        Extrae y categoriza fallas mecánicas
        """
        if self.raw_data is None:
            return
            
        failures = []
        
        # Buscar fallas en todas las celdas
        for i, row in self.raw_data.iterrows():
            for j, cell in enumerate(row):
                if pd.isna(cell):
                    continue
                    
                cell_str = str(cell).strip().lower()
                
                # Buscar indicadores de fallas
                if re.search(self.section_patterns['fallas'], cell_str):
                    # Buscar descripción de la falla en celdas adyacentes
                    failure_description = self._extract_failure_description(row, j)
                    
                    if failure_description:
                        # NORMALIZAR DESCRIPCIÓN DE FALLA
                        normalized_description = self.normalize_failure_description(failure_description)
                        
                        failure = {
                            'id': f"FALLA_{len(failures) + 1}_{datetime.now().strftime('%H%M%S')}",
                            'descripcion': normalized_description,
                            'descripcion_original': failure_description,  # Guardar original
                            'categoria': self._categorize_failure(normalized_description),
                            'severidad': self._determine_severity(normalized_description),
                            'ubicacion_fila': i,
                            'ubicacion_columna': j,
                            'fecha_reporte': self.normalize_date_format(self._extract_inspection_date()),
                            'status_color': self._determine_failure_status_color(normalized_description)
                        }
                        failures.append(failure)
        
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
        description_lower = description.lower()
        
        for category, keywords in self.failure_categories.items():
            if category == 'otros':
                continue
            for keyword in keywords:
                if keyword in description_lower:
                    return category
        
        return 'otros'

    def _determine_severity(self, description: str) -> str:
        """
        Determina el nivel de severidad de la falla
        """
        description_lower = description.lower()
        
        for severity, keywords in self.severity_levels.items():
            for keyword in keywords:
                if keyword in description_lower:
                    return severity
        
        return 'medio'  # Valor por defecto

    def _analyze_fatigue_control(self):
        """
        Analiza el control de fatiga de conductores basado en preguntas específicas HQ-FO-40
        """
        fatigue_analysis = []
        
        # Buscar las preguntas de fatiga en el Excel
        fatigue_questions = self._find_fatigue_questions()
        
        for driver in self.processed_data['conductores']:
            driver_fatigue = {
                'conductor_id': driver['id'],
                'conductor_nombre': driver['nombre'],
                'horas_trabajadas': driver.get('horas_trabajadas', 0),
                'fecha_analisis': datetime.now().isoformat()
            }
            
            # Evaluar respuestas a preguntas específicas
            fatigue_responses = self._evaluate_fatigue_responses(driver['id'], fatigue_questions)
            driver_fatigue.update(fatigue_responses)
            
            # Calcular nivel de fatiga basado en las 4 preguntas
            driver_fatigue['nivel_fatiga'] = self._calculate_comprehensive_fatigue_level(fatigue_responses)
            driver_fatigue['recomendacion'] = self._get_fatigue_recommendation(driver_fatigue['nivel_fatiga'])
            driver_fatigue['status_color'] = self._get_fatigue_status_color(driver_fatigue['nivel_fatiga'])
            
            fatigue_analysis.append(driver_fatigue)
        
        self.processed_data['control_fatiga'] = fatigue_analysis

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

    def _evaluate_fatigue_responses(self, driver_id: str, questions: Dict) -> Dict:
        """
        Evalúa las respuestas del conductor a las preguntas de fatiga
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
            if key != 'puntuacion_fatiga' and value in ['si', 'sí', 'yes', True]:
                if key == 'sin_medicamentos':
                    score += 1 if value in ['no', False] else 0  # Invertido para medicamentos
                else:
                    score += 1
        
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