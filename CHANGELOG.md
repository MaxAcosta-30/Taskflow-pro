# CHANGELOG - TaskFlow Pro

Este documento detalla las funcionalidades implementadas y las pendientes en el sistema a fecha de hoy.

## [1.0.0-beta.1] - 2026-04-25

### ✅ Funcionalidades Completas

#### 1. Sistema de Autenticación (`app/api/auth`, `lib/auth`)
- **Registro e Inicio de Sesión:** Implementado con validación de esquemas (Zod).
- **Manejo de Sesiones:** JWT con lógica de Access y Refresh Tokens funcional.
- **OAuth:** Integración con GitHub configurada y operativa.
- **Middleware:** Protección de rutas privadas mediante `middleware.ts`.
- **Store:** Gestión de estado global de usuario con Zustand (`auth.store.ts`).

#### 2. Kanban Board (Core) (`components/board`, `app/api/boards`)
- **Estructura de Datos:** Modelos de Prisma para Boards, Columns y Tasks definidos.
- **UI de Tablero:** Componentes `KanbanBoard`, `KanbanColumn` y `TaskCard` funcionales.
- **Movimiento de Tareas:** Endpoint `api/tasks/[taskId]/move` implementado para persistir cambios de columna.
- **Gestión de Tareas:** Creación de tareas y comentarios operativa.

#### 3. Engine de Automatización (`workers/`, `lib/integrations`)
- **Arquitectura de Workers:** Procesadores para `automation`, `notification`, `scheduler` y `cleanup` estructurados con BullMQ.
- **Integraciones:** 
  - **GitHub:** Conector para eventos de repositorio.
  - **NewsAPI:** Fetching de noticias para disparadores.
  - **Open-Meteo:** Integración de datos meteorológicos.
- **Builder UI:** Interfaz visual para construir flujos de automatización (`automations/builder`).

#### 4. Infraestructura y Observabilidad
- **Dockerización:** Entorno completo con App, DB, Redis y Nginx configurados en `docker-compose.yml`.
- **Monitoreo:** Exportación de métricas a Prometheus y visualización en Grafana pre-configurada.
- **Logging:** Sistema de logs centralizado con `pino` (`lib/logger`).
- **CI/CD:** Workflow de GitHub Actions configurado para tests y build automático.

---

### ⏳ Funcionalidades Pendientes / En Desarrollo

#### 1. Analytics & Reporting (`app/(dashboard)/analytics`)
- [ ] **Dashboards de Usuario:** La carpeta existe pero falta la implementación de los gráficos de rendimiento y KPIs de tareas.
- [ ] **Exportación:** Falta la funcionalidad para exportar reportes en PDF/CSV.

#### 2. Sistema de Notificaciones Real-time
- [ ] **Web Push:** El worker existe pero falta la integración con Service Workers para notificaciones nativas en el navegador.
- [ ] **Preferencias de Usuario:** Falta la interfaz para que el usuario elija qué notificaciones recibir (Email vs Push).

#### 3. Automatizaciones Avanzadas
- [ ] **Multi-step Actions:** El builder actualmente soporta disparadores simples; falta la lógica para encadenar múltiples acciones complejas.
- [ ] **Webhooks Entrantes:** El endpoint `api/webhooks` está creado pero requiere más manejadores para servicios externos (Slack, Discord, etc.).

#### 4. UI/UX Refinements
- [ ] **Drag & Drop Reordering:** Optimizar la persistencia del orden de las columnas en el tablero.
- [ ] **Modo Offline:** Implementar soporte básico de PWA para visualización sin conexión.

---

### 🛠 Notas Técnicas
- **Base de Datos:** Migraciones de Prisma al día (`20260425184453_init`).
- **Tests:** Cobertura de tests unitarios para Auth y Validaciones. Pendiente aumentar tests de integración en el Automation Engine.
