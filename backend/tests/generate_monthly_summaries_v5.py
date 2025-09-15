import pandas as pd
import os
from datetime import datetime
import xlsxwriter
import re
import unicodedata
from collections import Counter

def normalize_text(text):
    """Normaliza el texto eliminando acentos, convirtiendo a mayúsculas y eliminando caracteres especiales"""
    if pd.isna(text) or not isinstance(text, str):
        return None
    # Convertir a mayúsculas y eliminar acentos
    text = text.upper()
    text = unicodedata.normalize('NFKD', text).encode('ASCII', 'ignore').decode('ASCII')
    # Eliminar caracteres especiales y espacios múltiples
    text = re.sub(r'[^A-Z0-9]', '', text)
    return text

def is_valid_plate(plate):
    """Verifica si una placa tiene un formato válido después de la normalización"""
    if pd.isna(plate) or not isinstance(plate, str):
        return False
    # Longitud esperada después de normalización (3 letras + 3 números)
    if len(plate) != 6:
        return False
    # Patrón: 3 letras seguidas de 3 números
    if not re.match(r'^[A-Z]{3}\d{3}$', plate):
        return False
    return True

def normalize_plate(plate):
    """Normaliza el formato de la placa"""
    if pd.isna(plate) or not isinstance(plate, str):
        return None
    # Convertir a mayúsculas y eliminar acentos
    plate = plate.upper()
    plate = unicodedata.normalize('NFKD', plate).encode('ASCII', 'ignore').decode('ASCII')
    # Eliminar todos los caracteres especiales y espacios
    plate = re.sub(r'[^A-Z0-9]', '', plate)
    if is_valid_plate(plate):
        return plate
    return None

def get_most_common_driver(drivers):
    """Obtiene el conductor más frecuente de una lista"""
    if not drivers or all(pd.isna(d) for d in drivers):
        return None
    # Filtrar valores nulos y normalizar nombres
    valid_drivers = [normalize_text(d) for d in drivers if pd.notna(d) and isinstance(d, str)]
    if not valid_drivers:
        return None
    # Contar frecuencias
    counter = Counter(valid_drivers)
    # Obtener el más común
    most_common = counter.most_common(1)
    return most_common[0][0] if most_common else None

def get_driver_from_history(vehicle_history):
    """Determina el conductor principal basado en el historial del vehículo"""
    all_drivers = vehicle_history['CONDUCTOR'].tolist()
    return get_most_common_driver(all_drivers)

def process_monthly_data(df):
    """Procesa los datos mensuales y genera estadísticas"""
    processed_data = []
    
    # Normalizar todas las placas
    df['PLACA_NORMALIZADA'] = df['PLACA'].apply(normalize_plate)
    
    # Filtrar registros con placas válidas
    valid_records = df[df['PLACA_NORMALIZADA'].notna()].copy()
    
    # Agrupar por placa normalizada
    for plate, vehicle_data in valid_records.groupby('PLACA_NORMALIZADA'):
        # Días únicos con inspección
        unique_days = vehicle_data['FECHA'].dt.date.nunique()
        
        # Días totales del mes
        total_days = vehicle_data['FECHA'].dt.days_in_month.iloc[0]
        
        # Total de inspecciones
        total_inspections = len(vehicle_data)
        
        # Obtener el conductor principal
        main_driver = get_driver_from_history(vehicle_data)
        
        # Calcular porcentaje de cumplimiento (no puede exceder el 100%)
        compliance = min((unique_days / total_days) * 100, 100)
        
        processed_data.append({
            'PLACA': plate,
            'TOTAL_INSPECCIONES': total_inspections,
            'DIAS_CON_INSPECCION': unique_days,
            'CONDUCTOR_PRINCIPAL': main_driver,
            'PORCENTAJE_CUMPLIMIENTO': compliance,
            'DIAS_TOTALES': total_days
        })
    
    return pd.DataFrame(processed_data)

def generate_monthly_summaries(input_file):
    """Genera resúmenes mensuales a partir del archivo de inspección"""
    print(f"Procesando archivo: {input_file}")
    
    # Leer el archivo Excel
    df = pd.read_excel(input_file)
    
    # Convertir la columna de fecha a datetime
    df['FECHA'] = pd.to_datetime(df['FECHA'], errors='coerce')
    
    # Filtrar registros con fechas válidas
    df = df[df['FECHA'].notna()]
    
    # Crear directorio de salida si no existe
    output_dir = os.path.join(os.path.dirname(input_file), 'resumenes_automaticos')
    os.makedirs(output_dir, exist_ok=True)
    
    # Procesar por año y mes
    for year in df['FECHA'].dt.year.unique():
        year_dir = os.path.join(output_dir, str(year))
        os.makedirs(year_dir, exist_ok=True)
        
        for month in range(1, 13):
            # Filtrar datos del mes
            month_data = df[
                (df['FECHA'].dt.year == year) & 
                (df['FECHA'].dt.month == month)
            ]
            
            if len(month_data) > 0:
                # Procesar datos mensuales
                monthly_summary = process_monthly_data(month_data)
                
                if not monthly_summary.empty:
                    # Generar nombre del archivo
                    month_name = datetime(year, month, 1).strftime('%B').lower()
                    output_file = os.path.join(year_dir, f'resumen_{month_name}_{year}.xlsx')
                    
                    # Crear archivo Excel con formato
                    workbook = xlsxwriter.Workbook(output_file)
                    worksheet = workbook.add_worksheet()
                    
                    # Definir formatos
                    header_format = workbook.add_format({
                        'bold': True,
                        'align': 'center',
                        'valign': 'vcenter',
                        'border': 1,
                        'bg_color': '#D8E4BC'
                    })
                    
                    cell_format = workbook.add_format({
                        'align': 'center',
                        'valign': 'vcenter',
                        'border': 1
                    })
                    
                    percent_format = workbook.add_format({
                        'align': 'center',
                        'valign': 'vcenter',
                        'border': 1,
                        'num_format': '0.00%'
                    })
                    
                    # Escribir encabezados
                    headers = [
                        'PLACA',
                        'TOTAL INSPECCIONES',
                        'DÍAS CON INSPECCIÓN',
                        'CONDUCTOR PRINCIPAL',
                        'PORCENTAJE CUMPLIMIENTO',
                        'DÍAS TOTALES'
                    ]
                    
                    for col, header in enumerate(headers):
                        worksheet.write(0, col, header, header_format)
                        worksheet.set_column(col, col, 20)
                    
                    # Escribir datos
                    for row, data in enumerate(monthly_summary.itertuples(), start=1):
                        worksheet.write(row, 0, data.PLACA, cell_format)
                        worksheet.write(row, 1, data.TOTAL_INSPECCIONES, cell_format)
                        worksheet.write(row, 2, data.DIAS_CON_INSPECCION, cell_format)
                        worksheet.write(row, 3, data.CONDUCTOR_PRINCIPAL, cell_format)
                        worksheet.write(row, 4, data.PORCENTAJE_CUMPLIMIENTO / 100, percent_format)
                        worksheet.write(row, 5, data.DIAS_TOTALES, cell_format)
                    
                    workbook.close()
                    print(f"Resumen generado: {output_file}")

# Ejecutar el generador de resúmenes
if __name__ == '__main__':
    input_file = 'HQ-FO-40 INSPECCIÓN DIARIA DE VEHÍCULO LIVIANO. 08-09-2025 3-58 p.m (1).xlsx'
    generate_monthly_summaries(input_file)
    print("Proceso completado exitosamente.")