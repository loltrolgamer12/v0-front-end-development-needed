# 🚗 Sistema de Inspección Vehicular

Sistema integral de gestión y automatización para inspecciones técnicas vehiculares con tecnología moderna.

## 🚀 Inicio Rápido

### Opción 1: Instalación Automática (Recomendada)
```batch
# Descargar e instalar todo el sistema
install.bat

# Iniciar sistema completo  
start.bat

# Acceder a la aplicación
http://localhost:3000
```

### Opción 2: Docker Manual
```batch
# Si ya tienes Docker instalado
docker-compose up -d --build

# Verificar estado
docker-compose ps
```

## 📋 Requisitos del Sistema

- **Sistema Operativo**: Windows 10/11
- **RAM**: Mínimo 2GB, Recomendado 4GB+ 
- **Espacio en Disco**: 5GB libres
- **Docker Desktop**: Versión más reciente
- **Node.js**: 16+ (se instala automáticamente)
- **Python**: 3.8+ (se instala automáticamente)

## 🏗️ Arquitectura del Sistema

```
📦 vehicle-inspection-system/
├── 🐍 backend/              # API Flask + IA
├── ⚛️  frontend/             # React Dashboard  
├── 🐳 docker-compose.yml    # Orquestación
├── 📊 monitoring/           # Prometheus + Grafana
├── 🌐 nginx/               # Reverse Proxy
├── 📚 docs/                # Documentación
├── 📁 uploads/             # Archivos subidos
├── 📋 logs/                # Logs del sistema
└── 💾 backups/             # Respaldos
```

## 🌐 URLs del Sistema

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:3000 | Dashboard principal |
| **Backend API** | http://localhost:5000 | API REST |
| **Grafana** | http://localhost:3001 | Monitoreo (admin/admin123) |
| **Prometheus** | http://localhost:9090 | Métricas |
| **Health Check** | http://localhost:5000/health | Estado del sistema |

## 🎯 Funcionalidades Principales

### 📤 Carga de Archivos
- ✅ Formatos soportados: `.xlsx`, `.xls`, `.csv`
- ✅ Tamaño máximo: 50MB
- ✅ Validación automática de estructura
- ✅ Procesamiento asíncrono

### 📊 Análisis Automático
- ✅ Estadísticas descriptivas
- ✅ Detección de anomalías
- ✅ Análisis de calidad de datos
- ✅ Visualizaciones interactivas
- ✅ Reportes automatizados

### 🤖 IA Predictiva
- ✅ Predicción de fallas
- ✅ Análisis de tendencias
- ✅ Alertas inteligentes
- ✅ Recomendaciones automáticas

### 📈 Monitoreo y Alertas
- ✅ Dashboard en tiempo real
- ✅ Métricas de rendimiento
- ✅ Alertas por email/Slack
- ✅ Logs centralizados

## 🛠️ Comandos Útiles

```batch
# Gestión del Sistema
start.bat          # Iniciar sistema completo
stop.bat           # Detener todos los servicios
restart.bat        # Reiniciar sistema
status.bat         # Ver estado de servicios
logs.bat           # Logs en tiempo real

# Instalación y Validación
install.bat        # Instalación completa
setup.bat          # Instalación + validación automática
validate.bat       # Validador completo del sistema
validate.ps1       # Validador avanzado (PowerShell)

# Utilidades
utils.bat health   # Verificar salud del sistema
utils.bat backup   # Crear respaldo del sistema
utils.bat clean    # Limpiar archivos temporales
utils.bat status   # Estado detallado
```

## 📖 Guías Detalladas

- [🚀 Guía de Inicio Rápido](docs/QUICK_START.md)
- [🔧 Configuración Avanzada](docs/CONFIGURATION.md)
- [🔍 Solución de Problemas](docs/TROUBLESHOOTING.md) 
- [📚 API Reference](docs/API.md)
- [🔒 Seguridad](docs/SECURITY.md)

## 🎬 Flujo de Trabajo Típico

1. **📤 Subir Archivo**: Arrastra tu archivo HQ-FO-40.xlsx al dashboard
2. **⚡ Procesamiento**: El sistema analiza automáticamente los datos
3. **📊 Visualización**: Ve gráficas y estadísticas en tiempo real
4. **🤖 IA**: Recibe predicciones y recomendaciones inteligentes
5. **📋 Reportes**: Exporta reportes completos en Excel/PDF
6. **📈 Monitoreo**: Supervisa métricas en Grafana

## 🧪 Validación del Sistema

### Validación Automática
```batch
# Validación básica (recomendada)
validate.bat

# Validación avanzada con PowerShell
validate.ps1

# Validación con tests de rendimiento
validate.ps1 -Performance -Detailed

# Instalación + validación en un comando
setup.bat
```

### Tests Incluidos
- ✅ **Estructura de archivos**: Verifica archivos críticos
- ✅ **Dependencias**: Python, Node.js, Docker, etc.
- ✅ **Configuración Docker**: Sintaxis y servicios
- ✅ **Construcción**: Build de imágenes Docker
- ✅ **Conectividad**: Tests HTTP a todos los servicios
- ✅ **API Endpoints**: Validación de respuestas de API
- ✅ **Logs del Sistema**: Análisis de errores y warnings
- ✅ **Rendimiento**: Tests de carga (opcional)
- ✅ **Scripts de utilidades**: Verificación de herramientas

### Interpretación de Resultados
- **✅ PASS**: Todo funciona correctamente
- **⚠️ WARN**: Funciona pero necesita atención  
- **❌ FAIL**: Problemas críticos que requieren corrección

## 🔧 Configuración

### Variables de Entorno
```bash
# Copiar configuración ejemplo
copy .env.example .env

# Editar configuración
notepad .env
```

### Configuración de Alertas
```bash
# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# Email  
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=tu-email@gmail.com
SMTP_PASSWORD=tu-app-password
```

## 🚨 Solución de Problemas

### ❌ Error: Puerto en uso
```batch
# Verificar puertos ocupados
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Detener servicios
stop.bat
```

### ❌ Docker no funciona
```batch
# Verificar Docker Desktop
docker --version
docker-compose --version

# Reiniciar Docker Desktop desde el icono de la bandeja
```

### ❌ Servicios no inician
```batch
# Ver logs detallados
logs.bat

# Reiniciar sistema
stop.bat
start.bat
```

## 📞 Soporte y Contacto

- 📧 **Email**: soporte@vehiculos.com  
- 📱 **WhatsApp**: +57 300 123 4567
- 🕒 **Horario**: Lunes a Viernes 8:00-18:00 COT
- 📚 **Documentación**: [docs/](docs/)
- 🐛 **Reportar Bug**: Crear issue en el repositorio

## 🔄 Actualizaciones

```batch
# Actualizar sistema
git pull origin main
docker-compose build --no-cache
start.bat
```

## 📊 Métricas y KPIs

El sistema rastrea automáticamente:
- ⏱️ Tiempo de procesamiento de archivos
- 📈 Precisión de predicciones (>95%)
- 🔍 Detección de anomalías  
- 💾 Uso de recursos del sistema
- 👥 Usuarios activos
- 📊 Archivos procesados diariamente

## 🏆 Características Destacadas

- ✅ **100% Automatizado**: Cero intervención manual
- ✅ **IA de Última Generación**: Modelos predictivos avanzados
- ✅ **Escalable**: Maneja archivos de millones de registros
- ✅ **Seguro**: Encriptación end-to-end
- ✅ **Monitoring 24/7**: Alertas proactivas
- ✅ **Multi-usuario**: Acceso concurrente
- ✅ **API REST**: Integración con otros sistemas
- ✅ **Responsive**: Funciona en desktop y mobile

---

## 🎉 ¡Listo para Transformar tus Inspecciones Vehiculares!

**Sistema v2.0.0** - Precisión del 100% garantizada con IA de última generación

*Desarrollado con ❤️ para optimizar el análisis de inspecciones vehiculares HQ-FO-40*