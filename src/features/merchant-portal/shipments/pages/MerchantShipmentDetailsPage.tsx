import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { merchantPath } from '../../../../shared/routing/paths'
import { getMerchantPortalShipment, getMerchantPortalShipmentLabel } from '../api/merchantPortalShipments.api'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/Card'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { MerchantShipmentStatusBadge } from '../components/MerchantShipmentStatusBadge'
import { MerchantShipmentTrackingTimeline } from '../components/MerchantShipmentTrackingTimeline'
import { MoneyDisplay } from '../../../../shared/components/display/MoneyDisplay'
import { formatDate } from '../../../../shared/utils/formatters'
import { LabelDocumentDialog } from '../../../../shared/components/labels/LabelDocumentDialog'
import { CanMerchant } from '../../components/CanMerchant'
import { getApiErrorMessage } from '../../../../shared/api/api-error'

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function getOrderId(shipment: any) {
  return shipment.order_summary?.id ?? shipment.order_id ?? null
}

function getOrderNumber(shipment: any) {
  return shipment.order_summary?.order_number ?? shipment.order_number ?? '-'
}

function getCustomerName(shipment: any) {
  return shipment.customer?.name ?? shipment.customer_name ?? '-'
}

function getCustomerPhone(shipment: any) {
  return shipment.customer?.phone ?? shipment.customer_phone ?? '-'
}

function getDeliveryLocation(shipment: any) {
  const gov = shipment.delivery?.governorate_name ?? shipment.delivery_location_summary?.governorate_name ?? shipment.delivery_governorate_name ?? '-'
  const area = shipment.delivery?.area_name ?? shipment.delivery_location_summary?.area_name ?? shipment.delivery_area_name ?? '-'
  return `${gov}, ${area}`
}

function getDeliveryAddress(shipment: any) {
  return shipment.delivery?.address ?? shipment.delivery_location_summary?.address ?? shipment.delivery_address ?? '-'
}

function getPaymentType(shipment: any) {
  return shipment.payment_summary?.payment_type_label ?? shipment.payment_type_label ?? shipment.payment_summary?.payment_type ?? shipment.payment_type ?? '-'
}

function getCodAmount(shipment: any) {
  return shipment.payment_summary?.cod_amount ?? shipment.cod_amount ?? null
}

function getShippingFee(shipment: any) {
  return shipment.payment_summary?.shipping_fee ?? shipment.shipping_fee ?? null
}

function getDriverName(shipment: any) {
  return shipment.driver_summary?.name ?? shipment.assigned_driver_summary?.name ?? shipment.assigned_driver_name ?? null
}

function getTrackingEvents(shipment: any) {
  const events = shipment.tracking_events ?? shipment.histories
  return Array.isArray(events) && events.length > 0 ? events : undefined
}

export function MerchantShipmentDetailsPage() {
  const { t } = useTranslation()
  const { shipmentId } = useParams<{ shipmentId: string }>()

  const query = useQuery({
    queryKey: ['merchant-portal-shipment', shipmentId],
    queryFn: () => getMerchantPortalShipment(shipmentId!),
    enabled: !!shipmentId,
  })

  if (query.isLoading) {
    return <LoadingState title={t('Loading Shipment Details', { defaultValue: 'Loading Shipment Details' })} />
  }

  if (query.isError) {
    return <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
  }

  const shipment = query.data?.data

  if (!shipment) return null

  return (
    <section className="page-section">
      <PageHeader
        eyebrow={t('Merchant Portal', { defaultValue: 'Merchant Portal' })}
        title={t('Shipment Details', { defaultValue: 'Shipment Details' }) + ` #${shipment.shipment_number}`}
        actions={
          <CanMerchant capability="labels.print">
            <LabelDocumentDialog
              fetchDocument={(opts) => getMerchantPortalShipmentLabel(shipment.id, opts)}
              title={t('Print Waybill', { defaultValue: 'Print Waybill' })}
              triggerLabel={t('Print Waybill', { defaultValue: 'Print Waybill' })}
            />
          </CanMerchant>
        }
      />

      <div className="details-grid">
        <Card
          className="detail-card"
          data-accent={shipment.status === 'pending_pickup'
            ? 'warning'
            : shipment.status === 'in_transit' || shipment.status === 'out_for_delivery'
              ? 'shipments'
              : shipment.status === 'delivered'
                ? 'success'
                : shipment.status === 'returned' || shipment.status === 'failed'
                  ? 'danger'
                  : 'shipments'}
        >
          <CardHeader>
            <CardTitle>{t('Overview', { defaultValue: 'Overview' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="detail-list">
              <DetailRow 
                label={t('Status', { defaultValue: 'Status' })} 
                value={<MerchantShipmentStatusBadge status={shipment.status} statusLabel={shipment.status_label} />} 
              />
              <DetailRow 
                label={t('Created Date', { defaultValue: 'Created Date' })} 
                value={formatDate(shipment.created_at)} 
              />
              <DetailRow 
                label={t('Order Number', { defaultValue: 'Order Number' })} 
                value={
                  getOrderId(shipment) && getOrderNumber(shipment) !== '-' ? (
                    <Link to={merchantPath(`/orders/${getOrderId(shipment)}`)} style={{ textDecoration: 'none', color: 'var(--color-primary)' }}>
                      {getOrderNumber(shipment)}
                    </Link>
                  ) : getOrderNumber(shipment)
                } 
              />
              {getDriverName(shipment) ? (
                <DetailRow 
                  label={t('Driver', { defaultValue: 'Driver' })} 
                  value={getDriverName(shipment)} 
                />
              ) : null}
            </dl>
          </CardContent>
        </Card>

        <Card className="detail-card">
          <CardHeader>
            <CardTitle>{t('Delivery Information', { defaultValue: 'Delivery Information' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="detail-list">
              <DetailRow label={t('Customer Name', { defaultValue: 'Customer Name' })} value={getCustomerName(shipment)} />
              <DetailRow label={t('Customer Phone', { defaultValue: 'Customer Phone' })} value={getCustomerPhone(shipment)} />
              <DetailRow 
                label={t('Destination', { defaultValue: 'Destination' })} 
                value={getDeliveryLocation(shipment)} 
              />
              <DetailRow label={t('Address', { defaultValue: 'Address' })} value={getDeliveryAddress(shipment)} />
            </dl>
          </CardContent>
        </Card>

        <Card className="detail-card" data-accent="finance">
          <CardHeader>
            <CardTitle>{t('Payment Information', { defaultValue: 'Payment Information' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="detail-list">
              <DetailRow label={t('Payment Type', { defaultValue: 'Payment Type' })} value={getPaymentType(shipment)} />
              <DetailRow label={t('COD Amount', { defaultValue: 'COD Amount' })} value={<MoneyDisplay value={getCodAmount(shipment)} />} />
              <DetailRow label={t('Shipping Fee', { defaultValue: 'Shipping Fee' })} value={<MoneyDisplay value={getShippingFee(shipment)} />} />
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="table-card">
        <CardHeader>
          <CardTitle>{t('Tracking Timeline', { defaultValue: 'Tracking Timeline' })}</CardTitle>
        </CardHeader>
        <CardContent style={{ padding: '1.5rem' }}>
          <MerchantShipmentTrackingTimeline 
            shipmentId={shipment.id} 
            initialEvents={getTrackingEvents(shipment)} 
          />
        </CardContent>
      </Card>
    </section>
  )
}
