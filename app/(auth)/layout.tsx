// =============================================================
//  app/(auth)/layout.tsx
//  Panel de marca: lo que el producto hace de verdad (sin métricas inventadas)
//  y una muestra del tablero sincronizado.
// =============================================================

import { Logo } from '@/components/shared/logo'

const HECHOS = [
  { titulo: 'Sincronizado', texto: 'Socket.io con adaptador de Redis: si alguien mueve una tarea, todo el equipo lo ve sin recargar.' },
  { titulo: 'Automático', texto: 'Reglas por horario, cambio de estado o webhook, procesadas en segundo plano con BullMQ.' },
  { titulo: 'Medible', texto: 'Métricas con Prometheus y Grafana, errores con Sentry y logs estructurados.' },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-12 text-slate-100 lg:flex lg:w-1/2">
        <Logo className="relative z-10" />

        <div className="relative z-10 space-y-10">
          <h1 className="font-wide max-w-md text-[40px] font-extrabold uppercase leading-[0.98] tracking-[-0.01em]">
            Un tablero.
            <br />
            Todo el equipo.
            <br />
            <span className="text-[#FFC931]">Al instante.</span>
          </h1>

          {/* Muestra: la tarjeta de Ana avanza de columna y "llega" al tablero de Luis */}
          <div className="tablero-muestra" aria-hidden="true">
            {['Pendiente', 'En curso', 'Hecho'].map((columna) => (
              <div key={columna} className="muestra-columna">
                <span>{columna}</span>
              </div>
            ))}
            <div className="muestra-tarjeta">
              Publicar sitio
              <small>Ana la movió</small>
            </div>
          </div>

          <dl className="grid max-w-md gap-5">
            {HECHOS.map((hecho) => (
              <div key={hecho.titulo} className="grid grid-cols-[150px_1fr] gap-4 border-t border-slate-800 pt-4">
                <dt className="font-wide text-xs font-bold uppercase tracking-[0.08em] text-[#FFC931]">{hecho.titulo}</dt>
                <dd className="text-sm leading-relaxed text-slate-300">{hecho.texto}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="relative z-10 text-sm text-slate-400">Proyecto de portafolio de Max Acosta · código abierto</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
