import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { appConfig } from '../../app/config'
import { getPublicBranding, listPublicSettings } from '../../features/settings/api/settings.api'

export {
  applyBrandColors,
  generatePalette,
  useBrand,
} from './BrandProvider'
export type { BrandConfig, BrandPalette, BrandShade } from './BrandProvider'

type PublicSettingValue = string | number | boolean | string[] | null | undefined

function toSettingText(value: PublicSettingValue) {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  if (Array.isArray(value)) {
    return value.join(', ')
  }

  return value == null ? '' : String(value).trim()
}

export function isImageLikeValue(value: string | null | undefined) {
  if (!value) {
    return false
  }

  return /^(https?:\/\/|\/|data:image\/)/i.test(value) || /\.(png|jpe?g|webp|svg|gif)$/i.test(value)
}

export function getBrandInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (!parts.length) {
    return 'FL'
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join('')
}

export function resolveBrandLogoUrl(value: string | null | undefined): string | null {
  if (!value || !isImageLikeValue(value)) {
    return null
  }

  if (value.startsWith('data:') || value.startsWith('blob:')) {
    return value
  }

  try {
    const apiOrigin = new URL(appConfig.apiBaseUrl).origin

    // Normalize relative storage path (e.g. /storage/... or storage/...)
    if (value.startsWith('/storage/') || value.startsWith('storage/')) {
      const cleanPath = value.startsWith('/') ? value : `/${value}`
      return `${apiOrigin}${cleanPath}`
    }

    // If backend returned http://localhost/storage/... but the app is communicating with http://127.0.0.1:8000
    if (/^https?:\/\//i.test(value)) {
      const parsed = new URL(value)
      if (parsed.pathname.startsWith('/storage/')) {
        if (parsed.origin !== apiOrigin && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')) {
          return `${apiOrigin}${parsed.pathname}${parsed.search}`
        }
      }
    }

    return value
  } catch {
    return value
  }
}

export function useBranding() {
  const tenantKey = appConfig.defaultTenantId || 'default'

  const publicBrandingQuery = useQuery({
    queryKey: ['public-branding', tenantKey],
    queryFn: getPublicBranding,
    staleTime: 60_000,
  })

  const publicSettingsQuery = useQuery({
    queryKey: ['settings', 'public'],
    queryFn: listPublicSettings,
    staleTime: 60_000,
  })

  const settingMap = useMemo(() => {
    const entries = publicSettingsQuery.data?.data ?? []
    return new Map(entries.map((setting) => [setting.key, setting.value]))
  }, [publicSettingsQuery.data])

  const brandingData = publicBrandingQuery.data?.data
  const rawLogoUrl = brandingData?.logo_url || toSettingText(settingMap.get('company_logo'))
  const logoUrl = resolveBrandLogoUrl(rawLogoUrl)

  const companyName = brandingData?.company_name || toSettingText(settingMap.get('company_name')) || appConfig.appName
  const appName = brandingData?.app_name || appConfig.appName

  return {
    appName,
    companyName,
    companyLogo: logoUrl,
    logoUrl,
    tenantId: brandingData?.tenant_id,
    companyPhone: toSettingText(settingMap.get('company_phone')),
    companyEmail: toSettingText(settingMap.get('company_email')),
    companyAddress: toSettingText(settingMap.get('company_address')),
    companyWebsite: toSettingText(settingMap.get('company_website')),
    supportEmail: toSettingText(settingMap.get('support_email')),
    supportPhone: toSettingText(settingMap.get('support_phone')),
    publicSettings: publicSettingsQuery.data?.data ?? [],
    publicSettingsQuery,
    publicBrandingQuery,
    isLoading: publicBrandingQuery.isLoading && publicSettingsQuery.isLoading,
    refetch: () => {
      void publicBrandingQuery.refetch()
      void publicSettingsQuery.refetch()
    },
  }
}
