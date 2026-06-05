import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../../features/auth/store/auth.store'
import { getDefaultRouteForUser } from '../../auth/permissions'

export function PublicRoute({ children }: PropsWithChildren) {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  if (token) {
    return <Navigate to={getDefaultRouteForUser(user)} replace />
  }

  return children
}
