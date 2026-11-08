'use client'

// Configuración: solo lo que de verdad funciona. Nombre y zona horaria se guardan con
// PATCH /api/auth/me; el correo no se puede cambiar desde la API, así que se muestra como dato.
import { Check, Loader2 } from 'lucide-react'
import { useState } from 'react'

import { Avatar } from '@/components/shared/avatar'
import { useUpdateProfile } from '@/hooks/use-auth'
import { useAuthStore } from '@/stores/auth.store'

const ZONAS = [
  { value: 'America/Mazatlan', label: 'Culiacán / Mazatlán (GMT-7)' },
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
  { value: 'America/Tijuana', label: 'Tijuana (GMT-8)' },
  { value: 'UTC', label: 'UTC' },
]

export default function SettingsPage() {
  const { user } = useAuthStore()
  const { mutate: guardar, isPending, isSuccess, error, reset } = useUpdateProfile()
  const [nombre, setNombre] = useState(user?.name ?? '')
  const [zona, setZona] = useState('America/Mazatlan')

  const valido = nombre.trim().length >= 2

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-wide text-3xl font-extrabold uppercase tracking-[-0.01em] text-slate-900 dark:text-slate-50">Configuración</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Tu nombre es el que ve tu equipo en las tarjetas y los comentarios.</p>
      </div>

      <section className="rounded-md border border-slate-200 bg-card p-6 dark:border-slate-800" aria-labelledby="perfil">
        <div className="mb-6 flex items-center gap-4">
          <Avatar name={user?.name ?? ''} src={user?.avatarUrl} size={56} />
          <div>
            <h2 id="perfil" className="text-lg font-semibold text-slate-900 dark:text-slate-50">Perfil</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>
        </div>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault()
            if (valido) guardar({ name: nombre.trim(), timezone: zona })
          }}
        >
          <div className="space-y-1.5">
            <label htmlFor="nombre" className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre completo</label>
            <input
              id="nombre"
              type="text"
              autoComplete="name"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value)
                reset()
              }}
              aria-invalid={!valido}
              aria-describedby={!valido ? 'nombre-error' : undefined}
              className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-slate-700"
            />
            {!valido && <p id="nombre-error" className="text-xs text-red-700 dark:text-red-400">Escribe al menos 2 letras.</p>}
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Correo electrónico</p>
            <p className="rounded-md bg-slate-100 px-3 py-2.5 font-mono text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">{user?.email}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Es tu usuario para entrar; por ahora no se puede cambiar.</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="zona" className="text-sm font-medium text-slate-700 dark:text-slate-300">Zona horaria</label>
            <select
              id="zona"
              value={zona}
              onChange={(e) => {
                setZona(e.target.value)
                reset()
              }}
              className="w-full rounded-md border border-slate-300 bg-card px-3 py-2.5 text-sm dark:border-slate-700"
            >
              {ZONAS.map((z) => (
                <option key={z.value} value={z.value}>{z.label}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 dark:text-slate-400">Las automatizaciones por horario usan esta zona.</p>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={isPending || !valido}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <p role="status" className="text-sm">
              {isSuccess && (
                <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                  <Check className="h-4 w-4 text-primary" /> Guardado
                </span>
              )}
              {error && <span className="text-red-700 dark:text-red-400">{error.message}</span>}
            </p>
          </div>
        </form>
      </section>
    </div>
  )
}
