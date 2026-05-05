# Arquitectura — TaskFlow Pro

Documentación de las decisiones técnicas y el diseño del sistema.

---

## Visión general

TaskFlow Pro es una aplicación fullstack construida sobre Next.js 14 con App Router.
El sistema tiene tres procesos principales que corren simultáneamente:

1. **Servidor Next.js + Socket.io** (`server.ts`) — Sirve la aplicación web y mantiene conexiones WebSocket persistentes.
2. **Workers BullMQ** (`workers/index.ts`) — Proceso separado que consume jobs de Redis de forma asíncrona.
3. **Infraestructura Docker** — PostgreSQL, Redis, Nginx, Prometheus y Grafana.

---

## Por qué cada decisión técnica

### Next.js 14 con App Router

App Router introduce una nueva arquitectura centrada en React Server Components (RSC). Esto permite que componentes pesados (como los dashboards) sean renderizados directamente en el servidor sin añadir carga al bundle de cliente, lo que optimiza la experiencia de carga inicial. Adicionalmente, el ruteo basado en directorios anidados y las API routes funcionando con el estándar Web Request/Response simplifican enormemente el flujo de datos. Finalmente, la salida `standalone` compilada nativamente es ideal para contenedores Docker.

### Custom server.ts en lugar de `next dev`

Las API routes de Next.js son funciones serverless: se crean y destruyen por request. Socket.io necesita mantener conexiones persistentes (estado). Es imposible que ambos vivan en el mismo proceso de la forma estándar.

La solución es un custom server que monta tanto Next.js como Socket.io en el mismo proceso HTTP:

```text
HTTP request → server.ts → Next.js handler (API routes, páginas)
WebSocket    → server.ts → Socket.io handler (conexiones persistentes)
```

```typescript
// server.ts (simplificado)
const app = next({ dev, port })
const handle = app.getRequestHandler()

void app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? '/', true)
    void handle(req, res, parsedUrl)
  })

  // Inicializa Socket.io acoplado al httpServer
  initSocketServer(httpServer)

  httpServer.listen(port)
})
```

### Redis pub/sub como puente entre API routes y Socket.io

Las API routes no tienen acceso directo al servidor Socket.io porque corren en el mismo proceso pero en contextos distintos. La comunicación entre ellos se hace a través de Redis:

```text
API route → publishToBoard() → Redis pub/sub → Socket.io subscriber → cliente WS
```

Esto también permite escalar horizontalmente en el futuro: múltiples instancias de la app pueden publicar a Redis y cualquier instancia con conexiones WebSocket activas recibirá el evento.

```typescript
// lib/socket/publisher.ts
export async function publishToBoard<K extends keyof SocketEvents>(
  boardId: string,
  event: K,
  data: SocketEvents[K],
): Promise<void> {
  // Las API routes usan esto sin conocer el objeto global io
  await redis.publish(`board:${boardId}`, JSON.stringify({ event, data }))
}
```

```typescript
// lib/socket/index.ts
// El servidor WS se suscribe permanentemente para captar esos eventos
subscriber.psubscribe('board:*')
subscriber.on('pmessage', (pattern, channel, message) => {
  const boardId = channel.split(':')[1]
  const { event, data } = JSON.parse(message)
  io.to(`board:${boardId}`).emit(event, data)
})
```

### BullMQ sobre otras opciones de colas

BullMQ fue seleccionado frente a alternativas como pg-boss (PostgreSQL-based) o AWS SQS porque:
- Utiliza Redis, el cual ya está incluido en el stack para caching y pub/sub, evitando así añadir otra dependencia de infraestructura.
- Su API nativa de TypeScript provee genéricos para asegurar fuertemente el tipado del payload a través de toda la tubería.
- Posibilita integrar de manera sencilla un dashboard externo (Bull Board) y monitorizar jobs caídos.
- Maneja tareas programadas y repetibles, ideal para el cron del procesador `scheduler.ts`.
- Permite configurar reintentos automáticos con "backoff exponencial".

### Refresh token rotation

Cada vez que el cliente usa su refresh token para obtener nuevos tokens, el refresh token anterior se invalida en la base de datos y se emite uno nuevo. Si un atacante roba el refresh token y lo usa antes que el usuario legítimo, el próximo intento del usuario legítimo detecta el token inválido y puede revocar toda la sesión.

```text
Cliente envía refresh_token →
  Servidor verifica en DB (isRevoked: false) →
  Invalida el token anterior (isRevoked: true) →
  Crea nueva Session con nuevo refresh_token →
  Retorna nuevos access_token + refresh_token
```

### Redis para blacklist de access tokens

Los JWT no se pueden "revocar" por diseño — son válidos hasta que expiran. Para el logout inmediato, el access token se agrega a una blacklist en Redis con TTL igual al tiempo de expiración restante del token. Cada request verifica si el token está en la blacklist antes de procesarlo.

Costo: una operación `GET` en Redis por request autenticado — O(1), microsegundos.

### Motor de automatizaciones

El motor tiene tres capas:

**Capa 1 — Evaluación de triggers** (`workers/processors/scheduler.ts`)
El scheduler corre cada 5 minutos y evalúa todas las automatizaciones activas. Para cada una verifica si su trigger se cumple con una consulta a PostgreSQL o a una API externa.

**Capa 2 — Cola de ejecución** (BullMQ `automations` queue)
Cuando un trigger se cumple, se agrega un job a la cola. La cola garantiza que: los jobs se reintentan si fallan (3 intentos con backoff exponencial), no se pierden si el worker se cae, y el historial de ejecuciones queda registrado.

**Capa 3 — Ejecución de acciones** (`workers/processors/automation.ts`)
El processor ejecuta cada acción en orden, registra logs detallados, y actualiza el `AutomationRun` en la base de datos con el resultado.

```text
Scheduler (cada 5min)
  └── evalúa trigger TASK_STALE
        └── encuentra 3 tareas obsoletas
              └── triggerAutomation() × 3
                    └── BullMQ queue (persistente en Redis)
                          └── automationProcessor()
                                ├── Acción 1: MOVE_TASK → publica en Redis pub/sub → Socket.io → cliente
                                ├── Acción 2: SEND_NOTIFICATION → queueNotification()
                                └── Actualiza AutomationRun { status: SUCCESS, logs: [...] }
```

### Observabilidad en tres capas

**Capa 1 — Logs estructurados** (Pino)
Todos los logs son JSON con campos consistentes: `module`, `userId`, `jobId`, etc. En producción se pueden enviar a cualquier servicio de log aggregation (Datadog, Loki, CloudWatch).

**Capa 2 — Métricas de sistema y negocio** (Prometheus + prom-client)
Dos tipos de métricas:
- Infraestructura: latencia HTTP p95, jobs en cola, conexiones WebSocket activas
- Negocio: automatizaciones ejecutadas por tipo, tareas completadas, usuarios activos

**Capa 3 — Error tracking** (Sentry)
Captura errores con contexto completo: stack trace, usuario, request, variables de entorno. Las alertas de Grafana cubren degradación de rendimiento; Sentry cubre errores específicos.

---

## Modelo de datos

```text
User ─────────── TeamMember ─────────── Team
  │                                       │
  │                                    Board ── Column ── Task ── TaskLabel ── Label
  │                                                          │
Session                                                   TaskComment
OAuthAccount                                           
Notification                            Automation ── AutomationAction
AuditLog                                           └── AutomationRun
```

- **User**: Usuarios registrados con nombre, email, y autenticación.
- **Session / OAuthAccount**: Persistencia de sesiones JWT (rotación de tokens) e inicio de sesión federado vía GitHub.
- **Team**: Ámbito superior que agrupa a múltiples miembros y centraliza la propiedad de los tableros Kanban.
- **Board / Column / Task**: Dominio central de gestión de proyectos Kanban. Cada Tarea pertenece a una Columna, y cada Columna a un Tablero.
- **TaskLabel / Label**: Etiquetas compartidas por equipo para categorizar tareas (muchos a muchos).
- **TaskComment**: Foro de discusión por tarea específico para la comunicación del equipo.
- **Automation / AutomationAction / AutomationRun**: Recetas pre-establecidas que el equipo define. El Run mantiene los logs de cada ejecución pasada y su resultado.
- **Notification**: Mensajes de alerta distribuidos a los usuarios.
- **AuditLog**: Trazabilidad completa de operaciones críticas dentro de la plataforma con registro de IPs y metadatos.

---

## APIs externas

| API | Propósito | Auth | Cache | Límite free |
|---|---|---|---|---|
| Open-Meteo | Clima para triggers y widget | Sin key | 30 min Redis | Sin límite |
| NewsAPI | Widget de noticias en dashboard | API key | 1 hora Redis | 100 req/día |
| ExchangeRate API | Conversión de moneda | API key | 1 min Redis | 1500 req/mes |
| IPInfo | Geolocalización de sesiones | Token (opcional) | 1 hora Redis | 50k req/mes |
| GitHub API | OAuth login, datos de usuario | OAuth token | 1 hora Redis | 5000 req/hora |

---

## Seguridad

**Autenticación:**
- Access tokens: JWT con expiración de 15 minutos
- Refresh tokens: rotación en cada uso, almacenados en DB con estado `isRevoked`
- Cookies httpOnly, Secure, SameSite=Lax — inaccesibles desde JavaScript del cliente
- Blacklist de tokens revocados en Redis

**Rate limiting:**
- Login: 10 intentos por IP cada 15 minutos (Redis)
- API general: configurado en Nginx (30 req/min por IP)

**Webhooks entrantes:**
- Verificación HMAC-SHA256 con `crypto.timingSafeEqual` (previene timing attacks)

**Datos:**
- Passwords hasheados con bcrypt (12 salt rounds)
- Secrets JWT y passwords jamás aparecen en logs (Pino `redact`)
- Variables de entorno validadas al inicio

---

## Decisiones pendientes

- **Connection pooling:** En producción con alta concurrencia, considerar PgBouncer entre la app y PostgreSQL.
- **Horizontal scaling:** La arquitectura Redis pub/sub soporta múltiples instancias de la app, pero el scheduler debe correr en una sola instancia (o usar Redis locks para evitar ejecución duplicada).
- **Almacenamiento de archivos:** No hay sistema de almacenamiento de archivos. Para adjuntos en tareas, necesitaría S3 o similar.
- **WebSocket reconnection:** El cliente Socket.io reconecta automáticamente, pero los eventos perdidos durante la desconexión no se recuperan. Para uso crítico, implementar event sourcing o "catch-up on reconnect".
