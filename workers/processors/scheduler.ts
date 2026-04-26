import { db } from '@/lib/db';
import { workerLogger } from '@/lib/logger';
import { triggerAutomation } from '@/lib/queue';
import { AutomationTrigger, Prisma } from '@prisma/client';
import { addDays, isBefore, addHours, isAfter } from 'date-fns';

/**
 * El SchedulerProcessor evalua automatizaciones periodicas que no dependen de eventos inmediatos.
 * Se espera que sea ejecutado cada X minutos por un job recurrente en BullMQ.
 */
export async function schedulerProcessor() {
  workerLogger.info('Iniciando ciclo de evaluacion del scheduler');

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
    });

    for (const automation of automations) {
      const config = automation.triggerConfig as any;
      
      switch (automation.triggerType) {
        case AutomationTrigger.TASK_STALE:
          await evaluateTaskStale(automation, config);
          break;
        
        case AutomationTrigger.TASK_DUE_SOON:
          await evaluateTaskDueSoon(automation, config);
          break;

        case AutomationTrigger.WEATHER:
          await evaluateWeather(automation, config);
          break;

        case AutomationTrigger.SCHEDULE:
          await evaluateSchedule(automation, config);
          break;

        default:
          break;
      }
    }

    workerLogger.info('Ciclo de evaluacion del scheduler completado');
  } catch (error: any) {
    workerLogger.error({ error: error.message }, 'Error en el schedulerProcessor');
    throw error;
  }
}

/**
 * TASK_STALE: Tareas que no se han movido o actualizado en X dias.
 */
async function evaluateTaskStale(automation: any, config: any) {
  const days = config.daysStale || 7;
  const staleDate = addDays(new Date(), -days);

  const staleTasks = await db.task.findMany({
    where: {
      column: { board: { teamId: automation.teamId } },
      updatedAt: { lte: staleDate },
      status: { notIn: ['DONE', 'CANCELLED'] },
    },
  });

  for (const task of staleTasks) {
    // Evitar re-disparar si la automatización ya corrió para esta tarea recientemente
    const alreadyRun = await db.automationRun.findFirst({
      where: {
        automationId: automation.id,
        taskId: task.id,
        startedAt: { gte: staleDate },
      },
    });

    if (!alreadyRun) {
      await triggerAutomation({
        automationId: automation.id,
        taskId: task.id,
        triggeredBy: 'SYSTEM_SCHEDULER',
      });
    }
  }
}

/**
 * TASK_DUE_SOON: Tareas que vencen en las proximas X horas.
 */
async function evaluateTaskDueSoon(automation: any, config: any) {
  const hours = config.hoursBefore || 24;
  const now = new Date();
  const threshold = addHours(now, hours);

  const tasks = await db.task.findMany({
    where: {
      column: { board: { teamId: automation.teamId } },
      dueDate: {
        gte: now,
        lte: threshold,
      },
      status: { notIn: ['DONE', 'CANCELLED'] },
    },
  });

  for (const task of tasks) {
    const alreadyRun = await db.automationRun.findFirst({
      where: {
        automationId: automation.id,
        taskId: task.id,
        startedAt: { gte: addHours(now, -hours) },
      },
    });

    if (!alreadyRun) {
      await triggerAutomation({
        automationId: automation.id,
        taskId: task.id,
        triggeredBy: 'SYSTEM_SCHEDULER',
      });
    }
  }
}

/**
 * WEATHER: Evalua condiciones climaticas externas.
 * Nota: En una implementacion real, esto llamaria a Open-Meteo o NewsAPI.
 */
async function evaluateWeather(automation: any, config: any) {
  // Solo evaluar cada hora para evitar exceso de llamadas a APIs externas
  const oneHourAgo = addHours(new Date(), -1);
  if (automation.lastRunAt && isAfter(automation.lastRunAt, oneHourAgo)) {
    return;
  }

  // Placeholder para logica de integracion climatica
  workerLogger.debug({ automationId: automation.id, city: config.city }, 'Evaluando trigger de clima');
  
  // Aqui se realizaria el fetch a la API externa
  // const weather = await getWeather(config.city);
  // if (weather.condition === config.weatherCondition) { ... }
}

/**
 * SCHEDULE: Ejecucion basada en tiempo cron o intervalos.
 * Nota: BullMQ maneja triggers de repeticion nativamente, pero esta funcion
 * permite logica personalizada si se requiere evaluar el config manualmente.
 */
async function evaluateSchedule(automation: any, config: any) {
  const now = new Date();
  
  // Si no tiene lastRunAt o ha pasado el intervalo definido
  if (!automation.lastRunAt) {
    await triggerAutomation({
      automationId: automation.id,
      triggeredBy: 'SYSTEM_SCHEDULER',
    });
    return;
  }

  // Ejemplo: ejecucion diaria si no se ha ejecutado hoy
  if (config.frequency === 'daily') {
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    if (isBefore(automation.lastRunAt, todayStart)) {
      await triggerAutomation({
        automationId: automation.id,
        triggeredBy: 'SYSTEM_SCHEDULER',
      });
    }
  }
}
