"""
Sistema de Análisis de Inspecciones Vehiculares
---------------------------------------------
critical_analyzer.py - Módulo de análisis de items críticos

Este módulo implementa el análisis de items críticos y sus impactos
en el sistema de inspecciones vehiculares.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
from datetime import datetime, timedelta
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

def analyze_critical_items(inspections: pd.DataFrame) -> Dict:
    """
    Analiza items críticos en las inspecciones.
    
    Args:
        inspections: DataFrame con historial de inspecciones
        
    Returns:
        Diccionario con análisis de items críticos
    """
    analysis = {
        'high_risk_items': _identify_high_risk_items(inspections),
        'impact_analysis': _analyze_impact(inspections),
        'failure_clusters': _cluster_failures(inspections),
        'recommendations': _generate_recommendations(inspections)
    }
    
    return analysis

def _identify_high_risk_items(df: pd.DataFrame) -> List[Dict]:
    """
    Identifica items con alto riesgo basado en la tasa de cumplimiento.
    
    Args:
        df: DataFrame con historial de inspecciones
        
    Returns:
        Lista de items de alto riesgo con métricas
    """
    high_risk_items = []
    
    # Identificar las columnas de inspección (que terminan en _cumple)
    inspection_cols = [col for col in df.columns if col.endswith('_cumple')]
    
    for col in inspection_cols:
        # Calcular estadísticas del item
        total = len(df)
        no_cumple = len(df[df[col] == 'no_cumple'])
        frequency = no_cumple / total if total > 0 else 0
        
        # Calcular score de riesgo basado en la frecuencia de no cumplimiento
        risk_score = frequency
        
        if risk_score > 0.3:  # Umbral de alto riesgo (30% de no cumplimiento)
            impact_areas = ['seguridad', 'operación'] if risk_score > 0.5 else ['operación']
            
            high_risk_items.append({
                'item': col.replace('_cumple', ''),
                'risk_score': risk_score,
                'frequency': frequency,
                'total_inspections': total,
                'failures': no_cumple,
                'impact_areas': impact_areas
            })
    
    return sorted(high_risk_items, key=lambda x: x['risk_score'], reverse=True)

def _analyze_impact(df: pd.DataFrame) -> Dict:
    """
    Analiza el impacto de items críticos en diferentes áreas.
    
    Args:
        df: DataFrame con historial de inspecciones
        
    Returns:
        Diccionario con análisis de impacto
    """
    impact = {
        'safety': _analyze_safety_impact(df),
        'operational': _analyze_operational_impact(df),
        'cost': _analyze_cost_impact(df),
        'compliance': _analyze_compliance_impact(df)
    }
    
    return impact

def _cluster_failures(df: pd.DataFrame) -> List[Dict]:
    """
    Agrupa fallas en clusters para identificar patrones.
    
    Args:
        df: DataFrame con historial de inspecciones
        
    Returns:
        Lista de clusters de fallas
    """
    # Preparar datos para clustering
    inspection_cols = [col for col in df.columns if col.endswith('_cumple')]
    if not inspection_cols:
        return []
        
    # Crear matriz de características basada en cumplimiento
    X = df[inspection_cols].apply(lambda x: x == 'no_cumple').astype(int).values
    
    if len(X) < 3:  # Si hay muy pocos datos, no hacer clustering
        return []
    
    # Normalizar datos
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Aplicar KMeans
    n_clusters = min(3, len(X) - 1)  # No más clusters que datos - 1
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    clusters = kmeans.fit_predict(X_scaled)
    
    # Analizar clusters
    cluster_analysis = []
    for i in range(n_clusters):
        cluster_data = df[clusters == i]
        
        # Encontrar los items más problemáticos en este cluster
        problem_items = []
        for col in inspection_cols:
            failures = len(cluster_data[cluster_data[col] == 'no_cumple'])
            if failures > 0:
                problem_items.append({
                    'item': col.replace('_cumple', ''),
                    'failures': failures,
                    'failure_rate': failures / len(cluster_data)
                })
        
        cluster_analysis.append({
            'cluster_id': i,
            'size': len(cluster_data),
            'avg_compliance': cluster_data['compliance_rate'].mean(),
            'problem_items': sorted(problem_items, key=lambda x: x['failure_rate'], reverse=True)[:5],
            'vehicles': cluster_data['placa'].nunique()
        })
    
    return cluster_analysis

def _generate_recommendations(df: pd.DataFrame) -> List[Dict]:
    """
    Genera recomendaciones basadas en análisis de items críticos.
    
    Args:
        df: DataFrame con historial de inspecciones
        
    Returns:
        Lista de recomendaciones
    """
    recommendations = []
    
    # Analizar items críticos
    high_risk_items = _identify_high_risk_items(df)
    
    for item in high_risk_items:
        recommendations.append({
            'item': item['item'],
            'priority': 'high' if item['risk_score'] > 0.8 else 'medium',
            'actions': _suggest_actions(item),
            'expected_impact': _estimate_impact(item),
            'implementation_time': _estimate_implementation_time(item)
        })
    
    return recommendations

def _calculate_severity_score(item_data: pd.DataFrame) -> float:
    """
    Calcula score de severidad para un item.
    """
    # Implementar cálculo de severidad
    return 0.5

def _identify_impact_areas(item_data: pd.DataFrame) -> List[str]:
    """
    Identifica áreas impactadas por un item.
    """
    return ['safety', 'operational']

def _analyze_safety_impact(df: pd.DataFrame) -> Dict:
    """
    Analiza impacto en seguridad.
    """
    return {}

def _analyze_operational_impact(df: pd.DataFrame) -> Dict:
    """
    Analiza impacto operacional.
    """
    return {}

def _analyze_cost_impact(df: pd.DataFrame) -> Dict:
    """
    Analiza impacto en costos.
    """
    return {}

def _analyze_compliance_impact(df: pd.DataFrame) -> Dict:
    """
    Analiza impacto en cumplimiento.
    """
    return {}

def _get_common_items(cluster_data: pd.DataFrame) -> List[str]:
    """
    Obtiene items comunes en un cluster.
    """
    return []

def _analyze_cluster_characteristics(cluster_data: pd.DataFrame) -> Dict:
    """
    Analiza características de un cluster.
    """
    return {}

def _suggest_actions(item: Dict) -> List[str]:
    """
    Sugiere acciones para un item crítico.
    """
    return ['Increase inspection frequency', 'Update maintenance schedule']

def _estimate_impact(item: Dict) -> Dict:
    """
    Estima impacto de acciones recomendadas.
    """
    return {
        'risk_reduction': 0.3,
        'cost_savings': 5000,
        'time_savings': '2 hours per inspection'
    }

def _estimate_implementation_time(item: Dict) -> str:
    """
    Estima tiempo de implementación de acciones.
    """
    return '2 weeks'