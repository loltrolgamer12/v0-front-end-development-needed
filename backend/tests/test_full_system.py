"""
Test completo del sistema de inspección vehicular
-----------------------------------------------
Este módulo realiza pruebas exhaustivas de todo el sistema,
incluyendo normalización, procesamiento, análisis de tendencias
y análisis de items críticos.
"""

import sys
import os
from pathlib import Path
import pandas as pd
import numpy as np
from datetime import datetime
import unittest
from typing import Dict, List
import warnings

# Configurar path para importaciones
backend_path = str(Path(__file__).parent.parent / 'src')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Importar todos los módulos del sistema
from normalizer import normalize_text, normalize_plate, normalize_location
from data_processor import process_inspection_data
from trend_analyzer import analyze_trends
from critical_analyzer import analyze_critical_items
from database import save_inspections, get_inspections

class TestInspectionSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Configuración inicial para todas las pruebas"""
        cls.excel_path = r'C:\Users\juan\Desktop\papa exel\analisis-exel\datos_prueba\HQ-FO-40 INSPECCIÓN DIARIA DE VEHÍCULO LIVIANO. 08-09-2025 3-58 p.m (1).xlsx'
        cls.df = pd.read_excel(cls.excel_path)
        print(f"\nTotal de registros cargados: {len(cls.df)}")
        
    def setUp(self):
        """Configuración para cada prueba individual"""
        warnings.filterwarnings('ignore')
        
    def test_01_data_loading(self):
        """Prueba la carga de datos"""
        print("\n1. Prueba de carga de datos")
        self.assertIsNotNone(self.df)
        self.assertTrue(len(self.df) > 0)
        print(f"✓ Datos cargados correctamente: {len(self.df)} registros")
        
        # Verificar columnas requeridas
        required_columns = [
            'PLACA DEL VEHICULO',
            'CAMPO/COORDINACIÓN',
            'CONTRATO',
            'NOMBRE DE QUIEN REALIZA LA INSPECCIÓN '
        ]
        for col in required_columns:
            self.assertIn(col, self.df.columns)
        print("✓ Todas las columnas requeridas están presentes")
        
    def test_02_normalization(self):
        """Prueba las funciones de normalización"""
        print("\n2. Prueba de normalización")
        
        # Test de placas
        test_plates = self.df['PLACA DEL VEHICULO'].unique()[:5]
        for plate in test_plates:
            if pd.notna(plate):
                normalized = normalize_plate(plate)
                self.assertIsInstance(normalized, str)
                self.assertTrue(len(normalized) > 0)
                print(f"✓ Placa normalizada: {plate} -> {normalized}")
        
        # Test de ubicaciones
        test_locations = self.df['CAMPO/COORDINACIÓN'].unique()
        for location in test_locations:
            if pd.notna(location):
                normalized = normalize_location(location)
                self.assertIsInstance(normalized, str)
                self.assertTrue(len(normalized) > 0)
                print(f"✓ Ubicación normalizada: {location} -> {normalized}")
        
        # Test de nombres
        test_names = self.df['NOMBRE DE QUIEN REALIZA LA INSPECCIÓN '].unique()[:5]
        for name in test_names:
            if pd.notna(name):
                normalized = normalize_text(name)
                self.assertIsInstance(normalized, str)
                self.assertTrue(len(normalized) > 0)
                print(f"✓ Nombre normalizado: {name} -> {normalized}")
    
    def test_03_data_processing(self):
        """Prueba el procesamiento de datos"""
        print("\n3. Prueba de procesamiento de datos")
        
        try:
            processed_df = process_inspection_data(self.df)
            self.assertIsInstance(processed_df, pd.DataFrame)
            self.assertTrue(len(processed_df) > 0)
            print(f"✓ Datos procesados correctamente: {len(processed_df)} registros")
            
            # Verificar columnas procesadas
            expected_columns = [
                'placa',
                'ubicacion',
                'inspector',
                'contrato',
                'timestamp',
                'turno'
            ]
            for col in expected_columns:
                self.assertIn(col, processed_df.columns.str.lower())
            print("✓ Todas las columnas procesadas están presentes")
            
        except Exception as e:
            print(f"✗ Error en procesamiento: {str(e)}")
            raise
    
    def test_04_trend_analysis(self):
        """Prueba el análisis de tendencias"""
        print("\n4. Prueba de análisis de tendencias")
        
        try:
            processed_df = process_inspection_data(self.df)
            trends = analyze_trends(processed_df)
            
            self.assertIsInstance(trends, dict)
            expected_keys = ['compliance_trend', 'failure_patterns', 'seasonal_patterns']
            for key in expected_keys:
                self.assertIn(key, trends)
                print(f"✓ Análisis de {key} completado")
            
            # Verificar resultados específicos
            self.assertIn('slope', trends['compliance_trend'])
            self.assertIn('trend_type', trends['compliance_trend'])
            print(f"✓ Tendencia de cumplimiento: {trends['compliance_trend']['trend_type']}")
            
        except Exception as e:
            print(f"✗ Error en análisis de tendencias: {str(e)}")
            raise
    
    def test_05_critical_items(self):
        """Prueba el análisis de items críticos"""
        print("\n5. Prueba de análisis de items críticos")
        
        try:
            processed_df = process_inspection_data(self.df)
            critical_analysis = analyze_critical_items(processed_df)
            
            self.assertIsInstance(critical_analysis, dict)
            expected_keys = ['high_risk_items', 'impact_analysis', 'failure_clusters']
            for key in expected_keys:
                self.assertIn(key, critical_analysis)
                print(f"✓ Análisis de {key} completado")
            
            # Verificar items de alto riesgo
            high_risk_items = critical_analysis['high_risk_items']
            self.assertIsInstance(high_risk_items, list)
            if high_risk_items:
                print(f"✓ Se identificaron {len(high_risk_items)} items de alto riesgo")
                for item in high_risk_items[:3]:
                    print(f"  - {item['item']}: score={item['risk_score']:.2f}")
                    
        except Exception as e:
            print(f"✗ Error en análisis de items críticos: {str(e)}")
            raise
    
    def test_06_database_operations(self):
        """Prueba las operaciones de base de datos"""
        print("\n6. Prueba de operaciones de base de datos")
        
        try:
            # Procesar datos para guardar
            processed_df = process_inspection_data(self.df)
            
            # Intentar guardar en la base de datos
            save_result = save_inspections(processed_df)
            self.assertTrue(save_result)
            print("✓ Datos guardados en la base de datos")
            
            # Intentar recuperar de la base de datos
            retrieved_df = get_inspections()
            self.assertIsInstance(retrieved_df, pd.DataFrame)
            self.assertTrue(len(retrieved_df) > 0)
            print(f"✓ Datos recuperados de la base de datos: {len(retrieved_df)} registros")
            
        except Exception as e:
            print(f"✗ Error en operaciones de base de datos: {str(e)}")
            raise
    
    def test_07_end_to_end(self):
        """Prueba de integración completa"""
        print("\n7. Prueba de integración completa")
        
        try:
            # 1. Cargar y procesar datos
            processed_df = process_inspection_data(self.df)
            print("✓ Datos procesados")
            
            # 2. Analizar tendencias
            trends = analyze_trends(processed_df)
            print("✓ Tendencias analizadas")
            
            # 3. Analizar items críticos
            critical = analyze_critical_items(processed_df)
            print("✓ Items críticos analizados")
            
            # 4. Guardar en base de datos
            save_result = save_inspections(processed_df)
            print("✓ Datos guardados")
            
            # 5. Verificar resultados
            self.assertTrue(all([
                isinstance(processed_df, pd.DataFrame),
                isinstance(trends, dict),
                isinstance(critical, dict),
                save_result
            ]))
            print("✓ Prueba de integración completada exitosamente")
            
        except Exception as e:
            print(f"✗ Error en prueba de integración: {str(e)}")
            raise

if __name__ == '__main__':
    # Configurar la salida de unittest para que sea más detallada
    unittest.main(verbosity=2)