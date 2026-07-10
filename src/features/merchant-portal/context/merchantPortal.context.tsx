import { createContext, useContext, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMerchantPortalMe } from '../api/merchantPortal.api'
import { useAuthStore } from '../../auth/store/auth.store'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { logout as logoutRequest } from '../../auth/api/auth.api'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { merchantPath } from '../../../shared/routing/paths'

export type MerchantPortalContextType = {
  user: { id: number; name: string; email: string } | null
  merchant: { id: number; name: string; company_name: string; status?: string } | null
  portalRole: string | null
  portalStatus: string | null
  capabilities: string[]
  hasMerchantCapability: (capability: string) => boolean
  hasAnyMerchantCapability: (capabilities: string[]) => boolean
  hasAllMerchantCapabilities: (capabilities: string[]) => boolean
}

const MerchantPortalContext = createContext<MerchantPortalContextType | undefined>(undefined)

export function MerchantPortalProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const clearSession = useAuthStore((state) => state.logout)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['merchant-portal-me'],
    queryFn: getMerchantPortalMe,
    enabled: Boolean(token),
    retry: false,
  })

  async function handleLogout() {
    try {
      await logoutRequest()
    } catch {
      // Clear locally anyway
    } finally {
      clearSession()
      navigate(merchantPath('/login'), { replace: true })
    }
  }

  if (isLoading) {
    return <LoadingState />
  }

  // If error occurred (like 401/403/404), the Axios response interceptor will redirect.
  // We can render a fallback error state in the meantime.
  if (isError || !data?.data) {
    return (
      <div className="error-state-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>{t('Failed to load merchant session', { defaultValue: 'Failed to load merchant session' })}</h2>
        <p>{(error as any)?.response?.data?.message || t('You might not have a valid merchant portal user membership.', { defaultValue: 'You might not have a valid merchant portal user membership.' })}</p>
        <div style={{ marginTop: '1.5rem' }}>
          <Button variant="secondary" onClick={handleLogout}>
            {t('Logout', { defaultValue: 'Logout' })}
          </Button>
        </div>
      </div>
    )
  }

  const { user, merchant, portal_role, portal_status, capabilities = [] } = data.data

  const isMerchantInactive = merchant?.status === 'inactive' || merchant?.status === 'suspended'
  const isPortalUserInactive = portal_status !== 'active'

  if (isMerchantInactive || isPortalUserInactive) {
    return (
      <div className="error-state-container" style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '100px auto' }}>
        <h2 style={{ color: 'var(--danger-color, #ef4444)', marginBottom: '1rem' }}>
          {isMerchantInactive 
            ? t('Merchant Account Inactive', { defaultValue: 'Merchant Account Inactive' })
            : t('Membership Suspended', { defaultValue: 'Membership Suspended' })
          }
        </h2>
        <p style={{ marginBottom: '2rem', color: 'var(--text-muted, #6b7280)' }}>
          {isMerchantInactive
            ? t('Your merchant portal access is currently disabled because your company account is inactive or suspended. Please contact operations support.', {
                defaultValue: 'Your merchant portal access is currently disabled because your company account is inactive or suspended. Please contact operations support.'
              })
            : t('Your personal merchant membership is currently inactive or suspended. Please contact your company administrator.', {
                defaultValue: 'Your personal merchant membership is currently inactive or suspended. Please contact your company administrator.'
              })
          }
        </p>
        <Button variant="secondary" onClick={handleLogout}>
          {t('Logout', { defaultValue: 'Logout' })}
        </Button>
      </div>
    )
  }

  const hasMerchantCapability = (capability: string) => {
    return capabilities.includes(capability)
  }

  const hasAnyMerchantCapability = (checkCapabilities: string[]) => {
    return checkCapabilities.some((cap) => capabilities.includes(cap))
  }

  const hasAllMerchantCapabilities = (checkCapabilities: string[]) => {
    return checkCapabilities.every((cap) => capabilities.includes(cap))
  }

  return (
    <MerchantPortalContext.Provider
      value={{
        user,
        merchant,
        portalRole: portal_role,
        portalStatus: portal_status,
        capabilities,
        hasMerchantCapability,
        hasAnyMerchantCapability,
        hasAllMerchantCapabilities,
      }}
    >
      {children}
    </MerchantPortalContext.Provider>
  )
}

export function useMerchantPortalContext() {
  const context = useContext(MerchantPortalContext)
  if (context === undefined) {
    throw new Error('useMerchantPortalContext must be used within a MerchantPortalProvider')
  }
  return context
}

export function useMerchantCapabilities() {
  const { capabilities, hasMerchantCapability, hasAnyMerchantCapability, hasAllMerchantCapabilities } = useMerchantPortalContext()
  return {
    capabilities,
    hasMerchantCapability,
    hasAnyMerchantCapability,
    hasAllMerchantCapabilities,
  }
}
