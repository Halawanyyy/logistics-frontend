import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  lookupBarcode,
  lookupProductBarcode,
  scanShipmentStatusBarcode,
} from '../api/barcodes.api'
import type { BarcodeLookupResult } from '../types/barcodes.types'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { BarcodeScannerInput } from '../../../shared/components/barcode/BarcodeScannerInput'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Input } from '../../../shared/components/ui/Input'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { Select } from '../../../shared/components/ui/Select'
import { adminPath } from '../../../shared/routing/paths'

const shipmentStatuses = [
  'pending_pickup',
  'driver_assigned',
  'picked_up',
  'arrived_at_hub',
  'sorting',
  'ready_for_dispatch',
  'in_transit',
  'out_for_delivery',
  'delivery_attempted',
  'rescheduled',
  'delivered',
  'partially_delivered',
  'failed',
  'returned',
  'returned_to_hub',
  'returned_to_warehouse',
  'cancelled',
]

function entityLink(result: BarcodeLookupResult) {
  if (result.type === 'order') {
    return adminPath(`/orders/${result.id}`)
  }
  if (result.type === 'shipment') {
    return adminPath(`/shipments/${result.id}`)
  }
  if (result.type === 'warehouse_product') {
    return adminPath(`/warehouse-products/${result.id}`)
  }
  return null
}

function DataCard({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="insight-tile">
      <span className="eyebrow">{title}</span>
      <strong>{value == null || value === '' ? '-' : String(value)}</strong>
    </div>
  )
}

export function BarcodeOperationsPage() {
  const { t } = useTranslation()
  const [lookupValue, setLookupValue] = useState('')
  const [shipmentBarcode, setShipmentBarcode] = useState('')
  const [shipmentStatus, setShipmentStatus] = useState('picked_up')
  const [shipmentNotes, setShipmentNotes] = useState('')
  const [productBarcode, setProductBarcode] = useState('')
  const lookupMutation = useMutation({
    mutationFn: (barcode: string) => lookupBarcode({ barcode }),
  })
  const shipmentStatusMutation = useMutation({
    mutationFn: () => scanShipmentStatusBarcode({
      barcode: shipmentBarcode,
      status: shipmentStatus,
      notes: shipmentNotes || undefined,
    }),
  })
  const productLookupMutation = useMutation({
    mutationFn: (barcode: string) => lookupProductBarcode({ barcode }),
  })
  const lookupResult = lookupMutation.data?.data
  const shipmentStatusResult = shipmentStatusMutation.data?.data ?? null
  const productResult = productLookupMutation.data?.data ?? null

  return (
    <section className="page-section">
      <PageHeader
        title={t('Barcode Operations')}
        description={t('Lookup barcodes, scan shipment status changes, and inspect warehouse product barcodes.')}
      />

      <div className="page-stack">
        <Card>
          <CardHeader>
            <CardTitle>{t('Barcode Lookup')}</CardTitle>
            <CardDescription>{t('Scan or enter any supported barcode and jump to the related record.')}</CardDescription>
          </CardHeader>
          <CardContent className="page-stack">
            <BarcodeScannerInput
              autoFocus
              value={lookupValue}
              onChange={setLookupValue}
              onScan={(value) => lookupMutation.mutate(value)}
            />
            {lookupMutation.isPending ? <LoadingState title={t('Looking up barcode')} /> : null}
            {lookupMutation.isError ? (
              <ErrorState
                title={t('Barcode lookup failed')}
                message={getApiErrorMessage(lookupMutation.error)}
                onRetry={() => lookupMutation.variables ? lookupMutation.mutate(lookupMutation.variables) : undefined}
              />
            ) : null}
            {lookupResult ? (
              <Card variant="flat">
                <CardContent className="page-stack">
                  <div className="stats-grid">
                    <DataCard title={t('Type')} value={lookupResult.type} />
                    <DataCard title={t('ID')} value={lookupResult.id} />
                    <DataCard title={t('Barcode')} value={lookupResult.barcode} />
                    <DataCard title={t('Status')} value={lookupResult.data.status} />
                  </div>
                  {entityLink(lookupResult) ? (
                    <Link className="table-link" to={entityLink(lookupResult)!}>
                      {t('Open related record')}
                    </Link>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('Shipment Status Scan')}</CardTitle>
            <CardDescription>{t('Scan a shipment barcode and apply one documented shipment status update.')}</CardDescription>
          </CardHeader>
          <CardContent className="form-grid">
            <label className="field">
              <span>{t('Shipment Barcode')}</span>
              <BarcodeScannerInput
                value={shipmentBarcode}
                onChange={setShipmentBarcode}
                onScan={() => shipmentStatusMutation.mutate()}
              />
            </label>
            <label className="field">
              <span>{t('Status')}</span>
              <Select value={shipmentStatus} onChange={(event) => setShipmentStatus(event.target.value)}>
                {shipmentStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </Select>
            </label>
            <label className="field">
              <span>{t('Notes')}</span>
              <Input value={shipmentNotes} onChange={(event) => setShipmentNotes(event.target.value)} />
            </label>
            <div className="form-actions">
              <Button
                type="button"
                loading={shipmentStatusMutation.isPending}
                disabled={!shipmentBarcode}
                onClick={() => shipmentStatusMutation.mutate()}
              >
                {t('Scan Shipment Status')}
              </Button>
            </div>
            {shipmentStatusMutation.isError ? (
              <FieldError error={getApiErrorMessage(shipmentStatusMutation.error)} />
            ) : null}
            {shipmentStatusResult ? (
              <Card variant="flat">
                <CardContent className="stats-grid">
                  {Object.entries(shipmentStatusResult).slice(0, 6).map(([key, value]) => (
                    <DataCard key={key} title={key.replace(/_/g, ' ')} value={value} />
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('Product Barcode Lookup')}</CardTitle>
            <CardDescription>{t('Scan a warehouse product barcode to inspect product and stock location data.')}</CardDescription>
          </CardHeader>
          <CardContent className="page-stack">
            <BarcodeScannerInput
              value={productBarcode}
              onChange={setProductBarcode}
              onScan={(value) => productLookupMutation.mutate(value)}
            />
            {productLookupMutation.isPending ? <LoadingState title={t('Looking up product barcode')} /> : null}
            {productLookupMutation.isError ? (
              <ErrorState
                title={t('Product barcode lookup failed')}
                message={getApiErrorMessage(productLookupMutation.error)}
                onRetry={() => productLookupMutation.variables ? productLookupMutation.mutate(productLookupMutation.variables) : undefined}
              />
            ) : null}
            {productResult ? (
              <Card variant="flat">
                <CardContent className="page-stack">
                  <div className="stats-grid">
                    {Object.entries(productResult).slice(0, 8).map(([key, value]) => (
                      <DataCard key={key} title={key.replace(/_/g, ' ')} value={typeof value === 'object' ? JSON.stringify(value) : value} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
