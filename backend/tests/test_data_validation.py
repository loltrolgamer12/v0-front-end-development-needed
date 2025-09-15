"""
Test de validación de datos del sistema de inspección vehicular
------------------------------------------------------------
Este módulo realiza pruebas exhaustivas de validación de datos
comparando los resultados del procesamiento con los datos reales.
"""

import sys
import os
from pathlib import Path
import pandas as pd
import random
from datetime import datetime

# Agregar el directorio src al path para poder importar los módulos
sys.path.append(str(Path(__file__).parent.parent / 'src'))

import sys
from pathlib import Path
backend_path = str(Path(__file__).parent.parent / 'src')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from normalizer import normalize_text, normalize_plate, normalize_location

class TestDataValidation:
    def __init__(self):
        self.excel_path = r'C:\Users\juan\Desktop\papa exel\analisis-exel\datos_prueba\HQ-FO-40 INSPECCIÓN DIARIA DE VEHÍCULO LIVIANO. 08-09-2025 3-58 p.m (1).xlsx'
        self.df = pd.read_excel(self.excel_path)
        self.test_results = []
        
    def run_all_tests(self):
        """Ejecuta todas las pruebas de validación"""
        print("Iniciando pruebas de validación...")
        
        # Pruebas de conteo y filtrado
        self._test_plate_counts()
        self._test_inspector_counts()
        self._test_location_counts()
        self._test_contract_counts()
        self._test_compliance_counts()
        
        # Pruebas de normalización
        self._test_normalization()
        
        # Resumen de resultados
        self._print_results()
        
    def _test_plate_counts(self):
        """Prueba conteos por placa"""
        print("\nProbando conteos por placa...")
        
        # Seleccionar 100 placas aleatorias
        all_plates = self.df['PLACA DEL VEHICULO'].unique()
        test_plates = random.sample(list(all_plates), min(100, len(all_plates)))
        
        for plate in test_plates:
            # Conteo real
            real_count = len(self.df[self.df['PLACA DEL VEHICULO'] == plate])
            
            # Conteo procesado
            processed_df = process_inspection_data(self.df)
            processed_count = len(processed_df[processed_df['placa'] == normalize_plate(plate)])
            
            # Verificar coincidencia
            self.test_results.append({
                'tipo': 'Placa',
                'valor': plate,
                'real': real_count,
                'procesado': processed_count,
                'coincide': real_count == processed_count
            })

    def _test_inspector_counts(self):
        """Prueba conteos por inspector"""
        print("Probando conteos por inspector...")
        
        inspectors = self.df['NOMBRE DE QUIEN REALIZA LA INSPECCIÓN'].unique()
        test_inspectors = random.sample(list(inspectors), min(100, len(inspectors)))
        
        for inspector in test_inspectors:
            real_count = len(self.df[self.df['NOMBRE DE QUIEN REALIZA LA INSPECCIÓN'] == inspector])
            processed_df = process_inspection_data(self.df)
            processed_count = len(processed_df[processed_df['inspector'] == normalize_text(inspector)])
            
            self.test_results.append({
                'tipo': 'Inspector',
                'valor': inspector,
                'real': real_count,
                'procesado': processed_count,
                'coincide': real_count == processed_count
            })

    def _test_location_counts(self):
        """Prueba conteos por ubicación"""
        print("Probando conteos por ubicación...")
        
        locations = self.df['CAMPO/COORDINACIÓN'].unique()
        test_locations = random.sample(list(locations), min(100, len(locations)))
        
        for location in test_locations:
            real_count = len(self.df[self.df['CAMPO/COORDINACIÓN'] == location])
            processed_df = process_inspection_data(self.df)
            processed_count = len(processed_df[processed_df['ubicacion'] == normalize_location(location)])
            
            self.test_results.append({
                'tipo': 'Ubicación',
                'valor': location,
                'real': real_count,
                'procesado': processed_count,
                'coincide': real_count == processed_count
            })

    def _test_contract_counts(self):
        """Prueba conteos por contrato"""
        print("Probando conteos por contrato...")
        
        contracts = self.df['CONTRATO'].unique()
        test_contracts = random.sample(list(contracts), min(100, len(contracts)))
        
        for contract in test_contracts:
            real_count = len(self.df[self.df['CONTRATO'] == contract])
            processed_df = process_inspection_data(self.df)
            processed_count = len(processed_df[processed_df['contrato'] == normalize_text(contract)])
            
            self.test_results.append({
                'tipo': 'Contrato',
                'valor': contract,
                'real': real_count,
                'procesado': processed_count,
                'coincide': real_count == processed_count
            })

    def _test_compliance_counts(self):
        """Prueba conteos de cumplimiento"""
        print("Probando conteos de cumplimiento...")
        
        # Seleccionar columnas de inspección
        inspection_cols = [col for col in self.df.columns if col.startswith('**')]
        test_cols = random.sample(inspection_cols, min(100, len(inspection_cols)))
        
        for col in test_cols:
            real_compliant = len(self.df[self.df[col] == 'CUMPLE'])
            real_non_compliant = len(self.df[self.df[col] == 'NO CUMPLE'])
            
            processed_df = process_inspection_data(self.df)
            processed_compliant = len(processed_df[processed_df[col.lower().replace('**', '')] == 'cumple'])
            processed_non_compliant = len(processed_df[processed_df[col.lower().replace('**', '')] == 'no_cumple'])
            
            self.test_results.append({
                'tipo': 'Cumplimiento',
                'valor': col,
                'real': real_compliant,
                'procesado': processed_compliant,
                'coincide': real_compliant == processed_compliant and real_non_compliant == processed_non_compliant
            })

    def _test_normalization(self):
        """Prueba normalización de datos"""
        print("Probando normalización de datos...")
        
        # Prueba de placas
        test_plates = random.sample(list(self.df['PLACA DEL VEHICULO'].unique()), 10)
        for plate in test_plates:
            normalized = normalize_plate(plate)
            self.test_results.append({
                'tipo': 'Normalización Placa',
                'valor': plate,
                'real': plate,
                'procesado': normalized,
                'coincide': bool(normalized)  # Verificar que no esté vacío
            })
        
        # Prueba de ubicaciones
        test_locations = random.sample(list(self.df['CAMPO/COORDINACIÓN'].unique()), 10)
        for location in test_locations:
            normalized = normalize_location(location)
            self.test_results.append({
                'tipo': 'Normalización Ubicación',
                'valor': location,
                'real': location,
                'procesado': normalized,
                'coincide': bool(normalized)  # Verificar que no esté vacío
            })

    def _print_results(self):
        """Imprime resumen de resultados de las pruebas"""
        print("\nRESULTADOS DE LAS PRUEBAS")
        print("-" * 50)
        
        # Agrupar resultados por tipo
        by_type = {}
        for result in self.test_results:
            tipo = result['tipo']
            if tipo not in by_type:
                by_type[tipo] = {'total': 0, 'coinciden': 0}
            by_type[tipo]['total'] += 1
            if result['coincide']:
                by_type[tipo]['coinciden'] += 1
        
        # Imprimir resultados
        for tipo, stats in by_type.items():
            porcentaje = (stats['coinciden'] / stats['total']) * 100
            print(f"{tipo}:")
            print(f"  - Pruebas realizadas: {stats['total']}")
            print(f"  - Pruebas exitosas: {stats['coinciden']}")
            print(f"  - Porcentaje de éxito: {porcentaje:.2f}%")
            print()
        
        # Imprimir algunos ejemplos de fallos si existen
        fallos = [r for r in self.test_results if not r['coincide']]
        if fallos:
            print("\nEjemplos de discrepancias encontradas:")
            for fallo in fallos[:5]:  # Mostrar solo los primeros 5 fallos
                print(f"Tipo: {fallo['tipo']}")
                print(f"Valor: {fallo['valor']}")
                print(f"Conteo real: {fallo['real']}")
                print(f"Conteo procesado: {fallo['procesado']}")
                print("-" * 30)

if __name__ == '__main__':
    tester = TestDataValidation()
    tester.run_all_tests()