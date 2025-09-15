"""
Sistema de Análisis de Inspecciones Vehiculares
---------------------------------------------
normalizer.py - Módulo de normalización de datos

Este módulo contiene las funciones de normalización para diferentes tipos de datos
en el sistema de inspecciones vehiculares.
"""

import re
from unidecode import unidecode
from typing import Optional, Union

def normalize_text(text: Optional[Union[str, int, float]]) -> str:
    """
    Normaliza texto eliminando espacios extras y aplicando capitalización correcta.
    Preserva caracteres especiales importantes como la ñ.
    
    Args:
        text: Texto a normalizar (puede ser string, int o float)
        
    Returns:
        Texto normalizado
    """
    if text is None:
        return ""
        
    # Convertir a string si es número
    text_str = str(text)
        
    # Eliminar espacios extras
    text = " ".join(text_str.strip().split())
    
    # Convertir a minúsculas primero para un mejor manejo
    text = text.lower()
    
    # Lista de palabras que no deben ser capitalizadas (artículos, preposiciones, etc.)
    skip_words = {'de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'o', 'u', 'en', 'a'}
    
    # Dividir el texto en palabras y capitalizar cada una excepto las que están en skip_words
    words = text.split()
    for i in range(len(words)):
        if i == 0 or words[i] not in skip_words:
            # Preservar la ñ al capitalizar
            if words[i].startswith('ñ'):
                words[i] = 'Ñ' + words[i][1:]
            else:
                words[i] = words[i].capitalize()
    
    return ' '.join(words)

def normalize_plate(plate: Optional[Union[str, int]]) -> str:
    """
    Normaliza placas vehiculares eliminando espacios y estandarizando formato.
    Maneja múltiples formatos válidos de placas colombianas.
    
    Args:
        plate: Placa vehicular a normalizar (puede ser string o número)
        
    Returns:
        Placa normalizada
    """
    if plate is None:
        return ""
    
    # Convertir a string si es número
    plate_str = str(plate)
    
    # Eliminar espacios y caracteres especiales, convertir a mayúsculas
    plate = re.sub(r'[^A-Za-z0-9]', '', plate_str.strip()).upper()
    
    # Patrones válidos de placas colombianas
    patterns = [
        r'^[A-Z]{3}\d{3}$',      # Formato estándar: ABC123
        r'^[A-Z]{2}\d{4}$',      # Formato especial: AB1234
        r'^[A-Z]{3}\d{2}[A-Z]$', # Formato diplomático: ABC12D
        r'^\d{3}[A-Z]{3}$'       # Formato de motos: 123ABC
    ]
    
    # Verificar si la placa coincide con algún formato válido
    is_valid = any(re.match(pattern, plate) for pattern in patterns)
    
    if not is_valid:
        # Intentar corregir errores comunes
        corrections = {
            'O': '0',  # Letra O por número 0
            'I': '1',  # Letra I por número 1
            'S': '5',  # Letra S por número 5
            'Z': '2'   # Letra Z por número 2
        }
        
        corrected_plate = plate
        for letter, number in corrections.items():
            # Solo corregir en la parte numérica esperada
            if len(plate) == 6:  # Formato ABC123
                corrected_plate = corrected_plate[:3] + corrected_plate[3:].replace(letter, number)
        
        # Verificar si la placa corregida es válida
        is_valid = any(re.match(pattern, corrected_plate) for pattern in patterns)
        if is_valid:
            return corrected_plate
        
        # Si aún no es válida, mantener pero marcar como pendiente de revisión
        return f"REV-{plate}"
    
    return plate

def normalize_contract(contract: Optional[str]) -> str:
    """
    Normaliza nombres de contratos aplicando reglas específicas.
    
    Args:
        contract: Nombre del contrato
        
    Returns:
        Contrato normalizado
    """
    if not contract:
        return ""
    
    # Normalizar texto base
    contract = normalize_text(contract)
    
    # Aplicar correcciones específicas
    replacements = {
        "Operacion": "Operación",
        "Administracion": "Administración"
    }
    
    return replacements.get(contract, contract)

def normalize_location(location: Optional[str]) -> str:
    """
    Normaliza nombres de ubicaciones/campos preservando características importantes.
    
    Args:
        location: Nombre de la ubicación
        
    Returns:
        Ubicación normalizada
    """
    if not location:
        return ""
    
    # Normalizar texto base
    location = normalize_text(location)
    
    # Mapeo de nombres alternativos y correcciones
    location_mapping = {
        "Dina": "Dina",
        "Casino Dina": "Dina Casino",
        "Yaguara": "Yaguará",
        "Tello": "Tello",
        "San Francisco": "San Francisco",
        "Neiva": "Neiva",
        "Quifa": "Quifa",
        "Cajua": "Cajuá"
    }
    
    # Aplicar mapeo si existe
    normalized = location_mapping.get(location, location)
    
    # Lista de ubicaciones principales
    main_locations = {"Dina", "Yaguará", "Tello", "San Francisco", "Neiva", "Quifa", "Cajuá"}
    
    # Si no es una ubicación principal, agregar prefijo pero preservar el nombre original
    if normalized not in main_locations:
        normalized = f"Otra-{normalized}"
    
    return normalized