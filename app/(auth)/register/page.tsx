// =============================================================
//  app/(auth)/register/page.tsx — Página de Registro
// =============================================================

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Github, Loader2, UserPlus, Check } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { useRegister } from '@/hooks/use-auth'
import { registerSchema, type RegisterInput } from '@/lib/validations'

// Validación visual de requisitos de contraseña
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs transition-colors
      ${met ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
      <Check className={`w-3 h-3 ${met ? 'opacity-100' : 'opacity-30'}`} />
      {text}
    </div>
  )
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)

  const { mutate: register_, isPending, error: registerError } = useRegister()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  const password = watch('password', '')
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber    = /[0-9]/.test(password)

  const onSubmit = (data: RegisterInput) => register_(data)

  const apiError = registerError
    ? (registerError as { error?: string }).error ?? 'Error al crear la cuenta'
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
          Crea tu cuenta gratis
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Empieza a automatizar tu equipo hoy mismo
        </p>
      </div>

      {/* OAuth GitHub */}
      <a
        href="/api/auth/oauth/github"
        className="flex items-center justify-center gap-3 w-full px-4 py-2.5
                   border border-slate-200 dark:border-slate-700 rounded-lg
                   text-slate-700 dark:text-slate-300 font-medium text-sm
                   hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <Github className="w-5 h-5" />
        Registrarse con GitHub
      </a>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-slate-950 px-2 text-slate-400">
            o regístrate con email
          </span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

        {apiError && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800
                          rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
            {apiError}
          </div>
        )}

        {/* Nombre */}
        <div className="space-y-1.5">
          <label htmlFor="name"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Nombre completo
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Juan García"
            {...register('name')}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700
                       bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                       placeholder:text-slate-400
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       disabled:opacity-50 transition-colors text-sm"
            disabled={isPending}
          />
          {errors.name && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.name.message}</p>
          )}
        </div>

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
          <label htmlFor="password"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
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
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Requisitos de contraseña */}
          {password.length > 0 && (
            <div className="flex gap-4 pt-1">
              <PasswordRequirement met={hasMinLength} text="8+ caracteres" />
              <PasswordRequirement met={hasUppercase} text="Una mayúscula" />
              <PasswordRequirement met={hasNumber}    text="Un número" />
            </div>
          )}
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
            <><Loader2 className="w-4 h-4 animate-spin" /> Creando cuenta...</>
          ) : (
            <><UserPlus className="w-4 h-4" /> Crear cuenta</>
          )}
        </button>

        <p className="text-xs text-slate-400 text-center">
          Al registrarte aceptas nuestros{' '}
          <Link href="/terms" className="underline hover:text-slate-600 dark:hover:text-slate-300">
            Términos de Servicio
          </Link>
          {' '}y{' '}
          <Link href="/privacy" className="underline hover:text-slate-600 dark:hover:text-slate-300">
            Política de Privacidad
          </Link>
        </p>
      </form>

      {/* Link a login */}
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login"
          className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
