export type AppLocale = 'en' | 'ar'

export const LOCALE_STORAGE_KEY = 'logistics-locale'

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === 'en' || value === 'ar'
}

export function getLocalePreference(): AppLocale {
  if (typeof window === 'undefined') {
    return 'en'
  }

  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
  if (isAppLocale(stored)) {
    return stored
  }

  const browserLocale = window.navigator.language.toLowerCase()
  return browserLocale.startsWith('ar') ? 'ar' : 'en'
}

export function getNumberLocale(locale: AppLocale) {
  return locale === 'ar' ? 'ar-EG' : 'en-EG'
}

export function getDateLocale(locale: AppLocale) {
  return locale === 'ar' ? 'ar-EG' : 'en-GB'
}

export function pickDisplayLabel(
  fallback: string | null | undefined,
  localizedLabel?: string | null,
) {
  return localizedLabel?.trim() || fallback || '-'
}
