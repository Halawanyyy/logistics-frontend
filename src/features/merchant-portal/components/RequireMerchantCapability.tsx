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
