/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
// =============================================================
//  tests/setup.ts — Configuración global de Jest
//  Se ejecuta antes de cada test suite
// =============================================================

import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfill para Request/Response en entorno de tests
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as any
}

if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = ((callback: any, ...args: any[]) => setTimeout(callback, 0, ...args)) as any
  global.clearImmediate = (id: any) => clearTimeout(id)
}

if (typeof Request === 'undefined') {
  const { Request, Response, Headers } = require('next/dist/compiled/@edge-runtime/primitives')
  global.Request = Request
  global.Response = Response
  global.Headers = Headers
}
