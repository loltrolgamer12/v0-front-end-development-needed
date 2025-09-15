import pandas as pd

def examine_excel_file():
    input_file = r'C:\Users\juan\Desktop\papa exel\analisis-exel\datos_prueba\HQ-FO-40 INSPECCIÓN DIARIA DE VEHÍCULO LIVIANO. 08-09-2025 3-58 p.m (1).xlsx'
    
    # Leer el archivo Excel
    df = pd.read_excel(input_file)
    
    print("Columnas en el archivo:")
    for col in df.columns:
        print(f"- {col}")
    
    print("\nPrimeras 5 filas de datos:")
    print(df.head())

if __name__ == '__main__':
    examine_excel_file()