# 🚀 DESPLIEGUE MANUAL DESDE VERCEL DASHBOARD

## 📋 Pasos para Configurar Despliegue Manual

### 1. 🔓 Desconectar Auto-Deploy de GitHub
1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Selecciona tu proyecto: **hq-fo-40-sistema**
3. Ve a **Settings** → **Git** 
4. En la sección **Auto-Deploy on Git Push**:
   - **Desactiva** "Automatically deploy all pushes to main branch"
   - Guarda los cambios

### 2. 🎯 Cómo Hacer Despliegue Manual

#### Opción A: Desde Dashboard de Vercel
1. Ve a tu proyecto en Vercel Dashboard
2. Click en **"Deployments"** 
3. Click en **"Create Deployment"**
4. Selecciona la rama **main** 
5. Click **"Deploy"**

#### Opción B: Trigger Manual desde Git
1. Ve a **Settings** → **Git**
2. En **Production Branch**, asegúrate que sea **main**
3. Cuando quieras desplegar:
   - Haz tus cambios localmente
   - Commit: `git add . && git commit -m "tu mensaje"`
   - Push: `git push origin main`
   - Ve a Vercel Dashboard y click **"Redeploy"** manualmente

### 3. 📊 Monitorear Despliegues
- **Dashboard URL**: https://vercel.com/dashboard
- **Logs en tiempo real**: Click en cualquier deployment para ver logs
- **Estado actual**: Revisa la sección "Deployments" 

### 4. 🎛️ Control Total
Con esta configuración tendrás:
- ✅ **Control manual** de cuándo desplegar
- ✅ **Vista previa** antes de ir a producción  
- ✅ **Rollback fácil** a versiones anteriores
- ✅ **Logs detallados** de cada deploy

### 5. 📱 URLs del Proyecto
- **Production**: https://hq-fo-40-sistema.vercel.app
- **Preview**: Se genera automáticamente para cada deploy manual

---

## 🔧 Comandos de Git Útiles

```bash
# Verificar estado
git status

# Hacer commit de cambios
git add .
git commit -m "Descripción de cambios"

# Subir a GitHub (sin auto-deploy)
git push origin main

# Ver historial
git log --oneline -10
```

---

## 🚨 Importante
- Los archivos se suben a GitHub normalmente
- El deploy a Vercel lo controlas TÚ manualmente
- Puedes hacer múltiples commits sin deployar
- Despliegas solo cuando estés listo

---

**¡Ahora tienes control total sobre cuándo y cómo desplegar tu Sistema de Análisis HQ-FO-40!** 🎉