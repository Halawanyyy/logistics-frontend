import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../../features/auth/store/auth.store'
import { adminPath } from '../../routing/paths'

export function ProtectedRoute({ children }: PropsWithChildren) {
  const token = useAuthStore((state) => state.token)
  const location = useLocation()

  if (!token) {
    return <Navigate to={adminPath('/login')} replace state={{ from: location }} />
  }

  return children
}
