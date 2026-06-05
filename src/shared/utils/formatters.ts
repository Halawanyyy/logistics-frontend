import { getDateLocale, getLocalePreference, getNumberLocale } from '../i18n/locale'

export function formatDate(value: string | null) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat(getDateLocale(getLocalePreference()), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatMoney(value: string | null) {
  if (!value) {
    return '-'
  }

  const numericValue = Number(value)

  return new Intl.NumberFormat(getNumberLocale(getLocalePreference()), {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2,
  }).format(Number.isNaN(numericValue) ? 0 : numericValue)
}
