# Sistema de Inspección Vehicular - Guía de Deployment

## Requisitos del Sistema

### Hardware Mínimo
- CPU: 4 cores
- RAM: 8GB
- Almacenamiento: 50GB SSD
- Red: Conexión estable a internet

### Software
- Docker Desktop 4.15+
- Docker Compose 2.12+
- Git (para clonar repositorio)
- Windows 10/11 o Linux Ubuntu 20.04+

## Instalación Rápida

### 1. Clonar Repositorio
```bash
git clone <repository-url>
cd vehicle-inspection-system
```

### 2. Configuración Inicial
```bash
# Ejecutar script de instalación
install-dependencies.bat  # Windows
# o ./install-dependencies.sh  # Linux

# Configurar variables de entorno
cp .env.example .env
```

### 3. Iniciar Sistema
```bash
# Iniciar todos los servicios
start-system.bat  # Windows
# o ./start-system.sh  # Linux
```

## Configuración Detallada

### Variables de Entorno
Crear archivo `.env` en la raíz del proyecto:

```env
# Base de datos
POSTGRES_DB=vehicle_inspection
POSTGRES_USER=inspection_user
POSTGRES_PASSWORD=inspection_pass123

# Redis
REDIS_PASSWORD=redis_pass123

# Backend
SECRET_KEY=your-super-secret-key-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production
FLASK_ENV=production

# Frontend
REACT_APP_API_URL=http://localhost:5000/api

# Monitoreo
GRAFANA_ADMIN_PASSWORD=admin123

# Email (opcional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Configuración SSL (Producción)
1. Obtener certificados SSL
2. Colocar en `nginx/ssl/`
3. Actualizar `nginx/nginx.conf`
4. Reiniciar servicios

## Deployment en Producción

### 1. Servidor Ubuntu 20.04+
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clonar y configurar
git clone <repo-url> /opt/vehicle-inspection
cd /opt/vehicle-inspection
chmod +x *.sh
```

### 2. Configuración de Firewall
```bash
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw allow 3001    # Grafana (opcional)
sudo ufw enable
```

### 3. Configuración de Nginx (Proxy Reverso)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/ssl/certs/your-cert.pem;
    ssl_certificate_key /etc/ssl/private/your-key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Monitoreo y Mantenimiento

### Servicios de Monitoreo
- **Grafana**: http://localhost:3001 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Backend Health**: http://localhost:5000/api/health

### Logs
```bash
# Ver logs en tiempo real
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Logs específicos
docker-compose logs --tail=100 backend
```

### Backups Automáticos
```bash
# Backup manual
./backup-system.bat

# Programar backup diario (Linux)
sudo crontab -e
# Agregar: 0 2 * * * /opt/vehicle-inspection/backup-system.sh
```

### Actualizaciones
```bash
# Detener servicios
docker-compose down

# Actualizar código
git pull origin main

# Reconstruir imágenes
docker-compose build --no-cache

# Iniciar servicios
docker-compose up -d

# Verificar estado
docker-compose ps
```

## Escalabilidad

### Load Balancer (múltiples instancias)
```yaml
# docker-compose.override.yml
version: '3.8'
services:
  backend:
    deploy:
      replicas: 3
      
  nginx:
    volumes:
      - ./nginx/nginx-lb.conf:/etc/nginx/nginx.conf
```

### Base de datos distribuida
```yaml
# Para alta disponibilidad
postgres-master:
  image: postgres:15-alpine
  
postgres-slave:
  image: postgres:15-alpine
  environment:
    - PGUSER=replication_user
```

## Troubleshooting

### Problemas Comunes

#### 1. Base de datos no conecta
```bash
# Verificar estado
docker-compose ps postgres

# Revisar logs
docker-compose logs postgres

# Reiniciar servicio
docker-compose restart postgres
```

#### 2. Frontend no carga
```bash
# Verificar variables de entorno
docker-compose exec frontend env | grep REACT_APP

# Reconstruir
docker-compose build frontend --no-cache
```

#### 3. Errores de memoria
```bash
# Verificar uso de recursos
docker stats

# Limpiar datos no usados
docker system prune -a
```

#### 4. SSL Issues
```bash
# Verificar certificados
openssl x509 -in certificate.crt -text -noout

# Renovar certificados (Let's Encrypt)
sudo certbot renew
```

## Optimización de Performance

### Backend
- Usar Redis para caché
- Configurar connection pooling
- Optimizar queries SQL
- Comprimir respuestas API

### Frontend
- Lazy loading de componentes
- Code splitting
- CDN para assets estáticos
- Service Workers

### Base de datos
- Índices en consultas frecuentes
- Particionamiento de tablas grandes
- Vacuum regular
- Analyze statistics

## Seguridad

### Checklist de Seguridad
- [ ] Cambiar todas las contraseñas por defecto
- [ ] Configurar HTTPS con certificados válidos
- [ ] Actualizar dependencias regularmente
- [ ] Configurar firewall apropiadamente
- [ ] Backup regular y cifrado
- [ ] Logs de auditoría activados
- [ ] Rate limiting configurado
- [ ] Headers de seguridad configurados

### Hardening
```bash
# Deshabilitar servicios no necesarios
sudo systemctl disable apache2
sudo systemctl disable sendmail

# Configurar fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban

# Actualizaciones automáticas
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

## Contacto y Soporte

Para soporte técnico o problemas:
1. Revisar logs del sistema
2. Consultar documentación
3. Crear issue en el repositorio
4. Contactar al equipo de desarrollo