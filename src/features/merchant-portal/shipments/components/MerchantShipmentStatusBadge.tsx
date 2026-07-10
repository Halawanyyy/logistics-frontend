import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'
import { pickDisplayLabel } from '../../../../shared/i18n/locale'
import type { ShipmentStatus } from '../../../shipments/types/shipment.types'

type MerchantShipmentStatusBadgeProps = {
  status: ShipmentStatus
  statusLabel?: string | null
  className?: string
}

export function MerchantShipmentStatusBadge({ status, statusLabel, className }: MerchantShipmentStatusBadgeProps) {
  const displayLabel = statusLabel ? pickDisplayLabel(status, statusLabel) : status
  
  return <StatusBadge value={status as any} label={displayLabel} className={className} />
}
