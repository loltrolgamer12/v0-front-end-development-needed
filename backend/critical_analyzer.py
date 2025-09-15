import pandas as pd
from typing import Dict, Any, List
import numpy as np

def analyze_critical_items(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Analiza elementos críticos en los datos de inspección
    """
    analysis = {
        'high_risk_drivers': identify_high_risk_drivers(df),
        'critical_trends': analyze_critical_trends(df),
        'immediate_actions': recommend_immediate_actions(df)
    }
    return analysis

def identify_high_risk_drivers(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Identifica conductores de alto riesgo basado en su historial
    """
    driver_stats = df.groupby('CONDUCTOR').agg({
        'RESULTADO': ['count', lambda x: (x == 'NO CUMPLE').sum()]
    }).reset_index()
    
    driver_stats.columns = ['conductor', 'total_inspecciones', 'fallos']
    driver_stats['tasa_fallo'] = driver_stats['fallos'] / driver_stats['total_inspecciones']
    
    # Identificar conductores con alta tasa de fallos
    high_risk = driver_stats[driver_stats['tasa_fallo'] > 0.2].copy()
    high_risk['nivel_riesgo'] = np.where(
        high_risk['tasa_fallo'] > 0.4,
        'ALTO',
        'MEDIO'
    )
    
    return high_risk.to_dict(orient='records')

def analyze_critical_trends(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Analiza tendencias críticas que requieren atención inmediata
    """
    df['FECHA'] = pd.to_datetime(df['FECHA'])
    recent_period = df[df['FECHA'] >= (df['FECHA'].max() - pd.Timedelta(days=30))]
    
    trends = {
        'recent_failure_rate': calculate_recent_failure_rate(recent_period),
        'consecutive_failures': find_consecutive_failures(df),
        'critical_patterns': identify_critical_patterns(df)
    }
    
    return trends

def calculate_recent_failure_rate(df: pd.DataFrame) -> float:
    """
    Calcula la tasa de fallos reciente
    """
    if len(df) == 0:
        return 0.0
    
    failures = df[df['RESULTADO'] == 'NO CUMPLE'].shape[0]
    return (failures / len(df)) * 100

def find_consecutive_failures(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Identifica patrones de fallos consecutivos
    """
    consecutive_failures = []
    
    for driver in df['CONDUCTOR'].unique():
        driver_data = df[df['CONDUCTOR'] == driver].sort_values('FECHA')
        failure_streak = 0
        streak_start = None
        
        for idx, row in driver_data.iterrows():
            if row['RESULTADO'] == 'NO CUMPLE':
                if failure_streak == 0:
                    streak_start = row['FECHA']
                failure_streak += 1
            else:
                if failure_streak >= 2:
                    consecutive_failures.append({
                        'conductor': driver,
                        'fallos_consecutivos': failure_streak,
                        'fecha_inicio': streak_start,
                        'fecha_fin': row['FECHA']
                    })
                failure_streak = 0
                streak_start = None
    
    return consecutive_failures

def identify_critical_patterns(df: pd.DataFrame) -> List[str]:
    """
    Identifica patrones críticos en los datos
    """
    patterns = []
    
    # Analizar patrones de fatiga
    if 'FATIGA' in df.columns:
        fatigue_rate = df['FATIGA'].value_counts(normalize=True).get('SI', 0)
        if fatigue_rate > 0.3:
            patterns.append(f"Alta incidencia de fatiga ({fatigue_rate:.1%})")
    
    # Analizar patrones de tiempo
    df['HORA'] = pd.to_datetime(df['FECHA']).dt.hour
    high_risk_hours = df[df['RESULTADO'] == 'NO CUMPLE']['HORA'].value_counts()
    peak_hours = high_risk_hours[high_risk_hours > high_risk_hours.mean() + high_risk_hours.std()]
    
    if len(peak_hours) > 0:
        patterns.append(f"Horas críticas identificadas: {', '.join(map(str, peak_hours.index))}")
    
    return patterns

def recommend_immediate_actions(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Genera recomendaciones de acciones inmediatas basadas en el análisis
    """
    actions = []
    
    # Analizar conductores de alto riesgo
    high_risk_drivers = identify_high_risk_drivers(df)
    if high_risk_drivers:
        actions.append({
            'tipo': 'SUPERVISIÓN_INTENSIVA',
            'descripcion': 'Implementar supervisión intensiva para conductores de alto riesgo',
            'conductores': [d['conductor'] for d in high_risk_drivers if d['nivel_riesgo'] == 'ALTO']
        })
    
    # Analizar patrones críticos
    critical_trends = analyze_critical_trends(df)
    if critical_trends['recent_failure_rate'] > 25:
        actions.append({
            'tipo': 'REVISIÓN_URGENTE',
            'descripcion': 'Realizar revisión urgente del sistema de control',
            'tasa_fallo': critical_trends['recent_failure_rate']
        })
    
    # Analizar fallos consecutivos
    if critical_trends['consecutive_failures']:
        actions.append({
            'tipo': 'INTERVENCIÓN_INMEDIATA',
            'descripcion': 'Intervenir en casos de fallos consecutivos',
            'casos': len(critical_trends['consecutive_failures'])
        })
    
    return actions