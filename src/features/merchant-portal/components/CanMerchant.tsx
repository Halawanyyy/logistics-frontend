import type { ReactNode } from 'react'
import { useMerchantPortalContext } from '../context/merchantPortal.context'

type CanMerchantProps = {
  children: ReactNode
  fallback?: ReactNode
  capability?: string
  anyOf?: string[]
  allOf?: string[]
}

export function CanMerchant({ children, fallback = null, capability, anyOf, allOf }: CanMerchantProps) {
  const { hasMerchantCapability, hasAnyMerchantCapability, hasAllMerchantCapabilities } = useMerchantPortalContext()

  const allowed = capability
    ? hasMerchantCapability(capability)
    : anyOf?.length
      ? hasAnyMerchantCapability(anyOf)
      : allOf?.length
        ? hasAllMerchantCapabilities(allOf)
        : false

  return allowed ? <>{children}</> : <>{fallback}</>
}
