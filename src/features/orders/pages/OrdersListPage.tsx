import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { confirmOrder, deleteOrder, listOrders } from '../api/orders.api'
import { createShipmentFromOrder } from '../../shipments/api/shipments.api'
import { getOrderLabel } from '../../../shared/api/labels.api'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { DateRangeFilter } from '../../../shared/components/filters/DateRangeFilter'
import { LabelDocumentDialog } from '../../../shared/components/labels/LabelDocumentDialog'
import { GovernorateAreaSelector } from '../../../shared/components/selectors/GovernorateAreaSelector'
import { MerchantSelector } from '../../../shared/components/selectors/MerchantSelector'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { ConfirmActionModal } from '../../../shared/components/modals/ConfirmActionModal'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Dropdown, DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '../../../shared/components/ui/Dropdown'
import { Input } from '../../../shared/components/ui/Input'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { Select } from '../../../shared/components/ui/Select'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { pickDisplayLabel } from '../../../shared/i18n/locale'
import { useLocale } from '../../../shared/i18n/useLocale'
import { adminPath } from '../../../shared/routing/paths'
import { formatDate } from '../../../shared/utils/formatters'
import type { Order } from '../types/order.types'
import { getOrderPrintableLabelDocument } from '../utils/orderLabel'

type OrdersListFilters = {
  status: string
  order_type: string
  fulfillment_type: string
  payment_type: string
  delivery_status: string
  delivery_governorate_id: string
  delivery_area_id: string
  customer_phone: string
  order_number: string
  has_shipment: string
  warehouse_fulfillment_status: string
  partially_delivered: string
  merchant_id: string
  date_from: string
  date_to: string
  search: string
}

const initialFilters: OrdersListFilters = {
  status: '',
  order_type: '',
  fulfillment_type: '',
  payment_type: '',
  delivery_status: '',
  delivery_governorate_id: '',
  delivery_area_id: '',
  customer_phone: '',
  order_number: '',
  has_shipment: '',
  warehouse_fulfillment_status: '',
  partially_delivered: '',
  merchant_id: '',
  date_from: '',
  date_to: '',
  search: '',
}

export function OrdersListPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const searchText = searchParams.get('search') ?? ''
  const [filters, setFilters] = useState(() => ({
    ...initialFilters,
    search: searchText,
  }))
  const [orderPendingDelete, setOrderPendingDelete] = useState<{ id: number; orderNumber: string } | null>(null)
  const [selectedOrderForLabel, setSelectedOrderForLabel] = useState<Order | null>(null)
  const [isOrderLabelDialogOpen, setIsOrderLabelDialogOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const queryClient = useQueryClient()
  const params = useMemo(() => ({
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.order_type ? { order_type: filters.order_type } : {}),
    ...(filters.fulfillment_type ? { fulfillment_type: filters.fulfillment_type } : {}),
    ...(filters.payment_type ? { payment_type: filters.payment_type } : {}),
    ...(filters.delivery_status ? { delivery_status: filters.delivery_status } : {}),
    ...(filters.delivery_governorate_id ? { delivery_governorate_id: filters.delivery_governorate_id } : {}),
    ...(filters.delivery_area_id ? { delivery_area_id: filters.delivery_area_id } : {}),
    ...(filters.customer_phone ? { customer_phone: filters.customer_phone } : {}),
    ...(filters.order_number ? { order_number: filters.order_number } : {}),
    ...(filters.has_shipment ? { has_shipment: filters.has_shipment } : {}),
    ...(filters.warehouse_fulfillment_status ? { warehouse_fulfillment_status: filters.warehouse_fulfillment_status } : {}),
    ...(filters.partially_delivered ? { partially_delivered: filters.partially_delivered } : {}),
    ...(filters.merchant_id ? { merchant_id: filters.merchant_id } : {}),
    ...(filters.date_from ? { date_from: filters.date_from } : {}),
    ...(filters.date_to ? { date_to: filters.date_to } : {}),
    ...(filters.search ? { search: filters.search } : {}),
  }), [filters])
  const query = useQuery({
    queryKey: ['orders', params],
    queryFn: () => listOrders(params),
    placeholderData: (previousData) => previousData,
  })
  const deleteMutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: async () => {
      setOrderPendingDelete(null)
      setSuccessMessage(t('Order deleted successfully.', { defaultValue: 'Order deleted successfully.' }))
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
  const confirmMutation = useMutation({
    mutationFn: confirmOrder,
    onSuccess: async () => {
      setSuccessMessage(t('Order confirmed successfully.', { defaultValue: 'Order confirmed successfully.' }))
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
  const createShipmentMutation = useMutation({
    mutationFn: createShipmentFromOrder,
    onSuccess: async () => {
      setSuccessMessage(t('Shipment created successfully.', { defaultValue: 'Shipment created successfully.' }))
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
      await queryClient.invalidateQueries({ queryKey: ['shipments'] })
    },
  })

  const orders = query.data?.data ?? []

  useEffect(() => {
    setFilters((current) => (
      current.search === searchText
        ? current
        : {
          ...current,
          search: searchText,
        }
    ))
  }, [searchText])

  return (
    <section className="page-section">
      <PageHeader
        title={t('Orders')}
        description={t('Orders with merchant, customer, commercial, and shipment state details.', {
          defaultValue: 'Orders with merchant, customer, commercial, and shipment state details.',
        })}
        actions={
          <Can permission={PERMISSIONS.ORDERS_CREATE}>
            <Link className="ui-link-reset" to={adminPath('/orders/create')}>
              <Button>{t('Create Order', { defaultValue: 'Create Order' })}</Button>
            </Link>
          </Can>
        }
      />

      <Card variant="flat" className="dashboard-filter-card">
        <CardHeader>
          <CardTitle>{t('Filters')}</CardTitle>
          <CardDescription>{t('Filters are applied with local state and backend query params without reloading the page.', { defaultValue: 'Filters are applied with local state and backend query params without reloading the page.' })}</CardDescription>
        </CardHeader>
        <CardContent className="dashboard-filters">
          <label className="field">
            <span>{t('Status')}</span>
            <Select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="">{t('All statuses')}</option>
              <option value="draft">draft</option>
              <option value="pending_review">pending_review</option>
              <option value="confirmed">confirmed</option>
              <option value="shipment_created">shipment_created</option>
              <option value="delivered">delivered</option>
              <option value="partially_delivered">partially_delivered</option>
              <option value="failed">failed</option>
              <option value="cancelled">cancelled</option>
            </Select>
          </label>

          <label className="field">
            <span>{t('Order Type', { defaultValue: 'Order Type' })}</span>
            <Select value={filters.order_type} onChange={(event) => setFilters((current) => ({ ...current, order_type: event.target.value }))}>
              <option value="">{t('All order types', { defaultValue: 'All order types' })}</option>
              <option value="delivery">delivery</option>
              <option value="swap">swap</option>
              <option value="return">return</option>
            </Select>
          </label>

          <label className="field">
            <span>{t('Fulfillment Type', { defaultValue: 'Fulfillment Type' })}</span>
            <Select value={filters.fulfillment_type} onChange={(event) => setFilters((current) => ({ ...current, fulfillment_type: event.target.value }))}>
              <option value="">{t('All fulfillment types', { defaultValue: 'All fulfillment types' })}</option>
              <option value="pickup_from_merchant">pickup_from_merchant</option>
              <option value="from_warehouse">from_warehouse</option>
              <option value="pickup_from_customer">pickup_from_customer</option>
            </Select>
          </label>

          <label className="field">
            <span>{t('Payment Type', { defaultValue: 'Payment Type' })}</span>
            <Select value={filters.payment_type} onChange={(event) => setFilters((current) => ({ ...current, payment_type: event.target.value }))}>
              <option value="">{t('All payment types', { defaultValue: 'All payment types' })}</option>
              <option value="cod">cod</option>
              <option value="prepaid">prepaid</option>
            </Select>
          </label>

          <label className="field">
            <span>{t('Delivery Status', { defaultValue: 'Delivery Status' })}</span>
            <Select value={filters.delivery_status} onChange={(event) => setFilters((current) => ({ ...current, delivery_status: event.target.value }))}>
              <option value="">{t('All delivery statuses', { defaultValue: 'All delivery statuses' })}</option>
              <option value="pending">pending</option>
              <option value="reserved">reserved</option>
              <option value="fulfilled">fulfilled</option>
              <option value="partially_delivered">partially_delivered</option>
              <option value="delivered">delivered</option>
              <option value="returned">returned</option>
              <option value="damaged">damaged</option>
              <option value="cancelled">cancelled</option>
            </Select>
          </label>

          <label className="field">
            <span>{t('Warehouse Fulfillment', { defaultValue: 'Warehouse Fulfillment' })}</span>
            <Select value={filters.warehouse_fulfillment_status} onChange={(event) => setFilters((current) => ({ ...current, warehouse_fulfillment_status: event.target.value }))}>
              <option value="">{t('All warehouse states', { defaultValue: 'All warehouse states' })}</option>
              <option value="not_required">not_required</option>
              <option value="pending_reservation">pending_reservation</option>
              <option value="reserved">reserved</option>
              <option value="picking">picking</option>
              <option value="picked">picked</option>
              <option value="packing">packing</option>
              <option value="packed">packed</option>
              <option value="ready_for_dispatch">ready_for_dispatch</option>
              <option value="fulfilled">fulfilled</option>
              <option value="cancelled">cancelled</option>
            </Select>
          </label>

          <label className="field">
            <span>{t('Partially Delivered', { defaultValue: 'Partially Delivered' })}</span>
            <Select value={filters.partially_delivered} onChange={(event) => setFilters((current) => ({ ...current, partially_delivered: event.target.value }))}>
              <option value="">{t('All orders', { defaultValue: 'All orders' })}</option>
              <option value="1">{t('Yes', { defaultValue: 'Yes' })}</option>
              <option value="0">{t('No', { defaultValue: 'No' })}</option>
            </Select>
          </label>

          <label className="field">
            <span>{t('Merchant')}</span>
            <MerchantSelector
              value={filters.merchant_id}
              onChange={(merchant_id) => setFilters((current) => ({ ...current, merchant_id }))}
              includeAllOption
            />
          </label>

          <GovernorateAreaSelector
            governorateId={filters.delivery_governorate_id}
            areaId={filters.delivery_area_id}
            includeAllOption
            onChange={({ governorate_id, area_id }) => {
              setFilters((current) => ({
                ...current,
                delivery_governorate_id: governorate_id,
                delivery_area_id: area_id,
              }))
            }}
          />

          <label className="field">
            <span>{t('Customer Phone', { defaultValue: 'Customer Phone' })}</span>
            <Input
              value={filters.customer_phone}
              onChange={(event) => setFilters((current) => ({ ...current, customer_phone: event.target.value }))}
              placeholder={t('Exact or partial phone', { defaultValue: 'Exact or partial phone' })}
            />
          </label>

          <label className="field">
            <span>{t('Order Number', { defaultValue: 'Order Number' })}</span>
            <Input
              value={filters.order_number}
              onChange={(event) => setFilters((current) => ({ ...current, order_number: event.target.value }))}
              placeholder={t('ORD-...', { defaultValue: 'ORD-...' })}
            />
          </label>

          <label className="field">
            <span>{t('Has Shipment', { defaultValue: 'Has Shipment' })}</span>
            <Select value={filters.has_shipment} onChange={(event) => setFilters((current) => ({ ...current, has_shipment: event.target.value }))}>
              <option value="">{t('All orders', { defaultValue: 'All orders' })}</option>
              <option value="1">{t('Yes', { defaultValue: 'Yes' })}</option>
              <option value="0">{t('No', { defaultValue: 'No' })}</option>
            </Select>
          </label>

          <label className="field">
            <span>{t('Search')}</span>
            <Input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder={t('Order number, customer, or phone', { defaultValue: 'Order number, customer, or phone' })}
            />
          </label>

          <DateRangeFilter
            dateFrom={filters.date_from}
            dateTo={filters.date_to}
            onChange={({ date_from, date_to }) => setFilters((current) => ({ ...current, date_from, date_to }))}
          />
        </CardContent>
        <CardContent>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setFilters(initialFilters)}>
              {t('Reset filters')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="table-card">
        <CardHeader className="table-card__header">
          <CardTitle>{t('Orders')}</CardTitle>
          <CardDescription>{t('Backend-filtered orders with view, edit, delete, confirm, and shipment actions.', { defaultValue: 'Backend-filtered orders with view, edit, delete, confirm, and shipment actions.' })}</CardDescription>
        </CardHeader>
        <CardContent>
          {successMessage ? <div className="form-success">{successMessage}</div> : null}
          {deleteMutation.error ? <div className="form-error">{getApiErrorMessage(deleteMutation.error)}</div> : null}
          {confirmMutation.error ? <div className="form-error">{getApiErrorMessage(confirmMutation.error)}</div> : null}
          {createShipmentMutation.error ? <div className="form-error">{getApiErrorMessage(createShipmentMutation.error)}</div> : null}
          {query.isPending && !query.data ? <LoadingState title={t('Loading orders', { defaultValue: 'Loading orders' })} /> : null}
          {query.isError ? (
            <ErrorState
              title={t('Unable to load orders', { defaultValue: 'Unable to load orders' })}
              message={getApiErrorMessage(query.error)}
              onRetry={() => void query.refetch()}
            />
          ) : null}
          {!query.isPending && !query.isError && !orders.length ? (
            <EmptyState
              title={t('No orders found', { defaultValue: 'No orders found' })}
              description={t('No orders match the selected filters.', { defaultValue: 'No orders match the selected filters.' })}
            />
          ) : null}
          {orders.length ? (
            <TableContainer>
              <Table variant="striped">
                <thead>
                  <tr>
                    <TableHead>{t('Order')}</TableHead>
                    <TableHead>{t('Merchant')}</TableHead>
                    <TableHead>{t('Order Type', { defaultValue: 'Order Type' })}</TableHead>
                    <TableHead>{t('Fulfillment', { defaultValue: 'Fulfillment' })}</TableHead>
                    <TableHead>{t('Warehouse Flow', { defaultValue: 'Warehouse Flow' })}</TableHead>
                    <TableHead>{t('Payment', { defaultValue: 'Payment' })}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Created')}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const hasShipment = Boolean(order.shipment ?? order.shipment_id ?? order.shipment_number)
                    const isShipmentCreated = order.status === 'shipment_created' || hasShipment
                    const warehouseReadyForShipment = order.fulfillment_type !== 'from_warehouse'
                      || order.warehouse_fulfillment_status === 'fulfilled'
                    const canCreateShipment =
                      order.status === 'confirmed'
                      && !order.requires_review
                      && order.items.length > 0
                      && !hasShipment
                      && warehouseReadyForShipment
                    const canConfirm = (order.status === 'draft' || order.status === 'pending_review') && !order.requires_review && order.items.length > 0

                    return (
                      <tr key={order.id}>
                        <TableCell>
                          <Link className="table-link" to={adminPath(`/orders/${order.id}`)}>
                            {order.order_number}
                          </Link>
                        </TableCell>
                        <TableCell>{order.merchant_name}</TableCell>
                        <TableCell>{order.order_type ?? '-'}</TableCell>
                        <TableCell>
                          <StatusBadge value={order.fulfillment_type}>
                            {pickDisplayLabel(order.fulfillment_type, order.fulfillment_type_label)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>
                          {order.fulfillment_type === 'from_warehouse' ? (
                            <StatusBadge value={order.warehouse_fulfillment_status}>
                              {pickDisplayLabel(order.warehouse_fulfillment_status, order.warehouse_fulfillment_status_label)}
                            </StatusBadge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge value={order.payment_type}>
                            {pickDisplayLabel(order.payment_type, order.payment_type_label)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge value={order.status}>
                            {pickDisplayLabel(order.status, order.status_label)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>{formatDate(order.created_at)}</TableCell>
                        <TableCell>
                          <Dropdown>
                            <DropdownMenu>
                              <DropdownTrigger>...</DropdownTrigger>
                              <DropdownContent>
                                <DropdownItem
                                  onClick={() => {
                                    navigate(adminPath(`/orders/${order.id}`))
                                  }}
                                >
                                  {t('View')}
                                </DropdownItem>
                                {!isShipmentCreated ? (
                                  <Can permission={PERMISSIONS.ORDERS_UPDATE}>
                                    <DropdownItem onClick={() => navigate(adminPath(`/orders/${order.id}/edit`))}>
                                      {t('Edit')}
                                    </DropdownItem>
                                  </Can>
                                ) : null}
                                {!isShipmentCreated ? (
                                  <Can permission={PERMISSIONS.ORDERS_DELETE}>
                                    <DropdownItem destructive onClick={() => setOrderPendingDelete({ id: order.id, orderNumber: order.order_number })}>
                                      {t('Delete')}
                                    </DropdownItem>
                                  </Can>
                                ) : null}
                                {canConfirm ? (
                                  <Can permission={PERMISSIONS.ORDERS_CONFIRM}>
                                    <DropdownItem onClick={() => confirmMutation.mutate(order.id)}>
                                      {t('Confirm')}
                                    </DropdownItem>
                                  </Can>
                                ) : null}
                                {!isShipmentCreated ? (
                                  <Can permission={PERMISSIONS.ORDERS_CREATE_SHIPMENT}>
                                    <DropdownItem
                                      disabled={!canCreateShipment}
                                      title={
                                        !canCreateShipment
                                          ? (order.fulfillment_type === 'from_warehouse' && order.warehouse_fulfillment_status !== 'fulfilled' && order.status === 'confirmed')
                                            ? t('Awaiting warehouse fulfillment before shipment can be created.', { defaultValue: 'Awaiting warehouse fulfillment before shipment can be created.' })
                                            : t('Order must be confirmed and approved to create a shipment.', { defaultValue: 'Order must be confirmed and approved to create a shipment.' })
                                          : undefined
                                      }
                                      onClick={() => createShipmentMutation.mutate(order.id)}
                                    >
                                      {t('Create Shipment')}
                                    </DropdownItem>
                                  </Can>
                                ) : null}
                                <DropdownItem
                                  onClick={(event) => {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    setSelectedOrderForLabel(order)
                                    setIsOrderLabelDialogOpen(true)
                                  }}
                                >
                                  {t('Label', { defaultValue: 'Label' })}
                                </DropdownItem>
                              </DropdownContent>
                            </DropdownMenu>
                          </Dropdown>
                        </TableCell>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </TableContainer>
          ) : null}
        </CardContent>
      </Card>

      <ConfirmActionModal
        open={Boolean(orderPendingDelete)}
        title={t('Delete order', { defaultValue: 'Delete order' })}
        description={orderPendingDelete ? t('Delete order {{orderNumber}}?', {
          orderNumber: orderPendingDelete.orderNumber,
          defaultValue: `Delete order ${orderPendingDelete.orderNumber}?`,
        }) : ''}
        confirmLabel={t('Delete order', { defaultValue: 'Delete order' })}
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setOrderPendingDelete(null)}
        onConfirm={() => {
          if (orderPendingDelete) {
            deleteMutation.mutate(orderPendingDelete.id)
          }
        }}
      />

      <LabelDocumentDialog
        defaultFormat="html"
        fetchDocument={(options) => {
          if (!selectedOrderForLabel) {
            throw new Error(t('No order selected for label.', { defaultValue: 'No order selected for label.' }))
          }

          return getOrderPrintableLabelDocument({
            fetchDocument: (requestOptions) => getOrderLabel(selectedOrderForLabel.id, requestOptions),
            locale,
            options,
            order: selectedOrderForLabel,
            t,
          })
        }}
        formats={['html', 'pdf']}
        hideTrigger
        onOpenChange={(nextOpen) => {
          setIsOrderLabelDialogOpen(nextOpen)
          if (!nextOpen) {
            setSelectedOrderForLabel(null)
          }
        }}
        open={isOrderLabelDialogOpen}
        title={t('Order Label - {{orderNumber}}', {
          orderNumber: selectedOrderForLabel?.order_number ?? '',
          defaultValue: selectedOrderForLabel
            ? `Order Label - ${selectedOrderForLabel.order_number}`
            : 'Order Label',
        })}
        triggerLabel={t('Label', { defaultValue: 'Label' })}
      />
    </section>
  )
}
