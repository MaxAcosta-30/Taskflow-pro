// =============================================================
//  app/(auth)/layout.tsx
// =============================================================

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Fondo con patrón */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Glow effect */}
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-white font-semibold text-lg">TaskFlow Pro</span>
        </div>

        {/* Mensaje central */}
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Automatiza tu equipo.<br />
            <span className="text-blue-400">Multiplica tu productividad.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-sm">
            Tableros Kanban en tiempo real, automatizaciones inteligentes
            y métricas de equipo en un solo lugar.
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
                <div className="text-slate-500 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-slate-600 text-sm">
          © 2024 TaskFlow Pro. Todos los derechos reservados.
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-slate-950">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
