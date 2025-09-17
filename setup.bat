@echo off
REM ===================================================================
REM SCRIPT DE INSTALACIÓN Y VALIDACIÓN COMPLETA
REM Ejecuta instalación seguida de validación automática
REM ===================================================================

echo.
echo %ESC%[96m🚀 INSTALACIÓN Y VALIDACIÓN COMPLETA%ESC%[0m
echo %ESC%[96mSistema de Análisis de Inspecciones Vehiculares%ESC%[0m
echo.

REM Paso 1: Ejecutar instalación
echo %ESC%[94m=== PASO 1: INSTALACIÓN ===%ESC%[0m
call install.bat
if %errorlevel% neq 0 (
    echo %ESC%[91m❌ Error en instalación%ESC%[0m
    echo.
    echo Presiona cualquier tecla para continuar...
    pause >nul
    exit /b 1
)

echo.
echo %ESC%[92m✅ Instalación completada exitosamente%ESC%[0m
echo.

REM Paso 2: Ejecutar validación
echo %ESC%[94m=== PASO 2: VALIDACIÓN ===%ESC%[0m
echo %ESC%[93mEjecutando validación completa del sistema...%ESC%[0m
echo.

REM Pausa para que el usuario lea
timeout /t 3 >nul

call validate.bat
set "validation_result=%errorlevel%"

echo.
echo %ESC%[94m=== RESUMEN FINAL ===%ESC%[0m

if %validation_result% equ 0 (
    echo %ESC%[92m🎉 ¡SISTEMA COMPLETAMENTE LISTO!%ESC%[0m
    echo %ESC%[92m✅ Instalación y validación exitosas%ESC%[0m
    echo.
    echo %ESC%[96m🚀 Tu sistema está listo para usar:%ESC%[0m
    echo    • Ejecutar: start.bat
    echo    • Dashboard: http://localhost:3000
    echo    • Monitoreo: http://localhost:3001
    echo.
) else (
    echo %ESC%[93m⚠️ Sistema instalado pero con advertencias%ESC%[0m
    echo %ESC%[93mRevisa los logs de validación para más detalles%ESC%[0m
    echo.
    echo %ESC%[96m🔧 Puedes intentar:%ESC%[0m
    echo    • Revisar docs\TROUBLESHOOTING.md
    echo    • Ejecutar utils.bat health
    echo    • Contactar soporte si es necesario
    echo.
)

echo Presiona cualquier tecla para continuar...
pause >nul