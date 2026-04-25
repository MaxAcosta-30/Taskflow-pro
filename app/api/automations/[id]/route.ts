// =============================================================
//  app/api/automations/[id]/route.ts — Toggle / Delete
// =============================================================

import { type NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth/helpers'

// ── PATCH /api/automations/:id ───────────────────────────────
// Activa / desactiva una automatización
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as { isActive?: boolean; name?: string; description?: string }

    const automation = await db.automation.update({
      where: { id: params.id },
      data: body,
    })

    return NextResponse.json({ success: true, data: automation })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── DELETE /api/automations/:id ──────────────────────────────
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await db.automation.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
