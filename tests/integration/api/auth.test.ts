/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
// =============================================================
//  tests/integration/api/auth.test.ts
// =============================================================

import { NextRequest } from 'next/server'

import { POST as loginHandler } from '@/app/api/auth/login/route'
import { POST as registerHandler } from '@/app/api/auth/register/route'
import { db } from '@/lib/db'

vi.mock('@/lib/db', () => ({
  db: {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    team: { findUnique: vi.fn(), create: vi.fn() },
    teamMember: { create: vi.fn() },
    session: { create: vi.fn() },
  },
}))

vi.mock('@/lib/redis', () => ({
  redis: { get: vi.fn(), setex: vi.fn(), del: vi.fn() },
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9, resetIn: 900 }),
}))

vi.mock('@/lib/logger', () => ({
  authLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockReturnValue({
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  }),
}))

vi.mock('@/lib/integrations/ipinfo', () => ({
  getIpInfo: vi.fn().mockResolvedValue({ country: 'ES', city: 'Madrid' }),
}))

function makeRequest(url: string, body: any) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('Auth API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/auth/register', () => {
    it('should return 201 when registration is successful', async () => {
      ;(db.user.findUnique as any).mockResolvedValue(null)
      ;(db.user.create as any).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'MEMBER',
      })

      const req = makeRequest('http://localhost:3000/api/auth/register', {
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
      })

      const res = await registerHandler(req)
      const data = await res.json()

      expect(res.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.user.email).toBe('test@example.com')
    })

    it('should return 409 if user already exists', async () => {
      ;(db.user.findUnique as any).mockResolvedValue({ id: 'existing' })

      const req = makeRequest('http://localhost:3000/api/auth/register', {
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
      })

      const res = await registerHandler(req)
      expect(res.status).toBe(409)
    })
  })

  describe('POST /api/auth/login', () => {
    it('should return 401 on invalid credentials', async () => {
      ;(db.user.findUnique as any).mockResolvedValue(null)

      const req = makeRequest('http://localhost:3000/api/auth/login', {
        email: 'wrong@example.com',
        password: 'Password123',
      })

      const res = await loginHandler(req)
      expect(res.status).toBe(401)
    })
  })
})
