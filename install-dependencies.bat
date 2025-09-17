@echo off
REM Script para instalar todas las dependencias y configurar el proyecto para tests

echo Instalando dependencias del backend...
cd backend
pip install -r requirements.txt
pip install pytest pytest-cov pytest-mock requests-mock
echo.

echo Instalando dependencias del frontend...
cd ..\frontend
call npm install
call npm install react-router-dom@^6.8.0 @types/react-router-dom@^5.3.3
echo.

echo Instalando dependencias de tests e2e...
cd ..\e2e
call npm install
echo.

cd ..

echo.
echo =================================
echo Instalacion completa!
echo.
echo Para ejecutar tests:
echo   Backend: cd backend && pytest
echo   Frontend: cd frontend && npm test
echo   E2E: cd e2e && npm run cypress:run
echo.
echo Para desarrollo:
echo   Backend: cd backend && flask run
echo   Frontend: cd frontend && npm start
echo =================================