// =============================================================
//  app/api/auth/me/route.ts — Usuario autenticado actual
// =============================================================

import type { NextRequest } from 'next/server'

import { getAuthUser, getCachedUser, unauthorized } from '@/lib/auth/helpers'

export async function GET(req: NextRequest) {
  const payload = await getAuthUser(req)
  if (!payload) return unauthorized()

  const user = await getCachedUser(payload.sub)
  if (!user) return unauthorized('Usuario no encontrado')

  return Response.json({ success: true, data: { user } })
}
