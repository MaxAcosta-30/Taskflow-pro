// =============================================================
//  stores/auth.store.ts — Zustand Auth Store
// =============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type User = {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  role: string
}

type AuthState = {
  user:           User | null
  accessToken:    string | null
  isAuthenticated: boolean
  isLoading:      boolean

  setUser:        (user: User) => void
  setTokens:      (accessToken: string) => void
  logout:         () => void
  setLoading:     (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:            null,
      accessToken:     null,
      isAuthenticated: false,
      isLoading:       true,

      setUser: (user) =>
        set({ user, isAuthenticated: true, isLoading: false }),

      setTokens: (accessToken) =>
        set({ accessToken }),

      logout: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),

      setLoading: (isLoading) =>
        set({ isLoading }),
    }),
    {
      name: 'taskflow-auth',
      // Solo persistir el usuario, NO el token (está en cookie httpOnly)
      partialize: (state) => ({ user: state.user }),
    },
  ),
)
