import { AutomationTrigger, Prisma, Automation } from '@prisma/client'
import { addDays, isBefore, addHours, isAfter } from 'date-fns'

import { db } from '@/lib/db'
import type { WeatherCondition } from '@/lib/integrations/open-meteo'
import { workerLogger } from '@/lib/logger'
import { triggerAutomation } from '@/lib/queue'

/**
 * El SchedulerProcessor evalua automatizaciones periodicas que no dependen de eventos inmediatos.
 * Se espera que sea ejecutado cada X minutos por un job recurrente en BullMQ.
 */
export async function schedulerProcessor() {
  workerLogger.info('Iniciando ciclo de evaluacion del scheduler')

  try {
    // 1. Obtener todas las automatizaciones activas con triggers periodicos
    const automations = await db.automation.findMany({
      where: {
        isActive: true,
        triggerType: {
          in: [
            AutomationTrigger.TASK_STALE,
            AutomationTrigger.TASK_DUE_SOON,
            AutomationTrigger.WEATHER,
            AutomationTrigger.SCHEDULE,
          ],
        },
      },
    })

    for (const automation of automations) {
      const config = automation.triggerConfig as Record<string, unknown>

      switch (automation.triggerType) {
        case AutomationTrigger.TASK_STALE:
          await evaluateTaskStale(automation, config)
          break

        case AutomationTrigger.TASK_DUE_SOON:
          await evaluateTaskDueSoon(automation, config)
          break

        case AutomationTrigger.WEATHER: {
          const lat = config['latitude'] as number
          const lon = config['longitude'] as number
          const condition = config['weatherCondition'] as string

          try {
            const { checkWeatherCondition } = await import('@/lib/integrations/open-meteo')
            const { matches, weather } = await checkWeatherCondition(
              lat,
              lon,
              condition as WeatherCondition,
            )

            if (matches) {
              workerLogger.info(
                { automationId: automation.id, condition, temperature: weather.temperature },
                'Weather trigger condition met',
              )
              await triggerAutomation({
                automationId: automation.id,
                triggeredBy: 'SYSTEM_SCHEDULER',
              })
            }
          } catch (err) {
            workerLogger.error({ automationId: automation.id, err }, 'Weather check failed')
          }
          break
        }

        case AutomationTrigger.SCHEDULE:
          await evaluateSchedule(automation, config)
          break

        default:
          break
      }
    }

    workerLogger.info('Ciclo de evaluacion del scheduler completado')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    workerLogger.error({ error: errorMessage }, 'Error en el schedulerProcessor')
    throw error
  }
}

/**
 * TASK_STALE: Tareas que no se han movido o actualizado en X dias.
 */
async function evaluateTaskStale(automation: Automation, config: Record<string, unknown>) {
  const days = (config.daysStale as number) || 7
  const staleDate = addDays(new Date(), -days)

  const staleTasks = await db.task.findMany({
    where: {
      column: { board: { teamId: automation.teamId } },
      updatedAt: { lte: staleDate },
      status: { notIn: ['DONE', 'CANCELLED'] },
    },
  })

  for (const task of staleTasks) {
    // Evitar re-disparar si la automatización ya corrió para esta tarea recientemente
    const alreadyRun = await db.automationRun.findFirst({
      where: {
        automationId: automation.id,
        taskId: task.id,
        startedAt: { gte: staleDate },
      },
    })

    if (!alreadyRun) {
      await triggerAutomation({
        automationId: automation.id,
        taskId: task.id,
        triggeredBy: 'SYSTEM_SCHEDULER',
      })
    }
  }
}

/**
 * TASK_DUE_SOON: Tareas que vencen en las proximas X horas.
 */
async function evaluateTaskDueSoon(automation: Automation, config: Record<string, unknown>) {
  const hours = (config.hoursBefore as number) || 24
  const now = new Date()
  const threshold = addHours(now, hours)

  const tasks = await db.task.findMany({
    where: {
      column: { board: { teamId: automation.teamId } },
      dueDate: {
        gte: now,
        lte: threshold,
      },
      status: { notIn: ['DONE', 'CANCELLED'] },
    },
  })

  for (const task of tasks) {
    const alreadyRun = await db.automationRun.findFirst({
      where: {
        automationId: automation.id,
        taskId: task.id,
        startedAt: { gte: addHours(now, -hours) },
      },
    })

    if (!alreadyRun) {
      await triggerAutomation({
        automationId: automation.id,
        taskId: task.id,
        triggeredBy: 'SYSTEM_SCHEDULER',
      })
    }
  }
}

/**
 * SCHEDULE: Ejecucion basada en tiempo cron o intervalos.
 * Nota: BullMQ maneja triggers de repeticion nativamente, pero esta funcion
 * permite logica personalizada si se requiere evaluar el config manualmente.
 */
async function evaluateSchedule(automation: Automation, config: Record<string, unknown>) {
  const now = new Date()

  // Si no tiene lastRunAt o ha pasado el intervalo definido
  if (!automation.lastRunAt) {
    await triggerAutomation({
      automationId: automation.id,
      triggeredBy: 'SYSTEM_SCHEDULER',
    })
    return
  }

  // Ejemplo: ejecucion diaria si no se ha ejecutado hoy
  if (config.frequency === 'daily') {
    const todayStart = new Date(now.setHours(0, 0, 0, 0))
    if (isBefore(automation.lastRunAt, todayStart)) {
      await triggerAutomation({
        automationId: automation.id,
        triggeredBy: 'SYSTEM_SCHEDULER',
      })
    }
  }
}
