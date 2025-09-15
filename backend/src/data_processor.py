"""
Sistema de Análisis de Inspecciones Vehiculares
---------------------------------------------
data_processor.py - Módulo de procesamiento de datos

Este módulo contiene las funciones principales para procesar
los datos de inspecciones vehiculares.
"""

import pandas as pd
from datetime import datetime
from typing import Dict, List, Optional, Union, Tuple
import numpy as np
from normalizer import normalize_text, normalize_plate, normalize_location
from trend_analyzer import analyze_trends
from critical_analyzer import analyze_critical_items
from database import save_inspections, get_inspections

def process_inspection_data(data: Union[str, pd.DataFrame]) -> Dict:
    """Procesa los datos de inspección aplicando normalización y transformaciones.
    
    Args:
        data: Puede ser la ruta al archivo Excel o un DataFrame con los datos crudos
        
    Returns:
        Diccionario con los resultados procesados por vehículo
    """
    # Si es una ruta de archivo, cargar el DataFrame
    if isinstance(data, str):
        df = pd.read_excel(data)
    else:
        df = data.copy()
    
    # Limpiar nombres de columnas y datos
    df.columns = [col.strip() for col in df.columns]
    df['NOMBRE DE QUIEN REALIZA LA INSPECCIÓN'] = df['NOMBRE DE QUIEN REALIZA LA INSPECCIÓN'].str.strip().str.upper()
    df['PLACA DEL VEHICULO'] = df['PLACA DEL VEHICULO'].str.strip().str.upper()
    
    # Convertir marca temporal a fecha
    df['fecha'] = pd.to_datetime(df['Marca temporal'])
    
    # Imprimir rango de fechas
    print("\nRango de fechas en el archivo:")
    print(f"Fecha más antigua: {df['fecha'].min()}")
    print(f"Fecha más reciente: {df['fecha'].max()}\n")
    
    # Filtrar solo registros de agosto 2025
    mask_agosto = (df['fecha'].dt.year == 2025) & (df['fecha'].dt.month == 8)
    df_agosto = df[mask_agosto]
    
    print(f"Total de registros: {len(df)}")
    print(f"Registros de agosto 2025: {len(df_agosto)}\n")
    
    df_agosto['fecha'] = df_agosto['fecha'].dt.date
    
    # Inicializar diccionario de resultados
    results = {}
    
    # Procesar cada placa
    for placa in df_agosto['PLACA DEL VEHICULO'].unique():
        vehiculo_df = df_agosto[df_agosto['PLACA DEL VEHICULO'] == placa]
        
        # Contar días únicos con reportes
        dias_con_reportes = vehiculo_df['fecha'].nunique()
        
        # Calcular porcentaje de cumplimiento (19 días hábiles en agosto)
        cumplimiento = (dias_con_reportes / 19) * 100
        
        # Obtener custodio (último registro)
        custodio = vehiculo_df['NOMBRE DE QUIEN REALIZA LA INSPECCIÓN'].iloc[-1] if not vehiculo_df.empty else ""
        
        results[placa] = {
            'cumplimiento': cumplimiento,
            'total_reportes': dias_con_reportes,
            'custodio': custodio
        }
    
    return results
    
    # Normalizar campos principales
    processed['placa'] = processed['PLACA DEL VEHICULO'].apply(normalize_plate)
    processed['ubicacion'] = processed['CAMPO/COORDINACIÓN'].apply(normalize_location)
    processed['inspector'] = processed['NOMBRE DE QUIEN REALIZA LA INSPECCIÓN '].apply(normalize_text)
    processed['contrato'] = processed['CONTRATO'].apply(normalize_text)
    processed['turno'] = processed['TURNO'].apply(normalize_text)
    
    # Convertir timestamp
    processed['timestamp'] = pd.to_datetime(processed['Marca temporal'])
    
    # Procesar campos de inspección
    inspection_cols = [col for col in df.columns if col.startswith('**')]
    for col in inspection_cols:
        new_col = col.replace('**', '').strip().lower().replace(' ', '_')
        processed[new_col] = processed[col].apply(lambda x: 'cumple' if x == 'CUMPLE' else 'no_cumple' if x == 'NO CUMPLE' else 'na')
    
    # Procesar kilometraje
    processed['kilometraje'] = pd.to_numeric(processed['KILOMETRAJE'], errors='coerce')
    
    # Procesar observaciones
    processed['observaciones'] = processed['OBSERVACIONES'].fillna('')
    
    # Agregar campos calculados
    processed['hora_dia'] = processed['timestamp'].dt.hour
    processed['dia_semana'] = processed['timestamp'].dt.day_name()
    processed['mes'] = processed['timestamp'].dt.month_name()
    
    # Calcular tasa de cumplimiento
    def calculate_compliance(row):
        inspection_values = [row[col] for col in processed.columns if col.endswith('_cumple')]
        total = len(inspection_values)
        compliant = len([v for v in inspection_values if v == 'cumple'])
        return compliant / total if total > 0 else 0
    
    processed['compliance_rate'] = processed.apply(calculate_compliance, axis=1)
    
    # Seleccionar columnas relevantes
    relevant_columns = [
        'timestamp', 'placa', 'ubicacion', 'inspector', 'contrato',
        'turno', 'kilometraje', 'observaciones', 'hora_dia',
        'dia_semana', 'mes', 'compliance_rate'
    ] + [col for col in processed.columns if col.endswith('_cumple')]
    
    return processed[relevant_columns]

def analyze_inspection_data(df: pd.DataFrame) -> Dict:
    """Realiza un análisis completo de los datos de inspección.
    
    Args:
        df: DataFrame con los datos procesados
        
    Returns:
        Diccionario con los resultados del análisis
    """
    if 'compliance_rate' not in df.columns:
        df = process_inspection_data(df)
    
    trends = analyze_trends(df)
    critical = analyze_critical_items(df)
    
    stats = {
        'total_inspections': len(df),
        'unique_vehicles': len(df['placa'].unique()),
        'unique_inspectors': len(df['inspector'].unique()),
        'avg_compliance': df['compliance_rate'].mean(),
        'low_compliance_vehicles': _get_low_compliance_vehicles(df),
        'high_risk_locations': _get_high_risk_locations(df)
    }
    
    return {
        'trends': trends,
        'critical_items': critical,
        'statistics': stats
    }

def load_and_process_excel(file_path: str) -> Tuple[pd.DataFrame, Dict]:
    """Carga y procesa un archivo Excel de inspecciones.
    
    Args:
        file_path: Ruta al archivo Excel
        
    Returns:
        Tuple con el DataFrame procesado y las estadísticas
    """
    df = pd.read_excel(file_path, sheet_name="Respuestas de formulario 1")
    processed_df = process_inspection_data(df)
    stats = analyze_inspection_data(processed_df)
    
    # Guardar en base de datos
    save_inspections(processed_df)
    
    return processed_df, stats

def _get_low_compliance_vehicles(df: pd.DataFrame, threshold: float = 0.8) -> List[Dict]:
    """Identifica vehículos con baja tasa de cumplimiento"""
    vehicle_stats = df.groupby('placa').agg({
        'compliance_rate': ['mean', 'count']
    }).reset_index()
    
    vehicle_stats.columns = ['placa', 'avg_compliance', 'total_inspections']
    low_compliance = vehicle_stats[vehicle_stats['avg_compliance'] < threshold]
    
    return low_compliance.to_dict('records')

def _get_high_risk_locations(df: pd.DataFrame) -> List[Dict]:
    """Identifica ubicaciones con mayor riesgo"""
    location_stats = df.groupby('ubicacion').agg({
        'compliance_rate': ['mean', 'count']
    }).reset_index()
    
    location_stats.columns = ['ubicacion', 'avg_compliance', 'total_inspections']
    location_stats['risk_score'] = (1 - location_stats['avg_compliance']) * \
                                 np.log1p(location_stats['total_inspections'])
    
    return location_stats.sort_values('risk_score', ascending=False).to_dict('records')