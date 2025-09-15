"""
Analiza la estructura del archivo de Excel.
"""

import pandas as pd
import os

def main():
    file_path = os.path.join(os.path.dirname(__file__), '..', '..', 
                            'datos_prueba', 
                            'Copia de Copia de Copia de CONSOLIDADO INSPECCIONES PREOPERACIONALES DE VEHICULOS AGOSTO - MANTENIMIENTO - Copy.xlsx')
    
    # Cargar Excel
    df = pd.read_excel(file_path)
    
    print("\nINFORMACIÓN DEL DATASET:")
    print("-" * 50)
    
    print("\nColumnas:")
    for i, col in enumerate(df.columns):
        print(f"{i+1}. {col}")
    
    print("\nPrimeras 5 filas:")
    print(df.head())
    
    print("\nEstadísticas básicas:")
    print(df.info())

if __name__ == "__main__":
    main()