@echo off
REM Script para configurar y iniciar todos los servicios del sistema

echo Configurando base de datos y servicios...
echo.

echo Creando directorios necesarios...
if not exist "database\backup" mkdir "database\backup"
if not exist "backend\logs" mkdir "backend\logs"
if not exist "backend\uploads" mkdir "backend\uploads"
echo.

echo Iniciando servicios con Docker Compose...
docker-compose up -d postgres redis
echo Esperando que la base de datos este lista...
timeout /t 10 /nobreak > nul

echo Ejecutando migraciones de base de datos...
docker-compose exec postgres psql -U inspection_user -d vehicle_inspection -f /docker-entrypoint-initdb.d/init.sql
echo.

echo Iniciando servicios de monitoreo...
docker-compose up -d prometheus grafana
echo.

echo Iniciando backend...
docker-compose up -d backend
echo.

echo Iniciando frontend...
docker-compose up -d frontend
echo.

echo.
echo =================================
echo SISTEMA INICIADO EXITOSAMENTE
echo =================================
echo.
echo Servicios disponibles:
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:5000
echo   Grafana: http://localhost:3001 (admin/admin123)
echo   Prometheus: http://localhost:9090
echo   PostgreSQL: localhost:5432
echo   Redis: localhost:6379
echo.
echo Para ver logs: docker-compose logs [servicio]
echo Para detener: docker-compose down
echo =================================