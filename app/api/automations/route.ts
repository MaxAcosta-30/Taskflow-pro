// =============================================================
//  app/api/automations/route.ts — CRUD de Automatizaciones
// =============================================================

import { type NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth/helpers'
import { createAutomationSchema } from '@/lib/validations'

// ── GET /api/automations ─────────────────────────────────────
// Lista todas las automatizaciones del equipo activo del usuario
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Obtenemos el teamId del primer equipo del usuario
    const membership = await db.teamMember.findFirst({
      where: { userId: user.sub },
      orderBy: { joinedAt: 'asc' },
    })

    if (!membership) {
      return NextResponse.json({ success: true, data: [] })
    }

    const automations = await db.automation.findMany({
      where: { teamId: membership.teamId },
      include: {
        _count: { select: { runs: true, actions: true } },
        creator: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: automations })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── POST /api/automations ────────────────────────────────────
// Crea una nueva automatización con sus acciones
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const validated = createAutomationSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validated.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { name, description, triggerType, triggerConfig, actions } = validated.data

    // Obtener el equipo del usuario
    const membership = await db.teamMember.findFirst({
      where: { userId: user.sub },
      orderBy: { joinedAt: 'asc' },
    })

    if (!membership) {
      return NextResponse.json({ error: 'No perteneces a ningún equipo' }, { status: 403 })
    }

    // Crear la automatización + acciones en una sola transacción
    const automation = await db.automation.create({
      data: {
        name,
        description,
        teamId: membership.teamId,
        creatorId: user.sub,
        triggerType,
        triggerConfig: triggerConfig as any,
        actions: {
          create: actions.map((action, index) => ({
            actionType: action.actionType,
            config: action.config as any,
            position: action.position ?? index,
          })),
        },
      },
      include: {
        actions: true,
        _count: { select: { runs: true, actions: true } },
      },
    })

    return NextResponse.json({ success: true, data: automation }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
