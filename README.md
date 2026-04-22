# TaskFlow Pro 🚀

Plataforma empresarial de productividad y automatización de flujos de trabajo.
Construida con Next.js 14, PostgreSQL, Redis, WebSockets, Docker y más.

---

## 📦 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript estricto |
| Base de datos | PostgreSQL 16 + Prisma ORM |
| Cache / Queues | Redis 7 + BullMQ |
| Tiempo real | Socket.io |
| Auth | JWT + Refresh Tokens + OAuth GitHub |
| UI | Tailwind CSS + shadcn/ui + Radix UI |
| Estado cliente | TanStack Query + Zustand |
| Drag & Drop | dnd-kit |
| Validación | Zod |
| Logging | Pino |
| Métricas | Prometheus + Grafana |
| Errores | Sentry |
| Proxy | Nginx |
| Contenedores | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Testing | Jest + Playwright |

---

## 🗂️ Estructura del Proyecto

```
taskflow-pro/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Rutas de autenticación (layout sin sidebar)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/              # Rutas protegidas (layout con sidebar)
│   │   ├── board/[boardId]/      # Tablero Kanban
│   │   ├── automations/          # Motor de automatizaciones
│   │   ├── analytics/            # Dashboard de métricas
│   │   └── settings/             # Configuración de equipo/usuario
│   └── api/                      # API Routes (backend)
│       ├── auth/                 # Login, register, refresh, oauth
│       ├── tasks/                # CRUD de tareas
│       ├── boards/               # CRUD de tableros
│       ├── columns/              # CRUD de columnas
│       ├── automations/          # CRUD de automatizaciones
│       ├── notifications/        # Notificaciones
│       ├── metrics/              # Endpoint para Prometheus
│       └── webhooks/             # Webhooks entrantes
│
├── components/                   # Componentes React
│   ├── ui/                       # shadcn/ui base components
│   ├── board/                    # Kanban board components
│   ├── automations/              # Automation builder
│   ├── analytics/                # Charts y widgets
│   └── shared/                   # Navbar, Sidebar, etc.
│
├── lib/                          # Lógica de servidor reutilizable
│   ├── db/                       # Prisma client singleton
│   ├── redis/                    # ioredis client
│   ├── socket/                   # Socket.io server
│   ├── queue/                    # BullMQ queues y jobs
│   ├── auth/                     # JWT helpers
│   ├── validations/              # Zod schemas
│   ├── logger/                   # Pino logger
│   └── integrations/             # APIs externas
│       ├── open-meteo/           # Clima (sin key)
│       ├── github/               # GitHub OAuth + API
│       └── newsapi/              # Noticias
│
├── workers/                      # BullMQ processors (proceso separado)
│   ├── index.ts                  # Entry point del worker
│   └── processors/               # Un archivo por tipo de job
│
├── types/                        # TypeScript types globales
├── hooks/                        # React custom hooks
├── stores/                       # Zustand stores
├── middleware/                   # Next.js middleware (auth guard)
├── prisma/                       # Schema + migraciones + seed
├── tests/
│   ├── unit/                     # Jest unit tests
│   └── e2e/                      # Playwright E2E tests
├── docker/                       # Dockerfiles
├── nginx/                        # Configuración Nginx
├── prometheus/                   # prometheus.yml
├── grafana/                      # Dashboards + provisioning
└── .github/workflows/            # CI/CD pipelines
```

---

## 🗓️ Roadmap de Fases

### ✅ FASE 1 — Fundamentos (ACTUAL)
Base sólida del proyecto.

- [x] Estructura de carpetas completa
- [x] package.json con todas las dependencias
- [x] TypeScript configuración estricta
- [x] ESLint + Prettier + Husky
- [x] Variables de entorno (.env.example)
- [x] Prisma Schema completo (todos los modelos)
- [x] Docker Compose (App, Worker, Postgres, Redis, Nginx, Prometheus, Grafana)
- [x] Dockerfiles (App + Worker)
- [x] Nginx configuración con rate limiting
- [x] Prometheus configuración
- [x] GitHub Actions CI/CD pipeline
- [x] Tipos TypeScript globales
- [x] README completo

---

### 🔐 FASE 2 — Autenticación
Sistema de auth completo y seguro.

**Paso 2.1** — Prisma client singleton + logger (Pino)
**Paso 2.2** — Redis client + helpers de cache
**Paso 2.3** — JWT helpers (sign, verify, refresh)
**Paso 2.4** — API Routes: POST /api/auth/register
**Paso 2.5** — API Routes: POST /api/auth/login
**Paso 2.6** — API Routes: POST /api/auth/refresh
**Paso 2.7** — API Routes: POST /api/auth/logout
**Paso 2.8** — OAuth GitHub (callback + perfil)
**Paso 2.9** — Next.js Middleware (auth guard por rutas)
**Paso 2.10** — UI: Login page + Register page
**Paso 2.11** — Zustand auth store
**Paso 2.12** — TanStack Query hooks para auth

---

### 📋 FASE 3 — Core: Kanban en Tiempo Real
El corazón de la aplicación.

**Paso 3.1** — Socket.io server setup
**Paso 3.2** — API Routes: Boards CRUD
**Paso 3.3** — API Routes: Columns CRUD
**Paso 3.4** — API Routes: Tasks CRUD
**Paso 3.5** — WebSocket events para tareas
**Paso 3.6** — UI: Sidebar con lista de boards
**Paso 3.7** — UI: Tablero Kanban (columnas + tarjetas)
**Paso 3.8** — Drag & Drop con dnd-kit
**Paso 3.9** — UI: Modal de detalle de tarea
**Paso 3.10** — Comentarios en tiempo real
**Paso 3.11** — Indicadores de presencia (quién está viendo)

---

### ⚡ FASE 4 — Motor de Automatizaciones
La feature más compleja e impresionante.

**Paso 4.1** — BullMQ setup (queues + workers)
**Paso 4.2** — Worker: procesador de automatizaciones
**Paso 4.3** — Integración Open-Meteo (trigger por clima)
**Paso 4.4** — Scheduler (cron jobs con BullMQ)
**Paso 4.5** — API Routes: Automations CRUD
**Paso 4.6** — UI: Listado de automatizaciones
**Paso 4.7** — UI: Builder visual de automatizaciones
**Paso 4.8** — UI: Historial de ejecuciones (AutomationRun)
**Paso 4.9** — Sistema de notificaciones (DB + WS)

---

### 📊 FASE 5 — APIs Externas + Dashboard Analytics
Integraciones y visualización de datos.

**Paso 5.1** — Integración NewsAPI (widget de noticias)
**Paso 5.2** — Integración ExchangeRate (conversión de moneda)
**Paso 5.3** — Integración IPInfo (registro de sesiones)
**Paso 5.4** — API Routes: Analytics (métricas del equipo)
**Paso 5.5** — UI: Dashboard con widgets
**Paso 5.6** — UI: Gráficos con Recharts
**Paso 5.7** — UI: Notificaciones en tiempo real (centro de notifs)

---

### 🔭 FASE 6 — Observabilidad
Monitoreo production-grade.

**Paso 6.1** — Endpoint /api/metrics (prom-client)
**Paso 6.2** — Métricas custom (requests, latencia, jobs, errores)
**Paso 6.3** — Grafana: dashboard de infraestructura
**Paso 6.4** — Grafana: dashboard de negocio (KPIs)
**Paso 6.5** — Sentry setup (errores en producción)
**Paso 6.6** — Alertas en Grafana

---

### 🧪 FASE 7 — Testing
Cobertura completa de pruebas.

**Paso 7.1** — Jest config + setup
**Paso 7.2** — Unit tests: auth helpers
**Paso 7.3** — Unit tests: validations (Zod schemas)
**Paso 7.4** — Unit tests: queue processors
**Paso 7.5** — Integration tests: API Routes
**Paso 7.6** — Playwright config
**Paso 7.7** — E2E: flujo de registro/login
**Paso 7.8** — E2E: crear tarea y moverla en el Kanban
**Paso 7.9** — E2E: crear y ejecutar automatización

---

### 🚀 FASE 8 — Producción
Preparación para deploy real.

**Paso 8.1** — Variables de entorno de producción
**Paso 8.2** — Seed de base de datos
**Paso 8.3** — Backup automático de PostgreSQL
**Paso 8.4** — Grafana provisioning (dashboards como código)
**Paso 8.5** — Documentación API con Swagger/OpenAPI
**Paso 8.6** — Guía de deploy en VPS

---

## 🚀 Inicio rápido

```bash
# 1. Clonar e instalar
git clone https://github.com/tu-usuario/taskflow-pro
cd taskflow-pro
npm install

# 2. Configurar entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# 3. Levantar servicios con Docker
docker compose --profile dev up -d

# 4. Ejecutar migraciones
npm run db:migrate

# 5. Seed (datos de prueba)
npm run db:seed

# 6. Iniciar la app
npm run dev

# 7. Iniciar worker (en otra terminal)
npm run worker:dev
```

---

## 🌐 Puertos

| Servicio | Puerto |
|---------|--------|
| Next.js App | http://localhost:3000 |
| Nginx | http://localhost:80 |
| Grafana | http://localhost:3002 |
| Prometheus | http://localhost:9090 |
| Redis Commander | http://localhost:8081 |
| PostgreSQL | localhost:5432 |

---

## 📝 Licencia

MIT — Libre para uso en portafolio y proyectos personales.
