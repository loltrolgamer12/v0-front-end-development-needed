@echo off
REM ===================================================================
REM SCRIPT DE DETENCIÓN - SISTEMA DE INSPECCIONES VEHICULARES
REM Detiene todos los servicios del sistema
REM ===================================================================

echo.
echo %ESC%[93m🛑 DETENIENDO SISTEMA DE INSPECCIONES VEHICULARES%ESC%[0m
echo.

REM Verificar si Docker está disponible
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %ESC%[91m[ERROR]%ESC%[0m Docker no está disponible
    echo.
    echo Presiona cualquier tecla para continuar...
    pause >nul
    exit /b 1
)

REM Detener servicios
echo %ESC%[93m[INFO]%ESC%[0m Deteniendo servicios Docker...
docker-compose down

if %errorlevel% equ 0 (
    echo.
    echo %ESC%[92m✅ Sistema detenido correctamente%ESC%[0m
) else (
    echo.
    echo %ESC%[91m❌ Error al detener algunos servicios%ESC%[0m
    echo %ESC%[93m[INFO]%ESC%[0m Forzando detención...
    docker-compose down --remove-orphans
)

REM Mostrar estado final
echo.
echo %ESC%[94m=== ESTADO FINAL ===%ESC%[0m
docker-compose ps

echo.
echo %ESC%[92m🏁 Sistema completamente detenido%ESC%[0m
echo.

echo Presiona cualquier tecla para continuar...
pause >nul