/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
// =============================================================
//  tests/unit/workers/scheduler-processor.test.ts
// =============================================================

import { db } from '@/lib/db'
import { checkWeatherCondition } from '@/lib/integrations/open-meteo'
import { triggerAutomation } from '@/lib/queue'
import { schedulerProcessor } from '@/workers/processors/scheduler'

vi.mock('@/lib/db', () => ({
  db: {
    automation: { findMany: vi.fn() },
    task: { findMany: vi.fn() },
    automationRun: { findFirst: vi.fn() },
  },
}))

vi.mock('@/lib/queue', () => ({
  triggerAutomation: vi.fn(),
}))

vi.mock('@/lib/integrations/open-meteo', () => ({
  checkWeatherCondition: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  workerLogger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}))

describe('schedulerProcessor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should trigger TASK_STALE automation for stale tasks', async () => {
    ;(db.automation.findMany as any).mockResolvedValue([
      {
        id: 'auto-1',
        isActive: true,
        triggerType: 'TASK_STALE',
        triggerConfig: { daysStale: 7 },
        teamId: 'team-1',
      },
    ])
    ;(db.task.findMany as any).mockResolvedValue([{ id: 'task-1' }])
    ;(db.automationRun.findFirst as any).mockResolvedValue(null)

    await schedulerProcessor()

    expect(triggerAutomation).toHaveBeenCalledWith(
      expect.objectContaining({
        automationId: 'auto-1',
        taskId: 'task-1',
        triggeredBy: 'SYSTEM_SCHEDULER',
      }),
    )
  })

  it('should trigger WEATHER automation when condition matches', async () => {
    ;(db.automation.findMany as any).mockResolvedValue([
      {
        id: 'auto-2',
        isActive: true,
        triggerType: 'WEATHER',
        triggerConfig: { latitude: 40, longitude: -3, weatherCondition: 'rain' },
        teamId: 'team-1',
      },
    ])
    ;(checkWeatherCondition as any).mockResolvedValue({
      matches: true,
      weather: { temperature: 15 },
    })

    await schedulerProcessor()

    expect(triggerAutomation).toHaveBeenCalledWith(
      expect.objectContaining({
        automationId: 'auto-2',
        triggeredBy: 'SYSTEM_SCHEDULER',
      }),
    )
  })

  it('should not trigger WEATHER automation when condition does not match', async () => {
    ;(db.automation.findMany as any).mockResolvedValue([
      {
        id: 'auto-2',
        isActive: true,
        triggerType: 'WEATHER',
        triggerConfig: { latitude: 40, longitude: -3, weatherCondition: 'rain' },
        teamId: 'team-1',
      },
    ])
    ;(checkWeatherCondition as any).mockResolvedValue({
      matches: false,
      weather: { temperature: 25 },
    })

    await schedulerProcessor()

    expect(triggerAutomation).not.toHaveBeenCalled()
  })
})
