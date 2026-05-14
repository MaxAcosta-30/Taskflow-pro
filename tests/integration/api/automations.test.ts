/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
// =============================================================
//  tests/integration/api/automations.test.ts
// =============================================================

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/automations/route'
import { db } from '@/lib/db'

vi.mock('@/lib/db', () => ({
  db: {
    automation: { findMany: vi.fn(), create: vi.fn() },
    teamMember: { findFirst: vi.fn() },
  },
}))

vi.mock('@/lib/auth/helpers', () => ({
  getAuthUser: vi.fn().mockResolvedValue({ sub: 'user-1' }),
}))

function makeRequest(url: string, method: string = 'GET', body: any = null) {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : null,
  })
}

describe('Automations API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/automations', () => {
    it('should return automations list', async () => {
      ;(db.teamMember.findFirst as any).mockResolvedValue({ teamId: 'team-1' })
      ;(db.automation.findMany as any).mockResolvedValue([
        { id: 'auto-1', name: 'Auto 1', _count: { runs: 0, actions: 1 } }
      ])

      const req = makeRequest('http://localhost:3000/api/automations')
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
    })
  })

  describe('POST /api/automations', () => {
    it('should create an automation with actions', async () => {
      ;(db.teamMember.findFirst as any).mockResolvedValue({ teamId: 'team-1' })
      ;(db.automation.create as any).mockResolvedValue({ 
        id: 'auto-2', 
        name: 'New Automation' 
      })

      const payload = {
        name: 'New Automation',
        triggerType: 'TASK_MOVED',
        triggerConfig: { toColumnId: 'col-1' },
        actions: [
          {
            actionType: 'SEND_NOTIFICATION',
            config: { title: 'Moved', body: 'Task moved to col 1' },
            position: 0
          }
        ]
      }

      const req = makeRequest('http://localhost:3000/api/automations', 'POST', payload)
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(201)
      expect(data.success).toBe(true)
      expect(db.automation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Automation',
            triggerType: 'TASK_MOVED',
          })
        })
      )
    })

    it('should return 400 for invalid data', async () => {
      const req = makeRequest('http://localhost:3000/api/automations', 'POST', {
        name: 'Missing trigger'
      })

      const res = await POST(req)
      expect(res.status).toBe(400)
    })
  })
})
