import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { z } from 'zod'
import {
  confirmOrder,
  deleteOrder,
  fulfillOrderFromWarehouse,
  getOrder,
  listOrderStockReservations,
  markOrderPacked,
  markOrderPicked,
  readyOrderForDispatch,
  releaseOrderStock,
  reserveOrderStock,
  startOrderPacking,
  startOrderPicking,
} from '../api/orders.api'
import type { Order } from '../types/order.types'
import { createShipmentFromOrder } from '../../shipments/api/shipments.api'
import { listWarehouseProducts, listWarehouses } from '../../warehouse/api/warehouse.api'
import { getOrderLabel } from '../../../shared/api/labels.api'
import { getApiErrorMessage, isApiNotFound } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { Attachments } from '../../../shared/components/attachments/Attachments'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { LabelDocumentDialog } from '../../../shared/components/labels/LabelDocumentDialog'
import { ConfirmActionModal } from '../../../shared/components/modals/ConfirmActionModal'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { NotFoundState } from '../../../shared/components/states/NotFoundState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Dialog } from '../../../shared/components/ui/Dialog'
import { Input } from '../../../shared/components/ui/Input'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { SearchableSelect } from '../../../shared/components/ui/SearchableSelect'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { useFormApiErrors } from '../../../shared/hooks/useFormApiErrors'
import { pickDisplayLabel } from '../../../shared/i18n/locale'
import { useLocale } from '../../../shared/i18n/useLocale'
import { adminPath } from '../../../shared/routing/paths'
import { formatDate } from '../../../shared/utils/formatters'
import { getOrderPrintableLabelDocument } from '../utils/orderLabel'
const reserveStockSchema = z.object({
  warehouse_id: z.number().min(1, 'Warehouse is required.'),
  items: z.array(
    z.object({
      order_item_id: z.number().min(1),
      warehouse_product_id: z.number().min(1, 'Product is required.'),
      quantity: z.number().min(1, 'Quantity must be at least 1.'),
    }),
  ),
})

type ReserveStockValues = z.infer<typeof reserveStockSchema>

function ReserveStockDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
  order,
}: {
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: ReserveStockValues) => void
  open: boolean
  order: Order
}) {
  const { t } = useTranslation()
  const { formError, getFieldError } = useFormApiErrors(error)
  const [warehouses, products] = useQueries({
    queries: [
      { queryKey: ['warehouses'], queryFn: listWarehouses, enabled: open },
      {
        queryKey: ['warehouse-products', 'reserve', order.merchant_id],
        queryFn: () => listWarehouseProducts({ merchant_id: order.merchant_id, status: 'active' }),
        enabled: open,
      },
    ],
  })
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReserveStockValues>({
    resolver: zodResolver(reserveStockSchema),
    values: {
      warehouse_id: 0,
      items: order.items.map((item) => ({
        order_item_id: item.id,
        warehouse_product_id: item.warehouse_product_id ?? 0,
        quantity: Math.max(1, item.quantity - (item.delivered_quantity ?? 0) - (item.returned_quantity ?? 0) - (item.damaged_quantity ?? 0)),
      })),
    },
  })
  const { fields } = useFieldArray({ control, name: 'items' })

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>{t('Reserve Stock')}</CardTitle>}>
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>{t('Warehouse')}</span>
          <Controller
            control={control}
            name="warehouse_id"
            render={({ field }) => (
              <SearchableSelect
                value={field.value ? String(field.value) : '0'}
                placeholder={t('Select warehouse', { defaultValue: 'Select warehouse' })}
                searchPlaceholder={t('Search warehouses...', { defaultValue: 'Search warehouses...' })}
                onChange={(warehouse_id) => field.onChange(Number(warehouse_id || 0))}
                options={[
                  { label: t('Select warehouse', { defaultValue: 'Select warehouse' }), value: '0' },
                  ...((warehouses.data?.data ?? []).map((warehouse) => ({
                    label: warehouse.name,
                    value: String(warehouse.id),
                    keywords: [warehouse.code ?? '', warehouse.address ?? ''],
                  }))),
                ]}
              />
            )}
          />
          <FieldError error={errors.warehouse_id?.message ?? getFieldError('warehouse_id')} />
        </label>

        <div className="order-items-list">
          {fields.map((field, index) => (
            <div className="order-item-row" key={field.id}>
              <input type="hidden" {...register(`items.${index}.order_item_id`, { valueAsNumber: true })} />
              <label className="field">
                <span>{t('Order Item')}</span>
                <Input value={order.items[index]?.product_name ?? ''} disabled />
              </label>
              <label className="field">
                <span>{t('Warehouse Product')}</span>
                <Controller
                  control={control}
                  name={`items.${index}.warehouse_product_id`}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value ? String(field.value) : '0'}
                      placeholder={t('Select product', { defaultValue: 'Select product' })}
                      searchPlaceholder={t('Search warehouse products...', { defaultValue: 'Search warehouse products...' })}
                      onChange={(warehouse_product_id) => field.onChange(Number(warehouse_product_id || 0))}
                      options={[
                        { label: t('Select product', { defaultValue: 'Select product' }), value: '0' },
                        ...((products.data?.data ?? []).map((product) => ({
                          label: `${product.name} (${product.sku})`,
                          value: String(product.id),
                          keywords: [product.name, product.sku, product.barcode ?? '', product.merchant_name ?? ''],
                        }))),
                      ]}
                    />
                  )}
                />
                <FieldError error={errors.items?.[index]?.warehouse_product_id?.message ?? getFieldError(`items.${index}.warehouse_product_id`)} />
              </label>
              <label className="field">
                <span>{t('Quantity')}</span>
                <Input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                <FieldError error={errors.items?.[index]?.quantity?.message ?? getFieldError(`items.${index}.quantity`)} />
              </label>
            </div>
          ))}
        </div>

        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {t('Reserve Stock')}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function OrderDetailsPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { orderId } = useParams()
    const [reserveOpen, setReserveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const query = useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => getOrder(orderId!),
    enabled: Boolean(orderId),
  })
  const reservationsQuery = useQuery({
    queryKey: ['orders', orderId, 'stock-reservations'],
    queryFn: () => listOrderStockReservations(orderId!),
    enabled: Boolean(orderId),
  })

  async function invalidateOrder() {
    await queryClient.invalidateQueries({ queryKey: ['orders'] })
    await queryClient.invalidateQueries({ queryKey: ['orders', orderId] })
    await queryClient.invalidateQueries({ queryKey: ['orders', orderId, 'stock-reservations'] })
    await queryClient.invalidateQueries({ queryKey: ['orders', orderId, 'timeline'] })
    await queryClient.invalidateQueries({ queryKey: ['shipments'] })
    await queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
  }

  const confirmMutation = useMutation({
    mutationFn: () => confirmOrder(orderId!),
    onSuccess: async () => {
      setSuccessMessage(t('Order confirmed successfully.', { defaultValue: 'Order confirmed successfully.' }))
      await invalidateOrder()
    },
  })
  const createShipmentMutation = useMutation({
    mutationFn: () => createShipmentFromOrder(orderId!),
    onSuccess: async () => {
      setSuccessMessage(t('Shipment created successfully.', { defaultValue: 'Shipment created successfully.' }))
      await invalidateOrder()
      await query.refetch()
    },
  })
  const reserveMutation = useMutation({
    mutationFn: (values: ReserveStockValues) => reserveOrderStock(orderId!, values),
    onSuccess: async () => {
      setReserveOpen(false)
      setSuccessMessage(t('Stock reserved successfully.', { defaultValue: 'Stock reserved successfully.' }))
      await invalidateOrder()
    },
  })
  const releaseMutation = useMutation({
    mutationFn: () => releaseOrderStock(orderId!),
    onSuccess: async () => {
      setSuccessMessage(t('Stock reservations released successfully.', { defaultValue: 'Stock reservations released successfully.' }))
      await invalidateOrder()
    },
  })
  const fulfillMutation = useMutation({
    mutationFn: () => fulfillOrderFromWarehouse(orderId!),
    onSuccess: async () => {
      setSuccessMessage(t('Order fulfilled from warehouse successfully.', { defaultValue: 'Order fulfilled from warehouse successfully.' }))
      await invalidateOrder()
    },
  })
  const deleteMutation = useMutation({
    mutationFn: () => deleteOrder(orderId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
      navigate(adminPath('/orders'))
    },
  })
  const workflowMutation = useMutation({
    mutationFn: (action: 'start-picking' | 'mark-picked' | 'start-packing' | 'mark-packed' | 'ready-for-dispatch') => {
      switch (action) {
        case 'start-picking':
          return startOrderPicking(orderId!)
        case 'mark-picked':
          return markOrderPicked(orderId!)
        case 'start-packing':
          return startOrderPacking(orderId!)
        case 'mark-packed':
          return markOrderPacked(orderId!)
        case 'ready-for-dispatch':
          return readyOrderForDispatch(orderId!)
      }
    },
    onSuccess: async () => {
      setSuccessMessage(t('Warehouse workflow updated successfully.', { defaultValue: 'Warehouse workflow updated successfully.' }))
      await invalidateOrder()
      await query.refetch()
    },
  })

  if (query.isLoading) {
    return <LoadingState title={t('Loading order', { defaultValue: 'Loading order' })} description={t('Fetching order details from the API.', { defaultValue: 'Fetching order details from the API.' })} />
  }

  if (query.isError && isApiNotFound(query.error)) {
    return (
      <NotFoundState
        title={t('Order not found', { defaultValue: 'Order not found' })}
        description={t('This order could not be found in the orders API.', { defaultValue: 'This order could not be found in the orders API.' })}
      />
    )
  }

  if (query.isError || !query.data) {
    return <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
  }

  const order = query.data.data
  const hasShipment = Boolean(order.shipment ?? order.shipment_id ?? order.shipment_number)
  const isShipmentCreated = order.status === 'shipment_created' || hasShipment
  const isWarehouseFulfillment = order.fulfillment_type === 'from_warehouse'
  const shipmentId = order.shipment?.id ?? order.shipment?.shipment_id ?? order.shipment_id
  const shipmentNumber = order.shipment?.shipment_number ?? order.shipment_number
  const canConfirm = (order.status === 'draft' || order.status === 'pending_review') && !order.requires_review && order.items.length > 0
  const canCreateShipment =
    order.status === 'confirmed'
    && !order.requires_review
    && order.items.length > 0
    && !hasShipment
    && (
      order.fulfillment_type !== 'from_warehouse'
      || order.warehouse_fulfillment_status === 'fulfilled'
    )
  const shipmentBlockedByWarehouseFlow =
    order.fulfillment_type === 'from_warehouse'
    && order.status === 'confirmed'
    && !hasShipment
    && order.warehouse_fulfillment_status !== 'fulfilled'

  return (
    <section className="page-section">
      <PageHeader
        title={order.order_number}
        description={t('Order for {{customer}} with {{count}} item(s).', {
          customer: order.customer_name,
          count: order.items.length,
          defaultValue: `Order for ${order.customer_name} with ${order.items.length} item(s).`,
        })}
        actions={
          <div className="page-header__button-row">
            {!isShipmentCreated ? (
              <Can permission={PERMISSIONS.ORDERS_UPDATE}>
                <Link className="ui-link-reset" to={adminPath(`/orders/${order.id}/edit`)}>
                  <Button variant="secondary">{t('Edit')}</Button>
                </Link>
              </Can>
            ) : null}
            {canConfirm ? (
              <Can permission={PERMISSIONS.ORDERS_CONFIRM}>
                <Button
                  variant="secondary"
                  loading={confirmMutation.isPending}
                  onClick={() => confirmMutation.mutate()}
                >
                  {t('Confirm Order', { defaultValue: 'Confirm Order' })}
                </Button>
              </Can>
            ) : null}
            {!isShipmentCreated ? (
              <Can permission={PERMISSIONS.ORDERS_CREATE_SHIPMENT}>
                <Button
                  variant="secondary"
                  loading={createShipmentMutation.isPending}
                  disabled={!canCreateShipment}
                  title={
                    !canCreateShipment
                      ? shipmentBlockedByWarehouseFlow
                        ? t('Awaiting warehouse fulfillment before shipment can be created.', { defaultValue: 'Awaiting warehouse fulfillment before shipment can be created.' })
                        : t('Order must be confirmed and approved to create a shipment.', { defaultValue: 'Order must be confirmed and approved to create a shipment.' })
                      : undefined
                  }
                  onClick={() => createShipmentMutation.mutate()}
                >
                  {t('Create Shipment')}
                </Button>
              </Can>
            ) : null}
            <LabelDocumentDialog
              defaultFormat="html"
              fetchDocument={(options) => getOrderPrintableLabelDocument({
                fetchDocument: (requestOptions) => getOrderLabel(order.id, requestOptions),
                locale,
                options,
                order,
                t,
              })}
              formats={['html', 'pdf']}
              title={t('Order Label - {{orderNumber}}', {
                orderNumber: order.order_number,
                defaultValue: `Order Label - ${order.order_number}`,
              })}
              triggerLabel={t('Label', { defaultValue: 'Label' })}
            />
            {!isShipmentCreated ? (
              <Can permission={PERMISSIONS.ORDERS_DELETE}>
                <Button
                  variant="danger"
                  loading={deleteMutation.isPending}
                  onClick={() => setDeleteOpen(true)}
                >
                  {t('Delete')}
                </Button>
              </Can>
            ) : null}
            <Link className="ui-link-reset" to={adminPath('/orders')}>
              <Button variant="secondary">{t('Back to orders', { defaultValue: 'Back to orders' })}</Button>
            </Link>
          </div>
        }
      />

      {successMessage ? <div className="form-success">{successMessage}</div> : null}
      {confirmMutation.error ? <div className="form-error">{getApiErrorMessage(confirmMutation.error)}</div> : null}
      {createShipmentMutation.error ? <div className="form-error">{getApiErrorMessage(createShipmentMutation.error)}</div> : null}
      {deleteMutation.error ? <div className="form-error">{getApiErrorMessage(deleteMutation.error)}</div> : null}
      {workflowMutation.error ? <div className="form-error">{getApiErrorMessage(workflowMutation.error)}</div> : null}

      {isShipmentCreated ? (
        <div className="table-meta">{t('Edit and delete actions are locked because a shipment already exists for this order.', {
          defaultValue: 'Edit and delete actions are locked because a shipment already exists for this order.',
        })}</div>
      ) : null}
      {shipmentBlockedByWarehouseFlow ? (
        <div className="table-meta">
          {t('Shipment creation is disabled until warehouse fulfillment reaches fulfilled for this from_warehouse order.', {
            defaultValue: 'Shipment creation is disabled until warehouse fulfillment reaches fulfilled for this from_warehouse order.',
          })}
        </div>
      ) : null}

      {order.requires_review ? (
        <Card className="feedback-card feedback-card--error">
          <CardHeader className="feedback-card__header">
            <CardTitle>{t('Review Required', { defaultValue: 'Review Required' })}</CardTitle>
          </CardHeader>
          <CardContent className="feedback-card__content">
            <p>{order.review_reason ?? t('This order must be reviewed before confirmation or shipment creation.', {
              defaultValue: 'This order must be reviewed before confirmation or shipment creation.',
            })}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="details-grid">
        <Card className="detail-card">
          <CardHeader>
            <CardTitle>{t('Overview', { defaultValue: 'Overview' })}</CardTitle>
            <CardDescription>{t('Commercial and operational order summary.', { defaultValue: 'Commercial and operational order summary.' })}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="detail-list">
              <div><dt>{t('Merchant')}</dt><dd>{order.merchant_name}</dd></div>
              <div><dt>{t('Customer')}</dt><dd>{order.customer_name}</dd></div>
              <div><dt>{t('Phone')}</dt><dd>{order.customer_phone}</dd></div>
              <div>
                <dt>{t('Status')}</dt>
                <dd>
                  <StatusBadge value={order.status}>
                    {pickDisplayLabel(order.status, order.status_label)}
                  </StatusBadge>
                </dd>
              </div>
              <div><dt>{t('Order Type', { defaultValue: 'Order Type' })}</dt><dd>{order.order_type ?? '-'}</dd></div>
              <div>
                <dt>{t('Fulfillment Type', { defaultValue: 'Fulfillment Type' })}</dt>
                <dd>
                  <StatusBadge value={order.fulfillment_type}>
                    {pickDisplayLabel(order.fulfillment_type, order.fulfillment_type_label)}
                  </StatusBadge>
                </dd>
              </div>
              <div>
                <dt>{t('Payment Type', { defaultValue: 'Payment Type' })}</dt>
                <dd>
                  <StatusBadge value={order.payment_type}>
                    {pickDisplayLabel(order.payment_type, order.payment_type_label)}
                  </StatusBadge>
                </dd>
              </div>
              <div>
                <dt>{t('Warehouse Fulfillment', { defaultValue: 'Warehouse Fulfillment' })}</dt>
                <dd>
                  {order.fulfillment_type === 'from_warehouse' ? (
                    <StatusBadge value={order.warehouse_fulfillment_status}>
                      {pickDisplayLabel(order.warehouse_fulfillment_status, order.warehouse_fulfillment_status_label)}
                    </StatusBadge>
                  ) : t('not_required', { defaultValue: 'not_required' })}
                </dd>
              </div>
              <div>
                <dt>{t('Shipment', { defaultValue: 'Shipment' })}</dt>
                <dd>
                  {shipmentId && shipmentNumber ? (
                    <Link className="table-link" to={adminPath(`/shipments/${shipmentId}`)}>{shipmentNumber}</Link>
                  ) : shipmentNumber ? shipmentNumber : '-'}
                </dd>
              </div>
              <div><dt>{t('COD Amount', { defaultValue: 'COD Amount' })}</dt><dd><MoneyDisplay value={order.cod_amount} /></dd></div>
              <div><dt>{t('Shipping Fee', { defaultValue: 'Shipping Fee' })}</dt><dd><MoneyDisplay value={order.shipping_fee} /></dd></div>
              <div><dt>{t('Created At', { defaultValue: 'Created At' })}</dt><dd>{formatDate(order.created_at)}</dd></div>
            </dl>
          </CardContent>
        </Card>

        <Card className="detail-card">
          <CardHeader>
            <CardTitle>{t('Delivery', { defaultValue: 'Delivery' })}</CardTitle>
            <CardDescription>{t('Destination, review state, and fulfillment notes.', { defaultValue: 'Destination, review state, and fulfillment notes.' })}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="detail-list">
              <div><dt>{t('Governorate')}</dt><dd>{order.delivery_governorate_name}</dd></div>
              <div><dt>{t('Area')}</dt><dd>{order.delivery_area_name ?? '-'}</dd></div>
              <div><dt>{t('Address')}</dt><dd>{order.delivery_address}</dd></div>
              <div><dt>{t('Delivery Notes', { defaultValue: 'Delivery Notes' })}</dt><dd>{order.delivery_notes ?? '-'}</dd></div>
              <div><dt>{t('Swap Original Order', { defaultValue: 'Swap Original Order' })}</dt><dd>{order.original_order_number ?? '-'}</dd></div>
              <div><dt>{t('Swap Notes', { defaultValue: 'Swap Notes' })}</dt><dd>{order.swap_notes ?? '-'}</dd></div>
              <div><dt>{t('Requires Review', { defaultValue: 'Requires Review' })}</dt><dd>{order.requires_review ? t('Yes', { defaultValue: 'Yes' }) : t('No', { defaultValue: 'No' })}</dd></div>
              <div><dt>{t('Review Reason', { defaultValue: 'Review Reason' })}</dt><dd>{order.review_reason ?? '-'}</dd></div>
            </dl>
          </CardContent>
        </Card>

        <Card className="detail-card">
          <CardHeader>
            <CardTitle>{t('Packaging', { defaultValue: 'Packaging' })}</CardTitle>
            <CardDescription>{t('Packaging requirement, notes, and company catalog packaging fees for this order.', {
              defaultValue: 'Packaging requirement, notes, and company catalog packaging fees for this order.',
            })}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="detail-list">
              <div>
                <dt>{t('Requires Packaging', { defaultValue: 'Requires Packaging' })}</dt>
                <dd>{order.requires_packaging ? t('Yes', { defaultValue: 'Yes' }) : t('No', { defaultValue: 'No' })}</dd>
              </div>
              <div>
                <dt>{t('Package Notes', { defaultValue: 'Package Notes' })}</dt>
                <dd>{order.package_notes ?? '—'}</dd>
              </div>
              <div>
                <dt>{t('Total Packaging Fee', { defaultValue: 'Total Packaging Fee' })}</dt>
                <dd>{order.total_packaging_fee ? <MoneyDisplay value={order.total_packaging_fee} /> : '—'}</dd>
              </div>
              <div>
                <dt>{t('Packaging Items', { defaultValue: 'Packaging Items' })}</dt>
                <dd>{order.packaging_items?.length ?? 0}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="table-card">
        <CardHeader className="section-title-row">
          <div>
            <CardTitle>{t('Items', { defaultValue: 'Items' })}</CardTitle>
            <CardDescription>{t('Line items included in this order.', { defaultValue: 'Line items included in this order.' })}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <TableContainer>
            <Table variant="compact">
              <thead>
                <tr>
                  <TableHead>{t('Product')}</TableHead>
                  <TableHead>{t('SKU', { defaultValue: 'SKU' })}</TableHead>
                  <TableHead>{t('Quantity')}</TableHead>
                  <TableHead>{t('Delivery Status', { defaultValue: 'Delivery Status' })}</TableHead>
                  <TableHead>{t('Delivered', { defaultValue: 'Delivered' })}</TableHead>
                  <TableHead>{t('Returned', { defaultValue: 'Returned' })}</TableHead>
                  <TableHead>{t('Damaged', { defaultValue: 'Damaged' })}</TableHead>
                  <TableHead>{t('Unit Price', { defaultValue: 'Unit Price' })}</TableHead>
                  <TableHead>{t('Weight', { defaultValue: 'Weight' })}</TableHead>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>{item.sku ?? '-'}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.delivery_status ? <StatusBadge value={item.delivery_status} /> : '-'}</TableCell>
                    <TableCell>{item.delivered_quantity ?? 0}</TableCell>
                    <TableCell>{item.returned_quantity ?? 0}</TableCell>
                    <TableCell>{item.damaged_quantity ?? 0}</TableCell>
                    <TableCell><MoneyDisplay value={item.unit_price} /></TableCell>
                    <TableCell>{item.weight ?? '-'}</TableCell>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {order.packaging_items?.length ? (
        <Card className="table-card">
          <CardHeader className="section-title-row">
            <div>
              <CardTitle>{t('Packaging Items', { defaultValue: 'Packaging Items' })}</CardTitle>
              <CardDescription>{t('Backend-calculated packaging snapshot rows selected from the company catalog.', {
                defaultValue: 'Backend-calculated packaging snapshot rows selected from the company catalog.',
              })}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>{t('Packaging Product', { defaultValue: 'Packaging Product' })}</TableHead>
                    <TableHead>{t('SKU', { defaultValue: 'SKU' })}</TableHead>
                    <TableHead>{t('Category', { defaultValue: 'Category' })}</TableHead>
                    <TableHead>{t('Size Label', { defaultValue: 'Size Label' })}</TableHead>
                    <TableHead>{t('Packaging Quantity', { defaultValue: 'Packaging Quantity' })}</TableHead>
                    <TableHead>{t('Unit Price', { defaultValue: 'Unit Price' })}</TableHead>
                    <TableHead>{t('Total', { defaultValue: 'Total' })}</TableHead>
                    <TableHead>{t('Packaging Notes', { defaultValue: 'Packaging Notes' })}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {order.packaging_items.map((item) => (
                    <tr key={item.id}>
                      <TableCell>{item.item_name}</TableCell>
                      <TableCell>{item.item_sku ?? '—'}</TableCell>
                      <TableCell>{item.category ?? '—'}</TableCell>
                      <TableCell>{item.size_label ?? '—'}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell><MoneyDisplay value={item.unit_price} /></TableCell>
                      <TableCell><MoneyDisplay value={item.total_price} /></TableCell>
                      <TableCell>{item.notes ?? '—'}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ) : null}

      {isWarehouseFulfillment ? (
        <Card className="table-card">
          <CardHeader className="section-title-row">
            <div>
              <CardTitle>{t('Stock Reservations')}</CardTitle>
              <CardDescription>{t('Stock reservation actions are shown only for from_warehouse orders.', { defaultValue: 'Stock reservation actions are shown only for from_warehouse orders.' })}</CardDescription>
            </div>
            <div className="page-header__button-row">
              <Can permission={PERMISSIONS.ORDERS_RESERVE_STOCK}>
                <Button variant="secondary" onClick={() => setReserveOpen(true)}>
                  {t('Reserve Stock')}
                </Button>
              </Can>
              <Can permission={PERMISSIONS.ORDERS_RELEASE_STOCK}>
                <Button
                  variant="secondary"
                  loading={releaseMutation.isPending}
                  onClick={() => releaseMutation.mutate()}
                >
                  {t('Release Stock', { defaultValue: 'Release Stock' })}
                </Button>
              </Can>
              <Can permission={PERMISSIONS.ORDERS_FULFILL_WAREHOUSE}>
                <Button
                  variant="secondary"
                  loading={fulfillMutation.isPending}
                  onClick={() => fulfillMutation.mutate()}
                >
                  {t('Fulfill From Warehouse', { defaultValue: 'Fulfill From Warehouse' })}
                </Button>
              </Can>
            </div>
          </CardHeader>
          <CardContent>
            {reserveMutation.error ? <div className="form-error">{getApiErrorMessage(reserveMutation.error)}</div> : null}
            {releaseMutation.error ? <div className="form-error">{getApiErrorMessage(releaseMutation.error)}</div> : null}
            {fulfillMutation.error ? <div className="form-error">{getApiErrorMessage(fulfillMutation.error)}</div> : null}
            {reservationsQuery.isLoading ? <LoadingState title={t('Loading stock reservations', { defaultValue: 'Loading stock reservations' })} /> : null}
            {reservationsQuery.isError ? (
              <ErrorState
                title={t('Unable to load stock reservations', { defaultValue: 'Unable to load stock reservations' })}
                message={getApiErrorMessage(reservationsQuery.error)}
                onRetry={() => void reservationsQuery.refetch()}
              />
            ) : null}
            {!reservationsQuery.isLoading && !reservationsQuery.isError ? (
              (reservationsQuery.data?.data ?? []).length ? (
                <TableContainer>
                  <Table variant="compact">
                    <thead>
                      <tr>
                        <TableHead>{t('Product')}</TableHead>
                        <TableHead>{t('Warehouse')}</TableHead>
                        <TableHead>{t('Quantity')}</TableHead>
                        <TableHead>{t('Status')}</TableHead>
                        <TableHead>{t('Created', { defaultValue: 'Created' })}</TableHead>
                      </tr>
                    </thead>
                    <tbody>
                      {(reservationsQuery.data?.data ?? []).map((reservation) => (
                        <tr key={reservation.id}>
                          <TableCell>{reservation.product_name}</TableCell>
                          <TableCell>{reservation.warehouse_name}</TableCell>
                          <TableCell>{reservation.quantity}</TableCell>
                          <TableCell><StatusBadge value={reservation.status} /></TableCell>
                          <TableCell>{formatDate(reservation.created_at)}</TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableContainer>
              ) : (
                <EmptyState
                  title={t('No stock reservations', { defaultValue: 'No stock reservations' })}
                  description={t('No stock reservations have been recorded for this warehouse order yet.', {
                    defaultValue: 'No stock reservations have been recorded for this warehouse order yet.',
                  })}
                />
              )
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {isWarehouseFulfillment ? (
        <Card className="table-card">
          <CardHeader className="section-title-row">
            <div>
              <CardTitle>{t('Warehouse Workflow', { defaultValue: 'Warehouse Workflow' })}</CardTitle>
              <CardDescription>{t('Warehouse picking, packing, and dispatch steps for from_warehouse orders.', { defaultValue: 'Warehouse picking, packing, and dispatch steps for from_warehouse orders.' })}</CardDescription>
            </div>
            <div className="page-header__button-row">
              {order.warehouse_fulfillment_status === 'reserved' ? (
                <Button
                  variant="secondary"
                  loading={workflowMutation.isPending}
                  onClick={() => workflowMutation.mutate('start-picking')}
                >
                  {t('Start Picking', { defaultValue: 'Start Picking' })}
                </Button>
              ) : null}
              {order.warehouse_fulfillment_status === 'picking' ? (
                <Button
                  variant="secondary"
                  loading={workflowMutation.isPending}
                  onClick={() => workflowMutation.mutate('mark-picked')}
                >
                  {t('Mark Picked', { defaultValue: 'Mark Picked' })}
                </Button>
              ) : null}
              {order.warehouse_fulfillment_status === 'picked' ? (
                <Button
                  variant="secondary"
                  loading={workflowMutation.isPending}
                  onClick={() => workflowMutation.mutate('start-packing')}
                >
                  {t('Start Packing', { defaultValue: 'Start Packing' })}
                </Button>
              ) : null}
              {order.warehouse_fulfillment_status === 'packing' ? (
                <Button
                  variant="secondary"
                  loading={workflowMutation.isPending}
                  onClick={() => workflowMutation.mutate('mark-packed')}
                >
                  {t('Mark Packed', { defaultValue: 'Mark Packed' })}
                </Button>
              ) : null}
              {order.warehouse_fulfillment_status === 'packed' ? (
                <Button
                  variant="secondary"
                  loading={workflowMutation.isPending}
                  onClick={() => workflowMutation.mutate('ready-for-dispatch')}
                >
                  {t('Ready For Dispatch', { defaultValue: 'Ready For Dispatch' })}
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            <dl className="detail-list">
              <div>
                <dt>{t('Current Warehouse Status', { defaultValue: 'Current Warehouse Status' })}</dt>
                <dd>
                  <StatusBadge value={order.warehouse_fulfillment_status}>
                    {pickDisplayLabel(order.warehouse_fulfillment_status, order.warehouse_fulfillment_status_label)}
                  </StatusBadge>
                </dd>
              </div>
              <div>
                <dt>{t('Shipment Creation Rule', { defaultValue: 'Shipment Creation Rule' })}</dt>
                <dd>
                  {order.warehouse_fulfillment_status === 'fulfilled'
                    ? t('Shipment creation is allowed.', { defaultValue: 'Shipment creation is allowed.' })
                    : t('Shipment creation stays blocked until warehouse fulfillment is fulfilled.', {
                      defaultValue: 'Shipment creation stays blocked until warehouse fulfillment is fulfilled.',
                    })}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      ) : null}



      

      <Can permission={PERMISSIONS.ATTACHMENTS_VIEW}>
        <Attachments attachableType="orders" attachableId={order.id} />
      </Can>

      {isWarehouseFulfillment ? (
        <ReserveStockDialog
          error={reserveMutation.error}
          isSubmitting={reserveMutation.isPending}
          onClose={() => setReserveOpen(false)}
          onSubmit={(values) => reserveMutation.mutate(values)}
          open={reserveOpen}
          order={order}
        />
      ) : null}

      <ConfirmActionModal
        open={deleteOpen}
        title={t('Delete order', { defaultValue: 'Delete order' })}
        description={t('Delete order {{orderNumber}}?', {
          orderNumber: order.order_number,
          defaultValue: `Delete order ${order.order_number}?`,
        })}
        confirmLabel={t('Delete order', { defaultValue: 'Delete order' })}
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </section>
  )
}
