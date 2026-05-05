/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
// =============================================================
//  tests/integration/api/auth.test.ts
// =============================================================

import { NextRequest } from 'next/server'

import { POST as loginHandler } from '@/app/api/auth/login/route'
import { POST as registerHandler } from '@/app/api/auth/register/route'
import { db } from '@/lib/db'

jest.mock('@/lib/db', () => ({
  db: {
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    team: { findUnique: jest.fn(), create: jest.fn() },
    teamMember: { create: jest.fn() },
    session: { create: jest.fn() },
  },
}))

jest.mock('@/lib/redis', () => ({
  redis: { get: jest.fn(), setex: jest.fn(), del: jest.fn() },
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 9, resetIn: 900 }),
}))

jest.mock('@/lib/logger', () => ({
  authLogger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockReturnValue({
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  }),
}))

jest.mock('@/lib/integrations/ipinfo', () => ({
  getIpInfo: jest.fn().mockResolvedValue({ country: 'ES', city: 'Madrid' }),
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
    jest.clearAllMocks()
  })

  describe('POST /api/auth/register', () => {
    it('should return 201 when registration is successful', async () => {
      ;(db.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(db.user.create as jest.Mock).mockResolvedValue({
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
      ;(db.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing' })

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
      ;(db.user.findUnique as jest.Mock).mockResolvedValue(null)

      const req = makeRequest('http://localhost:3000/api/auth/login', {
        email: 'wrong@example.com',
        password: 'Password123',
      })

      const res = await loginHandler(req)
      expect(res.status).toBe(401)
    })
  })
})
