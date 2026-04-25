// =============================================================
//  lib/api/helpers.ts — API Route utilities
// =============================================================

import type { NextRequest } from 'next/server'
import type { ZodSchema } from 'zod'

import { getAuthUser, unauthorized } from '@/lib/auth/helpers'
import type { JwtPayload } from '@/types'

export type RouteContext = { params: Record<string, string> }

/** Valida auth + parsea body con Zod en un solo paso */
export async function withAuth(
  req: NextRequest,
  handler: (user: JwtPayload) => Promise<Response>,
): Promise<Response> {
  const user = await getAuthUser(req)
  if (!user) return unauthorized()
  return handler(user)
}

/** Parsea y valida el body JSON con un schema Zod */
export async function parseBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>,
): Promise<{ data: T; error: null } | { data: null; error: Response }> {
  try {
    const body = await req.json() as unknown
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return {
        data: null,
        error: Response.json(
          { success: false, error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
          { status: 422 },
        ),
      }
    }
    return { data: parsed.data, error: null }
  } catch {
    return {
      data: null,
      error: Response.json({ success: false, error: 'JSON inválido' }, { status: 400 }),
    }
  }
}

export function ok<T>(data: T, status = 200) {
  return Response.json({ success: true, data }, { status })
}

export function created<T>(data: T) {
  return ok(data, 201)
}

export function notFound(message = 'Recurso no encontrado') {
  return Response.json({ success: false, error: message }, { status: 404 })
}

export function serverError(message = 'Error interno del servidor') {
  return Response.json({ success: false, error: message }, { status: 500 })
}
