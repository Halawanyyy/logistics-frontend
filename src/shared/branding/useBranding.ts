import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { appConfig } from '../../app/config'
import { listPublicSettings } from '../../features/settings/api/settings.api'

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

  return /^(https?:\/\/|\/)/i.test(value) || /\.(png|jpe?g|webp|svg|gif)$/i.test(value)
}

export function getBrandInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (!parts.length) {
    return 'L'
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join('')
}

export function useBranding() {
  const publicSettingsQuery = useQuery({
    queryKey: ['settings', 'public'],
    queryFn: listPublicSettings,
    staleTime: 60_000,
  })

  const settingMap = useMemo(() => {
    const entries = publicSettingsQuery.data?.data ?? []
    return new Map(entries.map((setting) => [setting.key, setting.value]))
  }, [publicSettingsQuery.data])

  const companyName = toSettingText(settingMap.get('company_name')) || appConfig.appName
  const companyLogoValue = toSettingText(settingMap.get('company_logo'))
  const companyLogo = isImageLikeValue(companyLogoValue) ? companyLogoValue : null

  return {
    companyName,
    companyLogo,
    companyPhone: toSettingText(settingMap.get('company_phone')),
    companyEmail: toSettingText(settingMap.get('company_email')),
    companyAddress: toSettingText(settingMap.get('company_address')),
    companyWebsite: toSettingText(settingMap.get('company_website')),
    supportEmail: toSettingText(settingMap.get('support_email')),
    supportPhone: toSettingText(settingMap.get('support_phone')),
    publicSettings: publicSettingsQuery.data?.data ?? [],
    publicSettingsQuery,
  }
}
