# 🧪 Validación del Sistema

## Descripción

Los scripts de validación verifican que el sistema esté completamente funcional después de la instalación. Incluyen tests exhaustivos de todos los componentes.

## Scripts Disponibles

### `validate.bat` - Validador Básico
Validador rápido y compatible que verifica los componentes esenciales:

```batch
validate.bat
```

**Tests incluidos:**
- ✅ Estructura de archivos
- ✅ Dependencias del sistema
- ✅ Configuración Docker
- ✅ Construcción de imágenes
- ✅ Inicio de servicios
- ✅ Conectividad HTTP
- ✅ Funcionalidad básica
- ✅ Scripts de utilidades

### `validate.ps1` - Validador Avanzado
Validador completo con análisis detallado y métricas de rendimiento:

```powershell
# Validación estándar
.\validate.ps1

# Con análisis detallado
.\validate.ps1 -Detailed

# Con tests de rendimiento
.\validate.ps1 -Performance

# Omitir construcción Docker (más rápido)
.\validate.ps1 -SkipBuild

# Validación completa
.\validate.ps1 -Detailed -Performance
```

**Tests adicionales:**
- 📊 Análisis de rendimiento
- 🔍 Validación de contenido de respuestas API
- 📋 Análisis detallado de logs
- ⏱️ Métricas de tiempo de respuesta
- 🏥 Monitoreo de estabilización de servicios
- 📈 Estadísticas de éxito/fallo

## Interpretación de Resultados

### Códigos de Salida
- **0**: ✅ Validación exitosa - Sistema listo
- **1**: ⚠️ Advertencias - Sistema funcional con problemas menores
- **2**: ❌ Fallas críticas - Sistema requiere atención
- **3**: 💥 Error crítico durante validación

### Tipos de Tests
- **✅ PASS**: Componente funciona perfectamente
- **⚠️ WARN**: Funciona pero necesita atención
- **❌ FAIL**: Problema crítico que requiere corrección

## Ejemplos de Uso

### Validación Después de Instalación
```batch
# Después de install.bat
validate.bat

# O usar setup automático
setup.bat  # install.bat + validate.bat
```

### Validación de Producción
```powershell
# Validación completa para producción
.\validate.ps1 -Detailed -Performance

# Verificar solo conectividad (rápido)
.\validate.ps1 -SkipBuild
```

### Troubleshooting
```batch
# Si hay problemas, usar validación detallada
validate.ps1 -Detailed

# Revisar logs generados
type validation_*.log

# Verificar salud específica
utils.bat health
```

## Logs Generados

Los validadores crean logs detallados:

- `validation_YYYYMMDD_HHMMSS.log` (validate.bat)
- `validation_detailed_YYYYMMDD_HHMMSS.log` (validate.ps1)

### Ejemplo de Log
```
[2024-09-16 14:30:15] [TEST] === ESTRUCTURA DE ARCHIVOS ===
[2024-09-16 14:30:15] [PASS] Todos los archivos requeridos están presentes
[2024-09-16 14:30:16] [TEST] === DEPENDENCIAS DEL SISTEMA ===
[2024-09-16 14:30:17] [INFO] Dependency: Python - Version: Python 3.11.5 - Status: OK
[2024-09-16 14:30:18] [PASS] Todas las dependencias están instaladas correctamente
```

## Solución de Problemas Comunes

### Fallas de Dependencias
```batch
# Reinstalar dependencias
install.bat

# Verificar manualmente
python --version
node --version
docker --version
```

### Fallas de Conectividad
```batch
# Verificar puertos
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Reiniciar servicios
stop.bat
start.bat
```

### Fallas de Docker
```batch
# Verificar Docker Desktop
docker info

# Reconstruir imágenes
docker-compose build --no-cache
```

## Automatización

### CI/CD Pipeline
```yaml
# Ejemplo para GitHub Actions
- name: Validate System
  run: |
    .\validate.ps1 -Detailed -Performance
  shell: powershell
```

### Monitoreo Continuo
```batch
# Ejecutar validación cada hora
schtasks /create /tn "SystemValidation" /tr "validate.bat" /sc hourly
```

## Mejores Prácticas

1. **Después de cada instalación**: Siempre ejecutar `validate.bat`
2. **Antes de producción**: Usar `validate.ps1 -Detailed -Performance`
3. **Troubleshooting**: Revisar logs detallados primero
4. **Monitoreo**: Ejecutar validaciones periódicas
5. **Documentación**: Mantener logs para análisis histórico

## Personalización

Los scripts pueden modificarse para incluir tests específicos:

```powershell
# Agregar test personalizado en validate.ps1
function Test-CustomFunctionality {
    Write-TestHeader "MI TEST PERSONALIZADO"
    
    # Tu lógica de test aquí
    
    if ($testPassed) {
        Write-TestPass "Test personalizado exitoso"
    } else {
        Write-TestFail "Test personalizado falló"
    }
}
```

---

**💡 Tip**: Usar `setup.bat` para nuevas instalaciones, `validate.bat` para verificaciones rápidas, y `validate.ps1 -Detailed -Performance` para análisis completos.