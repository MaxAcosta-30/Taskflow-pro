import {
  PrismaClient,
  Role,
  TeamRole,
  TeamPlan,
  Priority,
  TaskStatus,
  AutomationTrigger,
  ActionType,
  RunStatus,
  NotificationType,
} from '@prisma/client'
import bcrypt from 'bcryptjs'
import { addDays, subDays, subHours } from 'date-fns'

const prisma = new PrismaClient()

// Tareas de ejemplo realistas por tablero y columna (sin datos de clientes reales).
const TITULOS: Record<string, Record<string, string[]>> = {
  Lanzamiento: {
    Pendiente: ['Exportar tablero a CSV', 'Plantillas de tablero por equipo', 'Atajos de teclado en el tablero'],
    'Por hacer': ['Página de precios', 'Invitar miembros por enlace', 'Onboarding de tres pasos'],
    'En curso': ['Reintentos de webhooks fallidos', 'Notificaciones en el navegador', 'Filtro por responsable'],
    'En revisión': ['Historial de cambios por tarea', 'Modo oscuro en Analytics'],
    Hecho: ['Login con GitHub', 'Tablero sincronizado con Socket.io', 'Rotación de refresh tokens', 'Automatizaciones por horario', 'Arrastrar y soltar entre columnas', 'Comentarios en tareas', 'Panel de Analytics', 'Etiquetas por equipo'],
  },
  'Marketing y diseño': {
    Pendiente: ['Guía de voz de la marca', 'Casos de uso para agencias'],
    'Por hacer': ['Capturas para la landing', 'Video corto del tablero en vivo', 'Artículo: automatizar sin código'],
    'En curso': ['Rediseño de la landing', 'Ilustraciones de onboarding'],
    'En revisión': ['Correo de bienvenida', 'Tabla comparativa de planes'],
    Hecho: ['Logo y paleta', 'Plantilla de presentación', 'Íconos del producto', 'Kit para redes', 'Guía de componentes', 'Banner de lanzamiento'],
  },
  Infraestructura: {
    Pendiente: ['Réplica de lectura de PostgreSQL', 'Pruebas de carga del WebSocket'],
    'Por hacer': ['Alertas de Grafana por latencia', 'Backups diarios verificados', 'Límite de peticiones por IP'],
    'En curso': ['Worker de BullMQ en contenedor propio', 'Dashboard de colas en Grafana'],
    'En revisión': ['Migrar Nginx a HTTP/2', 'Logs estructurados con Pino'],
    Hecho: ['Docker Compose de desarrollo', 'Adaptador Redis para Socket.io', 'Métricas con Prometheus', 'Sentry en cliente y servidor', 'CI con lint, tipos y pruebas', 'Healthcheck de la API', 'Rotación de logs'],
  },
}

async function main() {
  console.log('Iniciando seed profesional...')

  // 1. Limpieza total
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "public"."${tablename}" RESTART IDENTITY CASCADE;`,
        )
      } catch (error) {
        console.log(`No se pudo truncar ${tablename}`)
      }
    }
  }
  console.log('Base de datos reseteada.')

  // 2. Usuarios
  const passwordHash = await bcrypt.hash('password123', 12)

  const alice = await prisma.user.create({
    data: {
      email: 'alice@taskflow.pro',
      name: 'Alicia Navarro',
      passwordHash,
      role: Role.SUPER_ADMIN,
      avatarUrl: null,
      timezone: 'America/Mazatlan',
    },
  })

  const bob = await prisma.user.create({
    data: {
      email: 'bob@taskflow.pro',
      name: 'Roberto Gil',
      passwordHash,
      role: Role.MEMBER,
      avatarUrl: null,
    },
  })

  const carlos = await prisma.user.create({
    data: {
      email: 'carlos@taskflow.pro',
      name: 'Carlos Ibarra',
      passwordHash,
      role: Role.MEMBER,
      avatarUrl: null,
    },
  })

  console.log('Usuarios Alicia, Roberto y Carlos creados.')

  // 3. Equipo
  const team = await prisma.team.create({
    data: {
      name: 'Estudio Norte',
      slug: 'startup-tech',
      description: 'Agencia de desarrollo ágil y productos SaaS.',
      plan: TeamPlan.PRO,
      members: {
        create: [
          { userId: alice.id, teamRole: TeamRole.OWNER },
          { userId: bob.id, teamRole: TeamRole.ADMIN },
          { userId: carlos.id, teamRole: TeamRole.VIEWER },
        ],
      },
    },
  })

  console.log('Equipo "Estudio Norte" creado.')

  // 4. Etiquetas
  const labels = await Promise.all([
    prisma.label.create({ data: { name: 'Bug', color: '#EF4444', teamId: team.id } }),
    prisma.label.create({ data: { name: 'Función', color: '#10B981', teamId: team.id } }),
    prisma.label.create({ data: { name: 'Refactor', color: '#8B5CF6', teamId: team.id } }),
    prisma.label.create({ data: { name: 'Hotfix', color: '#F59E0B', teamId: team.id } }),
    prisma.label.create({ data: { name: 'Diseño', color: '#EC4899', teamId: team.id } }),
  ])

  // 5. Tableros
  const boards = [
    { name: 'Lanzamiento', color: '#FFC931', desc: 'Funciones del producto y plan de salida.' },
    { name: 'Marketing y diseño', color: '#EC4899', desc: 'Campañas y piezas de marca.' },
    { name: 'Infraestructura', color: '#10B981', desc: 'CI/CD, monitoreo y escalado.' },
  ]

  for (const b of boards) {
    const board = await prisma.board.create({
      data: {
        teamId: team.id,
        name: b.name,
        color: b.color,
        description: b.desc,
        columns: {
          create: [
            { name: 'Pendiente', position: 0, color: '#6B7280', isDefault: true },
            { name: 'Por hacer', position: 1, color: '#F59E0B' },
            { name: 'En curso', position: 2, color: '#3B82F6' },
            { name: 'En revisión', position: 3, color: '#8B5CF6' },
            { name: 'Hecho', position: 4, color: '#10B981' },
          ],
        },
      },
      include: { columns: true },
    })

    // Crear tareas para cada tablero
    for (const col of board.columns) {
      const titulos = TITULOS[board.name]?.[col.name] ?? []
      const taskCount = titulos.length
      for (let i = 0; i < taskCount; i++) {
        const date = subDays(new Date(), Math.floor(Math.random() * 30))
        await prisma.task.create({
          data: {
            title: titulos[i]!,
            description: 'Tarea de ejemplo del seed: muévela, comenta o asígnala para ver la sincronización.',
            columnId: col.id,
            creatorId: alice.id,
            assigneeId: Math.random() > 0.3 ? bob.id : null,
            priority: [Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT][
              Math.floor(Math.random() * 4)
            ],
            status:
              col.name === 'Hecho'
                ? TaskStatus.DONE
                : col.name === 'En curso'
                  ? TaskStatus.IN_PROGRESS
                  : TaskStatus.TODO,
            createdAt: date,
            updatedAt: addDays(date, 1),
            dueDate:
              col.name !== 'Hecho' ? addDays(new Date(), Math.floor(Math.random() * 15) - 2) : null,
            // Las terminadas llevan inicio y fin: así Analytics calcula completadas y tiempo de entrega.
            startedAt: col.name === 'Hecho' || col.name === 'En curso' ? date : null,
            completedAt: col.name === 'Hecho' ? addDays(date, 1 + Math.floor(Math.random() * 4)) : null,
            labels: {
              create:
                Math.random() > 0.5 && labels.length > 0
                  ? [{ labelId: labels[Math.floor(Math.random() * labels.length)]!.id }]
                  : [],
            },
            comments: {
              create:
                Math.random() > 0.7
                  ? [{ authorId: bob.id, content: 'Ya lo estoy viendo, te aviso al subirlo.' }]
                  : [],
            },
          },
        })
      }
    }
  }

  console.log('3 tableros creados con tareas de ejemplo por columna.')

  // 6. Automatizaciones
  const automation1 = await prisma.automation.create({
    data: {
      teamId: team.id,
      creatorId: alice.id,
      name: 'Asignar a Roberto al pasar a En curso',
      description: 'Cuando una tarea entra a En curso, se asigna a Roberto.',
      triggerType: AutomationTrigger.TASK_MOVED,
      triggerConfig: { toColumnName: 'En curso' },
      isActive: true,
      actions: {
        create: {
          actionType: ActionType.ASSIGN_USER,
          config: { userId: bob.id },
          position: 0,
        },
      },
    },
  })

  const automation2 = await prisma.automation.create({
    data: {
      teamId: team.id,
      creatorId: alice.id,
      name: 'Aviso de tarea detenida',
      description: 'Avisa a Alicia si una tarea lleva más de 3 días en revisión.',
      triggerType: AutomationTrigger.TASK_STALE,
      triggerConfig: { daysStale: 3, columnName: 'En revisión' },
      isActive: true,
      actions: {
        create: {
          actionType: ActionType.SEND_NOTIFICATION,
          config: {
            userId: alice.id,
            title: 'Tarea detenida',
            body: 'Revisa por qué el PR sigue bloqueado.',
          },
          position: 0,
        },
      },
    },
  })

  console.log('2 Automatizaciones activas creadas.')

  // 7. Historial de Runs
  await prisma.automationRun.createMany({
    data: [
      {
        automationId: automation1.id,
        status: RunStatus.SUCCESS,
        triggeredBy: 'USER_ACTION',
        startedAt: subHours(new Date(), 2),
        completedAt: subHours(new Date(), 2),
      },
      {
        automationId: automation1.id,
        status: RunStatus.SUCCESS,
        triggeredBy: 'USER_ACTION',
        startedAt: subHours(new Date(), 24),
        completedAt: subHours(new Date(), 24),
      },
      {
        automationId: automation2.id,
        status: RunStatus.FAILED,
        error: 'Network timeout',
        triggeredBy: 'SYSTEM_SCHEDULER',
        startedAt: subHours(new Date(), 5),
      },
    ],
  })

  // 8. Notificaciones
  await prisma.notification.createMany({
    data: [
      {
        userId: alice.id,
        type: NotificationType.AUTOMATION_TRIGGERED,
        title: 'Automation Executed',
        body: 'Auto-assign to Bob was triggered.',
        isRead: false,
      },
      {
        userId: bob.id,
        type: NotificationType.TASK_ASSIGNED,
        title: 'New Task Assigned',
        body: 'Alice assigned you to Feature #5.',
        isRead: false,
      },
    ],
  })

  console.log('Historial de ejecuciones y notificaciones pendientes creadas.')
  console.log('Seed finalizado correctamente. Credenciales: alice@taskflow.pro / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => {
    void prisma.$disconnect()
  })
