// =============================================================
//  app/api/metrics/route.ts — Prometheus Metrics Endpoint
// =============================================================

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server'
import { register } from 'prom-client'

// Importamos el archivo para forzar la inicialización de métricas
import '@/lib/metrics'

// ── Endpoint GET /api/metrics ─────────────────────────────────
export async function GET(request: NextRequest) {
  // Proteger con secret en producción
  const secret = request.headers.get('x-metrics-secret')
  if (
    process.env.NODE_ENV === 'production' &&
    secret !== process.env.METRICS_SECRET
  ) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const metrics = await register.metrics()

  return new NextResponse(metrics, {
    headers: { 'Content-Type': register.contentType },
  })
}
