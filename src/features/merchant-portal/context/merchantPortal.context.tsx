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
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: 'var(--bg-subtle, #f9fafb)' }}>
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          pointerEvents: 'none', 
          opacity: 0.04, 
          fontSize: '15vw', 
          fontWeight: 900, 
          textTransform: 'uppercase', 
          transform: 'rotate(-30deg)', 
          color: 'var(--danger-color, #ef4444)',
          whiteSpace: 'nowrap',
          userSelect: 'none'
        }}>
          {t('Suspended', { defaultValue: 'Suspended' })}
        </div>
        
        <div className="error-state-container" style={{ position: 'relative', zIndex: 10, padding: '3rem 2rem', textAlign: 'center', maxWidth: '500px', width: '100%', background: 'var(--card-bg, #ffffff)', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', border: '1px solid var(--border-color, #e5e7eb)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--danger-color-50, #fef2f2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--danger-color, #ef4444)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
          </div>
          <h2 style={{ color: 'var(--text-color, #111827)', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 700 }}>
            {isMerchantInactive 
              ? t('Merchant Account Inactive', { defaultValue: 'Merchant Account Inactive' })
              : t('Membership Suspended', { defaultValue: 'Membership Suspended' })
            }
          </h2>
          <p style={{ marginBottom: '2rem', color: 'var(--text-muted, #6b7280)', lineHeight: 1.6 }}>
            {isMerchantInactive
              ? t('Your merchant portal access is currently disabled because your company account is inactive or suspended. Please contact operations support.', {
                  defaultValue: 'Your merchant portal access is currently disabled because your company account is inactive or suspended. Please contact operations support.'
                })
              : t('Your personal merchant membership is currently inactive or suspended. Please contact your company administrator.', {
                  defaultValue: 'Your personal merchant membership is currently inactive or suspended. Please contact your company administrator.'
                })
            }
          </p>
          <Button variant="secondary" onClick={handleLogout} style={{ width: '100%', padding: '0.75rem' }}>
            {t('Logout', { defaultValue: 'Logout' })}
          </Button>
        </div>
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
