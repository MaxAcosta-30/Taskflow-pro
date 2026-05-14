/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
// =============================================================
//  tests/integration/api/boards.test.ts
// =============================================================

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/boards/route'
import { db } from '@/lib/db'

vi.mock('@/lib/db', () => ({
  db: {
    board: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
    teamMember: { findFirst: vi.fn() },
    column: { createMany: vi.fn() },
  },
}))

vi.mock('@/lib/redis', () => ({
  invalidateCacheByPattern: vi.fn(),
}))

vi.mock('@/lib/auth/helpers', () => ({
  getAuthUser: vi.fn().mockResolvedValue({ sub: 'user-1' }),
  unauthorized: vi.fn().mockReturnValue(Response.json({ success: false, error: 'No autorizado' }, { status: 401 })),
}))

function makeRequest(url: string, method: string = 'GET', body: any = null) {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : null,
  })
}

describe('Boards API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/boards', () => {
    it('should return boards list', async () => {
      const mockBoards = [
        { 
          id: 'board-1', 
          name: 'Board 1', 
          team: { id: 'team-1', name: 'Team A', slug: 'team-a' },
          _count: { columns: 4 }
        }
      ]
      ;(db.board.findMany as any).mockResolvedValue(mockBoards)

      const req = makeRequest('http://localhost:3000/api/boards')
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].name).toBe('Board 1')
    })

    it('should return 500 if database fails', async () => {
      ;(db.board.findMany as any).mockRejectedValue(new Error('DB Error'))

      const req = makeRequest('http://localhost:3000/api/boards')
      const res = await GET(req)
      expect(res.status).toBe(500)
    })
  })

  describe('POST /api/boards', () => {
    it('should create a board and default columns', async () => {
      ;(db.teamMember.findFirst as any).mockResolvedValue({ teamId: 'team-1' })
      ;(db.board.findFirst as any).mockResolvedValue({ position: 2 })
      ;(db.board.create as any).mockResolvedValue({ 
        id: 'board-2', 
        name: 'New Board',
        team: { id: 'team-1', name: 'Team A' },
        _count: { columns: 0 }
      })

      const req = makeRequest('http://localhost:3000/api/boards', 'POST', { 
        name: 'New Board',
        color: '#3B82F6'
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('New Board')
      expect(db.board.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            position: 3,
            teamId: 'team-1'
          })
        })
      )
      expect(db.column.createMany).toHaveBeenCalled()
    })

    it('should return 403 if user is not admin of any team', async () => {
      ;(db.teamMember.findFirst as any).mockResolvedValue(null)

      const req = makeRequest('http://localhost:3000/api/boards', 'POST', { 
        name: 'New Board'
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toContain('admin')
    })

    it('should return 422 if validation fails', async () => {
      const req = makeRequest('http://localhost:3000/api/boards', 'POST', { 
        name: '' // Invalid name
      })

      const res = await POST(req)
      expect(res.status).toBe(422)
    })
  })
})
