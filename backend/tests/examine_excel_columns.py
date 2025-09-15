import pandas as pd

def examine_excel_file():
    input_file = r'C:\Users\juan\Desktop\papa exel\analisis-exel\datos_prueba\HQ-FO-40 INSPECCIÓN DIARIA DE VEHÍCULO LIVIANO. 08-09-2025 3-58 p.m (1).xlsx'
    
    print(f"Leyendo archivo: {input_file}")
    df = pd.read_excel(input_file)
    
    print("\nNombre exacto de las columnas:")
    for col in df.columns:
        print(f"- '{col}'")
    
    print("\nPrimeras 5 filas de las columnas relevantes:")
    relevant_cols = ['Marca temporal', 'PLACA DEL VEHICULO', 'NOMBRE DE QUIEN REALIZA LA INSPECCIÓN'.upper()]
    try:
        print(df[relevant_cols].head())
    except KeyError as e:
        print(f"Error: No se encontró la columna {e}")

if __name__ == '__main__':
    examine_excel_file()