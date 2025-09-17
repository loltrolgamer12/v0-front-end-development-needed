# Preguntas Frecuentes (FAQ) - Sistema de Inspección Vehicular

## 📋 Índice

1. [Instalación y Configuración](#-instalación-y-configuración)
2. [Uso del Sistema](#-uso-del-sistema)
3. [Problemas Técnicos](#-problemas-técnicos)
4. [Funcionalidades](#-funcionalidades)
5. [Integración y APIs](#-integración-y-apis)
6. [Seguridad](#-seguridad)
7. [Desarrollo](#-desarrollo)

---

## 🛠️ Instalación y Configuración

### ❓ ¿Qué requisitos necesito para instalar el sistema?

**Requisitos mínimos:**
- Windows 10/11, macOS 10.14+, o Linux (Ubuntu 18.04+)
- 4GB RAM (recomendado 8GB)
- 10GB espacio libre en disco
- Docker Desktop instalado
- Conexión a internet para descargar dependencias

### ❓ ¿El sistema funciona sin Docker?

Sí, pero **no es recomendado**. Docker simplifica enormemente la instalación y garantiza consistencia entre entornos. Para instalación manual necesitarías:
- Python 3.9+
- Node.js 16+
- PostgreSQL 12+
- Redis 6+

### ❓ ¿Cómo cambio el puerto por defecto?

Edita el archivo `docker-compose.yml`:
```yaml
services:
  frontend:
    ports:
      - "8080:3000"  # Cambiar primer número
  backend:
    ports:
      - "8081:5000"  # Cambiar primer número
```

### ❓ ¿Puedo usar MySQL en lugar de PostgreSQL?

Actualmente solo soportamos PostgreSQL oficialmente. Para MySQL necesitarías:
1. Cambiar la conexión en `backend/app/__init__.py`
2. Instalar `pymysql` o `mysqlclient`
3. Ajustar algunos queries específicos de PostgreSQL

### ❓ ¿Cómo configuro el email para notificaciones?

Edita las variables de entorno en `.env`:
```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=tu-email@gmail.com
MAIL_PASSWORD=tu-app-password
```

**Para Gmail:** Debes usar una "contraseña de aplicación", no tu contraseña normal.

---

## 🖥️ Uso del Sistema

### ❓ ¿Cuáles son las credenciales por defecto?

- **Usuario:** `admin`
- **Contraseña:** `admin123`

⚠️ **IMPORTANTE:** Cambia estas credenciales inmediatamente después del primer acceso.

### ❓ ¿Cómo registro un nuevo vehículo?

1. Ve a **Vehículos** en el menú lateral
2. Haz clic en **"Agregar Vehículo"**
3. Completa la información requerida:
   - Placa (único)
   - VIN
   - Marca, modelo, año
   - Datos del propietario
4. Haz clic en **"Guardar"**

### ❓ ¿Qué tipos de inspección soporta el sistema?

- **Periódica:** Inspección regular programada
- **Extraordinaria:** Inspección por solicitud especial
- **Revisión:** Re-inspección después de fallas
- **Preventiva:** Inspección de mantenimiento

### ❓ ¿Cómo programo una inspección?

1. Ve a **Inspecciones** > **"Nueva Inspección"**
2. Selecciona el vehículo (busca por placa)
3. Elige tipo de inspección y fecha
4. Asigna inspector
5. Guarda la programación

### ❓ ¿Puedo modificar los elementos de inspección?

Sí, pero requiere modificar el código. Los elementos están definidos en:
- Backend: `backend/app/models/inspection.py`
- Frontend: `frontend/src/types/inspection.ts`

### ❓ ¿Cómo genero reportes?

1. Ve a **Reportes**
2. Selecciona el tipo de reporte
3. Configura filtros (fechas, estado, etc.)
4. Elige formato: PDF, Excel, o CSV
5. Haz clic en **"Generar Reporte"**

---

## 🚨 Problemas Técnicos

### ❓ El sistema no inicia, ¿qué hago?

**Verificaciones paso a paso:**

1. **Docker está ejecutándose?**
   ```bash
   docker --version
   ```

2. **Puertos ocupados?**
   ```bash
   # Windows
   netstat -an | findstr :3000
   
   # macOS/Linux
   lsof -i :3000
   ```

3. **Logs de error:**
   ```bash
   docker-compose logs
   ```

4. **Reiniciar servicios:**
   ```bash
   docker-compose down
   docker-compose up --build
   ```

### ❓ Error "Permission denied" en Windows

**Solución:**
1. Ejecuta PowerShell como Administrador
2. Habilita ejecución de scripts:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

### ❓ La página web no carga

**Pasos de diagnóstico:**

1. **Verifica el container frontend:**
   ```bash
   docker-compose ps
   ```

2. **Accede directamente al backend:**
   - http://localhost:5000/api/health

3. **Revisa logs:**
   ```bash
   docker-compose logs frontend
   docker-compose logs backend
   ```

4. **Limpia cache del navegador:**
   - Ctrl+F5 (Windows)
   - Cmd+Shift+R (Mac)

### ❓ Error de base de datos

**Síntomas comunes:**
- "Connection refused"
- "Database does not exist"
- "Authentication failed"

**Soluciones:**

1. **Recrear base de datos:**
   ```bash
   docker-compose down -v
   docker-compose up -d postgres
   docker-compose exec backend flask db upgrade
   ```

2. **Verificar variables de entorno:**
   Revisa `DATABASE_URL` en `.env`

### ❓ Los tests fallan

**Diagnóstico:**

1. **Dependencias actualizadas?**
   ```bash
   docker-compose build --no-cache
   ```

2. **Base de datos de test:**
   ```bash
   docker-compose exec backend pytest tests/ -v
   ```

3. **Logs detallados:**
   ```bash
   docker-compose exec backend pytest tests/ -v -s
   ```

---

## ⚙️ Funcionalidades

### ❓ ¿Puedo personalizar el dashboard?

Actualmente el dashboard tiene métricas fijas, pero puedes:
- Modificar el período de tiempo (7d, 30d, 3m)
- Filtrar por inspector o tipo de inspección
- Personalizar gráficos editando `frontend/src/pages/Dashboard.tsx`

### ❓ ¿Soporta múltiples centros de inspección?

En la versión actual, no directamente. Para implementarlo necesitarías:
1. Agregar modelo `InspectionCenter`
2. Relacionar inspectores con centros
3. Filtrar datos por centro en el frontend

### ❓ ¿Puedo enviar SMS en lugar de emails?

El sistema está preparado para SMS pero no configurado. Para habilitarlo:
1. Configura un proveedor SMS (Twilio, etc.)
2. Modifica `backend/app/services/notification_service.py`
3. Agrega configuración SMS en `.env`

### ❓ ¿Hay límite de vehículos o inspecciones?

No hay límites técnicos hardcoded, pero el rendimiento dependerá de:
- Recursos del servidor
- Configuración de la base de datos
- Para >10,000 vehículos recomendamos optimización de índices

### ❓ ¿Puedo hacer backup automático?

Sí, puedes configurar backup automático:

1. **Script de backup programado (Windows):**
   ```batch
   schtasks /create /tn "VehicleSystemBackup" /tr "C:\path\to\backup-system.bat" /sc daily /st 02:00
   ```

2. **Cron job (Linux/macOS):**
   ```bash
   0 2 * * * /path/to/backup-system.sh
   ```

---

## 🔌 Integración y APIs

### ❓ ¿Hay documentación de la API?

Sí, accede a la documentación interactiva en:
- http://localhost:5000/api/docs (cuando el sistema esté ejecutándose)
- O revisa `docs/api.md` en el repositorio

### ❓ ¿Puedo integrar con otros sistemas?

Sí, el sistema expone una API REST completa. Ejemplos de integración:

**Obtener lista de vehículos:**
```bash
curl -X GET "http://localhost:5000/api/vehicles" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Crear nueva inspección:**
```bash
curl -X POST "http://localhost:5000/api/inspections" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{"vehicle_id": 1, "type": "periodic", "scheduled_date": "2024-02-15"}'
```

### ❓ ¿Soporta webhooks?

Actualmente no, pero puedes implementar webhooks modificando:
1. `backend/app/services/webhook_service.py` (crear)
2. Agregar llamadas en eventos relevantes
3. Configurar URLs en la configuración

### ❓ ¿Puedo importar datos desde Excel?

No hay función de importación directa, pero puedes:
1. Usar la API para importar programáticamente
2. Modificar `backend/app/routes/import.py` (crear)
3. Usar pandas para procesar archivos Excel

---

## 🔒 Seguridad

### ❓ ¿Es seguro para uso en producción?

El sistema implementa varias medidas de seguridad:
- ✅ Autenticación JWT
- ✅ Validación de entrada
- ✅ Rate limiting
- ✅ CORS configurado
- ✅ Sanitización de datos

**Para producción recomendamos:**
- Cambiar todas las contraseñas por defecto
- Usar HTTPS (certificado SSL)
- Configurar firewall apropiado
- Actualizaciones regulares de dependencias

### ❓ ¿Cómo cambio la clave secreta JWT?

En el archivo `.env`:
```env
SECRET_KEY=tu-clave-super-secreta-y-larga-aqui
JWT_SECRET_KEY=otra-clave-diferente-para-jwt
```

**Importante:** Cambiar estas claves invalidará todas las sesiones activas.

### ❓ ¿Los datos están encriptados?

- **En tránsito:** Sí (HTTPS en producción)
- **En reposo:** La base de datos PostgreSQL puede configurarse con encriptación
- **Contraseñas:** Sí, hasheadas con bcrypt
- **JWT tokens:** Firmados y con expiración

### ❓ ¿Puedo configurar permisos más granulares?

Actualmente hay 4 roles básicos. Para permisos más específicos:
1. Modifica `backend/app/models/user.py`
2. Agrega nuevo sistema de permisos
3. Actualiza middleware de autorización

---

## 👨‍💻 Desarrollo

### ❓ ¿Cómo contribuyo al proyecto?

1. **Fork** el repositorio en GitHub
2. **Clone** tu fork localmente
3. **Instala** dependencias de desarrollo
4. **Crea branch** para tu feature
5. **Desarrolla** y testea
6. **Envía** Pull Request

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para detalles completos.

### ❓ ¿Puedo agregar nuevos campos al vehículo?

Sí, sigue estos pasos:

1. **Agrega campo al modelo:**
   ```python
   # backend/app/models/vehicle.py
   fuel_efficiency = db.Column(db.Float)
   ```

2. **Crea migración:**
   ```bash
   docker-compose exec backend flask db migrate -m "Add fuel_efficiency to vehicle"
   docker-compose exec backend flask db upgrade
   ```

3. **Actualiza frontend:**
   ```typescript
   // frontend/src/types/vehicle.ts
   export interface Vehicle {
     // ... existing fields
     fuelEfficiency?: number;
   }
   ```

### ❓ ¿Cómo debugging en desarrollo?

**Backend (Python):**
```python
# Agregar breakpoints
import pdb; pdb.set_trace()

# O usar logging
import logging
logging.info(f"Debug info: {variable}")
```

**Frontend (React):**
```typescript
// Console debugging
console.log('Debug:', variable);

// React DevTools
// Instala la extensión del navegador
```

**Docker logs en tiempo real:**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### ❓ ¿Puedo usar una base de datos diferente para testing?

Sí, el sistema ya está configurado para usar SQLite en tests:
```python
# backend/tests/conftest.py
SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
```

### ❓ ¿Cómo agrego nuevas librerías?

**Backend:**
1. Agregar a `backend/requirements.txt`
2. Rebuild container: `docker-compose build backend`

**Frontend:**
1. Agregar a `frontend/package.json`
2. Rebuild container: `docker-compose build frontend`

---

## 🆘 Soporte Adicional

### ❓ ¿Dónde puedo obtener más ayuda?

- **GitHub Issues:** [Reportar problemas](https://github.com/tu-usuario/vehicle-inspection-system/issues)
- **GitHub Discussions:** [Preguntas generales](https://github.com/tu-usuario/vehicle-inspection-system/discussions)
- **Email:** soporte@vehicleinspection.com
- **Documentación:** [Wiki del proyecto](https://github.com/tu-usuario/vehicle-inspection-system/wiki)

### ❓ ¿Hay una comunidad de usuarios?

Estamos construyendo la comunidad. Únete a:
- GitHub Discussions para preguntas
- Issues para reportar bugs
- Contribuciones son bienvenidas

### ❓ ¿Planean versión comercial o SaaS?

Actualmente el proyecto es completamente open source bajo licencia MIT. No hay planes inmediatos para versión comercial, pero el código puede usarse libremente para propósitos comerciales.

---

## 📝 ¿No encontraste tu pregunta?

Si tu pregunta no está aquí:
1. **Busca** en [GitHub Issues](https://github.com/tu-usuario/vehicle-inspection-system/issues)
2. **Crea** un nuevo issue con la etiqueta `question`
3. **Proporciona** contexto detallado y pasos para reproducir (si aplica)

---

*Este FAQ se actualiza regularmente. Última actualización: Enero 2024*