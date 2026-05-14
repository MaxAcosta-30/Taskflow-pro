/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
// =============================================================
//  tests/unit/workers/notification-processor.test.ts
// =============================================================

import type { Job } from 'bullmq'

import { db } from '@/lib/db'
import { notificationsSentTotal } from '@/lib/metrics'
import { publishToUser } from '@/lib/socket/publisher'
import { notificationProcessor } from '@/workers/processors/notification'

vi.mock('@/lib/db', () => ({
  db: {
    notificationSetting: { findUnique: vi.fn() },
    notification: { create: vi.fn() },
    pushSubscription: { findMany: vi.fn(), delete: vi.fn() },
  },
}))

vi.mock('@/lib/socket/publisher', () => ({
  publishToUser: vi.fn(),
}))

vi.mock('@/lib/metrics', () => ({
  notificationsSentTotal: { inc: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  workerLogger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('web-push', () => ({
  sendNotification: vi.fn().mockResolvedValue({}),
  setVapidDetails: vi.fn(),
}))

describe('notificationProcessor', () => {
  const mockJob = {
    id: 'job-1',
    data: {
      userId: 'user-1',
      type: 'TASK_ASSIGNED',
      title: 'New Task',
      body: 'You have been assigned a task',
    },
  } as Job

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a notification and emit socket event when in-app is enabled', async () => {
    ;(db.notificationSetting.findUnique as any).mockResolvedValue({
      inApp: true,
      push: false,
    })
    ;(db.notification.create as any).mockResolvedValue({ id: 'notif-1', title: 'New Task' })

    await notificationProcessor(mockJob)

    expect(db.notification.create).toHaveBeenCalled()
    expect(publishToUser).toHaveBeenCalledWith('user-1', 'notification:new', expect.anything())
    expect(notificationsSentTotal.inc).toHaveBeenCalledWith({ type: 'TASK_ASSIGNED' })
  })

  it('should skip in-app notification when explicitly disabled', async () => {
    ;(db.notificationSetting.findUnique as any).mockResolvedValue({
      inApp: false,
      push: false,
    })

    await notificationProcessor(mockJob)

    expect(db.notification.create).not.toHaveBeenCalled()
    expect(publishToUser).not.toHaveBeenCalled()
  })
})
