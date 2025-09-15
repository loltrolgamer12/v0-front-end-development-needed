"""
Análisis de efectividad usando el resumen mensual de agosto 2025.
"""

import pandas as pd
import os
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List

def analizar_resumen_mensual(df: pd.DataFrame) -> Dict:
    """
    Analiza el resumen mensual de inspecciones.
    """
    # Estadísticas generales
    stats = {
        'total_vehiculos': len(df),
        'total_inspecciones': df['# DE REPORTES AL MES DE AGOSTO'].sum(),
        'cumplimiento_promedio': df['PORCENTAJE DE CUMPLIMIENTO %'].mean() / 100,
        'vehiculos_criticos': len(df[df['PORCENTAJE DE CUMPLIMIENTO %'] < 90]),
        'vehiculos_optimos': len(df[df['PORCENTAJE DE CUMPLIMIENTO %'] >= 100])
    }
    
    # Análisis de cumplimiento por custodio
    custodio_stats = df.groupby('CUSTODIO').agg({
        'PLACA': 'count',
        'PORCENTAJE DE CUMPLIMIENTO %': 'mean',
        '# DE REPORTES AL MES DE AGOSTO': 'sum'
    }).reset_index()
    
    custodio_stats.columns = ['custodio', 'vehiculos', 'cumplimiento_promedio', 'total_reportes']
    custodio_stats = custodio_stats.sort_values('cumplimiento_promedio', ascending=False)
    
    # Identificar vehículos críticos
    vehiculos_criticos = df[df['PORCENTAJE DE CUMPLIMIENTO %'] < 90].sort_values('PORCENTAJE DE CUMPLIMIENTO %')
    
    return {
        'estadisticas': stats,
        'custodios': custodio_stats.to_dict('records'),
        'vehiculos_criticos': vehiculos_criticos[['PLACA', 'CUSTODIO', 'PORCENTAJE DE CUMPLIMIENTO %', '# DE REPORTES AL MES DE AGOSTO']].to_dict('records')
    }

def main():
    # Cargar archivo
    print("\n1. Cargando archivo de agosto 2025...")
    file_path = os.path.join(os.path.dirname(__file__), '..', '..', 
                            'datos_prueba', 
                            'Copia de Copia de Copia de CONSOLIDADO INSPECCIONES PREOPERACIONALES DE VEHICULOS AGOSTO - MANTENIMIENTO - Copy.xlsx')
    
    df = pd.read_excel(file_path)
    print(f"✓ Datos cargados: {len(df)} vehículos")
    
    # Analizar datos
    print("\n2. Analizando datos...")
    resultados = analizar_resumen_mensual(df)
    print("✓ Análisis completado")
    
    # Generar reporte
    print("\nRESULTADOS DEL ANÁLISIS - AGOSTO 2025")
    print("-" * 50)
    
    # Estadísticas generales
    print("\nESTADÍSTICAS GENERALES:")
    print(f"Total de vehículos: {resultados['estadisticas']['total_vehiculos']}")
    print(f"Total de inspecciones realizadas: {resultados['estadisticas']['total_inspecciones']}")
    print(f"Cumplimiento promedio: {resultados['estadisticas']['cumplimiento_promedio']:.2%}")
    print(f"Vehículos con cumplimiento crítico (<90%): {resultados['estadisticas']['vehiculos_criticos']}")
    print(f"Vehículos con cumplimiento óptimo (≥100%): {resultados['estadisticas']['vehiculos_optimos']}")
    
    # Top custodios por cumplimiento
    print("\nTOP 5 CUSTODIOS POR CUMPLIMIENTO:")
    for custodio in resultados['custodios'][:5]:
        print(f"- {custodio['custodio']}")
        print(f"  Cumplimiento promedio: {custodio['cumplimiento_promedio']:.2f}%")
        print(f"  Vehículos a cargo: {custodio['vehiculos']}")
        print(f"  Total reportes: {custodio['total_reportes']}")
    
    # Vehículos críticos
    print("\nVEHÍCULOS CON CUMPLIMIENTO CRÍTICO (<90%):")
    for vehiculo in resultados['vehiculos_criticos']:
        print(f"- Placa: {vehiculo['PLACA']}")
        print(f"  Custodio: {vehiculo['CUSTODIO']}")
        print(f"  Cumplimiento: {vehiculo['PORCENTAJE DE CUMPLIMIENTO %']:.2f}%")
        print(f"  Reportes realizados: {vehiculo['# DE REPORTES AL MES DE AGOSTO']}")
    
    # Generar gráficas
    print("\n3. Generando gráficas...")
    
    # Distribución de cumplimiento
    plt.figure(figsize=(12, 6))
    sns.histplot(data=df, x='PORCENTAJE DE CUMPLIMIENTO %', bins=20)
    plt.title('Distribución de Porcentajes de Cumplimiento - Agosto 2025')
    plt.xlabel('Porcentaje de Cumplimiento')
    plt.ylabel('Frecuencia')
    plt.axvline(x=90, color='r', linestyle='--', label='Límite crítico (90%)')
    plt.legend()
    plt.savefig('distribucion_cumplimiento_agosto2025.png')
    plt.close()
    
    # Relación entre reportes y cumplimiento
    plt.figure(figsize=(12, 6))
    plt.scatter(df['# DE REPORTES AL MES DE AGOSTO'], df['PORCENTAJE DE CUMPLIMIENTO %'])
    plt.title('Relación entre Cantidad de Reportes y Cumplimiento - Agosto 2025')
    plt.xlabel('Número de Reportes')
    plt.ylabel('Porcentaje de Cumplimiento')
    plt.grid(True)
    plt.savefig('relacion_reportes_cumplimiento_agosto2025.png')
    plt.close()
    
    print("\n✓ Análisis completado. Se han generado los archivos:")
    print("- distribucion_cumplimiento_agosto2025.png")
    print("- relacion_reportes_cumplimiento_agosto2025.png")

if __name__ == "__main__":
    main()