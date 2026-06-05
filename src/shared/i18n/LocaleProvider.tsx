import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { LocaleContext } from './LocaleContext'
import { i18n } from './i18n'
import { getLocalePreference, LOCALE_STORAGE_KEY, type AppLocale } from './locale'

export function LocaleProvider({ children }: PropsWithChildren) {
  const [locale, setLocale] = useState<AppLocale>(getLocalePreference)

  useEffect(() => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    document.documentElement.lang = locale
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
    void i18n.changeLanguage(locale)
  }, [locale])

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      toggleLocale: () => setLocale((current) => (current === 'en' ? 'ar' : 'en')),
    }),
    [locale],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}
