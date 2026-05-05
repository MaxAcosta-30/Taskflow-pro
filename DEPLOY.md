# Guía de Deploy — TaskFlow Pro

Instrucciones para desplegar TaskFlow Pro en un VPS con Ubuntu 22.04 LTS.
Tiempo estimado: 30-45 minutos en un servidor nuevo.

---

## Requisitos del servidor

| Recurso | Mínimo | Recomendado |
|---|---|---|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 2 GB | 4 GB |
| Disco | 20 GB SSD | 40 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

Proveedores compatibles: DigitalOcean, Hetzner, Linode, AWS EC2, cualquier VPS con Ubuntu.

---

## Paso 1 — Preparar el servidor

```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Instalar herramientas básicas
sudo apt install -y curl git ufw fail2ban

# Configurar firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Crear usuario de deploy (no usar root)
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo su - deploy
```

---

## Paso 2 — Instalar Docker

```bash
# Instalar Docker Engine (método oficial)
curl -fsSL https://get.docker.com | sh

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER
newgrp docker

# Verificar instalación
docker --version
docker compose version
```

---

## Paso 3 — Instalar Node.js 20

```bash
# Usando nvm (recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

nvm install 20
nvm use 20
nvm alias default 20

node --version  # debe mostrar v20.x.x
```

---

## Paso 4 — Clonar y configurar el proyecto

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/taskflow-pro /opt/taskflow-pro
cd /opt/taskflow-pro

# Instalar dependencias
npm ci

# Configurar variables de entorno de PRODUCCIÓN
cp .env.example .env
nano .env
```

### Variables críticas para producción

Edita el archivo `.env` y configura al menos estas variables:

```bash
NODE_ENV=production

# Generar con: openssl rand -base64 64
JWT_SECRET=SECRETO_ALEATORIO_MUY_LARGO_MIN_64_CHARS
JWT_REFRESH_SECRET=OTRO_SECRETO_DIFERENTE_MUY_LARGO

# Tu dominio real
NEXT_PUBLIC_APP_URL=https://tudominio.com

# PostgreSQL (cambiar las credenciales por defecto)
POSTGRES_USER=taskflow_prod
POSTGRES_PASSWORD=PASSWORD_SEGURO_ALEATORIO
POSTGRES_DB=taskflow_production
DATABASE_URL=postgresql://taskflow_prod:PASSWORD_SEGURO_ALEATORIO@postgres:5432/taskflow_production

# Redis
REDIS_URL=redis://redis:6379

# GitHub OAuth (registrar en github.com/settings/applications/new)
GITHUB_CLIENT_ID=tu_client_id
GITHUB_CLIENT_SECRET=tu_client_secret

# Sentry (opcional pero recomendado)
SENTRY_DSN=https://...@sentry.io/...

# Retención de backups
BACKUP_RETENTION_DAYS=30
```

> **Importante:** Nunca commitees el archivo `.env` al repositorio.

---

## Paso 5 — Configurar dominio y SSL

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado SSL (reemplaza con tu dominio real)
sudo certbot certonly --standalone -d tudominio.com -d www.tudominio.com

# Los certificados quedan en:
# /etc/letsencrypt/live/tudominio.com/fullchain.pem
# /etc/letsencrypt/live/tudominio.com/privkey.pem
```

Actualiza `nginx/nginx.conf` para usar los certificados SSL:

```nginx
server {
    listen 443 ssl;
    server_name tudominio.com;

    ssl_certificate     /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;

    # ... resto de la configuración
}

server {
    listen 80;
    server_name tudominio.com;
    return 301 https://$host$request_uri;
}
```

---

## Paso 6 — Build y primer deploy

```bash
cd /opt/taskflow-pro

# Build de la aplicación
npm run build

# Generar cliente Prisma
npx prisma generate

# Levantar todos los servicios
docker compose up -d

# Verificar que todos los servicios están healthy
docker compose ps

# Ejecutar migraciones de base de datos
docker compose exec app npx prisma migrate deploy

# Sembrar datos iniciales (solo en el primer deploy)
docker compose exec app npx prisma db seed

# Verificar que la app responde
curl http://localhost:3000/api/health
```

---

## Paso 7 — Verificación del deploy

```bash
# Verificar todos los servicios
docker compose ps

# Ver logs de la aplicación (últimas 50 líneas)
docker compose logs app --tail=50

# Ver logs del worker
docker compose logs worker --tail=50

# Verificar métricas de Prometheus
curl http://localhost:9090/-/healthy

# Verificar health de la app
curl https://tudominio.com/api/health
```

Respuesta esperada del health check:
```json
{
  "status": "healthy",
  "checks": {
    "postgres": "ok",
    "redis": "ok"
  }
}
```

---

## Actualizaciones (deploys subsecuentes)

```bash
cd /opt/taskflow-pro

# Obtener cambios
git pull origin main

# Instalar nuevas dependencias si las hay
npm ci

# Build
npm run build

# Reiniciar servicios con la nueva imagen
docker compose pull
docker compose up -d --no-build

# Aplicar nuevas migraciones si las hay
docker compose exec app npx prisma migrate deploy

# Limpiar imágenes antiguas
docker image prune -f

echo "Deploy completado: $(date)"
```

---

## Backups

Los backups de PostgreSQL se ejecutan automáticamente cada día a las 02:00 AM.

```bash
# Ver backups disponibles
ls -lh /var/lib/docker/volumes/taskflow-pro_postgres-backups/_data/

# Ejecutar backup manual
docker compose exec backup /backup.sh

# Restaurar desde un backup (interactivo)
docker compose exec backup /restore.sh /backups/taskflow_20260101_020000.sql.gz
```

---

## Monitoreo

| Servicio | URL | Credenciales |
|---|---|---|
| Grafana | https://tudominio.com:3002 | admin / [GRAFANA_ADMIN_PASSWORD del .env] |
| Prometheus | http://localhost:9090 | Solo accesible desde el servidor |

### Alertas configuradas

Las siguientes alertas están preconfiguradas en Grafana y notifican via webhook:

- **High HTTP Latency p95**: La latencia del percentil 95 supera los 500ms de forma sostenida por 2 minutos (Warning).
- **High HTTP Error Rate**: La proporción de respuestas con error HTTP 5xx supera el 5% del tráfico global en 2 minutos (Critical).
- **Automation Queue Backlog**: Más de 100 trabajos en espera procesándose en los últimos 5 minutos en BullMQ, indica posible saturación (Warning).
- **Queue Job Failures**: Más de 10 trabajos en cola fallidos o rebotados detectados en el plazo de 5 minutos (Critical).
- **No Active WebSocket Connections**: No se detectan conexiones activas hacia el servicio de WebSocket durante 10 minutos seguidos.

---

## Solución de problemas

### La aplicación no arranca

```bash
# Ver logs detallados
docker compose logs app --tail=100

# Verificar variables de entorno
docker compose exec app env | grep -E "DATABASE|REDIS|JWT"

# Verificar conectividad a base de datos
docker compose exec app npx prisma db execute --stdin <<< "SELECT 1;"
```

### Error de migraciones

```bash
# Ver estado de migraciones
docker compose exec app npx prisma migrate status

# Si hay migraciones pendientes
docker compose exec app npx prisma migrate deploy
```

### Redis no conecta

```bash
docker compose exec redis redis-cli ping
# Debe responder: PONG
```

### Puerto 80/443 ocupado

```bash
sudo lsof -i :80
sudo lsof -i :443
# Detener el proceso que ocupa el puerto antes de levantar Nginx
```

### Ver logs en tiempo real

```bash
# Todos los servicios
docker compose logs -f

# Solo app y worker
docker compose logs -f app worker
```

---

## Rollback

Si un deploy falla:

```bash
cd /opt/taskflow-pro

# Volver al commit anterior
git log --oneline -5   # ver commits recientes
git checkout [commit-anterior]

# Rebuild y reiniciar
npm run build
docker compose up -d --no-build

# Si hubo migraciones de DB que necesitan revertirse, 
# restaurar desde el backup más reciente:
docker compose exec backup /restore.sh /backups/[backup-antes-del-deploy].sql.gz
```
