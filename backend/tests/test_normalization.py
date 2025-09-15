"""
Test de normalización de datos del sistema de inspección vehicular
---------------------------------------------------------------
Este módulo prueba las funciones de normalización con datos reales.
"""

import sys
import os
from pathlib import Path
import pandas as pd
import random

# Agregar el directorio src al path para poder importar los módulos
backend_path = str(Path(__file__).parent.parent / 'src')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from normalizer import normalize_text, normalize_plate, normalize_location

def test_normalization():
    """Prueba las funciones de normalización con datos reales"""
    
    print("Iniciando pruebas de normalización...")
    
    # Cargar datos
    excel_path = r'C:\Users\juan\Desktop\papa exel\analisis-exel\datos_prueba\HQ-FO-40 INSPECCIÓN DIARIA DE VEHÍCULO LIVIANO. 08-09-2025 3-58 p.m (1).xlsx'
    df = pd.read_excel(excel_path)
    
    # Test de normalización de placas
    print("\nPruebas de normalización de placas:")
    placas = df['PLACA DEL VEHICULO'].unique()
    muestra_placas = random.sample(list(placas), min(100, len(placas)))
    
    for placa in muestra_placas[:10]:  # Mostrar solo 10 ejemplos
        normalizada = normalize_plate(placa)
        print(f"Original: {placa} -> Normalizada: {normalizada}")
    
    # Test de normalización de ubicaciones
    print("\nPruebas de normalización de ubicaciones:")
    ubicaciones = df['CAMPO/COORDINACIÓN'].unique()
    for ubicacion in ubicaciones:
        normalizada = normalize_location(ubicacion)
        print(f"Original: {ubicacion} -> Normalizada: {normalizada}")
    
    # Test de normalización de nombres
    print("\nPruebas de normalización de nombres de inspector:")
    inspectores = df['NOMBRE DE QUIEN REALIZA LA INSPECCIÓN'].unique()
    muestra_inspectores = random.sample(list(inspectores), min(10, len(inspectores)))
    
    for inspector in muestra_inspectores:
        normalizado = normalize_text(inspector)
        print(f"Original: {inspector} -> Normalizado: {normalizado}")
    
    # Test de normalización de contratos
    print("\nPruebas de normalización de contratos:")
    contratos = df['CONTRATO'].unique()
    for contrato in contratos:
        normalizado = normalize_text(contrato)
        print(f"Original: {contrato} -> Normalizado: {normalizado}")

if __name__ == '__main__':
    test_normalization()