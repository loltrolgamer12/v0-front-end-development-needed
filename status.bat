@echo off  
REM ===================================================================
REM SCRIPT DE ESTADO - SISTEMA DE INSPECCIONES VEHICULARES
REM Muestra el estado actual de todos los servicios
REM ===================================================================

echo.
echo %ESC%[96m📊 ESTADO DEL SISTEMA DE INSPECCIONES VEHICULARES%ESC%[0m
echo.

REM Verificar si Docker está disponible
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %ESC%[91m[ERROR]%ESC%[0m Docker no está disponible
    exit /b 1
)

echo %ESC%[94m=== ESTADO DE SERVICIOS ===%ESC%[0m
docker-compose ps

echo.
echo %ESC%[94m=== USO DE RECURSOS ===%ESC%[0m
docker stats --no-stream

echo.
echo %ESC%[96m🌐 URLS DISPONIBLES:%ESC%[0m
echo    📱 Frontend:      http://localhost:3000
echo    🔧 Backend API:   http://localhost:5000
echo    📊 Grafana:       http://localhost:3001 ^(admin/admin123^)
echo    🔍 Prometheus:    http://localhost:9090
echo    🏥 Health Check:  http://localhost:5000/health

echo.
echo %ESC%[94m💡 VERIFICAR HEALTH CHECKS:%ESC%[0m

REM Verificar health check del backend
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5000/health' -TimeoutSec 5; Write-Host '✓ Backend: Saludable' -ForegroundColor Green } catch { Write-Host '✗ Backend: No responde' -ForegroundColor Red }"

REM Verificar frontend
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 5; Write-Host '✓ Frontend: Disponible' -ForegroundColor Green } catch { Write-Host '✗ Frontend: No responde' -ForegroundColor Red }"

echo.
echo Presiona cualquier tecla para continuar...
pause >nul