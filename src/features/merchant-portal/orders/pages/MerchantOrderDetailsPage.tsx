import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import type { Order } from '../../../orders/types/order.types'
import { getOrderPrintableLabelDocument } from '../../../orders/utils/orderLabel'
import { getApiErrorMessage, isApiNotFound } from '../../../../shared/api/api-error'
import { MoneyDisplay } from '../../../../shared/components/display/MoneyDisplay'
import { LabelDocumentDialog } from '../../../../shared/components/labels/LabelDocumentDialog'
import { ConfirmActionModal } from '../../../../shared/components/modals/ConfirmActionModal'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { NotFoundState } from '../../../../shared/components/states/NotFoundState'
import { Button } from '../../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/Card'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { Table, TableCell, TableContainer, TableHead } from '../../../../shared/components/ui/Table'
import { merchantPath } from '../../../../shared/routing/paths'
import { formatDate } from '../../../../shared/utils/formatters'
import { useLocale } from '../../../../shared/i18n/useLocale'
import { useMerchantPortalContext } from '../../context/merchantPortal.context'
import {
  cancelMerchantPortalOrder,
  confirmMerchantPortalOrder,
  getMerchantPortalOrder,
  getMerchantPortalOrderLabel,
} from '../api/merchantPortalOrders.api'
import { MerchantOrderStatusBadge } from '../components/MerchantOrderStatusBadge'
import type { MerchantPortalOrder } from '../types/merchantPortalOrders.types'

type PendingAction = 'confirm' | 'cancel' | null

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function unwrapMerchantPortalOrder(payload: unknown): MerchantPortalOrder | null {
  let current: unknown = payload

  for (let depth = 0; depth < 4; depth += 1) {
    if (!isRecord(current)) {
      return null
    }

    if (
      'order_number' in current
      || 'customer_name' in current
      || 'customer' in current
      || 'delivery' in current
    ) {
      return current as unknown as MerchantPortalOrder
    }

    if ('order' in current && isRecord(current.order)) {
      current = current.order
      continue
    }

    if ('data' in current && isRecord(current.data)) {
      current = current.data
      continue
    }

    return null
  }

  return null
}

function getCustomerName(order: MerchantPortalOrder) {
  return order.customer_name
    ?? order.customer?.name
    ?? order.customer?.customer_name
    ?? '-'
}

function getCustomerPhone(order: MerchantPortalOrder) {
  return order.customer_phone
    ?? order.customer?.phone
    ?? order.customer?.customer_phone
    ?? '-'
}

function getAlternativePhone(order: MerchantPortalOrder) {
  return order.customer_phone_alt
    ?? order.customer_alt_phone
    ?? order.customer?.phone_alt
    ?? order.customer?.alternative_phone
    ?? order.customer?.alternate_phone
    ?? '-'
}

function getLocalizedLocationName(
  option: MerchantPortalOrder['delivery_governorate'] | MerchantPortalOrder['delivery_area'],
  locale: string,
) {
  if (!option) {
    return null
  }

  if (locale === 'ar') {
    return option.name_ar ?? option.name ?? option.id ?? null
  }

  return option.name ?? option.name_ar ?? option.id ?? null
}

function getDeliveryGovernorate(order: MerchantPortalOrder, locale: string) {
  return getLocalizedLocationName(order.delivery_governorate, locale)
    ?? order.delivery_governorate_name
    ?? order.delivery?.governorate_name
    ?? order.governorate_name
    ?? order.delivery_governorate_id
    ?? order.delivery?.governorate_id
    ?? '-'
}

function getDeliveryArea(order: MerchantPortalOrder, locale: string) {
  return getLocalizedLocationName(order.delivery_area, locale)
    ?? order.delivery_area_name
    ?? order.delivery?.area_name
    ?? order.area_name
    ?? order.delivery_area_id
    ?? order.delivery?.area_id
    ?? '-'
}

function getDeliveryAddress(order: MerchantPortalOrder) {
  return order.delivery_address
    ?? order.delivery?.address
    ?? order.address
    ?? '-'
}

function getDeliveryNotes(order: MerchantPortalOrder) {
  return order.delivery_notes
    ?? order.delivery?.notes
    ?? order.notes
    ?? '-'
}

function getPaymentTypeValue(order: MerchantPortalOrder) {
  return order.payment_type
    ?? order.payment_summary?.payment_type
    ?? order.payment?.type
    ?? order.payment_method
    ?? order.payment?.method
    ?? null
}

function getPaymentTypeLabel(
  order: MerchantPortalOrder,
  t: ReturnType<typeof useTranslation>['t'],
) {
  const value = getPaymentTypeValue(order)
  const normalized = String(value ?? '').trim().toLowerCase()

  if (!normalized) {
    return '-'
  }

  if (normalized === 'cod' || normalized === 'cash_on_delivery') {
    return t('Cash on Delivery', { defaultValue: 'Cash on Delivery' })
  }

  if (normalized === 'prepaid') {
    return t('Prepaid', { defaultValue: 'Prepaid' })
  }

  if (normalized === 'wallet') {
    return t('Wallet', { defaultValue: 'Wallet' })
  }

  return String(value)
}

function getCodAmount(order: MerchantPortalOrder) {
  return order.cod_amount
    ?? order.payment_summary?.cod_amount
    ?? order.payment?.cod_amount
    ?? order.amounts?.cod_amount
    ?? null
}

function getShippingFee(order: MerchantPortalOrder) {
  return order.shipping_fee
    ?? order.delivery_fee
    ?? order.payment_summary?.shipping_fee
    ?? order.amounts?.shipping_fee
    ?? order.amounts?.delivery_fee
    ?? null
}

function getFulfillmentTypeValue(order: MerchantPortalOrder) {
  return order.fulfillment_type
    ?? order.warehouse_summary?.fulfillment_type
    ?? null
}

function getFulfillmentTypeLabel(order: MerchantPortalOrder) {
  return order.fulfillment_type_label
    ?? order.warehouse_summary?.fulfillment_type_label
    ?? null
}

function getWarehouseFulfillmentStatusValue(order: MerchantPortalOrder) {
  return order.warehouse_fulfillment_status
    ?? order.warehouse_summary?.warehouse_fulfillment_status
    ?? null
}

function getWarehouseFulfillmentStatusLabel(order: MerchantPortalOrder) {
  return order.warehouse_fulfillment_status_label
    ?? order.warehouse_summary?.warehouse_fulfillment_status_label
    ?? null
}

function getBooleanFlag(value: unknown) {
  if (typeof value === 'boolean') {
    return value
  }

  if (value === 1 || value === '1' || value === 'true') {
    return true
  }

  if (value === 0 || value === '0' || value === 'false') {
    return false
  }

  return false
}

export function MerchantOrderDetailsPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { orderId } = useParams<{ orderId: string }>()
  const { hasMerchantCapability } = useMerchantPortalContext()
  const queryClient = useQueryClient()
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [successMessage, setSuccessMessage] = useState('')

  const query = useQuery({
    queryKey: ['merchant-portal-order', orderId],
    queryFn: () => getMerchantPortalOrder(orderId!),
    enabled: Boolean(orderId),
  })

  async function invalidateOrder() {
    await queryClient.invalidateQueries({ queryKey: ['merchant-portal-orders'] })
    await queryClient.invalidateQueries({ queryKey: ['merchant-portal-order', orderId] })
  }

  const confirmMutation = useMutation({
    mutationFn: () => confirmMerchantPortalOrder(orderId!),
    onSuccess: async () => {
      setPendingAction(null)
      setSuccessMessage(t('Order confirmed successfully.', { defaultValue: 'Order confirmed successfully.' }))
      await invalidateOrder()
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelMerchantPortalOrder(orderId!),
    onSuccess: async () => {
      setPendingAction(null)
      setSuccessMessage(t('Order cancelled successfully.', { defaultValue: 'Order cancelled successfully.' }))
      await invalidateOrder()
    },
  })

  if (query.isLoading) {
    return <LoadingState title={t('Loading Order Details', { defaultValue: 'Loading Order Details' })} />
  }

  if (query.isError && isApiNotFound(query.error)) {
    return (
      <NotFoundState
        description={t('The requested order could not be found in the merchant portal.', {
          defaultValue: 'The requested order could not be found in the merchant portal.',
        })}
        title={t('Order not found', { defaultValue: 'Order not found' })}
      />
    )
  }

  if (query.isError || !query.data) {
    return (
      <ErrorState
        title={t('Failed to load order.', { defaultValue: 'Failed to load order.' })}
        message={getApiErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    )
  }

  const order = unwrapMerchantPortalOrder(query.data)

  if (!order) {
    return (
      <ErrorState
        title={t('Failed to load order.', { defaultValue: 'Failed to load order.' })}
        message={t('The order details response could not be parsed.', {
          defaultValue: 'The order details response could not be parsed.',
        })}
      />
    )
  }

  const canEdit = hasMerchantCapability('orders.update')
    && !order.has_shipment
    && order.status !== 'cancelled'
    && order.status !== 'delivered'
  const canConfirm = hasMerchantCapability('orders.confirm')
    && !order.has_shipment
    && (order.status === 'draft' || order.status === 'pending_review')
  const canCancel = hasMerchantCapability('orders.cancel')
    && !order.has_shipment
    && order.status !== 'cancelled'
    && order.status !== 'delivered'

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Merchant Portal"
        title={t('Order Details', { defaultValue: 'Order Details' })}
        description={`#${order.order_number}`}
        actions={(
          <div className="page-header__button-row">
            {canEdit ? (
              <Link className="ui-link-reset" to={merchantPath(`/orders/${order.id}/edit`)}>
                <Button variant="secondary">{t('Edit Order', { defaultValue: 'Edit Order' })}</Button>
              </Link>
            ) : null}

            {canConfirm ? (
              <Button variant="secondary" onClick={() => setPendingAction('confirm')}>
                {t('Confirm Order', { defaultValue: 'Confirm Order' })}
              </Button>
            ) : null}

            {canCancel ? (
              <Button variant="danger" onClick={() => setPendingAction('cancel')}>
                {t('Cancel Order', { defaultValue: 'Cancel Order' })}
              </Button>
            ) : null}

            {hasMerchantCapability('labels.print') ? (
              <LabelDocumentDialog
                defaultFormat="html"
                fetchDocument={(options) => getOrderPrintableLabelDocument({
                  fetchDocument: (requestOptions) => getMerchantPortalOrderLabel(order.id, requestOptions),
                  locale,
                  options,
                  order: order as unknown as Order,
                  t,
                })}
                formats={['html', 'pdf']}
                title={t('Order Waybill - {{orderNumber}}', {
                  defaultValue: `Order Waybill - ${order.order_number}`,
                  orderNumber: order.order_number,
                })}
                triggerLabel={t('Print Waybill', { defaultValue: 'Print Waybill' })}
              />
            ) : null}

            <Link className="ui-link-reset" to={merchantPath('/orders')}>
              <Button variant="secondary">{t('Back', { defaultValue: 'Back' })}</Button>
            </Link>
          </div>
        )}
      />

      {successMessage ? <div className="form-success">{successMessage}</div> : null}
      {confirmMutation.error ? <div className="form-error">{getApiErrorMessage(confirmMutation.error)}</div> : null}
      {cancelMutation.error ? <div className="form-error">{getApiErrorMessage(cancelMutation.error)}</div> : null}

      <div className="details-grid">
        <Card
          className="detail-card"
          data-accent={order.status === 'draft'
            ? 'warning'
            : order.status === 'confirmed'
              ? 'orders'
              : order.status === 'shipped'
                ? 'shipments'
                : order.status === 'delivered'
                  ? 'success'
                  : order.status === 'cancelled'
                    ? 'danger'
                    : 'orders'}
        >
          <CardHeader>
            <CardTitle>{t('Order Summary', { defaultValue: 'Order Summary' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="detail-list">
              <DetailRow label={t('Order Number', { defaultValue: 'Order Number' })} value={order.order_number} />
              <DetailRow
                label={t('Status', { defaultValue: 'Status' })}
                value={<MerchantOrderStatusBadge label={order.status_label} value={order.status} />}
              />
              <DetailRow
                label={t('Order Type', { defaultValue: 'Order Type' })}
                value={order.order_type ? t(order.order_type, { defaultValue: order.order_type }) : '-'}
              />
              <DetailRow label={t('Created At', { defaultValue: 'Created At' })} value={formatDate(order.created_at)} />
              <DetailRow label={t('Notes', { defaultValue: 'Notes' })} value={order.notes ?? '-'} />
            </dl>
          </CardContent>
        </Card>

        <Card className="detail-card">
          <CardHeader>
            <CardTitle>{t('Customer Information', { defaultValue: 'Customer Information' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="detail-list">
              <DetailRow label={t('Customer Name', { defaultValue: 'Customer Name' })} value={getCustomerName(order)} />
              <DetailRow label={t('Customer Phone', { defaultValue: 'Customer Phone' })} value={getCustomerPhone(order)} />
              <DetailRow label={t('Alternative Phone', { defaultValue: 'Alternative Phone' })} value={getAlternativePhone(order)} />
            </dl>
          </CardContent>
        </Card>

        <Card className="detail-card">
          <CardHeader>
            <CardTitle>{t('Delivery Information', { defaultValue: 'Delivery Information' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="detail-list">
              <DetailRow label={t('Delivery Governorate', { defaultValue: 'Delivery Governorate' })} value={getDeliveryGovernorate(order, locale)} />
              <DetailRow label={t('Delivery Area', { defaultValue: 'Delivery Area' })} value={getDeliveryArea(order, locale)} />
              <DetailRow label={t('Delivery Address', { defaultValue: 'Delivery Address' })} value={getDeliveryAddress(order)} />
              <DetailRow label={t('Delivery Notes', { defaultValue: 'Delivery Notes' })} value={getDeliveryNotes(order)} />
            </dl>
          </CardContent>
        </Card>

        <Card className="detail-card" data-accent="finance">
          <CardHeader>
            <CardTitle>{t('Payment Information', { defaultValue: 'Payment Information' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="detail-list">
              <DetailRow
                label={t('Payment Type', { defaultValue: 'Payment Type' })}
                value={getPaymentTypeLabel(order, t)}
              />
              <DetailRow label={t('COD Amount', { defaultValue: 'COD Amount' })} value={<MoneyDisplay value={getCodAmount(order)} />} />
              <DetailRow label={t('Shipping Fee', { defaultValue: 'Shipping Fee' })} value={<MoneyDisplay value={getShippingFee(order)} />} />
            </dl>
          </CardContent>
        </Card>

        <Card className="detail-card">
          <CardHeader>
            <CardTitle>{t('Fulfillment Information', { defaultValue: 'Fulfillment Information' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="detail-list">
              <DetailRow
                label={t('Fulfillment Type', { defaultValue: 'Fulfillment Type' })}
                value={<MerchantOrderStatusBadge label={getFulfillmentTypeLabel(order)} value={getFulfillmentTypeValue(order)} />}
              />
              <DetailRow label={t('Fragile', { defaultValue: 'Fragile' })} value={getBooleanFlag(order.is_fragile) ? t('Yes', { defaultValue: 'Yes' }) : t('No', { defaultValue: 'No' })} />
              <DetailRow label={t('Allow Inspection', { defaultValue: 'Allow Inspection' })} value={getBooleanFlag(order.allow_inspection) ? t('Yes', { defaultValue: 'Yes' }) : t('No', { defaultValue: 'No' })} />
              <DetailRow
                label={t('Warehouse Fulfillment', { defaultValue: 'Warehouse Fulfillment' })}
                value={getWarehouseFulfillmentStatusValue(order)
                  ? <MerchantOrderStatusBadge label={getWarehouseFulfillmentStatusLabel(order)} value={getWarehouseFulfillmentStatusValue(order)} />
                  : '-'}
              />
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="table-card">
        <CardHeader>
          <CardTitle>{t('Order Items', { defaultValue: 'Order Items' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <TableContainer>
            <Table variant="compact">
              <thead>
                <tr>
                  <TableHead>{t('Product Name', { defaultValue: 'Product Name' })}</TableHead>
                  <TableHead>{t('SKU', { defaultValue: 'SKU' })}</TableHead>
                  <TableHead>{t('Quantity', { defaultValue: 'Quantity' })}</TableHead>
                  <TableHead>{t('Unit Price', { defaultValue: 'Unit Price' })}</TableHead>
                  <TableHead>{t('Weight', { defaultValue: 'Weight' })}</TableHead>
                  <TableHead>{t('Notes', { defaultValue: 'Notes' })}</TableHead>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>{item.sku ?? '-'}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell><MoneyDisplay value={item.unit_price} /></TableCell>
                    <TableCell>{item.weight ?? '-'}</TableCell>
                    <TableCell>{item.notes ?? '-'}</TableCell>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {(order.requires_packaging || order.package_notes || order.total_packaging_fee || order.packaging_items?.length) ? (
        <Card className="table-card">
          <CardHeader>
            <CardTitle>{t('Packaging', { defaultValue: 'Packaging' })}</CardTitle>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <dl className="detail-list">
              <DetailRow
                label={t('Requires Packaging', { defaultValue: 'Requires Packaging' })}
                value={order.requires_packaging ? t('Yes', { defaultValue: 'Yes' }) : t('No', { defaultValue: 'No' })}
              />
              <DetailRow label={t('Package Notes', { defaultValue: 'Package Notes' })} value={order.package_notes ?? '-'} />
              <DetailRow label={t('Total Packaging Fee', { defaultValue: 'Total Packaging Fee' })} value={<MoneyDisplay value={order.total_packaging_fee} />} />
            </dl>

            {order.packaging_items?.length ? (
              <TableContainer>
                <Table variant="compact">
                  <thead>
                    <tr>
                      <TableHead>{t('Packaging Items', { defaultValue: 'Packaging Items' })}</TableHead>
                      <TableHead>{t('SKU', { defaultValue: 'SKU' })}</TableHead>
                      <TableHead>{t('Quantity', { defaultValue: 'Quantity' })}</TableHead>
                      <TableHead>{t('Unit Price', { defaultValue: 'Unit Price' })}</TableHead>
                      <TableHead>{t('Total', { defaultValue: 'Total' })}</TableHead>
                    </tr>
                  </thead>
                  <tbody>
                    {order.packaging_items.map((item) => (
                      <tr key={item.id}>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell>{item.item_sku ?? '-'}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell><MoneyDisplay value={item.unit_price} /></TableCell>
                        <TableCell><MoneyDisplay value={item.total_price} /></TableCell>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableContainer>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <ConfirmActionModal
        open={pendingAction !== null}
        title={pendingAction === 'confirm'
          ? t('Confirm Order', { defaultValue: 'Confirm Order' })
          : t('Cancel Order', { defaultValue: 'Cancel Order' })}
        description={pendingAction === 'confirm'
          ? t('Confirm order {{orderNumber}}?', {
              defaultValue: `Confirm order ${order.order_number}?`,
              orderNumber: order.order_number,
            })
          : t('Cancel order {{orderNumber}}?', {
              defaultValue: `Cancel order ${order.order_number}?`,
              orderNumber: order.order_number,
            })}
        confirmLabel={pendingAction === 'confirm'
          ? t('Confirm Order', { defaultValue: 'Confirm Order' })
          : t('Cancel Order', { defaultValue: 'Cancel Order' })}
        loading={confirmMutation.isPending || cancelMutation.isPending}
        variant={pendingAction === 'cancel' ? 'danger' : 'default'}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          if (pendingAction === 'confirm') {
            confirmMutation.mutate()
            return
          }

          cancelMutation.mutate()
        }}
      />
    </section>
  )
}
