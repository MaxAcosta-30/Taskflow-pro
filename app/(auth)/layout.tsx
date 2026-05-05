// =============================================================
//  app/(auth)/layout.tsx
// =============================================================

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Panel izquierdo — branding */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-900 p-12 lg:flex lg:w-1/2">
        {/* Fondo con patrón */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Glow effect */}
        <div className="absolute left-1/3 top-1/3 h-64 w-64 rounded-full bg-blue-500 opacity-20 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <span className="text-lg font-semibold text-white">TaskFlow Pro</span>
        </div>

        {/* Mensaje central */}
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold leading-tight text-white">
            Automatiza tu equipo.
            <br />
            <span className="text-blue-400">Multiplica tu productividad.</span>
          </h1>
          <p className="max-w-sm text-lg text-slate-400">
            Tableros Kanban en tiempo real, automatizaciones inteligentes y métricas de equipo en un
            solo lugar.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 pt-4">
            {[
              { value: '10k+', label: 'Tareas automatizadas' },
              { value: '99.9%', label: 'Uptime garantizado' },
              { value: '<50ms', label: 'Latencia promedio' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-sm text-slate-600">
          © 2024 TaskFlow Pro. Todos los derechos reservados.
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex flex-1 items-center justify-center bg-white p-8 dark:bg-slate-950">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
