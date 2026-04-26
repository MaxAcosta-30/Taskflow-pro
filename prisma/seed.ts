import { PrismaClient, Role, TeamRole, TeamPlan, Priority, TaskStatus, AutomationTrigger, ActionType, RunStatus, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addDays, subDays, subHours } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed profesional...');

  // 1. Limpieza total
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" RESTART IDENTITY CASCADE;`);
      } catch (error) {
        console.log(`No se pudo truncar ${tablename}`);
      }
    }
  }
  console.log('🧹 Base de datos reseteada.');

  // 2. Usuarios
  const passwordHash = await bcrypt.hash('password123', 12);

  const alice = await prisma.user.create({
    data: {
      email: 'alice@taskflow.pro',
      name: 'Alice Admin',
      passwordHash,
      role: Role.SUPER_ADMIN,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
      timezone: 'Europe/Madrid',
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@taskflow.pro',
      name: 'Bob Developer',
      passwordHash,
      role: Role.MEMBER,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    },
  });

  const carlos = await prisma.user.create({
    data: {
      email: 'carlos@taskflow.pro',
      name: 'Carlos Viewer',
      passwordHash,
      role: Role.MEMBER,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
    },
  });

  console.log('👤 Usuarios Alice, Bob y Carlos creados.');

  // 3. Equipo
  const team = await prisma.team.create({
    data: {
      name: 'Startup Tech Solutions',
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
  });

  console.log('🏢 Equipo "Startup Tech" creado.');

  // 4. Etiquetas
  const labels = await Promise.all([
    prisma.label.create({ data: { name: 'Bug', color: '#EF4444', teamId: team.id } }),
    prisma.label.create({ data: { name: 'Feature', color: '#10B981', teamId: team.id } }),
    prisma.label.create({ data: { name: 'Refactor', color: '#8B5CF6', teamId: team.id } }),
    prisma.label.create({ data: { name: 'Hotfix', color: '#F59E0B', teamId: team.id } }),
    prisma.label.create({ data: { name: 'Design', color: '#EC4899', teamId: team.id } }),
  ]);

  // 5. Tableros
  const boards = [
    { name: '🚀 Product Launch', color: '#3B82F6', desc: 'Core product features and roadmap.' },
    { name: '🎨 Marketing & Design', color: '#EC4899', desc: 'Campaigns and brand assets.' },
    { name: '🛠 DevOps & Infra', color: '#10B981', desc: 'CI/CD, Monitoring and Scaling.' },
  ];

  for (const b of boards) {
    const board = await prisma.board.create({
      data: {
        teamId: team.id,
        name: b.name,
        color: b.color,
        description: b.desc,
        columns: {
          create: [
            { name: 'Backlog', position: 0, color: '#6B7280', isDefault: true },
            { name: 'To Do', position: 1, color: '#F59E0B' },
            { name: 'In Progress', position: 2, color: '#3B82F6' },
            { name: 'In Review', position: 3, color: '#8B5CF6' },
            { name: 'Done', position: 4, color: '#10B981' },
          ],
        },
      },
      include: { columns: true },
    });

    // Crear tareas para cada tablero
    for (const col of board.columns) {
      const taskCount = col.name === 'Done' ? 12 : 4;
      for (let i = 0; i < taskCount; i++) {
        const date = subDays(new Date(), Math.floor(Math.random() * 30));
        await prisma.task.create({
          data: {
            title: `${board.name === '🚀 Product Launch' ? 'Feature' : 'Task'} #${i + 1} en ${col.name}`,
            description: 'Esta es una descripción detallada de la tarea generada automáticamente para el seed.',
            columnId: col.id,
            creatorId: alice.id,
            assigneeId: Math.random() > 0.3 ? bob.id : null,
            priority: [Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT][Math.floor(Math.random() * 4)],
            status: col.name === 'Done' ? TaskStatus.DONE : (col.name === 'In Progress' ? TaskStatus.IN_PROGRESS : TaskStatus.TODO),
            createdAt: date,
            updatedAt: addDays(date, 1),
            dueDate: col.name !== 'Done' ? addDays(new Date(), Math.floor(Math.random() * 15)) : null,
            labels: {
              create: Math.random() > 0.5 ? [{ labelId: labels[Math.floor(Math.random() * labels.length)].id }] : [],
            },
            comments: {
              create: Math.random() > 0.7 ? [{ authorId: bob.id, content: 'Estoy trabajando en esto!' }] : [],
            },
          },
        });
      }
    }
  }

  console.log('📋 3 Tableros creados con ~60 tareas distribuidas cronológicamente.');

  // 6. Automatizaciones
  const automation1 = await prisma.automation.create({
    data: {
      teamId: team.id,
      creatorId: alice.id,
      name: 'Auto-assign to Bob',
      description: 'Assigns tasks to Bob when moved to In Progress.',
      triggerType: AutomationTrigger.TASK_MOVED,
      triggerConfig: { toColumnName: 'In Progress' },
      isActive: true,
      actions: {
        create: {
          actionType: ActionType.ASSIGN_USER,
          config: { userId: bob.id },
          position: 0,
        },
      },
    },
  });

  const automation2 = await prisma.automation.create({
    data: {
      teamId: team.id,
      creatorId: alice.id,
      name: 'Stale Task Warning',
      description: 'Notify Alice if a task is stuck in In Review for > 3 days.',
      triggerType: AutomationTrigger.TASK_STALE,
      triggerConfig: { daysStale: 3, columnName: 'In Review' },
      isActive: true,
      actions: {
        create: {
          actionType: ActionType.SEND_NOTIFICATION,
          config: { userId: alice.id, title: 'Task is stale!', body: 'Check why the PR is blocked.' },
          position: 0,
        },
      },
    },
  });

  console.log('🤖 2 Automatizaciones activas creadas.');

  // 7. Historial de Runs
  await prisma.automationRun.createMany({
    data: [
      { automationId: automation1.id, status: RunStatus.SUCCESS, triggeredBy: 'USER_ACTION', startedAt: subHours(new Date(), 2), completedAt: subHours(new Date(), 2) },
      { automationId: automation1.id, status: RunStatus.SUCCESS, triggeredBy: 'USER_ACTION', startedAt: subHours(new Date(), 24), completedAt: subHours(new Date(), 24) },
      { automationId: automation2.id, status: RunStatus.FAILED, error: 'Network timeout', triggeredBy: 'SYSTEM_SCHEDULER', startedAt: subHours(new Date(), 5) },
    ],
  });

  // 8. Notificaciones
  await prisma.notification.createMany({
    data: [
      { userId: alice.id, type: NotificationType.AUTOMATION_TRIGGERED, title: 'Automation Executed', body: 'Auto-assign to Bob was triggered.', isRead: false },
      { userId: bob.id, type: NotificationType.TASK_ASSIGNED, title: 'New Task Assigned', body: 'Alice assigned you to Feature #5.', isRead: false },
    ],
  });

  console.log('🔔 Historial de ejecuciones y notificaciones pendientes creadas.');
  console.log('✨ Seed finalizado correctamente. Credenciales: alice@taskflow.pro / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
