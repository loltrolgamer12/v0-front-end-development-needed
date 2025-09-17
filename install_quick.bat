@echo off
echo ========================================
echo  SISTEMA HQ-FO-40 - INSTALACION RAPIDA
echo ========================================
echo.
echo Instalando sistema completo de análisis HQ-FO-40...
echo.

:: Verificar si Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no está instalado
    echo Instala Python desde https://python.org
    pause
    exit /b 1
)

:: Verificar si Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no está instalado
    echo Instala Node.js desde https://nodejs.org
    pause
    exit /b 1
)

echo ✓ Python y Node.js detectados
echo.

:: Instalar dependencias del backend
echo [1/2] Instalando dependencias Python...
cd /d "%~dp0backend"
pip install flask flask-cors pandas openpyxl matplotlib seaborn
echo ✓ Backend listo

:: Instalar dependencias del frontend
echo.
echo [2/2] Instalando dependencias React...
cd /d "%~dp0frontend"
call npm install
echo ✓ Frontend listo

:: Volver al directorio raíz
cd /d "%~dp0"

echo.
echo ========================================
echo  INSTALACION COMPLETADA
echo ========================================
echo.
echo SISTEMA HQ-FO-40 LISTO PARA USAR
echo.
echo COMPONENTES INSTALADOS:
echo ✓ Backend Flask con API REST completa
echo ✓ Frontend React con dashboard interactivo  
echo ✓ Analizador Excel HQ-FO-40 especializado
echo ✓ Sistema de filtrado automático completo
echo ✓ Control de fatiga de conductores
echo ✓ Categorización de fallas mecánicas
echo ✓ Gráficas interactivas con visualización
echo ✓ Sistema de reportes PDF/Excel por fechas
echo ✓ Base de datos temporal (se limpia al cerrar)
echo.
echo PARA INICIAR EL SISTEMA:
echo.
echo OPCION 1 - Inicio Automático:
echo   ^> Ejecuta: run.bat
echo.
echo OPCION 2 - Inicio Manual:
echo   ^> Terminal 1: cd backend ^&^& python app.py
echo   ^> Terminal 2: cd frontend ^&^& npm start
echo   ^> Navegar a: http://localhost:3000
echo.
echo ¿Quieres crear el script de inicio automático? (S/N)
set /p choice="Respuesta: "
if /i "%choice%"=="S" (
    echo Creando script de inicio...
    
    echo @echo off> run.bat
    echo title Sistema HQ-FO-40 - Iniciando...>> run.bat
    echo echo Iniciando sistema HQ-FO-40...>> run.bat
    echo echo.>> run.bat
    echo echo [1/2] Iniciando servidor backend...>> run.bat
    echo cd /d "%%~dp0backend">> run.bat
    echo start "HQ-FO-40 Backend" python app.py>> run.bat
    echo timeout /t 3 /nobreak ^>nul>> run.bat
    echo.>> run.bat
    echo echo [2/2] Iniciando frontend...>> run.bat
    echo cd /d "%%~dp0frontend">> run.bat
    echo start "HQ-FO-40 Frontend" npm start>> run.bat
    echo.>> run.bat
    echo echo Sistema iniciado. Abriendo navegador...>> run.bat
    echo timeout /t 5 /nobreak ^>nul>> run.bat
    echo start http://localhost:3000>> run.bat
    
    echo ✓ Script 'run.bat' creado
    echo.
    echo ¿Quieres iniciar el sistema ahora? (S/N)
    set /p start_choice="Respuesta: "
    if /i "!start_choice!"=="S" (
        echo Iniciando sistema...
        call run.bat
    )
)

echo.
echo Sistema listo. ¡Disfruta analizando tus archivos HQ-FO-40!
pause