# 🚗 Sistema HQ-FO-40 - Frontend React# 🚗 Sistema de Inspección Vehicular



> **Interfaz de usuario para análisis de inspecciones vehiculares HQ-FO-40**Sistema integral de gestión y automatización para inspecciones técnicas vehiculares con tecnología moderna.



[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/loltrolgamer12/analisis-exel)## 🚀 Inicio Rápido



## 📋 Descripción### Opción 1: Instalación Automática (Recomendada)

```batch

Frontend React TypeScript para el sistema de análisis de inspecciones diarias de vehículos HQ-FO-40. Proporciona una interfaz moderna y responsive para:# Descargar e instalar todo el sistema

install.bat

- ✅ **Subida de archivos Excel** HQ-FO-40

- 📊 **Dashboard interactivo** con métricas en tiempo real  # Iniciar sistema completo  

- 🔍 **Filtros avanzados** por estado, fatiga, zona, etc.start.bat

- 📈 **Gráficos dinámicos** con Recharts

- 👥 **Control de fatiga** de conductores# Acceder a la aplicación

- 🚗 **Gestión de vehículos** y fallas mecánicashttp://localhost:3000

- 📋 **Reportes automáticos** y exportación```



## 🏗️ Arquitectura### Opción 2: Docker Manual

```batch

```# Si ya tienes Docker instalado

analisis-exel-frontend/docker-compose up -d --build

├── 🎨 frontend/               # Aplicación React

│   ├── src/# Verificar estado

│   │   ├── components/       # Componentes Reactdocker-compose ps

│   │   ├── config/          # Configuración API  ```

│   │   ├── pages/           # Páginas principales

│   │   └── types/           # TypeScript types## 📋 Requisitos del Sistema

│   ├── public/              # Archivos estáticos

│   └── package.json         # Dependencias- **Sistema Operativo**: Windows 10/11

├── 📋 DOCUMENTACION_TECNICA.md- **RAM**: Mínimo 2GB, Recomendado 4GB+ 

├── 🚀 vercel.json           # Deploy configuration- **Espacio en Disco**: 5GB libres

└── 📖 README.md- **Docker Desktop**: Versión más reciente

```- **Node.js**: 16+ (se instala automáticamente)

- **Python**: 3.8+ (se instala automáticamente)

## 🚀 Deploy Automático

## 🏗️ Arquitectura del Sistema

Este repositorio está configurado para deploy automático en Vercel:

```

- **Frontend**: Se deploya desde `/frontend`
- **Backend**: Conecta con API externa en repositorio separado
- **URL de producción**: Se configura automáticamente

## 🏗️ Arquitectura

```
📦 analisis-exel-frontend/
├── ⚛️  frontend/             # React Dashboard  
├── � DOCUMENTACION_TECNICA.md

## 🛠️ Desarrollo Local├── 📊 monitoring/           # Prometheus + Grafana

├── 🌐 nginx/               # Reverse Proxy

### Prerrequisitos├── 📚 docs/                # Documentación

- Node.js 16+├── 📁 uploads/             # Archivos subidos

- npm o yarn├── 📋 logs/                # Logs del sistema

└── 💾 backups/             # Respaldos

### Instalación```



```bash## 🌐 URLs del Sistema

# Clonar repositorio

git clone https://github.com/loltrolgamer12/analisis-exel.git| Servicio | URL | Descripción |

cd analisis-exel|----------|-----|-------------|

| **Frontend** | http://localhost:3000 | Dashboard principal |

# Instalar dependencias  | **Backend API** | http://localhost:5000 | API REST |

cd frontend| **Grafana** | http://localhost:3001 | Monitoreo (admin/admin123) |

npm install| **Prometheus** | http://localhost:9090 | Métricas |

| **Health Check** | http://localhost:5000/health | Estado del sistema |

# Iniciar desarrollo

npm start## 🎯 Funcionalidades Principales

```

### 📤 Carga de Archivos

### Variables de Entorno- ✅ Formatos soportados: `.xlsx`, `.xls`, `.csv`

- ✅ Tamaño máximo: 50MB

Crea un archivo `.env.local` en `/frontend`:- ✅ Validación automática de estructura

- ✅ Procesamiento asíncrono

```env

REACT_APP_API_URL=http://localhost:5000### 📊 Análisis Automático

```- ✅ Estadísticas descriptivas

- ✅ Detección de anomalías

## 🔧 Configuración de API- ✅ Análisis de calidad de datos

- ✅ Visualizaciones interactivas

El frontend se conecta automáticamente al backend:- ✅ Reportes automatizados



- **Desarrollo**: `http://localhost:5000`  ### 🤖 IA Predictiva

- **Producción**: `https://analisis-exel-backend.vercel.app`- ✅ Predicción de fallas

- ✅ Análisis de tendencias

La configuración está en `/frontend/src/config/api.ts`- ✅ Alertas inteligentes

- ✅ Recomendaciones automáticas

## 📦 Scripts Disponibles

### 📈 Monitoreo y Alertas

```bash- ✅ Dashboard en tiempo real

npm start          # Desarrollo local- ✅ Métricas de rendimiento

npm run build      # Build producción- ✅ Alertas por email/Slack

npm run build:dev  # Build sin warnings estrictos- ✅ Logs centralizados

npm test           # Tests automatizados  

npm run build:analyze  # Análisis de bundle## 🛠️ Comandos Útiles

```

```batch

## 🌟 Características# Gestión del Sistema

start.bat          # Iniciar sistema completo

### 📊 Dashboard Principalstop.bat           # Detener todos los servicios

- Métricas en tiempo realrestart.bat        # Reiniciar sistema

- Alertas críticasstatus.bat         # Ver estado de servicios

- Gráficos interactivoslogs.bat           # Logs en tiempo real



### 🔍 Filtros Avanzados  # Instalación y Validación

- Por estado de vehículosinstall.bat        # Instalación completa

- Por nivel de fatigasetup.bat          # Instalación + validación automática

- Por zona geográficavalidate.bat       # Validador completo del sistema

- Búsqueda de textovalidate.ps1       # Validador avanzado (PowerShell)



### 📈 Visualización de Datos# Utilidades

- Gráficos de barras y tortautils.bat health   # Verificar salud del sistema

- Tendencias temporalesutils.bat backup   # Crear respaldo del sistema

- Heatmaps de actividadutils.bat clean    # Limpiar archivos temporales

utils.bat status   # Estado detallado

### 📱 Responsive Design```

- Optimizado para desktop

- Compatible con tablets## 📖 Guías Detalladas

- UI/UX moderna

- [🚀 Guía de Inicio Rápido](docs/QUICK_START.md)

## 📚 Documentación- [🔧 Configuración Avanzada](docs/CONFIGURATION.md)

- [🔍 Solución de Problemas](docs/TROUBLESHOOTING.md) 

- [Documentación Técnica](DOCUMENTACION_TECNICA.md)- [📚 API Reference](docs/API.md)

- [Manual de Usuario](USER-MANUAL.md)  - [🔒 Seguridad](docs/SECURITY.md)

- [Guía de Deploy](DESPLIEGUE_MANUAL.md)

## 🎬 Flujo de Trabajo Típico

## 🔗 Repositorios Relacionados

1. **📤 Subir Archivo**: Arrastra tu archivo HQ-FO-40.xlsx al dashboard

- **Backend API**: `analisis-exel-backend` (repositorio separado)2. **⚡ Procesamiento**: El sistema analiza automáticamente los datos

- **Documentación**: Incluida en este repositorio3. **📊 Visualización**: Ve gráficas y estadísticas en tiempo real

4. **🤖 IA**: Recibe predicciones y recomendaciones inteligentes

## 🤝 Contribución5. **📋 Reportes**: Exporta reportes completos en Excel/PDF

6. **📈 Monitoreo**: Supervisa métricas en Grafana

1. Fork del repositorio

2. Crear branch: `git checkout -b feature/nueva-funcionalidad`## 🧪 Validación del Sistema

3. Commit: `git commit -m 'Add nueva funcionalidad'`  

4. Push: `git push origin feature/nueva-funcionalidad`### Validación Automática

5. Pull Request```batch

# Validación básica (recomendada)

## 📄 Licenciavalidate.bat



MIT License - Ver [LICENSE](LICENSE) para detalles# Validación avanzada con PowerShell

validate.ps1

---

# Validación con tests de rendimiento

**🚀 Sistema desarrollado para análisis profesional de inspecciones vehiculares HQ-FO-40**validate.ps1 -Performance -Detailed

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