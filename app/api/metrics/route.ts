// =============================================================
//  app/api/metrics/route.ts — Prometheus scrape endpoint
//  Las métricas se definen en lib/metrics.ts, no aquí.
// =============================================================

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { register } from '@/lib/metrics'

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-metrics-secret')

  if (process.env.NODE_ENV === 'production' && secret !== process.env.METRICS_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const metrics = await register.metrics()
    return new NextResponse(metrics, {
      headers: { 'Content-Type': register.contentType },
    })
  } catch (error) {
    return new NextResponse('Error collecting metrics', { status: 500 })
  }
}
