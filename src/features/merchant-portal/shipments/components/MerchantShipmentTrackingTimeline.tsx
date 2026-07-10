import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getMerchantPortalShipmentTracking } from '../api/merchantPortalShipments.api'
import type { MerchantPortalShipmentTrackingEvent } from '../types/merchantPortalShipments.types'
import { formatDate } from '../../../../shared/utils/formatters'
import { pickDisplayLabel } from '../../../../shared/i18n/locale'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { Table, TableCell, TableContainer, TableHead } from '../../../../shared/components/ui/Table'

type MerchantShipmentTrackingTimelineProps = {
  shipmentId: number | string
  initialEvents?: MerchantPortalShipmentTrackingEvent[]
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

  return (
    <TableContainer>
      <Table variant="compact">
        <thead>
          <tr>
            <TableHead>{t('Date', { defaultValue: 'Date' })}</TableHead>
            <TableHead>{t('Status', { defaultValue: 'Status' })}</TableHead>
            <TableHead>{t('Notes', { defaultValue: 'Notes' })}</TableHead>
          </tr>
        </thead>
        <tbody>
          {events.map((track) => (
            <tr key={track.id}>
              <TableCell style={{ whiteSpace: 'nowrap' }}>{formatDate(track.created_at)}</TableCell>
              <TableCell style={{ fontWeight: 500 }}>
                {track.status_label ? pickDisplayLabel(track.status, track.status_label) : track.status}
              </TableCell>
              <TableCell>{track.notes || '-'}</TableCell>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableContainer>
  )
}
