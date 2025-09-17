@echo off
echo ========================================
echo  PREPARANDO SISTEMA HQ-FO-40 PARA VERCEL
echo ========================================
echo.

echo [1/4] Verificando estructura del proyecto...
if not exist "frontend" (
    echo ERROR: Directorio frontend no encontrado
    pause
    exit /b 1
)
if not exist "backend" (
    echo ERROR: Directorio backend no encontrado
    pause
    exit /b 1
)
echo ✓ Estructura verificada

echo.
echo [2/4] Instalando dependencias del frontend...
cd frontend
call npm install
if errorlevel 1 (
    echo ERROR: Fallo en npm install
    pause
    exit /b 1
)
echo ✓ Dependencies instaladas

echo.
echo [3/4] Construyendo frontend para producción...
call npm run build
if errorlevel 1 (
    echo ERROR: Fallo en npm run build
    pause
    exit /b 1
)
echo ✓ Build completado

echo.
echo [4/4] Verificando archivos de deploy...
cd ..
if not exist "vercel.json" (
    echo ERROR: vercel.json no encontrado
    pause
    exit /b 1
)
if not exist "backend\requirements.txt" (
    echo ERROR: requirements.txt no encontrado
    pause
    exit /b 1
)
echo ✓ Archivos de configuración verificados

echo.
echo ========================================
echo  PROYECTO LISTO PARA DEPLOY EN VERCEL
echo ========================================
echo.
echo PASOS SIGUIENTES:
echo.
echo 1. Sube el código a GitHub:
echo    git add .
echo    git commit -m "Deploy ready"
echo    git push origin main
echo.
echo 2. Ve a vercel.com y conecta tu repositorio
echo.
echo 3. Vercel desplegará automáticamente el sistema
echo.
echo 4. Tu app estará disponible en:
echo    https://tu-proyecto.vercel.app
echo.
echo ARCHIVOS DE CONFIGURACIÓN CREADOS:
echo ✓ vercel.json - Configuración de deploy
echo ✓ .gitignore - Archivos a ignorar
echo ✓ DEPLOY_VERCEL.md - Documentación de deploy
echo ✓ frontend/build/ - Build optimizado
echo.
echo ¿Quieres abrir Vercel en el navegador? (S/N)
set /p choice="Respuesta: "
if /i "%choice%"=="S" (
    echo Abriendo Vercel...
    start https://vercel.com/new
) else (
    echo Deploy preparado. Ve a vercel.com cuando estés listo.
)

pause