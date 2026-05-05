# TaskFlow Pro

Plataforma empresarial de productividad y automatización de flujos de trabajo con tableros Kanban en tiempo real.

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript) ![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black?logo=next.js) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql) ![Redis](https://img.shields.io/badge/Redis-7.2-red?logo=redis) ![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker) ![License MIT](https://img.shields.io/badge/License-MIT-green)

```text
 ___________________________________________________________________
|  TaskFlow Pro                                         [Search] (A)|
|-------------------------------------------------------------------|
|  Backlog (3)  |  To Do (2)    |  In Progress (1) |  Done (4)      |
|  [ Feature A] |  [ Bugfix B]  |  [ Feature C ]   |  [ Task D ]    |
|  [ Task E   ] |  [ Task F  ]  |                  |  [ Task G ]    |
|  [ Task H   ] |               |                  |  [ Task I ]    |
|               |               |                  |  [ Task J ]    |
| [ + Tarea ]   | [ + Tarea ]   | [ + Tarea ]      | [ + Tarea ]    |
|___________________________________________________________________|
```

---

## Características

- **Kanban en tiempo real** — Actualizaciones instantáneas usando Socket.io en custom server y eventos sincronizados vía Redis pub/sub.
- **Motor de automatizaciones** — 7 tipos de triggers y 6 tipos de acciones procesadas asíncronamente en background workers con BullMQ.
- **Dashboard de analytics** — Visualización de datos de rendimiento del equipo enriquecidos con integraciones de Open-Meteo y NewsAPI.
- **Autenticación completa** — Sesiones seguras mediante JWT con rotación de refresh tokens, OAuth con GitHub y blacklist de tokens revocados en Redis.
- **Observabilidad** — Exportación de métricas de negocio e infraestructura a Prometheus, dashboards en Grafana, monitoreo de errores con Sentry y logs estructurados con Pino.
- **APIs externas gratuitas** — Integraciones pre-configuradas usando tiers gratuitos de Open-Meteo, NewsAPI, ExchangeRate y IPInfo.

---

## Stack

| Categoría | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 14.2.5 |
| Lenguaje | TypeScript | ^5 |
| Base de datos | PostgreSQL (Prisma ORM) | ^5.17.0 |
| Cache & Pub/Sub | Redis (ioredis) | ^5.4.1 |
| Colas (Queues) | BullMQ | ^5.12.0 |
| Tiempo real | Socket.io | ^4.7.5 |
| Autenticación | JWT (jsonwebtoken) & bcryptjs | ^9.0.2 |
| UI & Estilos | Tailwind CSS & Radix UI | ^3.4.1 |
| Estado cliente | Zustand & TanStack React Query | ^4.5.4 |
| Validación | Zod | ^3.23.8 |
| Testing | Jest & Playwright | ^29.7.0 |
| Métricas | Prometheus (prom-client) | ^15.1.3 |
| Logging | Pino | ^9.3.2 |
| Contenedores | Docker & Docker Compose | - |

---

## Arquitectura

```text
┌─────────────────────────────────────────────────────┐
│                     Nginx                           │
│            Rate limiting + SSL termination          │
└──────────┬──────────────────────────┬───────────────┘
           │                          │
  ┌────────▼────────┐       ┌────────▼────────┐
  │   Next.js App   │       │  Socket.io      │
  │  (App Router)   │       │  (server.ts)    │
  │  API Routes     │       │  WS connections │
  └────────┬────────┘       └────────┬────────┘
           │                          │
           └──────────┬───────────────┘
                      │
         ┌────────────▼────────────┐
         │         Redis           │
         │  Cache │ Pub/Sub │ BullMQ│
         └────────────┬────────────┘
                      │
         ┌────────────▼────────────┐
         │       PostgreSQL        │
         │      (Prisma ORM)       │
         └─────────────────────────┘
                      │
         ┌────────────▼────────────┐
         │    BullMQ Workers       │
         │  automation │ notif     │
         │  scheduler  │ cleanup   │
         └─────────────────────────┘
```

La aplicación se despliega mediante un custom server (`server.ts`) que monta tanto Next.js como Socket.io en el mismo proceso. Las API Routes procesan el tráfico HTTP y publican eventos a Redis Pub/Sub, los cuales son interceptados por el servidor Socket.io para su retransmisión a clientes conectados en tiempo real. Tareas de larga duración y automatizaciones se delegan a colas de BullMQ respaldadas por Redis, consumidas por un pool de workers independiente.

---

## Inicio rápido

### Prerequisitos

- Node.js >= 20
- Docker y Docker Compose
- Git

### Instalación

```bash
git clone https://github.com/tu-usuario/taskflow-pro
cd taskflow-pro

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores (ver sección de configuración)

# Levantar infraestructura
docker compose --profile dev up -d

# Ejecutar migraciones
npm run db:migrate

# Sembrar datos de prueba
npm run db:seed

# Iniciar la aplicación (en dos terminales)
npm run dev          # Terminal 1 — Next.js + Socket.io
npm run worker:dev   # Terminal 2 — BullMQ workers
```

La aplicación estará disponible en http://localhost:3000

### Credenciales del seed

| Usuario | Email | Contraseña | Rol |
|---|---|---|---|
| Alice Admin | alice@taskflow.pro | password123 | Admin |
| Bob Developer | bob@taskflow.pro | password123 | Member |
| Carlos Viewer | carlos@taskflow.pro | password123 | Member |

---

## Configuración

### Requeridas

| Variable | Descripción | Ejemplo |
|---|---|---|
| DATABASE_URL | Conexión a PostgreSQL | postgresql://taskflow:taskflow_password@localhost:5432/taskflow_db |
| REDIS_URL | Conexión a Redis | redis://localhost:6379 |
| JWT_SECRET | Secreto para access tokens (min 32 chars) | [generado con openssl rand -base64 64] |
| JWT_REFRESH_SECRET | Secreto para refresh tokens (diferente al anterior) | [generado con openssl rand -base64 64] |

### Opcionales (APIs externas gratuitas)

| Variable | Descripción | Cómo obtenerla |
|---|---|---|
| GITHUB_CLIENT_ID | OAuth GitHub | github.com/settings/apps |
| NEWS_API_KEY | Noticias en dashboard | newsapi.org (free tier) |
| EXCHANGE_RATE_API_KEY | Conversión de moneda | exchangerate-api.com (free) |
| IPINFO_TOKEN | Geolocalización de sesiones | ipinfo.io (50k req/mes gratis) |
| SENTRY_DSN | Monitoreo de errores | sentry.io (free tier) |

### Generación de secretos JWT

```bash
# Ejecutar dos veces para obtener dos secretos diferentes
openssl rand -base64 64
```

---

## Scripts disponibles

| Script | Descripción |
|---|---|
| npm run dev | Inicia Next.js + Socket.io en desarrollo mediante `tsx` |
| npm run build | Construye la aplicación Next.js de producción |
| npm run start | Inicia el servidor `server.ts` compilado para producción |
| npm run lint | Ejecuta verificaciones de código ESLint |
| npm run format | Aplica auto-formateo en todo el código con Prettier |
| npm run type-check | Verifica la compilación de TypeScript sin emitir binarios |
| npm run db:migrate | Aplica migraciones de desarrollo a Prisma y a PostgreSQL |
| npm run db:seed | Siembra datos de prueba en la base de datos |
| npm run db:studio | Inicia la interfaz web de Prisma Studio |
| npm run worker:dev | Ejecuta los procesos workers de BullMQ en entorno de desarrollo |
| npm run test | Ejecuta tests unitarios con Jest |
| npm run test:coverage | Genera reporte de cobertura de código para tests unitarios |
| npm run test:e2e | Ejecuta el conjunto de tests End-to-End con Playwright |

---

## Servicios en desarrollo

| Servicio | URL | Descripción |
|---|---|---|
| Aplicación | http://localhost:3000 | Next.js + Socket.io |
| Grafana | http://localhost:3002 | Dashboards (admin/admin123) |
| Prometheus | http://localhost:9090 | Métricas |
| Redis Commander | http://localhost:8081 | UI de Redis |
| Prisma Studio | http://localhost:5555 | GUI de base de datos |

---

## Motor de Automatizaciones

### Tipos de Trigger

| Trigger | Descripción | Ejemplo Config |
|---|---|---|
| TASK_STALE | Tarea permanece inactiva por X días | `{ "daysStale": 3, "columnName": "In Review" }` |
| TASK_MOVED | Tarea se mueve a una columna específica | `{ "toColumnName": "In Progress" }` |
| TASK_ASSIGNED | Se asigna tarea a un usuario | `{}` |
| TASK_DUE_SOON | Tarea próxima a su fecha de expiración | `{ "hoursBefore": 24 }` |
| SCHEDULE | Ejecución periódica basada en tiempo | `{ "cronExpression": "0 9 * * 1" }` |
| WEATHER | Condiciones de temperatura o precipitación | `{ "weatherCondition": "rain", "latitude": 40.71, "longitude": -74.00 }` |
| WEBHOOK | Eventos desde una API externa mediante JSON | `{}` |

### Tipos de Acción

| Acción | Descripción | Ejemplo Config |
|---|---|---|
| MOVE_TASK | Mueve tarea a columna designada | `{ "toColumnId": "cm1ab2cd" }` |
| ASSIGN_USER | Asigna usuario destino a una tarea | `{ "userId": "cm1ab2cd" }` |
| ADD_LABEL | Añade etiqueta descriptiva | `{ "labelId": "cm1ab2cd" }` |
| SEND_NOTIFICATION | Emite push/in-app notification a un usuario | `{ "userId": "cm1ab2cd", "title": "¡Aviso!", "body": "Revisar tarea" }` |
| WEBHOOK | Llama API remota via POST/GET HTTP | `{ "url": "https://api.example.com", "method": "POST" }` |
| CREATE_TASK | Produce una nueva subtarea en el tablero | `{ "title": "Revisión final", "columnId": "cm1ab2cd" }` |

### Ejemplo de automatización

```text
Trigger: TASK_STALE (daysStale: 3, columnName: "In Review")
Acción 1: MOVE_TASK → columna "En Riesgo"
Acción 2: SEND_NOTIFICATION → "Tarea atascada en revisión por 3 días"
```

---

## Testing

```bash
# Tests unitarios
npm run test

# Tests unitarios con coverage
npm run test:coverage

# Tests E2E (requiere servidor corriendo)
npm run test:e2e

# Tests E2E con UI visual
npm run test:e2e:ui
```

| Módulo | Cobertura (Líneas) |
|---|---|
| Unit Tests Global | ~25.02% |

---

## Contribución

1. Fork del repositorio
2. Crear rama: `git checkout -b feature/mi-feature`
3. Commits con formato convencional: `feat:`, `fix:`, `docs:`
4. Push y Pull Request

El CI/CD verifica automáticamente: TypeScript, ESLint, Prettier, tests unitarios y E2E.

---

## Licencia

MIT — ver [LICENSE](LICENSE)
