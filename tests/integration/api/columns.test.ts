/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
// =============================================================
//  tests/integration/api/columns.test.ts
// =============================================================

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/columns/route'
import { db } from '@/lib/db'

vi.mock('@/lib/db', () => ({
  db: {
    board: { findFirst: vi.fn() },
    column: { findFirst: vi.fn(), create: vi.fn() },
  },
}))

vi.mock('@/lib/auth/helpers', () => ({
  getAuthUser: vi.fn().mockResolvedValue({ sub: 'user-1' }),
}))

vi.mock('@/lib/socket/publisher', () => ({
  publishToBoard: vi.fn(),
}))

function makeRequest(url: string, body: any) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('Columns API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/columns', () => {
    it('should create a column and publish to board', async () => {
      ;(db.board.findFirst as any).mockResolvedValue({ id: 'board-1' })
      ;(db.column.findFirst as any).mockResolvedValue({ position: 2 })
      ;(db.column.create as any).mockResolvedValue({ 
        id: 'col-1', 
        name: 'New Column',
        position: 3
      })

      const req = makeRequest('http://localhost:3000/api/columns', {
        boardId: 'ckp1234567890123456789012', // Valid CUID for validation
        name: 'New Column'
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(201)
      expect(data.success).toBe(true)
      expect(db.column.create).toHaveBeenCalled()
    })

    it('should return 404 if board not found', async () => {
      ;(db.board.findFirst as any).mockResolvedValue(null)

      const req = makeRequest('http://localhost:3000/api/columns', {
        boardId: 'ckp1234567890123456789012',
        name: 'New Column'
      })

      const res = await POST(req)
      expect(res.status).toBe(404)
    })
  })
})
