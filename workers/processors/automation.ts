import type { Job } from 'bullmq'
import axios from 'axios'

import { db } from '@/lib/db'
import { workerLogger } from '@/lib/logger'
import { emitToBoardFromWorker } from '@/lib/socket/emitter'
import { queueNotification } from '@/lib/queue'

export async function automationProcessor(job: Job) {
  const { automationId, triggeredBy, taskId } = job.data as {
    automationId: string
    triggeredBy?: string
    taskId?: string
  }

  workerLogger.info({ jobId: job.id, automationId }, 'Executing automation')

  // Create an AutomationRun record
  const run = await db.automationRun.create({
    data: {
      automationId,
      status: 'RUNNING',
      triggeredBy,
      taskId,
    },
  })

  try {
    // 1. Fetch automation and its actions
    const automation = await db.automation.findUnique({
      where: { id: automationId },
      include: { actions: { orderBy: { position: 'asc' } } },
    })

    if (!automation || !automation.isActive) {
      await db.automationRun.update({
        where: { id: run.id },
        data: { status: 'SKIPPED', logs: { message: 'Automation not found or inactive' } },
      })
      return { skipped: true }
    }

    // Si hay un taskId, obtenemos el tablero para poder emitir eventos en tiempo real
    let boardId: string | undefined
    if (taskId) {
      const task = await db.task.findUnique({
        where: { id: taskId },
        include: { column: true },
      })
      if (task) {
        boardId = task.column.boardId
      }
    }

    // Helper para obtener la tarea completa y emitir el evento
    const emitTaskUpdated = async (id: string, bId: string) => {
      const updated = await db.task.findUnique({
        where: { id },
        include: {
          creator: { select: { id: true, name: true, avatarUrl: true } },
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          labels: { include: { label: true } },
          _count: { select: { comments: true } },
        },
      })
      if (updated) {
        // Formateamos para que coincida con TaskWithRelations del Frontend
        const payload = {
          ...updated,
          dueDate: updated.dueDate?.toISOString() ?? null,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
          labels: updated.labels.map((l) => ({
            id: l.label.id,
            name: l.label.name,
            color: l.label.color,
          })),
        }
        emitToBoardFromWorker(bId, 'task:updated', { task: payload as any, boardId: bId })
      }
    }

    // 2. Execute actions sequentially
    const logs = []
    for (const action of automation.actions) {
      workerLogger.debug({ actionType: action.actionType }, 'Executing action')
      const config = action.config as Record<string, any>

      try {
        switch (action.actionType) {
          case 'MOVE_TASK':
            if (taskId && config.toColumnId && boardId) {
              await db.task.update({
                where: { id: taskId },
                data: { columnId: config.toColumnId },
              })
              await emitTaskUpdated(taskId, boardId)
            }
            break

          case 'ASSIGN_USER':
            if (taskId && config.userId && boardId) {
              await db.task.update({
                where: { id: taskId },
                data: { assigneeId: config.userId },
              })
              await emitTaskUpdated(taskId, boardId)
            }
            break

          case 'ADD_LABEL':
            if (taskId && config.labelId && boardId) {
              await db.taskLabel.upsert({
                where: { taskId_labelId: { taskId, labelId: config.labelId } },
                update: {},
                create: { taskId, labelId: config.labelId },
              })
              await emitTaskUpdated(taskId, boardId)
            }
            break

          case 'SEND_NOTIFICATION':
            if (config.userId && config.title && config.body) {
              await queueNotification({
                userId: config.userId,
                type: 'AUTOMATION_TRIGGERED',
                title: config.title,
                body: config.body,
                data: { automationId, taskId },
              })
            }
            break

          case 'WEBHOOK':
            if (config.url) {
              const method = config.method || 'POST'
              await axios({
                method,
                url: config.url,
                data: config.body,
                headers: config.headers,
                timeout: 5000,
              })
            }
            break

          case 'CREATE_TASK':
            if (config.title && config.columnId) {
              // Necesitamos saber quién la crea. Usaremos el creador de la automatización si no hay triggeredBy
              const creatorId = triggeredBy ?? automation.creatorId
              const newTask = await db.task.create({
                data: {
                  title: config.title,
                  description: config.description,
                  columnId: config.columnId,
                  creatorId,
                },
                include: { column: true },
              })
              
              // Emitir
              emitToBoardFromWorker(newTask.column.boardId, 'task:created', { task: newTask as any, boardId: newTask.column.boardId })
            }
            break

          default:
            workerLogger.warn({ type: action.actionType }, 'Unknown action type')
        }

        logs.push({ actionId: action.id, type: action.actionType, status: 'success' })
      } catch (err: any) {
        workerLogger.error({ actionId: action.id, error: err.message }, 'Action failed')
        logs.push({ actionId: action.id, type: action.actionType, status: 'failed', error: err.message })
        // Dependiendo de la lógica de negocio, podríamos abortar el loop o continuar. Aquí continuamos.
      }
    }

    // 3. Update run status
    await db.automationRun.update({
      where: { id: run.id },
      data: {
        status: 'SUCCESS',
        completedAt: new Date(),
        logs: logs as any,
      },
    })

    // Update last run time on the automation
    await db.automation.update({
      where: { id: automationId },
      data: { lastRunAt: new Date() },
    })

    return { success: true }
  } catch (error: any) {
    await db.automationRun.update({
      where: { id: run.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        error: error.message,
      },
    })
    throw error
  }
}
