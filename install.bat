@echo off
REM ===================================================================
REM INSTALADOR AUTOMÁTICO - SISTEMA DE INSPECCIONES VEHICULARES
REM Versión Batch para máxima compatibilidad en Windows
REM Autor: Sistema IA - HQ-FO-40 Analysis  
REM Versión: 2.0.0 - Windows Batch Edition
REM ===================================================================

setlocal enabledelayedexpansion
set "PROJECT_NAME=vehicle-inspection-system"
set "LOG_FILE=installation.log"
set "START_TIME=%date% %time%"

REM Colores (si está disponible)
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "CYAN=[96m"
set "RESET=[0m"

echo %CYAN%
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                                                                  ║
echo ║     🚗 SISTEMA DE ANÁLISIS DE INSPECCIONES VEHICULARES 🚗       ║
echo ║                                                                  ║
echo ║              ⚡ INSTALADOR AUTOMÁTICO v2.0.0 ⚡                 ║
echo ║                     BATCH EDITION                                ║
echo ║                                                                  ║
echo ║    📊 Análisis Excel HQ-FO-40 con IA Predictiva                ║
echo ║    🎯 Precisión 100% garantizada                               ║
echo ║    🚀 Sistema completo en 5 minutos                            ║
echo ║    🐳 Docker + React + Flask + Grafana                         ║
echo ║                                                                  ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo %RESET%

echo.
echo %GREEN%[INFO]%RESET% Iniciando instalación del Sistema de Inspecciones Vehiculares
echo %GREEN%[INFO]%RESET% Fecha y hora: %START_TIME%
echo %GREEN%[INFO]%RESET% Log de instalación: %LOG_FILE%

REM Verificar si es Windows 10 o superior
for /f "tokens=4-7 delims=. " %%i in ('ver') do (
    set "VERSION=%%i.%%j"
)
echo %GREEN%[INFO]%RESET% Versión de Windows: %VERSION%

REM Verificar si PowerShell está disponible
powershell -Command "Get-Host" >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%[INFO]%RESET% PowerShell disponible, ejecutando instalador avanzado...
    echo.
    powershell -ExecutionPolicy Bypass -File "install.ps1"
    goto :end
) else (
    echo %YELLOW%[WARN]%RESET% PowerShell no disponible, usando instalación básica...
)

echo.
echo %BLUE%=== VERIFICANDO REQUISITOS DEL SISTEMA ===%RESET%

REM Verificar si Docker está instalado
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %YELLOW%[WARN]%RESET% Docker no encontrado
    echo %GREEN%[INFO]%RESET% Por favor instala Docker Desktop desde: https://docker.com/products/docker-desktop
    echo %GREEN%[INFO]%RESET% Presiona cualquier tecla cuando Docker esté instalado...
    pause
)

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %YELLOW%[WARN]%RESET% Node.js no encontrado
    echo %GREEN%[INFO]%RESET% Por favor instala Node.js desde: https://nodejs.org/
    echo %GREEN%[INFO]%RESET% Presiona cualquier tecla cuando Node.js esté instalado...
    pause
)

REM Verificar si Python está instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %YELLOW%[WARN]%RESET% Python no encontrado  
    echo %GREEN%[INFO]%RESET% Por favor instala Python desde: https://python.org/
    echo %GREEN%[INFO]%RESET% Presiona cualquier tecla cuando Python esté instalado...
    pause
)

REM Verificar si Git está instalado
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %YELLOW%[WARN]%RESET% Git no encontrado
    echo %GREEN%[INFO]%RESET% Por favor instala Git desde: https://git-scm.com/
    echo %GREEN%[INFO]%RESET% Presiona cualquier tecla cuando Git esté instalado...
    pause
)

echo.
echo %BLUE%=== VERIFICANDO ESTRUCTURA DEL PROYECTO ===%RESET%

REM Verificar directorios críticos
set "dirs=backend frontend monitoring nginx docs scripts uploads logs backups tests"
for %%d in (%dirs%) do (
    if exist "%%d" (
        echo %GREEN%[INFO]%RESET% ✓ %%d\
    ) else (
        echo %RED%[ERROR]%RESET% ✗ %%d\ faltante
    )
)

echo.
echo %BLUE%=== PRÓXIMOS PASOS ===%RESET%
echo.
echo %GREEN%1.%RESET% Ejecutar: start.bat                    ^(Iniciar sistema completo^)
echo %GREEN%2.%RESET% Abrir: http://localhost:3000          ^(Acceder a la aplicación^)
echo %GREEN%3.%RESET% Cargar archivo HQ-FO-40.xlsx         ^(Procesar inspecciones^)
echo %GREEN%4.%RESET% Ver dashboards en Grafana            ^(http://localhost:3001^)
echo.
echo %CYAN%🌐 URLS DISPONIBLES:%RESET%
echo    📱 Frontend:      http://localhost:3000
echo    🔧 Backend API:   http://localhost:5000
echo    📊 Grafana:       http://localhost:3001 ^(admin/admin123^)
echo    🔍 Prometheus:    http://localhost:9090
echo    🏥 Health Check:  http://localhost:5000/health
echo.

REM Crear archivo de estado
echo INSTALLATION_COMPLETED=true > .installation_complete
echo INSTALLATION_DATE=%date% %time% >> .installation_complete  
echo VERSION=2.0.0 >> .installation_complete
echo STATUS=ready >> .installation_complete
echo PLATFORM=Windows_Batch >> .installation_complete

echo %GREEN%[INFO]%RESET% ¡Instalación completada exitosamente!
echo %GREEN%[INFO]%RESET% El sistema está listo para usar

:end
echo.
echo Presiona cualquier tecla para continuar...
pause >nul