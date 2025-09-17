# 🚀 Guía de Inicio Rápido

## Instalación en 3 Pasos

### Paso 1: Instalación Automática
```batch
# Ejecutar instalador (como Administrador recomendado)
install.bat
```

El instalador configurará automáticamente:
- ✅ Docker Desktop
- ✅ Node.js LTS
- ✅ Python 3.11
- ✅ Dependencias del sistema
- ✅ Estructura del proyecto

### Paso 2: Iniciar el Sistema
```batch  
# Iniciar todos los servicios
start.bat
```

### Paso 3: Acceder a la Aplicación
```
🌐 Abrir navegador en: http://localhost:3000
```

## 🎯 Primer Uso

### 1. Cargar Archivo de Inspección
1. Haz clic en **"Cargar Excel"** 
2. Selecciona tu archivo `HQ-FO-40.xlsx`
3. Espera el procesamiento automático (30-60 segundos)

### 2. Ver Dashboard Interactivo  
- 📊 **Gráficas automáticas** de distribución de datos
- 📈 **Métricas clave** calculadas en tiempo real  
- 🔍 **Análisis de anomalías** con IA
- ⚠️ **Alertas inteligentes** de problemas detectados

### 3. Explorar Funcionalidades
- **Análisis Predictivo**: Ver predicciones de fallas
- **Reportes**: Exportar análisis en Excel/PDF
- **Monitoreo**: Revisar métricas en Grafana (puerto 3001)
- **API**: Integrar con otros sistemas

## 🌐 URLs Importantes

| Servicio | URL | Usuario | Contraseña |
|----------|-----|---------|------------|
| **Dashboard Principal** | http://localhost:3000 | - | - |
| **API Backend** | http://localhost:5000 | - | - |
| **Grafana Monitoring** | http://localhost:3001 | admin | admin123 |
| **Prometheus Metrics** | http://localhost:9090 | - | - |

## 🔧 Comandos Esenciales

```batch
# Sistema
start.bat      # Iniciar todo
stop.bat       # Detener todo  
restart.bat    # Reiniciar
status.bat     # Ver estado
logs.bat       # Ver logs

# Verificación
http://localhost:5000/health    # Health check
```

## 📊 Ejemplo de Análisis

### Entrada: Archivo HQ-FO-40.xlsx
```
Columnas típicas:
- Placa del vehículo
- Fecha de inspección  
- Tipo de vehículo
- Resultado de inspección
- Observaciones
- Técnico responsable
```

### Salida: Dashboard Automático
- 📈 **Gráfica de barras**: Distribución por tipo de vehículo
- 🥧 **Gráfica circular**: Porcentaje de aprobación/rechazo
- 📊 **Línea de tiempo**: Tendencias mensuales
- 🎯 **KPIs**: Tasa de aprobación, tiempo promedio, etc.
- 🤖 **Predicciones**: Vehículos con alta probabilidad de falla

## 🚨 Resolución Rápida de Problemas

### ❌ Error: "Docker not found"
```batch
# Instalar Docker Desktop
# URL: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
# Reiniciar Windows después de instalar
```

### ❌ Error: "Port already in use"  
```batch
# Detener servicios conflictivos
stop.bat

# Verificar puertos
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Reiniciar sistema
start.bat
```

### ❌ Error: "File upload failed"
- ✅ Verificar que el archivo sea `.xlsx`, `.xls` o `.csv`
- ✅ Confirmar tamaño menor a 50MB
- ✅ Revisar que tenga datos válidos

## 📱 Acceso Móvil

El sistema es completamente responsive:
- 📱 **Smartphone**: Funcionalidad completa en el navegador móvil  
- 💻 **Tablet**: Experiencia optimizada para pantalla tactil
- 🖥️ **Desktop**: Experiencia completa con todas las funciones

## 🎓 Tutorial Interactivo

### Escenario: Análisis de 1000 Inspecciones
1. **Subir archivo** (HQ-FO-40-sample.xlsx)
2. **Esperar procesamiento** (~45 segundos)  
3. **Revisar dashboard** con métricas automáticas
4. **Explorar gráficas** interactivas
5. **Ver alertas** de anomalías detectadas
6. **Exportar reporte** completo

## ⚡ Consejos Pro

- 🔄 **Auto-refresh**: Dashboard se actualiza automáticamente
- 💾 **Historial**: Se mantiene registro de todos los análisis
- 🔍 **Filtros**: Usa filtros de fecha/tipo para análisis específicos
- 📋 **Exportar**: Descarga reportes en múltiples formatos
- 🚨 **Alertas**: Configura notificaciones por email/Slack

## 🏁 ¡Listo para Producción!

Una vez completados estos pasos, tu sistema estará:
- ✅ **Funcionando 24/7** con monitoreo automático
- ✅ **Procesando archivos** en segundos  
- ✅ **Generando insights** con IA
- ✅ **Alertando proactivamente** sobre anomalías
- ✅ **Escalando automáticamente** según la carga

---

**¿Problemas?** Consulta [TROUBLESHOOTING.md](TROUBLESHOOTING.md) o contacta al soporte técnico.

**¿Más funciones?** Revisa la [documentación completa](README.md) para configuración avanzada.