# TaskFlow Pro - Guía de Despliegue en Producción

Esta guía detalla los pasos para desplegar TaskFlow Pro en un VPS (Ubuntu 22.04+) utilizando Docker y Nginx como proxy inverso.

## 📋 Requisitos Mínimos
- **CPU:** 2 vCPUs
- **RAM:** 2GB (4GB recomendado para el stack completo)
- **Disco:** 20GB SSD
- **SO:** Ubuntu 22.04 LTS
- **Herramientas:** Docker Engine + Docker Compose

## 🚀 Pasos de Instalación

### 1. Preparación del Servidor
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER
# Reiniciar sesión para aplicar cambios de grupo
```

### 2. Clonar y Configurar
```bash
git clone https://github.com/tu-usuario/taskflow-pro.git
cd taskflow-pro
cp .env.example .env.production
```

### 3. Generar Secretos
Genera claves seguras para JWT y contraseñas de DB:
```bash
openssl rand -base64 64 # Usa el output para JWT_ACCESS_SECRET y JWT_REFRESH_SECRET
```

Edita `.env.production` con tus valores reales (Dominio, Sentry DSN, Credenciales OAuth).

### 4. Lanzar el Stack
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 5. Configurar Nginx + SSL (Certbot)
Instala Nginx en el host y configura un sitio:
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Configuración sugerida `/etc/nginx/sites-available/taskflow`:
```nginx
server {
    server_name taskflow.tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```
Activa SSL: `sudo certbot --nginx -d taskflow.tu-dominio.com`

---

## 🛠 Mantenimiento y Logs

### Ver Logs de Producción
- **App Principal:** `docker compose logs -f app`
- **Workers:** `docker compose logs -f worker`
- **Base de Datos:** `docker compose logs -f postgres`

### Rollback en caso de error
Si un nuevo despliegue falla, vuelve a la versión anterior:
```bash
git checkout v1.0.x-stable
docker compose up -d --build
```

### Backup de Base de Datos
El stack incluye un script de backup automático en `docker/postgres/backup.sh`. Puedes programar un cron:
```bash
0 3 * * * /path/to/taskflow-pro/docker/postgres/backup.sh
```

---

## 🔍 Checklist de Producción
- [ ] `NODE_ENV` establecido en `production`.
- [ ] Puertos innecesarios cerrados en el Firewall (UFW). Solo 80, 443 y 22 permitidos.
- [ ] Sentry DSN configurado y capturando errores.
- [ ] Volumen de PostgreSQL persistido en host.
- [ ] Métricas de Prometheus protegidas (no expuestas públicamente).
