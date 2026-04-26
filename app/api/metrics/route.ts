import { NextResponse } from 'next/server';
import { register } from '@/lib/metrics';

/**
 * Endpoint de metricas para Prometheus.
 * Expone tanto las metricas por defecto de Node.js como las personalizadas
 * definidas en lib/metrics.ts.
 */
export async function GET() {
  try {
    const metrics = await register.metrics();
    
    return new NextResponse(metrics, {
      headers: {
        'Content-Type': register.contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    return new NextResponse(error.message, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

export const dynamic = 'force-dynamic';
