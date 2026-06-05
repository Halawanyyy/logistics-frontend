import { createContext } from 'react'
import type { AppLocale } from './locale'

export type LocaleContextValue = {
  locale: AppLocale
  setLocale: (locale: AppLocale) => void
  toggleLocale: () => void
}

export const LocaleContext = createContext<LocaleContextValue | null>(null)
