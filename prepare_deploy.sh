#!/bin/bash

echo "========================================="
echo " PREPARANDO SISTEMA HQ-FO-40 PARA VERCEL"
echo "========================================="
echo

echo "[1/4] Verificando estructura del proyecto..."
if [ ! -d "frontend" ]; then
    echo "ERROR: Directorio frontend no encontrado"
    exit 1
fi
if [ ! -d "backend" ]; then
    echo "ERROR: Directorio backend no encontrado"
    exit 1
fi
echo "✓ Estructura verificada"

echo
echo "[2/4] Instalando dependencias del frontend..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Fallo en npm install"
    exit 1
fi
echo "✓ Dependencies instaladas"

echo
echo "[3/4] Construyendo frontend para producción..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Fallo en npm run build"
    exit 1
fi
echo "✓ Build completado"

echo
echo "[4/4] Verificando archivos de deploy..."
cd ..
if [ ! -f "vercel.json" ]; then
    echo "ERROR: vercel.json no encontrado"
    exit 1
fi
if [ ! -f "backend/requirements.txt" ]; then
    echo "ERROR: requirements.txt no encontrado"
    exit 1
fi
echo "✓ Archivos de configuración verificados"

echo
echo "========================================="
echo " PROYECTO LISTO PARA DEPLOY EN VERCEL"
echo "========================================="
echo
echo "PASOS SIGUIENTES:"
echo
echo "1. Sube el código a GitHub:"
echo "   git add ."
echo "   git commit -m 'Deploy ready'"
echo "   git push origin main"
echo
echo "2. Ve a vercel.com y conecta tu repositorio"
echo
echo "3. Vercel desplegará automáticamente el sistema"
echo
echo "4. Tu app estará disponible en:"
echo "   https://tu-proyecto.vercel.app"
echo
echo "ARCHIVOS DE CONFIGURACIÓN CREADOS:"
echo "✓ vercel.json - Configuración de deploy"
echo "✓ .gitignore - Archivos a ignorar"
echo "✓ DEPLOY_VERCEL.md - Documentación de deploy"
echo "✓ frontend/build/ - Build optimizado"
echo
echo "¿Quieres abrir Vercel en el navegador? (y/n)"
read -r choice
if [ "$choice" = "y" ] || [ "$choice" = "Y" ]; then
    echo "Abriendo Vercel..."
    if command -v xdg-open &> /dev/null; then
        xdg-open https://vercel.com/new
    elif command -v open &> /dev/null; then
        open https://vercel.com/new
    else
        echo "Ve a https://vercel.com/new manualmente"
    fi
else
    echo "Deploy preparado. Ve a vercel.com cuando estés listo."
fi