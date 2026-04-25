// =============================================================
//  app/(auth)/login/page.tsx — Página de Login
// =============================================================

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Github, Loader2, LogIn } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { useLogin } from '@/hooks/use-auth'
import { loginSchema, type LoginInput } from '@/lib/validations'

// ── Mensaje de error OAuth por searchParam ────────────────────
const OAUTH_ERRORS: Record<string, string> = {
  oauth_denied:     'Cancelaste la autenticación con GitHub.',
  oauth_failed:     'Hubo un problema al conectar con GitHub. Intenta de nuevo.',
  no_email:         'No pudimos obtener tu email de GitHub. Asegúrate de tener un email verificado.',
  account_disabled: 'Tu cuenta ha sido desactivada.',
  server_error:     'Error interno. Por favor intenta más tarde.',
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const searchParams = useSearchParams()
  const oauthError   = searchParams.get('error')

  const { mutate: login, isPending, error: loginError } = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = (data: LoginInput) => login(data)

  const apiError = loginError
    ? (loginError as { error?: string }).error ?? 'Error al iniciar sesión'
    : null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="lg:hidden flex items-center gap-2 mb-6">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-semibold text-slate-900 dark:text-white">TaskFlow Pro</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Bienvenido de vuelta
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Ingresa a tu cuenta para continuar
        </p>
      </div>

      {/* Error OAuth */}
      {oauthError && OAUTH_ERRORS[oauthError] && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800
                        rounded-lg p-4 text-sm text-red-700 dark:text-red-400">
          {OAUTH_ERRORS[oauthError]}
        </div>
      )}

      {/* OAuth GitHub */}
      <a
        href="/api/auth/oauth/github"
        className="flex items-center justify-center gap-3 w-full px-4 py-2.5
                   border border-slate-200 dark:border-slate-700 rounded-lg
                   text-slate-700 dark:text-slate-300 font-medium text-sm
                   hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <Github className="w-5 h-5" />
        Continuar con GitHub
      </a>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-slate-950 px-2 text-slate-400">
            o continúa con email
          </span>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

        {/* Error API */}
        {apiError && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800
                          rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
            {apiError}
          </div>
        )}

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            {...register('email')}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700
                       bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                       placeholder:text-slate-400
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       disabled:opacity-50 transition-colors text-sm"
            disabled={isPending}
          />
          {errors.email && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Contraseña
            </label>
            <Link href="/forgot-password"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              {...register('password')}
              className="w-full px-3 py-2.5 pr-10 rounded-lg border border-slate-200 dark:border-slate-700
                         bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                         placeholder:text-slate-400
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         disabled:opacity-50 transition-colors text-sm"
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2
                         text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              {showPassword
                ? <EyeOff className="w-4 h-4" />
                : <Eye className="w-4 h-4" />
              }
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5
                     bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                     text-white font-medium text-sm rounded-lg
                     transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Iniciando sesión...</>
          ) : (
            <><LogIn className="w-4 h-4" /> Iniciar sesión</>
          )}
        </button>
      </form>

      {/* Link a register */}
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        ¿No tienes cuenta?{' '}
        <Link href="/register"
          className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
          Regístrate gratis
        </Link>
      </p>
    </div>
  )
}
