"""
Funciones de normalización para el procesamiento de datos.
"""
import unicodedata
import re
import pandas as pd

def normalize_name(name: str) -> str:
    """
    Normaliza un nombre para comparación:
    - Elimina tildes y caracteres especiales
    - Convierte a mayúsculas
    - Elimina espacios múltiples
    - Elimina puntuación
    
    Args:
        name: Nombre a normalizar
    Returns:
        Nombre normalizado
    """
    if not name or pd.isna(name):
        return ""
        
    # Convertir a mayúsculas y eliminar espacios extra
    name = str(name).upper().strip()
    
    # Eliminar tildes
    name = ''.join(c for c in unicodedata.normalize('NFD', name)
                  if unicodedata.category(c) != 'Mn')
    
    # Eliminar puntuación y caracteres especiales
    name = re.sub(r'[^\w\s]', ' ', name)
    
    # Eliminar espacios múltiples
    name = re.sub(r'\s+', ' ', name)
    
    return name.strip()

def extract_name_parts(name: str) -> tuple:
    """
    Extrae las partes de un nombre (nombres y apellidos).
    Maneja casos como iniciales y nombres parciales.
    """
    parts = normalize_name(name).split()
    if not parts:
        return [], []
    
    # Encontrar el punto donde empiezan los apellidos (normalmente después del primer o segundo nombre)
    # En español, asumimos que los apellidos son las últimas 1 o 2 palabras
    if len(parts) >= 3:
        nombres = parts[:-2]  # Todo excepto las últimas dos palabras son nombres
        apellidos = parts[-2:]  # Las últimas dos palabras son apellidos
    else:
        # Si hay menos de 3 palabras, asumimos que la última es apellido
        nombres = parts[:-1]
        apellidos = parts[-1:]
    
    return nombres, apellidos

def names_match(name1: str, name2: str, strict: bool = False) -> bool:
    """
    Compara dos nombres para determinar si son la misma persona.
    Maneja casos como:
    - Nombres parciales (Juan David vs Juan)
    - Iniciales (J. D. Gomez vs Juan David Gomez)
    - Orden diferente de nombres/apellidos
    - Nombres/apellidos faltantes
    
    Args:
        name1: Primer nombre
        name2: Segundo nombre
        strict: Si es True, requiere coincidencia exacta después de normalización
    Returns:
        True si los nombres coinciden según el criterio especificado
    """
    if not name1 or not name2:
        return False
        
    # Normalizar ambos nombres
    name1 = normalize_name(name1)
    name2 = normalize_name(name2)
    
    if strict:
        return name1 == name2
    
    # Extraer nombres y apellidos de cada cadena
    nombres1, apellidos1 = extract_name_parts(name1)
    nombres2, apellidos2 = extract_name_parts(name2)
    
    # Verificar coincidencia de apellidos (al menos uno debe coincidir)
    apellidos_coinciden = bool(set(apellidos1) & set(apellidos2))
    if not apellidos_coinciden:
        return False
    
    # Si hay coincidencia de apellidos, verificar nombres
    # Debe haber al menos una coincidencia en nombres o iniciales
    nombres_coinciden = False
    
    # Crear conjunto de iniciales y nombres completos para comparación
    iniciales1 = {n[0] for n in nombres1 if n}
    iniciales2 = {n[0] for n in nombres2 if n}
    
    # Verificar coincidencia de nombres o iniciales
    nombres_completos_coinciden = bool(set(nombres1) & set(nombres2))
    iniciales_coinciden = bool(iniciales1 & iniciales2)
    
    return apellidos_coinciden and (nombres_completos_coinciden or iniciales_coinciden)