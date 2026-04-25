// =============================================================
//  app/api/health/route.ts — Health Check Endpoint
//  Usado por Docker healthcheck y load balancers
// =============================================================

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { redis } from '@/lib/redis'

export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {}

  // ── Check PostgreSQL ─────────────────────────────────────
  try {
    await db.$queryRaw`SELECT 1`
    checks['postgres'] = 'ok'
  } catch {
    checks['postgres'] = 'error'
  }

  // ── Check Redis ──────────────────────────────────────────
  try {
    await redis.ping()
    checks['redis'] = 'ok'
  } catch {
    checks['redis'] = 'error'
  }

  const allOk = Object.values(checks).every((s) => s === 'ok')

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
      checks,
    },
    { status: allOk ? 200 : 503 },
  )
}
