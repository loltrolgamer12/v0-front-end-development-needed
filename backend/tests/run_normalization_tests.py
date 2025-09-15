import pandas as pd
import sys
from pathlib import Path

# Configurar path para importaciones
backend_path = str(Path(__file__).parent.parent / 'src')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Importar funciones de normalización
from normalizer import normalize_text, normalize_plate, normalize_location

# Cargar datos
excel_path = r'C:\Users\juan\Desktop\papa exel\analisis-exel\datos_prueba\HQ-FO-40 INSPECCIÓN DIARIA DE VEHÍCULO LIVIANO. 08-09-2025 3-58 p.m (1).xlsx'
df = pd.read_excel(excel_path)
print("Columnas disponibles:", list(df.columns))

def test_plates():
    """Prueba normalización de placas"""
    print("\nPRUEBA DE NORMALIZACIÓN DE PLACAS")
    print("-" * 50)
    sample_plates = df['PLACA DEL VEHICULO'].unique()[:10]
    
    for plate in sample_plates:
        if pd.notna(plate):
            normalized = normalize_plate(plate)
            print(f"Original: {plate:15} -> Normalizada: {normalized}")

def test_locations():
    """Prueba normalización de ubicaciones"""
    print("\nPRUEBA DE NORMALIZACIÓN DE UBICACIONES")
    print("-" * 50)
    locations = df['CAMPO/COORDINACIÓN'].unique()
    
    for location in locations:
        if pd.notna(location):
            normalized = normalize_location(location)
            print(f"Original: {location:15} -> Normalizada: {normalized}")

def test_inspectors():
    """Prueba normalización de nombres de inspectores"""
    print("\nPRUEBA DE NORMALIZACIÓN DE NOMBRES DE INSPECTORES")
    print("-" * 50)
    inspectors = df['NOMBRE DE QUIEN REALIZA LA INSPECCIÓN '].unique()[:10]  # Note el espacio extra al final
    
    for inspector in inspectors:
        if pd.notna(inspector):
            normalized = normalize_text(inspector)
            print(f"Original: {inspector:30} -> Normalizado: {normalized}")

def test_contracts():
    """Prueba normalización de contratos"""
    print("\nPRUEBA DE NORMALIZACIÓN DE CONTRATOS")
    print("-" * 50)
    contracts = df['CONTRATO'].unique()
    
    for contract in contracts:
        if pd.notna(contract):
            normalized = normalize_text(contract)
            print(f"Original: {contract:30} -> Normalizado: {normalized}")

def run_all_tests():
    """Ejecuta todas las pruebas de normalización"""
    print("INICIANDO PRUEBAS DE NORMALIZACIÓN")
    print("=" * 50)
    
    test_plates()
    test_locations()
    test_inspectors()
    test_contracts()
    
    print("\nPRUEBAS COMPLETADAS")
    print("=" * 50)

if __name__ == '__main__':
    run_all_tests()