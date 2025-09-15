import pandas as pd
import numpy as np
from typing import Dict, Any, List

def analyze_trends(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Analiza tendencias en los datos de inspección
    """
    trends = {
        'temporal': analyze_temporal_trends(df),
        'drivers': analyze_driver_trends(df),
        'patterns': analyze_failure_patterns(df)
    }
    return trends

def analyze_temporal_trends(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Analiza tendencias temporales en los datos
    """
    df['FECHA'] = pd.to_datetime(df['FECHA'])
    monthly_stats = df.groupby(pd.Grouper(key='FECHA', freq='M')).agg({
        'RESULTADO': ['count', lambda x: (x == 'NO CUMPLE').sum()]
    }).reset_index()
    
    monthly_stats.columns = ['fecha', 'total_inspecciones', 'fallos']
    monthly_stats['tasa_cumplimiento'] = (1 - monthly_stats['fallos'] / monthly_stats['total_inspecciones']) * 100
    
    return monthly_stats.to_dict(orient='records')

def analyze_driver_trends(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Analiza tendencias por conductor
    """
    driver_stats = df.groupby('CONDUCTOR').agg({
        'RESULTADO': ['count', lambda x: (x == 'NO CUMPLE').sum()]
    }).reset_index()
    
    driver_stats.columns = ['conductor', 'total_inspecciones', 'fallos']
    driver_stats['tasa_cumplimiento'] = (1 - driver_stats['fallos'] / driver_stats['total_inspecciones']) * 100
    
    return driver_stats.to_dict(orient='records')

def analyze_failure_patterns(df: pd.DataFrame) -> Dict[str, List[str]]:
    """
    Identifica patrones comunes de fallo
    """
    failure_df = df[df['RESULTADO'] == 'NO CUMPLE']
    
    patterns = {
        'common_issues': [],
        'high_risk_periods': [],
        'recommendations': []
    }
    
    # Analizar problemas comunes
    if len(failure_df) > 0:
        patterns['common_issues'] = identify_common_issues(failure_df)
        patterns['high_risk_periods'] = identify_high_risk_periods(failure_df)
        patterns['recommendations'] = generate_recommendations(patterns['common_issues'])
    
    return patterns

def identify_common_issues(failure_df: pd.DataFrame) -> List[str]:
    """
    Identifica los problemas más comunes en los fallos
    """
    issues = []
    
    if 'FATIGA' in failure_df.columns:
        fatigue_rate = (failure_df['FATIGA'] == 'SI').mean()
        if fatigue_rate > 0.3:
            issues.append(f"Alta tasa de fatiga detectada ({fatigue_rate:.1%})")
            
    if 'HORAS_SUENO' in failure_df.columns:
        sleep_issues = (failure_df['HORAS_SUENO'] < 7).mean()
        if sleep_issues > 0.3:
            issues.append(f"Problemas frecuentes con horas de sueño ({sleep_issues:.1%})")
    
    return issues

def identify_high_risk_periods(failure_df: pd.DataFrame) -> List[str]:
    """
    Identifica períodos de alto riesgo
    """
    periods = []
    
    if 'FECHA' in failure_df.columns:
        failure_df['HORA'] = pd.to_datetime(failure_df['FECHA']).dt.hour
        high_risk_hours = failure_df.groupby('HORA').size()
        peak_hours = high_risk_hours[high_risk_hours > high_risk_hours.mean() + high_risk_hours.std()].index
        
        if len(peak_hours) > 0:
            periods.append(f"Horas de mayor riesgo: {', '.join(map(str, peak_hours))}")
    
    return periods

def generate_recommendations(issues: List[str]) -> List[str]:
    """
    Genera recomendaciones basadas en los problemas identificados
    """
    recommendations = []
    
    for issue in issues:
        if 'fatiga' in issue.lower():
            recommendations.append("Implementar pausas obligatorias más frecuentes")
            recommendations.append("Revisar horarios de trabajo y descanso")
        
        if 'sueño' in issue.lower():
            recommendations.append("Asegurar períodos de descanso adecuados")
            recommendations.append("Evaluar horarios nocturnos")
    
    return recommendations