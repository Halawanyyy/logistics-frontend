import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPublicTracking } from '../api/public-tracking.api'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Input } from '../../../shared/components/ui/Input'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { EmptyState } from '../../../shared/components/feedback/EmptyState'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { formatDate } from '../../../shared/utils/formatters'

export function PublicTrackingPage() {
  const [shipmentNumber, setShipmentNumber] = useState('')
  const [submittedShipmentNumber, setSubmittedShipmentNumber] = useState('')
  const query = useQuery({
    queryKey: ['public-tracking', submittedShipmentNumber],
    queryFn: () => getPublicTracking(submittedShipmentNumber),
    enabled: Boolean(submittedShipmentNumber),
  })

  return (
    <section className="page-section">
      <PageHeader title="Track Shipment" description="Public shipment tracking by shipment number." />
      <Card>
        <CardContent>
          <form
            className="filters-bar"
            onSubmit={(event) => {
              event.preventDefault()
              setSubmittedShipmentNumber(shipmentNumber.trim())
            }}
          >
            <Input
              value={shipmentNumber}
              onChange={(event) => setShipmentNumber(event.target.value)}
              placeholder="SHP-20260424-000001"
            />
            <Button type="submit" loading={query.isFetching}>
              Track
            </Button>
          </form>
        </CardContent>
      </Card>
      {!submittedShipmentNumber ? (
        <EmptyState title="Enter a shipment number" description="Tracking data will appear after lookup." />
      ) : null}
      {query.isError ? (
        <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
      ) : null}
      {query.data ? (
        <Card>
          <CardHeader>
            <CardTitle>{query.data.data.shipment_number}</CardTitle>
            <StatusBadge value={query.data.data.status} />
          </CardHeader>
          <CardContent className="detail-list">
            <div>
              <dt>Customer</dt>
              <dd>{query.data.data.customer_name}</dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd>
                {query.data.data.delivery_governorate_name} /{' '}
                {query.data.data.delivery_area_name ?? '-'} - {query.data.data.delivery_address}
              </dd>
            </div>
            <div>
              <dt>History</dt>
              <dd className="activity-list">
                {query.data.data.histories.map((history, index) => (
                  <div className="activity-row" key={`${history.status}-${index}`}>
                    <div>
                      <p className="activity-row__title">{history.status}</p>
                      <p className="activity-row__meta">{history.notes ?? '-'}</p>
                    </div>
                    <span>{formatDate(history.created_at)}</span>
                  </div>
                ))}
              </dd>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </section>
  )
}
