import { getLocalePreference, getNumberLocale } from '../../i18n/locale'

type MoneyDisplayProps = {
  value: string | number | null | undefined
  currency?: string
  locale?: string
  fallback?: string
}

export function MoneyDisplay({
  value,
  currency = 'EGP',
  locale,
  fallback = '-',
}: MoneyDisplayProps) {
  if (value == null || value === '') {
    return <>{fallback}</>
  }

  const numericValue = typeof value === 'number' ? value : Number(value)
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0

  return (
    <>
      {new Intl.NumberFormat(locale ?? getNumberLocale(getLocalePreference()), {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
      }).format(safeValue)}
    </>
  )
}
