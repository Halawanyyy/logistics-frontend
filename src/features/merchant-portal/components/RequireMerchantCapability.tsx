import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useMerchantPortalContext } from '../context/merchantPortal.context'
import { merchantPath } from '../../../shared/routing/paths'

type RequireMerchantCapabilityProps = {
  children: ReactNode
  capability?: string
  anyOf?: string[]
  allOf?: string[]
}

export function RequireMerchantRole({ children, role, roles }: { children: ReactNode, role?: string, roles?: string[] }) {
  const { portalRole } = useMerchantPortalContext()
  
  const currentRole = portalRole?.toLowerCase() || ''
  const allowed = role 
    ? currentRole === role.toLowerCase() 
    : roles?.length 
      ? roles.map(r => r.toLowerCase()).includes(currentRole) 
      : false

  if (!allowed) {
    console.error('RequireMerchantRole blocked access. currentRole:', currentRole, 'expected role:', role, 'or roles:', roles)
    return <Navigate to={merchantPath('/403')} replace />
  }

  return <>{children}</>
}

export function RequireMerchantCapability({ children, capability, anyOf, allOf }: RequireMerchantCapabilityProps) {
  const { hasMerchantCapability, hasAnyMerchantCapability, hasAllMerchantCapabilities } = useMerchantPortalContext()

  const allowed = capability
    ? hasMerchantCapability(capability)
    : anyOf?.length
      ? hasAnyMerchantCapability(anyOf)
      : allOf?.length
        ? hasAllMerchantCapabilities(allOf)
        : false

  if (!allowed) {
    return <Navigate to={merchantPath('/403')} replace />
  }

  return <>{children}</>
}
