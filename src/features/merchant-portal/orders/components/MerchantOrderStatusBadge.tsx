import { pickDisplayLabel } from '../../../../shared/i18n/locale'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'
import { useTranslation } from 'react-i18next'

type MerchantOrderStatusBadgeProps = {
  className?: string
  label?: string | null
  value: boolean | null | string | undefined
}

export function MerchantOrderStatusBadge({
  className,
  label,
  value,
}: MerchantOrderStatusBadgeProps) {
  const { t, i18n } = useTranslation()
  const rawValue = typeof value === 'string' ? value : undefined
  const resolvedLabel = i18n.resolvedLanguage === 'ar' && rawValue
    ? t(rawValue, { defaultValue: label || rawValue })
    : label
      ? pickDisplayLabel(rawValue, label)
      : undefined

  return (
    <StatusBadge
      className={className}
      label={resolvedLabel}
      value={value}
    />
  )
}
