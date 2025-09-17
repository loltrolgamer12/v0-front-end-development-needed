@echo off
echo Limpiando archivos temporales del proyecto HQ-FO-40...

REM Limpiar base de datos temporal
if exist hqfo_temp.db del /q hqfo_temp.db
echo - Base de datos temporal eliminada

REM Limpiar logs
if exist logs\*.log del /q logs\*.log
echo - Logs eliminados

REM Limpiar build del frontend si existe
if exist frontend\build rmdir /s /q frontend\build
echo - Build del frontend eliminado

REM Limpiar cache de Python
if exist __pycache__ rmdir /s /q __pycache__
if exist api\__pycache__ rmdir /s /q api\__pycache__
echo - Cache de Python eliminado

echo.
echo Limpieza completada exitosamente.
pause