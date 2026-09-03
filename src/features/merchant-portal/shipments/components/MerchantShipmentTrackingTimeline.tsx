import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getMerchantPortalShipmentTracking } from '../api/merchantPortalShipments.api'
import type { MerchantPortalShipmentTrackingEvent } from '../types/merchantPortalShipments.types'
import { formatDate } from '../../../../shared/utils/formatters'
import { pickDisplayLabel } from '../../../../shared/i18n/locale'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { Timeline } from '../../../../shared/components/ui/Timeline'

type MerchantShipmentTrackingTimelineProps = {
  shipmentId: number | string
  initialEvents?: MerchantPortalShipmentTrackingEvent[]
}

function mapTimelineStatus(status?: string): 'completed' | 'failed' | 'pending' | 'current' | undefined {
  if (!status) return undefined
  if (status.includes('delivered') || status.includes('completed')) return 'completed'
  if (status.includes('failed') || status.includes('cancelled') || status.includes('returned')) return 'failed'
  if (status.includes('transit') || status.includes('out_for_delivery')) return 'current'
  return 'pending'
}

export function MerchantShipmentTrackingTimeline({ shipmentId, initialEvents }: MerchantShipmentTrackingTimelineProps) {
  const { t } = useTranslation()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['merchant-portal-shipment-tracking', shipmentId],
    queryFn: () => getMerchantPortalShipmentTracking(shipmentId),
    initialData: initialEvents ? { data: initialEvents } : undefined,
    enabled: !!shipmentId && !initialEvents,
  })

  if (isLoading) {
    return <LoadingState title={t('Loading Tracking Timeline', { defaultValue: 'Loading Tracking Timeline' })} />
  }

  if (isError) {
    return <ErrorState message={error.message} onRetry={() => void refetch()} />
  }

  const events = data?.data ?? []

  if (!events.length) {
    return (
      <div className="text-muted" style={{ padding: '1rem 0' }}>
        {t('No tracking history available.', { defaultValue: 'No tracking history available.' })}
      </div>
    )
  }

  const timelineItems = events.map((track) => ({
    id: track.id,
    title: track.status_label ? pickDisplayLabel(track.status, track.status_label) : track.status,
    timestamp: formatDate(track.created_at),
    description: track.notes || undefined,
    status: mapTimelineStatus(track.status),
  }))

  return <Timeline items={timelineItems} />
}
