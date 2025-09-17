@echo off
echo ========================================
echo    SISTEMA ANALISIS HQ-FO-40
echo    Despliegue Manual a Vercel
echo ========================================
echo.

echo [1] Verificando estado del repositorio...
git status

echo.
echo [2] ¿Desea hacer commit de cambios pendientes? (S/N)
set /p commit_choice="> "

if /i "%commit_choice%"=="S" (
    echo.
    echo Ingrese mensaje del commit:
    set /p commit_msg="> "
    git add .
    git commit -m "%commit_msg%"
    echo Cambios confirmados.
)

echo.
echo [3] ¿Desea hacer push a GitHub? (S/N)
set /p push_choice="> "

if /i "%push_choice%"=="S" (
    git push origin main
    echo Push completado.
)

echo.
echo [4] Iniciando despliegue manual a Vercel...
echo ----------------------------------------

echo.
echo Seleccione el tipo de despliegue:
echo [1] Despliegue de Preview (desarrollo)
echo [2] Despliegue de Producción
echo.
set /p deploy_type="Seleccione (1 o 2): "

if "%deploy_type%"=="1" (
    echo.
    echo Desplegando en modo PREVIEW...
    npx vercel
) else (
    echo.
    echo Desplegando en modo PRODUCCIÓN...
    npx vercel --prod
)

echo.
echo ========================================
echo Despliegue completado!
echo ========================================
echo.
echo Para verificar el estado:
echo   npx vercel ls
echo.
echo Para ver logs:
echo   npx vercel logs [URL_DEL_DEPLOY]
echo.
pause