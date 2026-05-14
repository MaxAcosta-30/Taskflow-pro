/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
// =============================================================
//  tests/unit/workers/automation-processor.test.ts
// =============================================================

import type { Job } from 'bullmq'

import { db } from '@/lib/db'
import { automationProcessor } from '@/workers/processors/automation'

vi.mock('@/lib/db', () => ({
  db: {
    automation: { findUnique: vi.fn(), update: vi.fn() },
    automationRun: { create: vi.fn(), update: vi.fn() },
    task: { findUnique: vi.fn(), update: vi.fn() },
    user: { findUnique: vi.fn() },
    taskLabel: { upsert: vi.fn() },
  },
}))

vi.mock('@/lib/redis', () => ({
  redis: { get: vi.fn(), setex: vi.fn(), del: vi.fn() },
}))

vi.mock('@/lib/socket/publisher', () => ({
  publishToBoard: vi.fn(),
}))

vi.mock('@/lib/queue', () => ({
  queueNotification: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  workerLogger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/lib/metrics', () => ({
  automationsTriggeredTotal: { inc: vi.fn() },
}))

describe('automationProcessor', () => {
  const mockJob = {
    id: 'test-job-1',
    data: { automationId: 'auto-1', taskId: 'task-1', triggeredBy: 'user-1' },
    name: 'run-automation',
  } as Job

  beforeEach(() => {
    vi.clearAllMocks()
    ;(db.automationRun.create as any).mockResolvedValue({ id: 'run-1' })
  })

  it('should skip if automation is not found', async () => {
    ;(db.automation.findUnique as any).mockResolvedValue(null)

    await automationProcessor(mockJob)

    expect(db.automationRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'run-1' },
        data: expect.objectContaining({ status: 'SKIPPED' }),
      }),
    )
  })

  it('should skip if automation is inactive', async () => {
    ;(db.automation.findUnique as any).mockResolvedValue({ id: 'auto-1', isActive: false })

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

    ;(db.automation.findUnique as any).mockResolvedValue(automation)
    ;(db.task.findUnique as any).mockResolvedValue(task)

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

    ;(db.automation.findUnique as any).mockResolvedValue(automation)
    ;(db.task.findUnique as any).mockImplementation(() => {
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
