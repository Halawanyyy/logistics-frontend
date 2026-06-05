import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AuthUser } from '../types/auth.types'

type AuthState = {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  setSession: (token: string, user: AuthUser) => void
  setUser: (user: AuthUser | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setSession: (token, user) =>
        set({
          token,
          user,
          isAuthenticated: true,
        }),
      setUser: (user) =>
        set((state) => ({
          user,
          isAuthenticated: Boolean(state.token && user),
        })),
      logout: () =>
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-session',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
