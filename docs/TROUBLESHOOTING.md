# 🔧 Solución de Problemas

## 🚨 Problemas Comunes

### ❌ Docker Desktop no funciona

**Síntomas:**
- Error: "Docker command not found"
- Error: "Cannot connect to Docker daemon"
- Servicios no inician

**Soluciones:**
```batch
# 1. Verificar instalación
docker --version
docker-compose --version

# 2. Verificar que Docker Desktop esté ejecutándose
# Buscar icono de Docker en la bandeja del sistema

# 3. Reiniciar Docker Desktop
# Click derecho en icono > Restart

# 4. Reinstalar Docker Desktop
# Descargar desde: https://desktop.docker.com/
```

### ❌ Puertos ocupados

**Síntomas:**
- Error: "Port 3000 already in use"
- Error: "Port 5000 already in use"  
- No se puede acceder a http://localhost:3000

**Soluciones:**
```batch
# 1. Detener servicios del sistema
stop.bat

# 2. Verificar qué está usando los puertos
netstat -ano | findstr :3000
netstat -ano | findstr :5000
netstat -ano | findstr :3001

# 3. Terminar procesos específicos (cambiar PID)
taskkill /PID 1234 /F

# 4. Reiniciar sistema
start.bat
```

### ❌ Archivos no se suben

**Síntomas:**
- Error: "File upload failed"
- "File format not supported"
- Upload se queda cargando indefinidamente

**Soluciones:**
```batch
# 1. Verificar formato de archivo
# Formatos soportados: .xlsx, .xls, .csv

# 2. Verificar tamaño (máximo 50MB)
# Reducir archivo si es necesario

# 3. Verificar permisos de carpeta uploads/
# Crear manualmente si no existe

# 4. Revisar logs del backend
docker-compose logs backend
```

### ❌ Frontend no carga

**Síntomas:**
- Pantalla blanca en http://localhost:3000
- Error: "Cannot GET /"
- "This site can't be reached"

**Soluciones:**
```batch
# 1. Verificar estado de servicios
status.bat

# 2. Revisar logs del frontend  
docker-compose logs frontend

# 3. Reconstruir contenedor frontend
docker-compose build frontend --no-cache
docker-compose up -d frontend

# 4. Limpiar caché del navegador
# Ctrl+F5 para hard refresh
```

### ❌ Backend API no responde

**Síntomas:**
- Error 500/502 en llamadas API
- http://localhost:5000/health no responde
- Frontend no puede conectar al backend

**Soluciones:**
```batch
# 1. Verificar health check
curl http://localhost:5000/health
# O abrir en navegador

# 2. Revisar logs del backend
docker-compose logs backend

# 3. Verificar dependencias Python
# Reconstruir contenedor si es necesario
docker-compose build backend --no-cache

# 4. Verificar variables de entorno
# Revisar archivo .env
```

## 🔍 Diagnóstico Avanzado

### Verificación Completa del Sistema
```batch
# 1. Estado de Docker
docker info

# 2. Estado de servicios
docker-compose ps

# 3. Uso de recursos
docker stats --no-stream

# 4. Logs recientes de todos los servicios  
docker-compose logs --tail=50

# 5. Verificar conectividad de red
docker-compose exec backend ping frontend
```

### Análisis de Performance
```batch
# 1. Métricas de sistema
# Abrir: http://localhost:9090 (Prometheus)

# 2. Dashboard de monitoreo
# Abrir: http://localhost:3001 (Grafana)
# Usuario: admin, Contraseña: admin123

# 3. Logs de performance  
docker-compose logs backend | findstr "slow"
docker-compose logs backend | findstr "timeout"
```

## 🗄️ Problemas de Base de Datos

### Redis no conecta
```batch
# 1. Verificar Redis
docker-compose exec redis redis-cli ping
# Debería responder "PONG"

# 2. Reiniciar Redis
docker-compose restart redis

# 3. Limpiar datos de Redis (si es necesario)
docker-compose exec redis redis-cli FLUSHALL
```

## 🌐 Problemas de Red

### Nginx no hace proxy correctamente
```batch
# 1. Verificar configuración
type nginx\nginx.conf

# 2. Revisar logs de Nginx
docker-compose logs nginx

# 3. Verificar conectividad upstream
docker-compose exec nginx ping backend
docker-compose exec nginx ping frontend

# 4. Recargar configuración
docker-compose restart nginx
```

## 💾 Problemas de Almacenamiento

### Espacio insuficiente
```batch
# 1. Verificar espacio disponible
dir C:\ 

# 2. Limpiar contenedores no utilizados
docker system prune -f

# 3. Limpiar volúmenes no utilizados
docker volume prune -f

# 4. Limpiar imágenes antiguas
docker image prune -a -f
```

### Permisos de archivos
```batch
# 1. Verificar permisos en carpetas críticas
# uploads/, logs/, backups/

# 2. Crear carpetas si no existen
mkdir uploads logs backups

# 3. Verificar que Docker tenga acceso
# Docker Desktop > Settings > Resources > File Sharing
```

## 🐛 Depuración Paso a Paso

### Proceso de Depuración Completo
```batch
# 1. DETENER TODO
stop.bat

# 2. LIMPIAR SISTEMA
docker system prune -f
docker volume prune -f

# 3. VERIFICAR REQUISITOS
docker --version
docker-compose --version

# 4. VERIFICAR ARCHIVOS
dir docker-compose.yml
dir backend\requirements.txt
dir frontend\package.json

# 5. RECONSTRUIR DESDE CERO
docker-compose build --no-cache

# 6. INICIAR CON LOGS
docker-compose up --build

# 7. VERIFICAR SERVICIOS UNO POR UNO
curl http://localhost:5000/health
curl http://localhost:3000
```

## 📞 Escalación a Soporte

### Información Requerida para Soporte
```batch
# 1. Generar reporte de sistema
echo "=== INFORMACIÓN DEL SISTEMA ===" > debug_report.txt
echo Fecha: %date% %time% >> debug_report.txt
systeminfo | findstr "OS Version" >> debug_report.txt
docker --version >> debug_report.txt
docker-compose --version >> debug_report.txt

# 2. Estado de servicios
echo "=== ESTADO DE SERVICIOS ===" >> debug_report.txt
docker-compose ps >> debug_report.txt

# 3. Logs recientes
echo "=== LOGS RECIENTES ===" >> debug_report.txt  
docker-compose logs --tail=100 >> debug_report.txt

# 4. Usar archivos de configuración
echo "=== CONFIGURACIÓN ===" >> debug_report.txt
type .env.example >> debug_report.txt
```

### Canales de Soporte
- 📧 **Email**: soporte@vehiculos.com
- 📱 **WhatsApp**: +57 300 123 4567  
- 🕒 **Horario**: Lunes a Viernes 8:00-18:00 COT
- ⚡ **Urgencias**: 24/7 para problemas críticos

### Antes de Contactar Soporte
- ✅ Probar las soluciones de este documento
- ✅ Generar reporte de debug completo
- ✅ Documentar pasos exactos que causaron el problema
- ✅ Incluir capturas de pantalla de errores
- ✅ Especificar versión del sistema (2.0.0)

---

## 🔄 Reset Completo del Sistema

Si nada más funciona, reset completo:
```batch
# ADVERTENCIA: Esto eliminará todos los datos
stop.bat
docker-compose down --volumes --remove-orphans
docker system prune -a -f --volumes
rmdir /S uploads logs backups
install.bat
start.bat
```

---

**💡 Tip**: Mantén este documento a mano durante las primeras semanas de uso. La mayoría de problemas se resuelven con estos pasos básicos.