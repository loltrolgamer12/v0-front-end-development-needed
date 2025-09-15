import pandas as pd
import os
from datetime import datetime
import re
import unicodedata

def normalize_string(s):
    """Normaliza un string eliminando acentos, espacios extra y convirtiendo a mayúsculas"""
    if pd.isna(s):
        return None
    # Convertir a string y eliminar espacios al inicio y final
    s = str(s).strip()
    # Convertir caracteres especiales a sus equivalentes básicos
    s = unicodedata.normalize('NFKD', s).encode('ASCII', 'ignore').decode('ASCII')
    # Convertir a mayúsculas
    s = s.upper()
    # Eliminar espacios múltiples
    s = re.sub(r'\s+', ' ', s)
    return s

def is_valid_name(s):
    """Verifica si un string parece ser un nombre y no una placa"""
    if pd.isna(s):
        return False
    s = str(s).strip().upper()
    # Si contiene palabras comunes en nombres, probablemente es un nombre
    name_indicators = ['JOSE', 'LUIS', 'CARLOS', 'JUAN', 'PEDRO', 'MARIA', 'ANA', 'JORGE',
                      'DANIEL', 'DAVID', 'FERNANDO', 'RICARDO', 'ANDRES', 'FRANCISCO',
                      'GARCIA', 'RODRIGUEZ', 'MARTINEZ', 'LOPEZ', 'GONZALEZ', 'PEREZ',
                      'SANCHEZ', 'RAMIREZ', 'TORRES', 'DIAZ']
    return any(word in s for word in name_indicators)

def is_valid_plate_format(plate):
    """Verifica si una placa tiene un formato válido"""
    # Formatos válidos de placa:
    # 1. AAA000 (3 letras + 3 números)
    # 2. AA0000 (2 letras + 4 números)
    # 3. A00000 (1 letra + 5 números)
    patterns = [
        r'^[A-Z]{3}\d{3}$',  # AAA000
        r'^[A-Z]{2}\d{4}$',  # AA0000
        r'^[A-Z]\d{5}$'      # A00000
    ]
    return any(re.match(pattern, plate) for pattern in patterns)

def normalize_plate(plate):
    """Normaliza y valida una placa vehicular"""
    if pd.isna(plate):
        return None
    
    # Convertir a string y normalizar
    plate = normalize_string(plate)
    
    # Verificar longitud básica
    if len(plate) < 5 or len(plate) > 7:
        return None
    
    # Si parece ser un nombre, rechazar
    if is_valid_name(plate):
        return None
    
    # Si es un número de identificación (más de 7 dígitos), rechazar
    if re.match(r'^\d{7,}$', plate):
        return None
    
    # Eliminar todos los caracteres especiales y espacios
    plate = re.sub(r'[^A-Z0-9]', '', plate)
    
    # Validar el formato
    if not is_valid_plate_format(plate):
        return None
    
    return plate

def get_most_frequent_driver(vehicle_data):
    """Obtiene el conductor que más veces aparece para un vehículo"""
    conductores = vehicle_data['NOMBRE DE QUIEN REALIZA LA INSPECCIÓN '].apply(normalize_string)
    conteo = conductores.value_counts()
    if conteo.empty:
        return 'No especificado'
    return conteo.index[0]

def process_excel_file(input_file, output_folder):
    # Crear carpetas para 2024 y 2025 si no existen
    os.makedirs(os.path.join(output_folder, '2024'), exist_ok=True)
    os.makedirs(os.path.join(output_folder, '2025'), exist_ok=True)
    
    print(f"Procesando archivo: {input_file}")
    
    # Leer el archivo Excel
    df = pd.read_excel(input_file)
    
    # Convertir la columna de fecha a datetime
    df['FECHA'] = pd.to_datetime(df['Marca temporal'])
    
    # Normalizar las placas y nombres de conductores
    df['PLACA_NORMALIZADA'] = df['PLACA DEL VEHICULO'].apply(normalize_plate)
    df['CONDUCTOR_NORMALIZADO'] = df['NOMBRE DE QUIEN REALIZA LA INSPECCIÓN '].apply(normalize_string)
    
    # Filtrar y reportar placas inválidas
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
            driver = get_most_frequent_driver(vehicle_data)
            
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