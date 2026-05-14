/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
// =============================================================
//  tests/integration/api/teams.test.ts
// =============================================================

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/teams/route'
import { db } from '@/lib/db'

vi.mock('@/lib/db', () => ({
  db: {
    team: { create: vi.fn() },
  },
}))

vi.mock('@/lib/auth/helpers', () => ({
  getAuthUser: vi.fn().mockResolvedValue({ sub: 'user-1' }),
}))

function makeRequest(url: string, body: any) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('Teams API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/teams', () => {
    it('should create a team and assign owner', async () => {
      ;(db.team.create as any).mockResolvedValue({ 
        id: 'team-1', 
        name: 'New Team',
        slug: 'new-team-abcde'
      })

      const req = makeRequest('http://localhost:3000/api/teams', {
        name: 'New Team'
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(201)
      expect(data.success).toBe(true)
      expect(db.team.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Team',
            members: expect.objectContaining({
              create: expect.objectContaining({
                userId: 'user-1',
                teamRole: 'OWNER'
              })
            })
          })
        })
      )
    })
  })
})
