/* eslint-disable @typescript-eslint/no-unused-vars */
// =============================================================
//  hooks/use-auth.ts — TanStack Query hooks de autenticación
// =============================================================

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

import type { RegisterInput, LoginInput } from '@/lib/validations'
import { useAuthStore } from '@/stores/auth.store'

const API = '/api/auth'

// ── Tipos ─────────────────────────────────────────────────────
type AuthUser = {
  id: string; email: string; name: string
  avatarUrl: string | null; role: string
}

type AuthResponse = {
  success: boolean
  data?: { user: AuthUser; tokens: { accessToken: string } }
  error?: string
  details?: Record<string, string[]>
}

// ── Fetch helper ──────────────────────────────────────────────
async function authFetch<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  const data = await res.json() as T
  if (!res.ok) throw data
  return data
}

// ── Hook: Obtener usuario actual ──────────────────────────────
export function useCurrentUser() {
  const { setUser, setLoading } = useAuthStore()

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await fetch(`${API}/me`)
      if (!res.ok) throw new Error('Not authenticated')
      const data = await res.json() as { data: { user: AuthUser } }
      setUser(data.data.user)
      return data.data.user
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime:    10 * 60 * 1000,
  })
}

// ── Hook: Register ────────────────────────────────────────────
export function useRegister() {
  const router     = useRouter()
  const { setUser } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RegisterInput) =>
      authFetch<AuthResponse>(`${API}/register`, data),

    onSuccess: (res) => {
      if (res.success && res.data) {
        setUser(res.data.user)
        void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
        router.push('/')
      }
    },
  })
}

// ── Hook: Login ───────────────────────────────────────────────
export function useLogin() {
  const router      = useRouter()
  const { setUser } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LoginInput) =>
      authFetch<AuthResponse>(`${API}/login`, data),

    onSuccess: (res) => {
      if (res.success && res.data) {
        setUser(res.data.user)
        void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
        router.push('/')
      }
    },
  })
}

// ── Hook: Logout ──────────────────────────────────────────────
export function useLogout() {
  const router      = useRouter()
  const { logout }  = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      fetch(`${API}/logout`, { method: 'POST' }).then((r) => r.json()),

    onSettled: () => {
      logout()
      queryClient.clear()
      router.push('/login')
    },
  })
}
