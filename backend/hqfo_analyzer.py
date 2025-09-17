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
            
            return {
                'success': True,
                'data': self.processed_data,
                'summary': self._generate_summary(),
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
                        current_vehicle['codigo'] = str(row.iloc[j + 1]).strip()
                        current_vehicle['placa'] = str(row.iloc[j + 1]).strip()
                
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
                        current_driver['nombre'] = str(row.iloc[j + 1]).strip()
                        current_driver['id'] = f"COND_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                
                # Identificar hora de inicio/fin
                elif re.search(self.section_patterns['hora'], cell_str):
                    if j + 1 < len(row) and not pd.isna(row.iloc[j + 1]):
                        time_value = str(row.iloc[j + 1]).strip()
                        if 'inicio' in cell_str or 'entrada' in cell_str:
                            current_driver['hora_inicio'] = time_value
                        elif 'fin' in cell_str or 'salida' in cell_str:
                            current_driver['hora_fin'] = time_value
        
        # Calcular horas trabajadas y fatiga
        if 'hora_inicio' in current_driver and 'hora_fin' in current_driver:
            horas_trabajadas = self._calculate_work_hours(
                current_driver['hora_inicio'], 
                current_driver['hora_fin']
            )
            current_driver['horas_trabajadas'] = horas_trabajadas
            current_driver['nivel_fatiga'] = self._calculate_fatigue_level(horas_trabajadas)
            current_driver['status_color'] = self._determine_driver_status_color(current_driver)
        
        current_driver['fecha_inspeccion'] = self._extract_inspection_date()
        
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
                        failure = {
                            'id': f"FALLA_{len(failures) + 1}_{datetime.now().strftime('%H%M%S')}",
                            'descripcion': failure_description,
                            'categoria': self._categorize_failure(failure_description),
                            'severidad': self._determine_severity(failure_description),
                            'ubicacion_fila': i,
                            'ubicacion_columna': j,
                            'fecha_reporte': self._extract_inspection_date(),
                            'status_color': self._determine_failure_status_color(failure_description)
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
        Analiza el control de fatiga de conductores
        """
        fatigue_analysis = []
        
        for driver in self.processed_data['conductores']:
            if 'horas_trabajadas' in driver:
                fatigue_record = {
                    'conductor_id': driver['id'],
                    'conductor_nombre': driver['nombre'],
                    'horas_trabajadas': driver['horas_trabajadas'],
                    'nivel_fatiga': driver['nivel_fatiga'],
                    'recomendacion': self._get_fatigue_recommendation(driver['nivel_fatiga']),
                    'fecha_analisis': datetime.now().isoformat(),
                    'status_color': driver['status_color']
                }
                fatigue_analysis.append(fatigue_record)
        
        self.processed_data['control_fatiga'] = fatigue_analysis

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
        Determina el color de estado para conductores
        """
        fatigue_level = driver.get('nivel_fatiga', 'normal')
        
        if fatigue_level == 'critico':
            return 'rojo'
        elif fatigue_level in ['alto', 'alerta']:
            return 'amarillo'
        else:
            return 'verde'

    def _determine_failure_status_color(self, description: str) -> str:
        """
        Determina el color de estado para fallas
        """
        severity = self._determine_severity(description)
        
        if severity == 'critico':
            return 'rojo'
        elif severity in ['alto', 'medio']:
            return 'amarillo'
        else:
            return 'verde'

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
                
                # Intentar parsear como fecha
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
            term = filters['search_term'].lower()
            drivers = [d for d in drivers if term in d.get('nombre', '').lower()]
        
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