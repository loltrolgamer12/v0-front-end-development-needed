import pandas as pd
from typing import Dict, Any, List

class NameNormalizer:
    def __init__(self):
        self.common_prefixes = ['sr', 'sr.', 'sra', 'sra.', 'srta', 'srta.', 'don', 'doña']
        self.common_conjunctions = ['y', 'e', 'de', 'del', 'la', 'las', 'los', 'el']
    
    def normalize(self, name: str) -> str:
        """
        Normaliza un nombre para estandarizar su formato
        """
        if not name or not isinstance(name, str):
            return ""
        
        # Convertir a minúsculas y eliminar espacios extras
        normalized = name.lower().strip()
        
        # Eliminar prefijos comunes
        for prefix in self.common_prefixes:
            if normalized.startswith(prefix + ' '):
                normalized = normalized[len(prefix):].strip()
        
        # Eliminar caracteres especiales y números
        normalized = ''.join(c for c in normalized if c.isalpha() or c.isspace())
        
        # Eliminar conjunciones y artículos
        words = normalized.split()
        words = [w for w in words if w not in self.common_conjunctions]
        
        # Capitalizar cada palabra
        normalized = ' '.join(w.capitalize() for w in words if w)
        
        return normalized

def normalize_inspection_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Normaliza los datos de inspección
    """
    normalizer = NameNormalizer()
    
    normalized_data = []
    for record in data:
        normalized_record = record.copy()
        
        # Normalizar nombres de conductores
        if 'CONDUCTOR' in normalized_record:
            normalized_record['CONDUCTOR'] = normalizer.normalize(normalized_record['CONDUCTOR'])
        
        # Normalizar respuestas
        for key, value in normalized_record.items():
            if isinstance(value, str):
                # Normalizar respuestas de sí/no
                if value.lower() in ['si', 'sí', 's', 'yes', 'y']:
                    normalized_record[key] = 'SI'
                elif value.lower() in ['no', 'n']:
                    normalized_record[key] = 'NO'
                # Normalizar campos de texto
                elif key not in ['CONDUCTOR', 'FECHA']:
                    normalized_record[key] = value.upper().strip()
        
        normalized_data.append(normalized_record)
    
    return normalized_data