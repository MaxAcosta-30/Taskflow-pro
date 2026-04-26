// =============================================================
//  app/api/auth/me/route.ts — Usuario autenticado actual
// =============================================================

import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, getCachedUser, unauthorized } from '@/lib/auth/helpers'
import { parseBody, ok, serverError } from '@/lib/api/helpers'
import { z } from 'zod'
import { invalidateCache, CACHE_KEYS } from '@/lib/redis'

export async function GET(req: NextRequest) {
  const payload = await getAuthUser(req)
  if (!payload) return unauthorized()

  const user = await getCachedUser(payload.sub)
  if (!user) return unauthorized('Usuario no encontrado')

  return Response.json({ success: true, data: { user } })
}

const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  avatarUrl: z.string().url().optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
})

export async function PATCH(req: NextRequest) {
  const payload = await getAuthUser(req)
  if (!payload) return unauthorized()

  const { data, error } = await parseBody(req, updateProfileSchema)
  if (error) return error

  try {
    const updatedUser = await db.user.update({
      where: { id: payload.sub },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        timezone: true,
        locale: true,
      }
    })

    // Invalidad cache
    await invalidateCache(CACHE_KEYS.user(payload.sub))

    return ok({ user: updatedUser })
  } catch (err: any) {
    console.error('[PATCH_ME_ERROR]', err)
    return serverError()
  }
}
