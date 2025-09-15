"""
Test de efectividad del sistema usando datos reales de agosto 2025.
"""

import pandas as pd
import os
from datetime import datetime
import sys
import matplotlib.pyplot as plt
import seaborn as sns

# Agregar directorio src al path para importar módulos
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from data_processor import process_inspection_data, analyze_inspection_data
from trend_analyzer import analyze_trends
from critical_analyzer import analyze_critical_items

def main():
    # Cargar archivo de prueba
    print("\n1. Cargando archivo de prueba...")
    file_path = os.path.join(os.path.dirname(__file__), '..', '..', 
                            'datos_prueba', 
                            'Copia de Copia de Copia de CONSOLIDADO INSPECCIONES PREOPERACIONALES DE VEHICULOS AGOSTO - MANTENIMIENTO - Copy.xlsx')
    
    df = pd.read_excel(file_path)
    print(f"✓ Datos cargados: {len(df)} registros")
    
    # Procesar datos
    print("\n2. Procesando datos...")
    processed_df = process_inspection_data(df)
    print("✓ Datos procesados")
    
    # Análisis de tendencias
    print("\n3. Analizando tendencias...")
    trends = analyze_trends(processed_df)
    print("✓ Tendencias analizadas")
    
    # Análisis de items críticos
    print("\n4. Analizando items críticos...")
    critical = analyze_critical_items(processed_df)
    print("✓ Items críticos analizados")
    
    # Análisis completo
    print("\n5. Generando análisis completo...")
    analysis = analyze_inspection_data(processed_df)
    print("✓ Análisis completo generado")
    
    # Generar reporte
    print("\n6. Generando reporte de efectividad...")
    
    print("\nRESULTADOS DEL ANÁLISIS:")
    print("-" * 50)
    
    # Estadísticas generales
    print("\nESTADÍSTICAS GENERALES:")
    print(f"Total de inspecciones: {analysis['statistics']['total_inspections']}")
    print(f"Vehículos únicos: {analysis['statistics']['unique_vehicles']}")
    print(f"Inspectores únicos: {analysis['statistics']['unique_inspectors']}")
    print(f"Tasa promedio de cumplimiento: {analysis['statistics']['avg_compliance']:.2%}")
    
    # Tendencias
    print("\nTENDENCIAS:")
    trend_type = trends['compliance_trend']['trend_type']
    slope = trends['compliance_trend']['slope']
    confidence = trends['compliance_trend']['confidence']
    print(f"Tendencia de cumplimiento: {trend_type}")
    print(f"Pendiente de tendencia: {slope:.4f}")
    print(f"Confianza del modelo: {confidence:.2%}")
    
    # Items críticos
    print("\nITEMS CRÍTICOS:")
    for item in critical['high_risk_items'][:5]:  # Top 5 items críticos
        print(f"- {item['item']}")
        print(f"  Tasa de falla: {item['frequency']:.2%}")
        print(f"  Total de fallas: {item['failures']}")
    
    # Vehículos con bajo cumplimiento
    print("\nVEHÍCULOS CON BAJO CUMPLIMIENTO:")
    for vehicle in analysis['statistics']['low_compliance_vehicles'][:5]:  # Top 5 vehículos
        print(f"- Placa: {vehicle['placa']}")
        print(f"  Cumplimiento promedio: {vehicle['avg_compliance']:.2%}")
        print(f"  Total de inspecciones: {vehicle['total_inspections']}")
    
    # Ubicaciones de alto riesgo
    print("\nUBICACIONES DE ALTO RIESGO:")
    for location in analysis['statistics']['high_risk_locations'][:5]:  # Top 5 ubicaciones
        print(f"- {location['ubicacion']}")
        print(f"  Cumplimiento promedio: {location['avg_compliance']:.2%}")
        print(f"  Total de inspecciones: {location['total_inspections']}")
    
    # Generar gráficas
    print("\n7. Generando gráficas...")
    
    # Gráfica de tendencia temporal
    plt.figure(figsize=(12, 6))
    daily_compliance = processed_df.groupby('timestamp')['compliance_rate'].mean()
    plt.plot(daily_compliance.index, daily_compliance.values)
    plt.title('Tendencia de Cumplimiento - Agosto 2025')
    plt.xlabel('Fecha')
    plt.ylabel('Tasa de Cumplimiento')
    plt.grid(True)
    plt.savefig('tendencia_cumplimiento.png')
    plt.close()
    
    # Gráfica de distribución de cumplimiento
    plt.figure(figsize=(10, 6))
    sns.histplot(data=processed_df, x='compliance_rate', bins=20)
    plt.title('Distribución de Tasas de Cumplimiento')
    plt.xlabel('Tasa de Cumplimiento')
    plt.ylabel('Frecuencia')
    plt.savefig('distribucion_cumplimiento.png')
    plt.close()
    
    print("\n✓ Análisis completado. Se han generado los archivos:")
    print("- tendencia_cumplimiento.png")
    print("- distribucion_cumplimiento.png")

if __name__ == "__main__":
    main()