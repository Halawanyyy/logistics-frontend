import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/store/auth.store'
import { hasAllPermissions, hasAnyPermission, hasPermission } from './permissions'
import type { Permission } from './permission-keys'
import { adminPath } from '../routing/paths'

type RequirePermissionProps = {
  children: ReactNode
  permission?: Permission
  anyOf?: Permission[]
  allOf?: Permission[]
}

export function RequirePermission({ children, permission, anyOf, allOf }: RequirePermissionProps) {
  const user = useAuthStore((state) => state.user)
  const allowed = permission
    ? hasPermission(user, permission)
    : anyOf?.length
      ? hasAnyPermission(user, anyOf)
      : allOf?.length
        ? hasAllPermissions(user, allOf)
      : false

  if (!allowed) {
    return <Navigate to={adminPath('/403')} replace />
  }

  return <>{children}</>
}
