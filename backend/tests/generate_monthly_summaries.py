"""
Script para generar resúmenes mensuales automáticos de inspecciones vehiculares.
"""
import pandas as pd
import numpy as np
from pathlib import Path
import sys
from datetime import datetime
import calendar
from tabulate import tabulate

def normalize_plate(plate: str) -> str:
    """Normaliza el formato de una placa vehicular."""
    if not isinstance(plate, str):
        return ''
    
    # 1. Convertir a mayúsculas y eliminar espacios extras
    plate = plate.upper().strip()
    
    # 2. Eliminar caracteres especiales y símbolos
    special_chars = '.,:;/\\+=_-|!@#$%^&*()'
    for char in special_chars:
        plate = plate.replace(char, '')
    
    # 3. Convertir múltiples espacios en uno solo
    plate = ' '.join(plate.split())
    
    # 4. Eliminar "KM" y números largos al final (kilometraje)
    if 'KM' in plate:
        plate = plate.split('KM')[0].strip()
    
    # 5. Si hay números largos al final (más de 4 dígitos), eliminarlos
    parts = plate.split()
    if parts and len(parts[-1]) > 4 and parts[-1].isdigit():
        parts.pop()
        plate = ' '.join(parts)
    
    return plate.strip()

def is_valid_plate(plate: str) -> bool:
    """Verifica si una cadena parece ser una placa válida."""
    if not isinstance(plate, str) or len(plate) == 0:
        return False
        
    # Normalizar la placa primero
    plate = normalize_plate(plate)
    
    # Criterios para una placa válida:
    # 1. Longitud entre 5 y 8 caracteres después de normalizar
    if not (5 <= len(plate) <= 8):
        return False
        
    # 2. Debe tener 3 letras al inicio
    if not (len(plate) >= 3 and plate[:3].isalpha()):
        return False
        
    # 3. No debe contener palabras comunes en nombres
    nombre_keywords = [
        'NOMBRE', 'CONDUCTOR', 'QUIEN', 'REALIZA', 'INSPECCIÓN', 'INSPECTOR',
        'SEÑOR', 'INGENIERO', 'ING', 'SR', 'DON', 'DOÑA', 'DOCTOR', 'DR',
        'LUIS', 'JUAN', 'PEDRO', 'JOSE', 'MARIA', 'CARLOS', 'JORGE', 'CESAR',
        'OSCAR', 'EDWIN', 'FABIÁN', 'EDUARDO', 'HECTOR', 'HERNAN', 'AUGUSTO',
        'RIVERA', 'GUZMAN', 'RODRIGUEZ', 'MARTINEZ', 'GARCIA', 'LOPEZ',
        'GONZALEZ', 'HERNANDEZ', 'SANCHEZ', 'RAMIREZ', 'TORRES',
        'INSTRUMENTISTA', 'TÉCNICO', 'PRUEBA', 'YAGUARA'
    ]
    
    if any(keyword in plate for keyword in nombre_keywords):
        return False
    
    # 4. Debe contener al menos un número
    if not any(c.isdigit() for c in plate):
        return False
    
    # 5. Solo debe contener letras, números y espacios
    valid_chars = set('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ')
    if not all(c in valid_chars for c in plate):
        return False
        
    # 6. El formato general debe ser: 3 letras + números (con o sin espacio)
    parts = plate.split()
    if len(parts) > 2:  # No más de dos partes (letras y números)
        return False
        
    return True

def load_inspection_data(file_path: str) -> pd.DataFrame:
    """Carga y preprocesa los datos de inspección."""
    print(f"\nCargando datos de inspección desde: {Path(file_path).name}")
    df = pd.read_excel(file_path)
    
    # Limpiar nombres de columnas
    df.columns = [col.strip() for col in df.columns]
    
    # Convertir marca temporal a datetime
    df['fecha'] = pd.to_datetime(df['Marca temporal'])
    
    # Limpiar y normalizar nombres y placas
    df['NOMBRE DE QUIEN REALIZA LA INSPECCIÓN'] = df['NOMBRE DE QUIEN REALIZA LA INSPECCIÓN'].fillna('').str.strip().str.upper()
    df['PLACA DEL VEHICULO'] = df['PLACA DEL VEHICULO'].fillna('').str.strip().str.upper()
    
    # Validar y filtrar placas
    mascara_placas_validas = df['PLACA DEL VEHICULO'].apply(is_valid_plate)
    df_filtrado = df[mascara_placas_validas].copy()
    
    # Registrar placas inválidas
    placas_invalidas = df[~mascara_placas_validas]['PLACA DEL VEHICULO'].unique()
    if len(placas_invalidas) > 0:
        print("\nPlacas inválidas encontradas y filtradas:")
        for placa in placas_invalidas:
            if isinstance(placa, str) and len(placa.strip()) > 0:
                print(f"  - {placa}")
    
    return df_filtrado
    
    return df

def get_month_summary(df: pd.DataFrame, year: int, month: int) -> dict:
    """Genera un resumen detallado para un mes específico."""
    # Filtrar datos del mes
    month_data = df[
        (df['fecha'].dt.year == year) & 
        (df['fecha'].dt.month == month)
    ].copy()
    
    # Calcular días hábiles del mes
    _, last_day = calendar.monthrange(year, month)
    total_dias = pd.date_range(start=f"{year}-{month:02d}-01", 
                             end=f"{year}-{month:02d}-{last_day}")
    dias_habiles = len([d for d in total_dias if d.weekday() < 5])
    
    # Análisis por vehículo
    vehiculos_stats = []
    for placa in month_data['PLACA DEL VEHICULO'].unique():
        vehiculo_data = month_data[month_data['PLACA DEL VEHICULO'] == placa]
        inspecciones_por_conductor = vehiculo_data['NOMBRE DE QUIEN REALIZA LA INSPECCIÓN'].value_counts()
        dias_inspeccion = vehiculo_data['fecha'].dt.date.nunique()
        
        # Calcular porcentaje de cumplimiento
        porcentaje_cumplimiento = (dias_inspeccion / dias_habiles) * 100
        
        # Obtener conductor principal y secundarios
        conductores = inspecciones_por_conductor.to_dict()
        conductor_principal = max(conductores.items(), key=lambda x: x[1]) if conductores else ('SIN CONDUCTOR', 0)
        otros_conductores = {k: v for k, v in conductores.items() if k != conductor_principal[0]}
        
        vehiculos_stats.append({
            'PLACA': placa,
            'CUSTODIO': conductor_principal[0],
            'INSPECCIONES_CUSTODIO': conductor_principal[1],
            'OTROS_CONDUCTORES': len(otros_conductores),
            'TOTAL_INSPECCIONES': len(vehiculo_data),
            'DIAS_CON_INSPECCION': dias_inspeccion,
            'PORCENTAJE_CUMPLIMIENTO': porcentaje_cumplimiento,
            'OBSERVACIONES': f"{len(otros_conductores)} conductores adicionales" if otros_conductores else "Sin conductores adicionales"
        })
    
    # Estadísticas generales
    stats = {
        'total_vehiculos': len(vehiculos_stats),
        'total_inspecciones': len(month_data),
        'dias_habiles': dias_habiles,
        'conductores_unicos': month_data['NOMBRE DE QUIEN REALIZA LA INSPECCIÓN'].nunique(),
        'promedio_inspecciones_por_vehiculo': len(month_data) / len(vehiculos_stats) if vehiculos_stats else 0,
        'vehiculos': pd.DataFrame(vehiculos_stats)
    }
    
    return stats

def generate_excel_summary(stats: dict, output_path: Path, year: int, month: int):
    """Genera un archivo Excel con el resumen mensual."""
    # Crear DataFrame con estadísticas generales
    general_stats = pd.DataFrame([{
        'Año': year,
        'Mes': calendar.month_name[month],
        'Total Vehículos': stats['total_vehiculos'],
        'Total Inspecciones': stats['total_inspecciones'],
        'Días Hábiles': stats['dias_habiles'],
        'Conductores Únicos': stats['conductores_unicos'],
        'Promedio Inspecciones por Vehículo': stats['promedio_inspecciones_por_vehiculo']
    }])
    
    # Ordenar vehículos por porcentaje de cumplimiento
    vehiculos_df = stats['vehiculos'].sort_values('PORCENTAJE_CUMPLIMIENTO', ascending=False)
    
    # Guardar en Excel con formato
    with pd.ExcelWriter(output_path, engine='xlsxwriter') as writer:
        # Hoja de estadísticas generales
        general_stats.to_excel(writer, sheet_name='Estadísticas Generales', index=False)
        workbook = writer.book
        worksheet = writer.sheets['Estadísticas Generales']
        
        # Formato para estadísticas generales
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#4F81BD',
            'font_color': 'white',
            'border': 1
        })
        for col_num, value in enumerate(general_stats.columns.values):
            worksheet.write(0, col_num, value, header_format)
        
        # Hoja de detalles por vehículo
        vehiculos_df.to_excel(writer, sheet_name='Detalles por Vehículo', index=False)
        worksheet = writer.sheets['Detalles por Vehículo']
        
        # Formato para detalles por vehículo
        for col_num, value in enumerate(vehiculos_df.columns.values):
            worksheet.write(0, col_num, value, header_format)
        
        # Ajustar anchos de columna
        for worksheet in writer.sheets.values():
            worksheet.autofit()

def main():
    # Rutas
    inspections_file = r"C:\Users\juan\Desktop\papa exel\analisis-exel\datos_prueba\HQ-FO-40 INSPECCIÓN DIARIA DE VEHÍCULO LIVIANO. 08-09-2025 3-58 p.m (1).xlsx"
    base_output_dir = Path(r"C:\Users\juan\Desktop\papa exel\analisis-exel\resumenes_automaticos")
    
    # Cargar datos
    df = load_inspection_data(inspections_file)
    
    # Procesar por año y mes
    for year in df['fecha'].dt.year.unique():
        year_dir = base_output_dir / str(year)
        year_dir.mkdir(exist_ok=True)
        print(f"\nProcesando año {year}...")
        
        for month in df[df['fecha'].dt.year == year]['fecha'].dt.month.unique():
            print(f"\nGenerando resumen para {calendar.month_name[month]} {year}")
            
            # Generar resumen mensual
            monthly_stats = get_month_summary(df, year, month)
            
            # Generar nombre de archivo
            output_file = year_dir / f"resumen_{year}_{month:02d}_{calendar.month_name[month]}.xlsx"
            
            # Guardar resumen
            generate_excel_summary(monthly_stats, output_file, year, month)
            print(f"Resumen guardado en: {output_file}")
            
            # Imprimir estadísticas básicas
            print(f"\nEstadísticas básicas para {calendar.month_name[month]} {year}:")
            print(f"Total vehículos: {monthly_stats['total_vehiculos']}")
            print(f"Total inspecciones: {monthly_stats['total_inspecciones']}")
            print(f"Conductores únicos: {monthly_stats['conductores_unicos']}")
            print(f"Promedio inspecciones por vehículo: {monthly_stats['promedio_inspecciones_por_vehiculo']:.2f}")

if __name__ == "__main__":
    main()