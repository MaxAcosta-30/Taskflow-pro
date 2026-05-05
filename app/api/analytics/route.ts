import { startOfMonth, endOfMonth, subMonths } from 'date-fns'
import type { NextRequest } from 'next/server'

import { withAuth, ok, serverError } from '@/lib/api/helpers'
import { db } from '@/lib/db'

/**
 * GET /api/analytics
 * Retorna KPIs de rendimiento del equipo/tableros.
 */
export async function GET(req: NextRequest) {
  return withAuth(req, async (user) => {
    try {
      const now = new Date()
      const threeMonthsAgo = subMonths(now, 3)

      // 1. Conteo de tareas por estado
      const taskStats = await db.task.groupBy({
        by: ['status'],
        where: {
          column: { board: { team: { members: { some: { userId: user.sub } } } } },
        },
        _count: true,
      })

      // 2. Conteo por prioridad
      const priorityStats = await db.task.groupBy({
        by: ['priority'],
        where: {
          column: { board: { team: { members: { some: { userId: user.sub } } } } },
        },
        _count: true,
      })

      // 3. Tasa de éxito de automatizaciones (últimos 3 meses)
      const automationStats = await db.automationRun.groupBy({
        by: ['status'],
        where: {
          automation: { team: { members: { some: { userId: user.sub } } } },
          startedAt: { gte: threeMonthsAgo },
        },
        _count: true,
      })

      // 4. Tiempo promedio de resolución (Lead Time)
      const completedTasks = await db.task.findMany({
        where: {
          status: 'DONE',
          completedAt: { not: null },
          startedAt: { not: null },
          column: { board: { team: { members: { some: { userId: user.sub } } } } },
        },
        select: {
          startedAt: true,
          completedAt: true,
        },
      })

      let totalLeadTime = 0
      completedTasks.forEach((task) => {
        if (task.completedAt && task.startedAt) {
          totalLeadTime += task.completedAt.getTime() - task.startedAt.getTime()
        }
      })

      const avgLeadTimeHours =
        completedTasks.length > 0 ? totalLeadTime / completedTasks.length / (1000 * 60 * 60) : 0

      return ok({
        tasksByStatus: taskStats,
        tasksByPriority: priorityStats,
        automationPerformance: automationStats,
        avgLeadTimeHours: Math.round(avgLeadTimeHours * 10) / 10,
        totalCompleted: completedTasks.length,
      })
    } catch (err: any) {
      console.error('[ANALYTICS_ERROR]', err)
      return serverError()
    }
  })
}
