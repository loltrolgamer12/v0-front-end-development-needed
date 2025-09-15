import pandas as pd
import sys
import os
from pathlib import Path

# Agregar el directorio backend/src al path para poder importar los módulos
backend_src = Path(__file__).parent.parent / 'src'
sys.path.append(str(backend_src))

from data_processor import process_inspection_data
from trend_analyzer import analyze_trends

def load_summary_file(file_path):
    """Carga el archivo de resumen manual."""
    df = pd.read_excel(file_path)
    # Asegurar que tenemos las columnas necesarias
    required_columns = ['PLACA', 'CUSTODIO', '# DE REPORTES AL MES DE AGOSTO', 'PORCENTAJE DE CUMPLIMIENTO %']
    for col in required_columns:
        if col not in df.columns:
            raise ValueError(f"Columna requerida '{col}' no encontrada en el archivo de resumen")
    return df

def load_and_process_inspections(file_path):
    """Carga y procesa el archivo de inspecciones diarias."""
    return process_inspection_data(file_path)

def compare_results(inspection_results, summary_data):
    """Compara los resultados del sistema con el resumen manual."""
    differences = []
    total_vehicles = len(summary_data)
    matching_vehicles = 0
    compliance_differences = []
    
    print(f"\nEncontrados {total_vehicles} vehículos en el resumen manual")
    print(f"Encontrados {len(inspection_results)} vehículos en el sistema\n")

    for _, summary_row in summary_data.iterrows():
        placa = summary_row['PLACA']
        summary_compliance = summary_row['PORCENTAJE DE CUMPLIMIENTO %']
        summary_reports = summary_row['# DE REPORTES AL MES DE AGOSTO']
        
        # Buscar el vehículo en los resultados del sistema
        system_vehicle = inspection_results.get(placa, {})
        if system_vehicle:
            system_compliance = system_vehicle.get('cumplimiento', 0)
            system_reports = system_vehicle.get('total_reportes', 0)
            
            # Calcular diferencias
            compliance_diff = abs(system_compliance - summary_compliance)
            reports_diff = abs(system_reports - summary_reports)
            
            if compliance_diff > 1:  # Permitir 1% de diferencia por redondeo
                differences.append({
                    'placa': placa,
                    'custodio': summary_row['CUSTODIO'],
                    'sistema_cumplimiento': system_compliance,
                    'manual_cumplimiento': summary_compliance,
                    'diferencia_cumplimiento': compliance_diff,
                    'sistema_reportes': system_reports,
                    'manual_reportes': summary_reports,
                    'diferencia_reportes': reports_diff
                })
            else:
                matching_vehicles += 1
            
            compliance_differences.append(compliance_diff)

    # Calcular estadísticas
    accuracy = (matching_vehicles / total_vehicles) * 100 if total_vehicles > 0 else 0
    avg_difference = sum(compliance_differences) / len(compliance_differences) if compliance_differences else 0
    
    return {
        'total_vehicles': total_vehicles,
        'matching_vehicles': matching_vehicles,
        'accuracy': accuracy,
        'average_difference': avg_difference,
        'differences': differences
    }

def print_validation_report(validation_results):
    """Imprime un reporte detallado de la validación."""
    print("\nREPORTE DE VALIDACIÓN DEL SISTEMA")
    print("-" * 50)
    print(f"\nESTADÍSTICAS GENERALES:")
    print(f"Total de vehículos analizados: {validation_results['total_vehicles']}")
    print(f"Vehículos con coincidencia exacta: {validation_results['matching_vehicles']}")
    print(f"Precisión del sistema: {validation_results['accuracy']:.2f}%")
    print(f"Diferencia promedio en cumplimiento: {validation_results['average_difference']:.2f}%")

    if validation_results['differences']:
        print("\nDISCREPANCIAS ENCONTRADAS:")
        print("-" * 50)
        for diff in validation_results['differences']:
            print(f"\nPlaca: {diff['placa']}")
            print(f"Custodio: {diff['custodio']}")
            print(f"Cumplimiento - Sistema: {diff['sistema_cumplimiento']:.2f}%")
            print(f"Cumplimiento - Manual: {diff['manual_cumplimiento']:.2f}%")
            print(f"Diferencia en cumplimiento: {diff['diferencia_cumplimiento']:.2f}%")
            print(f"Reportes - Sistema: {diff['sistema_reportes']}")
            print(f"Reportes - Manual: {diff['manual_reportes']}")
            print(f"Diferencia en reportes: {diff['diferencia_reportes']}")
    else:
        print("\n¡No se encontraron discrepancias significativas!")

def main():
    # Rutas de los archivos
    inspections_file = r"C:\Users\juan\Desktop\papa exel\analisis-exel\datos_prueba\HQ-FO-40 INSPECCIÓN DIARIA DE VEHÍCULO LIVIANO. 08-09-2025 3-58 p.m (1).xlsx"
    summary_file = r"C:\Users\juan\Desktop\papa exel\analisis-exel\datos_prueba\Copia de Copia de Copia de CONSOLIDADO INSPECCIONES PREOPERACIONALES DE VEHICULOS AGOSTO - MANTENIMIENTO - Copy.xlsx"

    print("1. Cargando archivo de inspecciones diarias...")
    inspection_results = load_and_process_inspections(inspections_file)
    print("✓ Archivo de inspecciones procesado")

    print("\n2. Cargando archivo de resumen manual...")
    summary_data = load_summary_file(summary_file)
    print("✓ Archivo de resumen cargado")

    print("\n3. Comparando resultados...")
    validation_results = compare_results(inspection_results, summary_data)
    
    print("\n4. Generando reporte de validación...")
    print_validation_report(validation_results)

if __name__ == "__main__":
    main()