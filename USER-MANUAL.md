# Sistema de Inspección Vehicular - Manual de Usuario

## Introducción

El Sistema de Inspección Vehicular es una aplicación web integral diseñada para gestionar y automatizar el proceso de inspecciones técnicas de vehículos. Permite registrar vehículos, programar inspecciones, realizar seguimiento del proceso y generar reportes detallados.

## Acceso al Sistema

### URL de Acceso
- **Aplicación**: http://localhost:3000 (desarrollo) o https://tu-dominio.com (producción)
- **Monitoreo**: http://localhost:3001 (Grafana)

### Credenciales por Defecto
- **Usuario**: admin
- **Contraseña**: admin123

> ⚠️ **Importante**: Cambiar la contraseña por defecto en el primer acceso.

## Navegación Principal

### Dashboard Principal
El dashboard proporciona una vista general del sistema:
- **Estadísticas generales**: Total de vehículos, inspecciones, etc.
- **Inspecciones pendientes**: Lista de inspecciones por realizar
- **Gráficos de tendencias**: Visualización de datos históricos
- **Filtros de tiempo**: Últimos 7 días, 30 días, 3 meses, etc.

### Menú de Navegación
- **Dashboard**: Vista principal con estadísticas
- **Vehículos**: Gestión del registro de vehículos
- **Inspecciones**: Programación y seguimiento de inspecciones
- **Reportes**: Generación de informes y análisis
- **Análisis**: Estadísticas avanzadas y tendencias
- **Configuración**: Ajustes del sistema y usuarios

## Gestión de Vehículos

### Registrar Nuevo Vehículo

1. **Acceder al módulo**:
   - Clic en "Vehículos" en el menú lateral
   - Clic en botón "Agregar Vehículo"

2. **Completar información básica**:
   - **Placa**: Número de placa único (requerido)
   - **VIN**: Número de identificación del vehículo (requerido)
   - **Marca**: Fabricante del vehículo (requerido)
   - **Modelo**: Modelo específico (requerido)
   - **Año**: Año de fabricación (requerido)
   - **Color**: Color principal del vehículo

3. **Información técnica**:
   - **Tipo de combustible**: Gasolina, Diésel, Eléctrico, Híbrido
   - **Tamaño del motor**: En litros (ej: 2.0)
   - **Transmisión**: Manual, Automática, CVT

4. **Datos del propietario**:
   - **Nombre completo**: Nombre del propietario (requerido)
   - **Documento ID**: Número de identificación (requerido)
   - **Teléfono**: Número de contacto
   - **Email**: Correo electrónico

5. **Información de seguro**:
   - **Compañía de seguros**: Nombre de la aseguradora
   - **Número de póliza**: Identificador de la póliza
   - **Fecha de registro**: Fecha de primera matriculación

### Buscar y Filtrar Vehículos

- **Búsqueda rápida**: Usar la barra de búsqueda para encontrar por placa, marca, modelo o propietario
- **Filtros avanzados**: Filtrar por año, tipo de combustible, estado de inspección
- **Ordenamiento**: Hacer clic en encabezados de columna para ordenar

### Editar Información de Vehículo

1. Localizar el vehículo en la lista
2. Clic en el botón "Editar" (ícono de lápiz)
3. Modificar los campos necesarios
4. Clic en "Guardar cambios"

### Historial de Vehículo

- Ver todas las inspecciones realizadas
- Consultar resultados históricos
- Descargar certificados de inspección

## Gestión de Inspecciones

### Programar Nueva Inspección

1. **Acceder al módulo**:
   - Clic en "Inspecciones" en el menú
   - Clic en "Nueva Inspección"

2. **Seleccionar vehículo**:
   - Buscar por placa o propietario
   - Seleccionar vehículo de la lista

3. **Configurar inspección**:
   - **Tipo de inspección**: Periódica, Extraordinaria, Revisión
   - **Fecha programada**: Seleccionar fecha y hora
   - **Inspector asignado**: Asignar técnico responsable
   - **Ubicación**: Centro de inspección
   - **Kilometraje**: Registrar odómetro actual

4. **Guardar programación**:
   - Revisar información
   - Clic en "Programar Inspección"
   - El sistema enviará notificaciones automáticas

### Realizar Inspección

#### Estados de Inspección
- **Pendiente**: Programada pero no iniciada
- **En Progreso**: Inspección en curso
- **Completada**: Finalizada con resultados
- **Cancelada**: No realizada por algún motivo

#### Proceso de Inspección

1. **Iniciar inspección**:
   - Localizar inspección programada
   - Clic en "Iniciar Inspección"
   - Estado cambia a "En Progreso"

2. **Completar elementos de verificación**:
   
   **Categoría: Frenos**
   - Pastillas delanteras: Estado, espesor
   - Pastillas traseras: Estado, espesor  
   - Líquido de frenos: Nivel, color, contaminación
   - Discos de freno: Desgaste, rayones
   
   **Categoría: Motor**
   - Aceite: Nivel, viscosidad, color
   - Refrigerante: Nivel, color
   - Correa de distribución: Estado, tensión
   - Filtros: Aire, combustible, aceite
   
   **Categoría: Luces**
   - Faros delanteros: Funcionamiento, alineación
   - Luces traseras: Frenos, direccionales, reversa
   - Luces interiores: Tablero, cortesía
   
   **Categoría: Neumáticos**
   - Desgaste: Profundidad de banda
   - Presión: Según especificaciones
   - Estado: Grietas, deformaciones
   
   **Categoría: Suspensión**
   - Amortiguadores: Fugas, funcionamiento
   - Resortes: Estado, asentamiento
   - Rotulas: Juego, desgaste

3. **Registrar resultados por elemento**:
   - **Pasa**: Elemento en condiciones aceptables
   - **Falla**: Requiere reparación inmediata
   - **Advertencia**: Monitorear en próxima inspección
   - **N/A**: No aplica para este vehículo

4. **Agregar observaciones**:
   - Comentarios específicos por elemento
   - Observaciones generales
   - Recomendaciones de mantenimiento

5. **Finalizar inspección**:
   - Revisar todos los elementos
   - Determinar resultado general:
     - **APROBADO**: Vehículo apto para circulación
     - **CONDICIONAL**: Apto con observaciones menores
     - **RECHAZADO**: Requiere reparaciones críticas
   - Clic en "Completar Inspección"

### Certificados e Informes

#### Generar Certificado
1. Acceder a inspección completada
2. Clic en "Generar Certificado"
3. El sistema crea PDF con:
   - Datos del vehículo y propietario
   - Resultados detallados por categoría
   - Fotografías (si se tomaron)
   - Firma digital del inspector
   - Código QR para verificación

#### Envío de Resultados
- **Email automático**: Al propietario registrado
- **SMS**: Notificación de resultado (opcional)
- **Portal web**: Acceso con número de placa

## Reportes y Análisis

### Dashboard de Reportes

**Estadísticas Principales**:
- Total de vehículos registrados
- Inspecciones realizadas (período)
- Tasa de aprobación
- Inspecciones pendientes

**Gráficos Disponibles**:
- Inspecciones por mes
- Tasa de aprobación por período
- Principales fallas encontradas
- Distribución por marca de vehículo

### Reportes Personalizados

#### Reporte de Inspecciones
1. **Filtros disponibles**:
   - Rango de fechas
   - Estado de inspección
   - Inspector
   - Tipo de vehículo
   - Resultado de inspección

2. **Exportar datos**:
   - Excel (.xlsx)
   - PDF
   - CSV para análisis

#### Reporte de Vehículos
- Lista completa o filtrada
- Información de contacto de propietarios
- Estado de inspecciones vigentes
- Vehículos con inspección vencida

#### Análisis de Tendencias
- Comparación período actual vs anterior
- Identificación de patrones de falla
- Recomendaciones de mantenimiento preventivo

### Configuración de Alertas

**Notificaciones Automáticas**:
- Inspecciones vencidas
- Próximas a vencer (7, 15, 30 días)
- Vehículos con fallas críticas
- Resumen semanal para administradores

## Configuración del Sistema

### Gestión de Usuarios

#### Roles Disponibles
- **Administrador**: Acceso completo al sistema
- **Inspector**: Realizar y gestionar inspecciones
- **Operador**: Registrar vehículos y programar citas
- **Consultor**: Solo lectura de reportes

#### Crear Nuevo Usuario
1. Acceder a "Configuración" > "Usuarios"
2. Clic en "Nuevo Usuario"
3. Completar información:
   - Nombre completo
   - Nombre de usuario (único)
   - Email
   - Teléfono
   - Rol asignado
4. Sistema genera contraseña temporal
5. Usuario debe cambiar contraseña en primer acceso

### Configuración de Inspección

#### Elementos de Verificación
- Personalizar categorías e ítems
- Definir criterios de aprobación
- Establecer elementos críticos
- Configurar valores de referencia

#### Centros de Inspección
- Registrar múltiples ubicaciones
- Asignar inspectores por centro
- Configurar horarios de operación
- Gestionar capacidad de citas

### Parámetros del Sistema

**Configuraciones Generales**:
- Información de la empresa
- Logo y personalización
- Vigencia de inspecciones
- Recordatorios automáticos

**Integraciones**:
- Configuración de email (SMTP)
- SMS (opcional)
- APIs externas
- Backup automático

## Resolución de Problemas

### Problemas Comunes

#### No puedo acceder al sistema
1. Verificar URL correcta
2. Comprobar usuario y contraseña
3. Limpiar caché del navegador
4. Contactar al administrador

#### Error al guardar información
1. Verificar conexión a internet
2. Revisar campos obligatorios
3. Comprobar formato de datos
4. Intentar nuevamente después de 1 minuto

#### No aparecen los reportes
1. Verificar filtros aplicados
2. Ampliar rango de fechas
3. Revisar permisos de usuario
4. Contactar soporte técnico

#### Lentitud del sistema
1. Cerrar pestañas no utilizadas
2. Limpiar caché del navegador
3. Verificar conexión a internet
4. Reportar al administrador

### Contacto de Soporte

**Soporte Técnico**:
- Email: soporte@vehicleinspection.com
- Teléfono: +1 (555) 123-4567
- Horario: Lunes a Viernes, 8:00 AM - 6:00 PM

**Documentación Adicional**:
- Manual técnico: /docs/technical-manual.pdf
- Videos tutoriales: /docs/tutorials/
- FAQ: /docs/faq.html

## Mejores Prácticas

### Para Inspectores
- Revisar programación diaria al inicio del turno
- Tomar fotografías de elementos críticos
- Ser detallado en observaciones
- Verificar completitud antes de finalizar
- Mantener actualizada información de contacto

### Para Administradores
- Realizar backup semanal
- Monitorear métricas del sistema
- Actualizar usuarios y permisos regularmente
- Revisar reportes de actividad mensualmente
- Mantener documentación actualizada

### Para Operadores
- Verificar datos antes de registrar vehículos
- Confirmar citas con propietarios
- Mantener agenda actualizada
- Registrar cambios de información inmediatamente
- Seguir procedimientos estándar