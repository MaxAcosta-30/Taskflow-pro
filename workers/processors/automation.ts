import axios from 'axios'
import type { Job } from 'bullmq'

import { db } from '@/lib/db'
import { workerLogger } from '@/lib/logger'
import { automationsTriggeredTotal } from '@/lib/metrics'
import { queueNotification } from '@/lib/queue'
import { publishToBoard } from '@/lib/socket/publisher'

/**
 * Helper para interpolar variables en un string.
 * Ejemplo: "Nueva tarea: {{task.title}}" -> "Nueva tarea: Mi Tarea"
 */
function interpolate(text: string, context: Record<string, unknown>): string {
  if (!text || typeof text !== 'string') return text
  return text.replace(/\{\{(.*?)\}\}/g, (match: string, path: string) => {
    const keys = path.trim().split('.')
    let value: unknown = context
    for (const key of keys) {
      value = (value as Record<string, unknown>)?.[key]
    }
    return value !== undefined ? String(value) : match
  })
}

/**
 * Interpola variables en un objeto recursivamente.
 */
function interpolateObject(obj: unknown, context: Record<string, unknown>): unknown {
  if (typeof obj === 'string') return interpolate(obj, context)
  if (Array.isArray(obj)) return obj.map((item) => interpolateObject(item, context))
  if (typeof obj === 'object' && obj !== null) {
    const result: Record<string, unknown> = {}
    for (const key in obj) {
      result[key] = interpolateObject((obj as Record<string, unknown>)[key], context)
    }
    return result
  }
  return obj
}

export async function automationProcessor(job: Job) {
  const { automationId, triggeredBy, taskId } = job.data as {
    automationId: string
    triggeredBy?: string
    taskId?: string
  }

  workerLogger.info({ jobId: job.id, automationId }, 'Executing automation')

  const run = await db.automationRun.create({
    data: {
      automationId,
      status: 'RUNNING',
      triggeredBy,
      taskId,
    },
  })

  try {
    const automation = await db.automation.findUnique({
      where: { id: automationId },
      include: {
        actions: { orderBy: { position: 'asc' } },
        team: true,
      },
    })

    if (!automation || !automation.isActive) {
      await db.automationRun.update({
        where: { id: run.id },
        data: { status: 'SKIPPED', logs: { message: 'Automation not found or inactive' } },
      })
      automationsTriggeredTotal.inc({
        status: 'skipped',
        trigger_type: automation?.triggerType || 'unknown',
      })
      return { skipped: true }
    }

    // Preparar contexto para variables dinámicas
    const context: Record<string, unknown> = {
      automation: { name: automation.name },
      team: { name: automation.team.name },
      now: new Date().toISOString(),
    }

    let boardId: string | undefined
    if (taskId) {
      const task = await db.task.findUnique({
        where: { id: taskId },
        include: {
          column: true,
          creator: true,
          assignee: true,
        },
      })
      if (task) {
        boardId = task.column.boardId
        context.task = {
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          creator: task.creator.name,
          assignee: task.assignee?.name ?? 'Nadie',
        }
      }
    }

    if (triggeredBy) {
      const user = await db.user.findUnique({ where: { id: triggeredBy } })
      if (user) {
        context.user = { id: user.id, name: user.name, email: user.email }
      }
    }

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
        await publishToBoard(bId, 'task:updated', { task: payload as never, boardId: bId })
      }
    }

    const logs = []
    for (const action of automation.actions) {
      workerLogger.debug({ actionType: action.actionType }, 'Executing action')

      // Interpolamos variables en el config de la acción antes de ejecutarla
      const config = interpolateObject(action.config, context) as Record<string, unknown>

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
                where: { taskId_labelId: { taskId, labelId: String(config.labelId) } },
                update: {},
                create: { taskId, labelId: String(config.labelId) },
              })
              await emitTaskUpdated(taskId, boardId)
            }
            break

          case 'SEND_NOTIFICATION': {
            const targetUserId = config.userId
              ? String(config.userId)
              : (triggeredBy ?? automation.creatorId)
            if (targetUserId && config.title && config.body) {
              await queueNotification({
                userId: String(targetUserId),
                type: 'AUTOMATION_TRIGGERED',
                title: String(config.title),
                body: String(config.body),
                data: { automationId, taskId },
              })
            }
            break
          }

          case 'WEBHOOK':
            if (config.url) {
              const method = config.method ? String(config.method) : 'POST'
              await axios({
                method: method,
                url: String(config.url),
                data: config.body,
                headers: config.headers as Record<string, string> | undefined,
                timeout: 5000,
              })
            }
            break

          case 'CREATE_TASK':
            if (config.title && config.columnId) {
              const creatorId = triggeredBy ?? automation.creatorId
              const newTask = await db.task.create({
                data: {
                  title: String(config.title),
                  description: config.description ? String(config.description) : undefined,
                  columnId: String(config.columnId),
                  creatorId,
                },
                include: { column: true },
              })
              await publishToBoard(newTask.column.boardId, 'task:created', {
                task: newTask as never,
                boardId: newTask.column.boardId,
              })
            }
            break

          default:
            workerLogger.warn({ type: action.actionType }, 'Unknown action type')
        }

        logs.push({ actionId: action.id, type: action.actionType, status: 'success' })
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        workerLogger.error({ actionId: action.id, error: errorMessage }, 'Action failed')
        logs.push({
          actionId: action.id,
          type: action.actionType,
          status: 'failed',
          error: errorMessage,
        })
      }
    }

    await db.automationRun.update({
      where: { id: run.id },
      data: {
        status: 'SUCCESS',
        completedAt: new Date(),
        logs: logs,
      },
    })

    await db.automation.update({
      where: { id: automationId },
      data: { lastRunAt: new Date() },
    })

    automationsTriggeredTotal.inc({ status: 'success', trigger_type: automation.triggerType })
    return { success: true }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    await db.automationRun.update({
      where: { id: run.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        error: errorMessage,
      },
    })
    automationsTriggeredTotal.inc({ status: 'failed', trigger_type: 'unknown' })
    throw error
  }
}
