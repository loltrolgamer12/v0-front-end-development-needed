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
    # Limpiar y normalizar datos
    df['CUSTODIO'] = df['CUSTODIO'].fillna('').str.strip().str.upper()
    df['PLACA'] = df['PLACA'].str.strip().str.upper()
    return df

def load_and_process_inspections(file_path):
    """Carga y procesa el archivo de inspecciones diarias."""
    return process_inspection_data(file_path)

from name_normalizer import names_match

def analyze_conductor_match(placa, system_data, summary_data):
    """Analiza la concordancia entre conductores del sistema y el resumen."""
    system_vehicle = system_data.get(placa, {})
    summary_row = summary_data[summary_data['PLACA'] == placa].iloc[0]
    
    summary_custodio = summary_row['CUSTODIO']
    system_custodio = system_vehicle.get('custodio', '')
    inspecciones = system_vehicle.get('inspecciones_por_conductor', {})
    
    # Usar comparación flexible de nombres
    match = names_match(summary_custodio, system_custodio, strict=False)
    other_conductors = {k: v for k, v in inspecciones.items() if k != system_custodio}
    
    return {
        'coincide_conductor': match,
        'conductor_resumen': summary_custodio,
        'conductor_sistema': system_custodio,
        'otros_conductores': other_conductors,
        'total_inspecciones': sum(inspecciones.values()) if inspecciones else 0
    }

def compare_results(inspection_results, summary_data):
    """Compara los resultados del sistema con el resumen manual."""
    differences = []
    total_vehicles = len(summary_data)
    matching_vehicles = 0
    compliance_differences = []
    conductor_matches = 0
    
    print("\nANÁLISIS DE CONDUCTORES Y CUMPLIMIENTO")
    print("-" * 50)

    for _, summary_row in summary_data.iterrows():
        placa = summary_row['PLACA']
        summary_compliance = summary_row['PORCENTAJE DE CUMPLIMIENTO %']
        summary_reports = summary_row['# DE REPORTES AL MES DE AGOSTO']
        
        # Análisis del vehículo en el sistema
        system_vehicle = inspection_results.get(placa, {})
        if system_vehicle:
            system_compliance = system_vehicle.get('cumplimiento', 0)
            system_reports = system_vehicle.get('total_reportes', 0)
            
            # Analizar conductores
            conductor_analysis = analyze_conductor_match(placa, inspection_results, summary_data)
            if conductor_analysis['coincide_conductor']:
                conductor_matches += 1
            
            # Calcular diferencias
            compliance_diff = abs(system_compliance - summary_compliance)
            reports_diff = abs(system_reports - summary_reports)
            
            if compliance_diff > 1 or not conductor_analysis['coincide_conductor']:  # Permitir 1% de diferencia por redondeo
                differences.append({
                    'placa': placa,
                    'conductor_analysis': conductor_analysis,
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
    conductor_accuracy = (conductor_matches / total_vehicles) * 100 if total_vehicles > 0 else 0
    avg_difference = sum(compliance_differences) / len(compliance_differences) if compliance_differences else 0
    
    return {
        'total_vehicles': total_vehicles,
        'matching_vehicles': matching_vehicles,
        'conductor_matches': conductor_matches,
        'accuracy': accuracy,
        'conductor_accuracy': conductor_accuracy,
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
    print(f"Coincidencia de conductores: {validation_results['conductor_matches']} ({validation_results['conductor_accuracy']:.2f}%)")
    print(f"Precisión del sistema: {validation_results['accuracy']:.2f}%")
    print(f"Diferencia promedio en cumplimiento: {validation_results['average_difference']:.2f}%")

    if validation_results['differences']:
        print("\nDISCREPANCIAS ENCONTRADAS:")
        print("-" * 50)
        for diff in validation_results['differences']:
            print(f"\nPlaca: {diff['placa']}")
            
            # Información de conductores
            conductor_analysis = diff['conductor_analysis']
            print(f"Conductor en resumen: {conductor_analysis['conductor_resumen']}")
            print(f"Conductor en sistema: {conductor_analysis['conductor_sistema']}")
            if not conductor_analysis['coincide_conductor']:
                print("⚠ DISCREPANCIA EN CONDUCTOR")
            if conductor_analysis['otros_conductores']:
                print("Otros conductores que realizaron inspecciones:")
                for conductor, insp in conductor_analysis['otros_conductores'].items():
                    print(f"  - {conductor}: {insp} inspecciones")
            
            # Información de cumplimiento
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