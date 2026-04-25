import type { Job } from 'bullmq'

import { db } from '@/lib/db'
import { workerLogger } from '@/lib/logger'

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
      taskId
    }
  })

  try {
    // 1. Fetch automation and its actions
    const automation = await db.automation.findUnique({
      where: { id: automationId },
      include: { actions: { orderBy: { position: 'asc' } } }
    })

    if (!automation || !automation.isActive) {
      await db.automationRun.update({
        where: { id: run.id },
        data: { status: 'SKIPPED', logs: { message: 'Automation not found or inactive' } }
      })
      return { skipped: true }
    }

    // 2. Execute actions sequentially
    const logs = []
    for (const action of automation.actions) {
      workerLogger.debug({ actionType: action.actionType }, 'Executing action')
      // TODO: Implement actual action logic (Move task, Call webhook, etc.)
      logs.push({ actionId: action.id, type: action.actionType, status: 'success' })
    }

    // 3. Update run status
    await db.automationRun.update({
      where: { id: run.id },
      data: {
        status: 'SUCCESS',
        completedAt: new Date(),
        logs: logs as any
      }
    })

    // Update last run time on the automation
    await db.automation.update({
      where: { id: automationId },
      data: { lastRunAt: new Date() }
    })

    return { success: true }
  } catch (error: any) {
    await db.automationRun.update({
      where: { id: run.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        error: error.message
      }
    })
    throw error
  }
}
