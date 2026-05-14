/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
// =============================================================
//  tests/setup.ts — Configuración global de Vitest
// =============================================================

import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

import { vi } from 'vitest'

// Enriquecer vi.fn() para que parezca un Mock de Jest
const patchMock = (fn: any) => {
  if (fn && typeof fn === 'function' && !fn.mockResolvedValue) {
    fn.mockResolvedValue = (val: any) => fn.mockImplementation(() => Promise.resolve(val))
    fn.mockRejectedValue = (val: any) => fn.mockImplementation(() => Promise.reject(val))
    fn.mockReturnValue = (val: any) => fn.mockImplementation(() => val)
  }
  return fn
}

const originalFn = vi.fn
// @ts-expect-error - overriding vi.fn
vi.fn = (...args: any[]) => {
  return patchMock(originalFn(...args))
}

// Hacer que 'jest' esté disponible globalmente como alias de 'vi' para compatibilidad
// @ts-expect-error - defining global.jest
global.jest = new Proxy(vi, {
  get(target, prop) {
    const val = (target as any)[prop]
    if (prop === 'fn') {
      return (...args: any[]) => patchMock(target.fn(...args))
    }
    if (typeof val === 'function') {
      return val.bind(target)
    }
    return val
  },
})

// Polyfill para Request/Response en entorno de tests
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as any
}

if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = ((callback: (...args: any[]) => void, ...args: any[]) =>
    setTimeout(callback, 0, ...args)) as any
  global.clearImmediate = (id: any) => clearTimeout(id)
}

if (typeof Request === 'undefined') {
  const { Request, Response, Headers } = require('next/dist/compiled/@edge-runtime/primitives')
  global.Request = Request
  global.Response = Response
  global.Headers = Headers
}
