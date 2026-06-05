import type { ReactNode } from 'react'
import { Can } from './Can'
import type { Permission } from './permission-keys'

type PermissionGateProps = {
  children: ReactNode
  fallback?: ReactNode
  permission?: Permission
  anyOf?: Permission[]
  allOf?: Permission[]
}

export function PermissionGate(props: PermissionGateProps) {
  return <Can {...props} />
}
