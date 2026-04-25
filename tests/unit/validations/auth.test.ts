// =============================================================
//  tests/unit/validations/auth.test.ts
// =============================================================

import { registerSchema, loginSchema } from '@/lib/validations'

describe('registerSchema', () => {
  it('should pass with valid data', () => {
    const result = registerSchema.safeParse({
      name: 'Juan García',
      email: 'juan@test.com',
      password: 'Password1',
    })
    expect(result.success).toBe(true)
  })

  it('should fail with short name', () => {
    const result = registerSchema.safeParse({ name: 'J', email: 'j@t.com', password: 'Password1' })
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.name).toBeDefined()
  })

  it('should fail with invalid email', () => {
    const result = registerSchema.safeParse({ name: 'Juan', email: 'not-an-email', password: 'Password1' })
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.email).toBeDefined()
  })

  it('should fail with weak password (no uppercase)', () => {
    const result = registerSchema.safeParse({ name: 'Juan', email: 'j@test.com', password: 'password1' })
    expect(result.success).toBe(false)
  })

  it('should fail with weak password (no number)', () => {
    const result = registerSchema.safeParse({ name: 'Juan', email: 'j@test.com', password: 'Password' })
    expect(result.success).toBe(false)
  })

  it('should lowercase the email', () => {
    const result = registerSchema.safeParse({
      name: 'Juan', email: 'JUAN@TEST.COM', password: 'Password1',
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.email).toBe('juan@test.com')
  })
})

describe('loginSchema', () => {
  it('should pass with valid data', () => {
    const result = loginSchema.safeParse({ email: 'juan@test.com', password: 'any' })
    expect(result.success).toBe(true)
  })

  it('should fail with empty password', () => {
    const result = loginSchema.safeParse({ email: 'juan@test.com', password: '' })
    expect(result.success).toBe(false)
  })
})
