import { pickDisplayLabel } from '../../../../shared/i18n/locale'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'

type MerchantOrderStatusBadgeProps = {
  label?: string | null
  value: boolean | null | string | undefined
}

export function MerchantOrderStatusBadge({
  label,
  value,
}: MerchantOrderStatusBadgeProps) {
  return (
    <StatusBadge
      label={label ? pickDisplayLabel(typeof value === 'string' ? value : undefined, label) : undefined}
      value={value}
    />
  )
}
