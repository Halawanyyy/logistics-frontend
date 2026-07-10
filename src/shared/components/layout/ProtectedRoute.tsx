import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../../features/auth/store/auth.store'
import { adminPath, merchantPath } from '../../routing/paths'

export function ProtectedRoute({ children }: PropsWithChildren) {
  const token = useAuthStore((state) => state.token)
  const location = useLocation()

  if (!token) {
    const isMerchant = location.pathname.startsWith('/merchant')
    const loginRedirect = isMerchant ? merchantPath('/login') : adminPath('/login')
    return <Navigate to={loginRedirect} replace state={{ from: location }} />
  }

  return children
}
