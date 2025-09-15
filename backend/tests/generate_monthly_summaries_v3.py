import pandas as pd
import os
from datetime import datetime
import re

def normalize_plate(plate):
    if pd.isna(plate):
        return None
    
    plate = str(plate).strip().upper()
    
    # Si la placa tiene menos de 5 caracteres o más de 7, probablemente es inválida
    if len(plate) < 5 or len(plate) > 7:
        return None
    
    # Eliminar caracteres especiales y espacios
    plate = re.sub(r'[^A-Z0-9]', '', plate)
    
    # Validar el formato de placa colombiana
    if not re.match(r'^[A-Z]{3}\d{3}$', plate) and not re.match(r'^[A-Z]{2}\d{4}$', plate) and not re.match(r'^[A-Z]\d{5}$', plate):
        return None
    
    return plate

def get_driver_name(row):
    conductor_col = 'NOMBRE DE QUIEN REALIZA LA INSPECCIÓN '
    if conductor_col not in row:
        return 'No especificado'
    return str(row[conductor_col]).strip() if pd.notna(row[conductor_col]) else 'No especificado'

def process_excel_file(input_file, output_folder):
    # Crear carpetas para 2024 y 2025 si no existen
    os.makedirs(os.path.join(output_folder, '2024'), exist_ok=True)
    os.makedirs(os.path.join(output_folder, '2025'), exist_ok=True)
    
    print(f"Procesando archivo: {input_file}")
    
    # Leer el archivo Excel
    df = pd.read_excel(input_file)
    
    # Convertir la columna de fecha a datetime
    df['FECHA'] = pd.to_datetime(df['Marca temporal'])
    
    # Normalizar las placas
    df['PLACA_NORMALIZADA'] = df['PLACA DEL VEHICULO'].apply(normalize_plate)
    
    # Filtrar registros con placas inválidas
    invalid_plates = df[df['PLACA_NORMALIZADA'].isna()]['PLACA DEL VEHICULO'].unique()
    print("\nPlacas inválidas encontradas:")
    for plate in invalid_plates:
        if pd.notna(plate):  # Solo mostrar placas que no sean NaN
            print(f"- {plate}")
    
    # Mantener solo registros con placas válidas
    df = df[df['PLACA_NORMALIZADA'].notna()]
    
    # Agrupar por año y mes
    grouped = df.groupby([df['FECHA'].dt.year, df['FECHA'].dt.month])
    
    for (year, month), group in grouped:
        if year not in [2024, 2025]:
            continue
            
        # Crear un DataFrame para el resumen
        summary_data = []
        
        # Obtener el último día del mes
        last_day = pd.Timestamp(year=year, month=month, day=1) + pd.offsets.MonthEnd(0)
        total_days = last_day.day
        
        # Agrupar por placa
        for placa, vehicle_data in group.groupby('PLACA_NORMALIZADA'):
            # Obtener el conductor que más veces aparece
            conductores = vehicle_data['NOMBRE DE QUIEN REALIZA LA INSPECCIÓN '].value_counts()
            driver = conductores.index[0] if not conductores.empty else 'No especificado'
            
            # Contar días únicos con inspección
            unique_days = vehicle_data['FECHA'].dt.day.nunique()
            
            # Contar total de inspecciones
            total_inspections = len(vehicle_data)
            
            # Calcular porcentaje de cumplimiento
            compliance = (unique_days / total_days) * 100
            
            summary_data.append({
                'PLACA': placa,
                'CONDUCTOR PRINCIPAL': driver,
                'TOTAL INSPECCIONES': total_inspections,
                'DÍAS CON INSPECCIÓN': unique_days,
                'PORCENTAJE CUMPLIMIENTO': compliance
            })
        
        if summary_data:
            # Crear DataFrame con el resumen
            summary_df = pd.DataFrame(summary_data)
            
            # Ordenar por placa
            summary_df = summary_df.sort_values('PLACA')
            
            # Formatear el porcentaje de cumplimiento
            summary_df['PORCENTAJE CUMPLIMIENTO'] = summary_df['PORCENTAJE CUMPLIMIENTO'].round(2)
            
            # Generar nombre del archivo
            month_name = datetime.strptime(str(month), "%m").strftime("%B")
            output_file = os.path.join(output_folder, str(year), f'resumen_{month_name.lower()}_{year}.xlsx')
            
            print(f"\nGenerando resumen para {month_name} {year}")
            print(f"Total vehículos: {len(summary_df)}")
            print(f"Total inspecciones: {summary_df['TOTAL INSPECCIONES'].sum()}")
            print(f"Promedio cumplimiento: {summary_df['PORCENTAJE CUMPLIMIENTO'].mean():.2f}%")
            
            # Guardar el archivo
            summary_df.to_excel(output_file, index=False)
            print(f"Resumen guardado en: {output_file}")

def main():
    # Usar la ruta completa del archivo
    input_file = r'C:\Users\juan\Desktop\papa exel\analisis-exel\datos_prueba\HQ-FO-40 INSPECCIÓN DIARIA DE VEHÍCULO LIVIANO. 08-09-2025 3-58 p.m (1).xlsx'
    output_folder = r'C:\Users\juan\Desktop\papa exel\analisis-exel\resumenes_automaticos'
    
    if not os.path.exists(input_file):
        print(f"Error: No se encuentra el archivo de entrada: {input_file}")
        return
    
    process_excel_file(input_file, output_folder)
    print("\n¡Proceso completado!")

if __name__ == '__main__':
    main()