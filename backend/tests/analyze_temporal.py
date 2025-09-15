"""
Script de análisis temporal y validación aleatoria de inspecciones vehiculares.
"""
import pandas as pd
import numpy as np
from pathlib import Path
import sys
from datetime import datetime
import random
from tabulate import tabulate

# Agregar el directorio backend/src al path
backend_src = Path(__file__).parent.parent / 'src'
sys.path.append(str(backend_src))

from name_normalizer import names_match

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

def analyze_by_month(df: pd.DataFrame) -> pd.DataFrame:
    """Analiza los datos agrupados por mes y año."""
    # Extraer mes y año
    df['año'] = df['fecha'].dt.year
    df['mes'] = df['fecha'].dt.month
    
    # Agrupar por mes y calcular estadísticas
    monthly_stats = df.groupby(['año', 'mes']).agg({
        'PLACA DEL VEHICULO': ['nunique', 'count'],
        'NOMBRE DE QUIEN REALIZA LA INSPECCIÓN': 'nunique'
    }).reset_index()
    
    monthly_stats.columns = ['año', 'mes', 'vehiculos_unicos', 'total_inspecciones', 'conductores_unicos']
    monthly_stats['promedio_inspecciones_por_vehiculo'] = monthly_stats['total_inspecciones'] / monthly_stats['vehiculos_unicos']
    
    return monthly_stats

def get_month_details(df: pd.DataFrame, year: int, month: int) -> dict:
    """Obtiene detalles detallados de un mes específico."""
    month_data = df[(df['fecha'].dt.year == year) & (df['fecha'].dt.month == month)].copy()
    
    # Calcular días hábiles (excluyendo fines de semana)
    dias_unicos = month_data['fecha'].dt.date.nunique()
    dias_habiles = len([d for d in month_data['fecha'].dt.date.unique() 
                       if d.weekday() < 5])  # 0-4 son días de semana
    
    # Análisis por vehículo
    vehiculos_stats = []
    for placa in month_data['PLACA DEL VEHICULO'].unique():
        vehiculo_data = month_data[month_data['PLACA DEL VEHICULO'] == placa]
        inspecciones_por_conductor = vehiculo_data['NOMBRE DE QUIEN REALIZA LA INSPECCIÓN'].value_counts()
        
        # Verificar si hay datos para el vehículo
        if len(inspecciones_por_conductor) > 0:
            vehiculos_stats.append({
                'placa': placa,
                'total_inspecciones': len(vehiculo_data),
                'dias_con_inspeccion': vehiculo_data['fecha'].dt.date.nunique(),
                'conductor_principal': inspecciones_por_conductor.index[0],
                'inspecciones_conductor_principal': inspecciones_por_conductor.iloc[0],
                'otros_conductores': len(inspecciones_por_conductor) - 1
            })
        else:
            vehiculos_stats.append({
                'placa': placa,
                'total_inspecciones': 0,
                'dias_con_inspeccion': 0,
                'conductor_principal': 'SIN CONDUCTOR',
                'inspecciones_conductor_principal': 0,
                'otros_conductores': 0
            })
    
    return {
        'dias_totales': dias_unicos,
        'dias_habiles': dias_habiles,
        'vehiculos': pd.DataFrame(vehiculos_stats)
    }

def validate_against_summary(inspection_details: dict, summary_df: pd.DataFrame, 
                           sample_size: int = 10) -> pd.DataFrame:
    """Valida una muestra aleatoria de vehículos contra el resumen manual."""
    # Seleccionar muestra aleatoria de vehículos
    vehiculos_muestra = random.sample(
        list(inspection_details['vehiculos']['placa']),
        min(sample_size, len(inspection_details['vehiculos']))
    )
    
    validations = []
    for placa in vehiculos_muestra:
        insp_data = inspection_details['vehiculos'][
            inspection_details['vehiculos']['placa'] == placa
        ].iloc[0]
        
        summary_data = summary_df[summary_df['PLACA'] == placa]
        if not summary_data.empty:
            summary_data = summary_data.iloc[0]
            
            # Comparar conductores
            conductor_match = names_match(
                insp_data['conductor_principal'],
                summary_data['CUSTODIO']
            )
            
            # Calcular porcentaje de cumplimiento
            cumplimiento_sistema = (insp_data['dias_con_inspeccion'] / inspection_details['dias_habiles']) * 100
            
            validations.append({
                'placa': placa,
                'conductor_sistema': insp_data['conductor_principal'],
                'conductor_resumen': summary_data['CUSTODIO'],
                'conductores_coinciden': conductor_match,
                'dias_inspeccion': insp_data['dias_con_inspeccion'],
                'total_inspecciones': insp_data['total_inspecciones'],
                'cumplimiento_sistema': cumplimiento_sistema,
                'cumplimiento_resumen': summary_data['PORCENTAJE DE CUMPLIMIENTO %'],
                'diferencia_cumplimiento': abs(cumplimiento_sistema - summary_data['PORCENTAJE DE CUMPLIMIENTO %'])
            })
    
    return pd.DataFrame(validations)

def print_monthly_report(stats: pd.DataFrame):
    """Imprime un reporte mensual formateado."""
    print("\nESTADÍSTICAS MENSUALES")
    print("-" * 80)
    print(tabulate(stats, headers='keys', tablefmt='grid', floatfmt=".2f"))

def print_validation_report(validations: pd.DataFrame):
    """Imprime un reporte de validación formateado."""
    print("\nVALIDACIÓN CONTRA RESUMEN MANUAL")
    print("-" * 80)
    
    coincidencias = sum(validations['conductores_coinciden'])
    total = len(validations)
    
    print(f"\nResumen de validación:")
    print(f"Total de vehículos validados: {total}")
    print(f"Coincidencias de conductor: {coincidencias} ({(coincidencias/total*100):.1f}%)")
    print(f"Diferencia promedio en cumplimiento: {validations['diferencia_cumplimiento'].mean():.2f}%")
    
    print("\nDetalle por vehículo:")
    for _, row in validations.iterrows():
        print(f"\nPlaca: {row['placa']}")
        print(f"Conductor en sistema: {row['conductor_sistema']}")
        print(f"Conductor en resumen: {row['conductor_resumen']}")
        print(f"Coincidencia: {'✓' if row['conductores_coinciden'] else '✗'}")
        print(f"Días con inspección: {row['dias_inspeccion']}")
        print(f"Total inspecciones: {row['total_inspecciones']}")
        print(f"Cumplimiento sistema: {row['cumplimiento_sistema']:.1f}%")
        print(f"Cumplimiento resumen: {row['cumplimiento_resumen']:.1f}%")
        print(f"Diferencia: {row['diferencia_cumplimiento']:.1f}%")

def main():
    # Rutas de los archivos
    inspections_file = r"C:\Users\juan\Desktop\papa exel\analisis-exel\datos_prueba\HQ-FO-40 INSPECCIÓN DIARIA DE VEHÍCULO LIVIANO. 08-09-2025 3-58 p.m (1).xlsx"
    summary_file = r"C:\Users\juan\Desktop\papa exel\analisis-exel\datos_prueba\Copia de Copia de Copia de CONSOLIDADO INSPECCIONES PREOPERACIONALES DE VEHICULOS AGOSTO - MANTENIMIENTO - Copy.xlsx"
    
    # Cargar datos
    inspections_df = load_inspection_data(inspections_file)
    summary_df = pd.read_excel(summary_file)
    
    # Análisis mensual
    print("\nAnalizando datos por mes...")
    monthly_stats = analyze_by_month(inspections_df)
    print_monthly_report(monthly_stats)
    
    # Analizar agosto 2025 en detalle
    print("\nAnalizando agosto 2025 en detalle...")
    agosto_2025 = get_month_details(inspections_df, 2025, 8)
    
    # Validación contra resumen
    print("\nRealizando validación aleatoria contra resumen manual...")
    validations = validate_against_summary(agosto_2025, summary_df)
    print_validation_report(validations)
    
    # Guardar resultados
    output_file = Path(__file__).parent / 'analisis_temporal.xlsx'
    with pd.ExcelWriter(output_file) as writer:
        monthly_stats.to_excel(writer, sheet_name='Estadisticas_Mensuales', index=False)
        agosto_2025['vehiculos'].to_excel(writer, sheet_name='Detalle_Agosto_2025', index=False)
        validations.to_excel(writer, sheet_name='Validacion_Aleatoria', index=False)
    
    print(f"\nResultados guardados en: {output_file}")

if __name__ == "__main__":
    main()