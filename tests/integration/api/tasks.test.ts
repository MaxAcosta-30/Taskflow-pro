/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
// =============================================================
//  tests/integration/api/tasks.test.ts
// =============================================================

import { NextRequest } from 'next/server'

import { POST as createTaskHandler } from '@/app/api/tasks/route'
import { db } from '@/lib/db'

jest.mock('@/lib/db', () => ({
  db: {
    column: { findFirst: jest.fn() },
    task: { findFirst: jest.fn(), create: jest.fn() },
  },
}))

jest.mock('@/lib/redis', () => ({
  redis: { get: jest.fn(), setex: jest.fn(), del: jest.fn() },
  invalidateCache: jest.fn(),
  CACHE_KEYS: { board: (id: string) => `board:${id}` },
}))

jest.mock('@/lib/socket/publisher', () => ({
  publishToBoard: jest.fn(),
}))

jest.mock('@/lib/auth/helpers', () => ({
  getAuthUser: jest.fn().mockResolvedValue({ sub: 'user-1' }),
}))

function makeRequest(url: string, body: any) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('Tasks API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/tasks', () => {
    it('should create a task and return 201', async () => {
      ;(db.column.findFirst as jest.Mock).mockResolvedValue({
        id: 'ckp1234567890123456789012',
        board: { id: 'ckp1234567890123456789013' },
      })
      ;(db.task.findFirst as jest.Mock).mockResolvedValue({ position: 5 })
      ;(db.task.create as jest.Mock).mockResolvedValue({
        id: 'ckp1234567890123456789014',
        title: 'New Task',
        columnId: 'ckp1234567890123456789012',
      })

      const req = makeRequest('http://localhost:3000/api/tasks', {
        title: 'New Task',
        columnId: 'ckp1234567890123456789012',
      })

      const res = await createTaskHandler(req)
      const data = await res.json()

      expect(res.status).toBe(201)
      expect(data.success).toBe(true)
      expect(db.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            position: 6,
          }),
        }),
      )
    })

    it('should return 404 if column is not found or no access', async () => {
      ;(db.column.findFirst as jest.Mock).mockResolvedValue(null)

      const req = makeRequest('http://localhost:3000/api/tasks', {
        title: 'New Task',
        columnId: 'ckp1234567890123456789015',
      })

      const res = await createTaskHandler(req)
      expect(res.status).toBe(404)
    })
  })
})
