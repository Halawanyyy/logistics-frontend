import type { ReactNode } from 'react'
import { useAuthStore } from '../../features/auth/store/auth.store'
import { hasAllPermissions, hasAnyPermission, hasPermission } from './permissions'
import type { Permission } from './permission-keys'

type CanProps = {
  children: ReactNode
  fallback?: ReactNode
  permission?: Permission
  anyOf?: Permission[]
  allOf?: Permission[]
}

export function Can({ children, fallback = null, permission, anyOf, allOf }: CanProps) {
  const user = useAuthStore((state) => state.user)
  const allowed = permission
    ? hasPermission(user, permission)
    : anyOf?.length
      ? hasAnyPermission(user, anyOf)
      : allOf?.length
        ? hasAllPermissions(user, allOf)
      : false

  return allowed ? <>{children}</> : <>{fallback}</>
}
