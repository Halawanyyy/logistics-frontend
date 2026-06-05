import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getMe } from '../features/auth/api/auth.api'
import { useAuthStore } from '../features/auth/store/auth.store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: {
      retry: 0,
    },
  },
})

function SessionBootstrap() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    if (!token || user) {
      return
    }

    void getMe()
      .then((response) => {
        setUser(response.user)
      })
      .catch(() => {
        logout()
      })
  }, [logout, setUser, token, user])

  return null
}

export function AppProvider({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionBootstrap />
      {children}
    </QueryClientProvider>
  )
}

export { queryClient }
