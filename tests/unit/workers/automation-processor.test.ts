/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
// =============================================================
//  tests/unit/workers/automation-processor.test.ts
// =============================================================

import type { Job } from 'bullmq'

import { db } from '@/lib/db'
import { automationProcessor } from '@/workers/processors/automation'

jest.mock('@/lib/db', () => ({
  db: {
    automation: { findUnique: jest.fn(), update: jest.fn() },
    automationRun: { create: jest.fn(), update: jest.fn() },
    task: { findUnique: jest.fn(), update: jest.fn() },
    user: { findUnique: jest.fn() },
    taskLabel: { upsert: jest.fn() },
  },
}))

jest.mock('@/lib/redis', () => ({
  redis: { get: jest.fn(), setex: jest.fn(), del: jest.fn() },
}))

jest.mock('@/lib/socket/publisher', () => ({
  publishToBoard: jest.fn(),
}))

jest.mock('@/lib/queue', () => ({
  queueNotification: jest.fn(),
}))

jest.mock('@/lib/logger', () => ({
  workerLogger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@/lib/metrics', () => ({
  automationsTriggeredTotal: { inc: jest.fn() },
}))

describe('automationProcessor', () => {
  const mockJob = {
    id: 'test-job-1',
    data: { automationId: 'auto-1', taskId: 'task-1', triggeredBy: 'user-1' },
    name: 'run-automation',
  } as Job

  beforeEach(() => {
    jest.clearAllMocks()
    ;(db.automationRun.create as jest.Mock).mockResolvedValue({ id: 'run-1' })
  })

  it('should skip if automation is not found', async () => {
    ;(db.automation.findUnique as jest.Mock).mockResolvedValue(null)

    await automationProcessor(mockJob)

    expect(db.automationRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'run-1' },
        data: expect.objectContaining({ status: 'SKIPPED' }),
      }),
    )
  })

  it('should skip if automation is inactive', async () => {
    ;(db.automation.findUnique as jest.Mock).mockResolvedValue({ id: 'auto-1', isActive: false })

    await automationProcessor(mockJob)

    expect(db.automationRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'SKIPPED' }),
      }),
    )
  })

  it('should process MOVE_TASK action correctly', async () => {
    const automation = {
      id: 'auto-1',
      isActive: true,
      name: 'Test Auto',
      triggerType: 'TASK_MOVED',
      team: { name: 'Test Team' },
      actions: [
        { id: 'act-1', actionType: 'MOVE_TASK', config: { toColumnId: 'col-2' }, position: 0 },
      ],
    }
    const task = {
      id: 'task-1',
      title: 'Task 1',
      column: { boardId: 'board-1' },
      creator: { name: 'Alice' },
    }

    ;(db.automation.findUnique as jest.Mock).mockResolvedValue(automation)
    ;(db.task.findUnique as jest.Mock).mockResolvedValue(task)

    await automationProcessor(mockJob)

    expect(db.task.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'task-1' },
        data: { columnId: 'col-2' },
      }),
    )
    expect(db.automationRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'SUCCESS' }),
      }),
    )
  })

  it('should handle action failures and update run status to FAILED', async () => {
    const automation = {
      id: 'auto-1',
      isActive: true,
      name: 'Test Auto',
      triggerType: 'TASK_MOVED',
      team: { name: 'Test Team' },
      actions: [
        { id: 'act-1', actionType: 'MOVE_TASK', config: { toColumnId: 'col-2' }, position: 0 },
      ],
    }

    ;(db.automation.findUnique as jest.Mock).mockResolvedValue(automation)
    ;(db.task.findUnique as jest.Mock).mockImplementation(() => {
      throw new Error('DB Error')
    })

    await expect(automationProcessor(mockJob)).rejects.toThrow('DB Error')

    expect(db.automationRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'FAILED', error: 'DB Error' }),
      }),
    )
  })
})
