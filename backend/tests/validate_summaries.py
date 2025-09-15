"""
Script para validar la precisión de los resúmenes mensuales contra los datos originales.
"""
import pandas as pd
import numpy as np
from pathlib import Path
import sys
import random
from datetime import datetime
import calendar
from tabulate import tabulate
import json

def load_inspection_data(file_path: str) -> pd.DataFrame:
    """Carga y preprocesa los datos de inspección."""
    print(f"\nCargando datos de inspección desde: {Path(file_path).name}")
    df = pd.read_excel(file_path)
    
    # Limpiar nombres de columnas
    df.columns = [col.strip() for col in df.columns]
    
    # Convertir marca temporal a datetime
    df['fecha'] = pd.to_datetime(df['Marca temporal'])
    
    # Normalizar nombres y placas
    df['NOMBRE DE QUIEN REALIZA LA INSPECCIÓN'] = df['NOMBRE DE QUIEN REALIZA LA INSPECCIÓN'].str.strip().str.upper()
    df['PLACA DEL VEHICULO'] = df['PLACA DEL VEHICULO'].str.strip().str.upper()
    
    return df

def load_monthly_summary(year: int, month: int) -> pd.DataFrame:
    """Carga el resumen mensual generado anteriormente."""
    base_path = Path(r"C:\Users\juan\Desktop\papa exel\analisis-exel\resumenes_automaticos")
    file_name = f"resumen_{year}_{month:02d}_{calendar.month_name[month]}.xlsx"
    file_path = base_path / str(year) / file_name
    
    # Cargar ambas hojas del Excel
    stats = pd.read_excel(file_path, sheet_name='Estadísticas Generales')
    details = pd.read_excel(file_path, sheet_name='Detalles por Vehículo')
    
    return {'stats': stats, 'details': details}

def validate_vehicle_data(inspections_df: pd.DataFrame, year: int, month: int, 
                        placa: str, summary_data: dict) -> dict:
    """Valida los datos de un vehículo específico contra el resumen."""
    # Filtrar datos del vehículo para el mes específico
    vehicle_data = inspections_df[
        (inspections_df['PLACA DEL VEHICULO'] == placa) &
        (inspections_df['fecha'].dt.year == year) &
        (inspections_df['fecha'].dt.month == month)
    ]
    
    # Obtener datos del resumen
    summary_vehicle = summary_data['details'][
        summary_data['details']['PLACA'] == placa
    ].iloc[0] if len(summary_data['details'][summary_data['details']['PLACA'] == placa]) > 0 else None
    
    if summary_vehicle is None:
        return {
            'placa': placa,
            'coincide': False,
            'errores': ['Vehículo no encontrado en el resumen']
        }
    
    # Validaciones
    errores = []
    inspecciones_reales = len(vehicle_data)
    dias_inspeccion_reales = vehicle_data['fecha'].dt.date.nunique()
    
    if inspecciones_reales != summary_vehicle['TOTAL_INSPECCIONES']:
        errores.append(f"Total inspecciones no coincide: Real={inspecciones_reales}, Resumen={summary_vehicle['TOTAL_INSPECCIONES']}")
    
    if dias_inspeccion_reales != summary_vehicle['DIAS_CON_INSPECCION']:
        errores.append(f"Días con inspección no coinciden: Real={dias_inspeccion_reales}, Resumen={summary_vehicle['DIAS_CON_INSPECCION']}")
    
    # Validar conductor principal
    if len(vehicle_data) > 0:
        conductor_real = vehicle_data['NOMBRE DE QUIEN REALIZA LA INSPECCIÓN'].value_counts().index[0]
        if conductor_real != summary_vehicle['CUSTODIO']:
            errores.append(f"Conductor principal no coincide: Real={conductor_real}, Resumen={summary_vehicle['CUSTODIO']}")
    
    # Calcular porcentaje de cumplimiento real
    _, ultimo_dia = calendar.monthrange(year, month)
    dias_habiles = len([d for d in pd.date_range(start=f"{year}-{month:02d}-01", 
                                               end=f"{year}-{month:02d}-{ultimo_dia}")
                       if d.weekday() < 5])
    
    cumplimiento_real = (dias_inspeccion_reales / dias_habiles) * 100
    if abs(cumplimiento_real - summary_vehicle['PORCENTAJE_CUMPLIMIENTO']) > 0.01:  # 0.01% de tolerancia
        errores.append(f"Porcentaje de cumplimiento no coincide: Real={cumplimiento_real:.2f}%, Resumen={summary_vehicle['PORCENTAJE_CUMPLIMIENTO']:.2f}%")
    
    return {
        'placa': placa,
        'coincide': len(errores) == 0,
        'errores': errores,
        'cumplimiento_real': cumplimiento_real,
        'cumplimiento_resumen': summary_vehicle['PORCENTAJE_CUMPLIMIENTO']
    }

def validate_month(inspections_df: pd.DataFrame, year: int, month: int, 
                  sample_size: int = None) -> dict:
    """Valida un mes completo de datos."""
    print(f"\nValidando {calendar.month_name[month]} {year}...")
    
    # Cargar resumen mensual
    try:
        summary_data = load_monthly_summary(year, month)
    except FileNotFoundError:
        return {
            'mes': f"{calendar.month_name[month]} {year}",
            'error': 'Resumen mensual no encontrado',
            'coincide': False
        }
    
    # Obtener todas las placas del mes
    placas_mes = inspections_df[
        (inspections_df['fecha'].dt.year == year) &
        (inspections_df['fecha'].dt.month == month)
    ]['PLACA DEL VEHICULO'].unique()
    
    # Si se especifica sample_size, tomar una muestra aleatoria
    if sample_size and sample_size < len(placas_mes):
        placas_validar = random.sample(list(placas_mes), sample_size)
    else:
        placas_validar = placas_mes
    
    # Validar cada vehículo
    resultados = []
    for placa in placas_validar:
        resultado = validate_vehicle_data(inspections_df, year, month, placa, summary_data)
        resultados.append(resultado)
    
    # Calcular estadísticas
    total_validados = len(resultados)
    coinciden = sum(1 for r in resultados if r['coincide'])
    porcentaje_precision = (coinciden / total_validados) * 100 if total_validados > 0 else 0
    
    return {
        'mes': f"{calendar.month_name[month]} {year}",
        'total_validados': total_validados,
        'coinciden': coinciden,
        'precision': porcentaje_precision,
        'resultados_detallados': resultados
    }

def print_validation_results(results: dict):
    """Imprime los resultados de la validación de forma legible."""
    print(f"\nResultados de validación para {results['mes']}:")
    print(f"Total vehículos validados: {results['total_validados']}")
    print(f"Vehículos que coinciden: {results['coinciden']}")
    print(f"Precisión: {results['precision']:.2f}%")
    
    if results['precision'] < 100:
        print("\nDetalles de discrepancias encontradas:")
        for resultado in results['resultados_detallados']:
            if not resultado['coincide']:
                print(f"\nPlaca: {resultado['placa']}")
                for error in resultado['errores']:
                    print(f"  - {error}")

def guardar_resultados(resultados: list, output_file: Path):
    """Guarda los resultados de la validación en un archivo Excel."""
    # Crear DataFrame con resumen general
    resumen = []
    for r in resultados:
        resumen.append({
            'Mes': r['mes'],
            'Total Validados': r['total_validados'],
            'Coinciden': r['coinciden'],
            'Precisión (%)': r['precision']
        })
    
    # Crear DataFrame con detalles de errores
    detalles = []
    for r in resultados:
        for vehiculo in r['resultados_detallados']:
            if not vehiculo['coincide']:
                detalles.append({
                    'Mes': r['mes'],
                    'Placa': vehiculo['placa'],
                    'Errores': '; '.join(vehiculo['errores'])
                })
    
    # Guardar en Excel
    with pd.ExcelWriter(output_file) as writer:
        pd.DataFrame(resumen).to_excel(writer, sheet_name='Resumen', index=False)
        pd.DataFrame(detalles).to_excel(writer, sheet_name='Detalles Errores', index=False)

def main():
    # Archivo de inspecciones
    inspections_file = r"C:\Users\juan\Desktop\papa exel\analisis-exel\datos_prueba\HQ-FO-40 INSPECCIÓN DIARIA DE VEHÍCULO LIVIANO. 08-09-2025 3-58 p.m (1).xlsx"
    
    # Cargar datos
    inspections_df = load_inspection_data(inspections_file)
    
    # Lista para almacenar resultados
    todos_resultados = []
    
    # Validar cada mes
    for year in sorted(inspections_df['fecha'].dt.year.unique()):
        for month in sorted(inspections_df[
            inspections_df['fecha'].dt.year == year
        ]['fecha'].dt.month.unique()):
            # Validar con una muestra aleatoria grande para meses anteriores
            sample_size = 50 if (year < 2025 or (year == 2025 and month < 8)) else None
            resultados = validate_month(inspections_df, year, month, sample_size)
            todos_resultados.append(resultados)
            print_validation_results(resultados)
    
    # Guardar resultados
    output_file = Path(__file__).parent / 'resultados_validacion.xlsx'
    guardar_resultados(todos_resultados, output_file)
    print(f"\nResultados guardados en: {output_file}")
    
    # Verificar si se alcanzó 100% de precisión
    precision_total = sum(r['precision'] for r in todos_resultados) / len(todos_resultados)
    print(f"\nPrecisión promedio total: {precision_total:.2f}%")
    
    if precision_total < 100:
        print("\n⚠️ ATENCIÓN: No se alcanzó el 100% de precisión requerida.")
        print("Se recomienda revisar las discrepancias y ajustar el proceso de generación de resúmenes.")
    else:
        print("\n✅ ÉXITO: Se alcanzó el 100% de precisión requerida en todos los meses.")

if __name__ == "__main__":
    main()