import pandas as pd
from typing import List, Dict, Any

def process_inspection_data(data: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Procesa los datos de inspección recibidos y los convierte en un DataFrame
    """
    df = pd.DataFrame(data)
    df['FECHA'] = pd.to_datetime(df['FECHA'])
    return df

def calculate_compliance_metrics(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Calcula métricas de cumplimiento por conductor
    """
    metrics = {
        'total_inspections': len(df),
        'compliance_rate': None,
        'by_driver': {}
    }
    
    # Calcular tasa de cumplimiento general
    failures = df[df['RESULTADO'] == 'NO CUMPLE'].shape[0]
    metrics['compliance_rate'] = ((len(df) - failures) / len(df)) * 100 if len(df) > 0 else 0
    
    # Calcular métricas por conductor
    for driver in df['CONDUCTOR'].unique():
        driver_data = df[df['CONDUCTOR'] == driver]
        driver_failures = driver_data[driver_data['RESULTADO'] == 'NO CUMPLE'].shape[0]
        metrics['by_driver'][driver] = {
            'total_inspections': len(driver_data),
            'compliance_rate': ((len(driver_data) - driver_failures) / len(driver_data)) * 100 if len(driver_data) > 0 else 0,
            'failures': driver_failures
        }
    
    return metrics