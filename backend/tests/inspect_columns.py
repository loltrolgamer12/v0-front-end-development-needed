import pandas as pd

# Leer el archivo
file_path = r"C:\Users\juan\Desktop\papa exel\analisis-exel\datos_prueba\HQ-FO-40 INSPECCIÓN DIARIA DE VEHÍCULO LIVIANO. 08-09-2025 3-58 p.m (1).xlsx"
df = pd.read_excel(file_path)

# Mostrar todas las columnas
print("\nColumnas en el archivo:")
print("-" * 50)
for col in df.columns:
    print(col)