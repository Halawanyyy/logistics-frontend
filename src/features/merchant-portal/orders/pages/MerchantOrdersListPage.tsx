import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { MoneyDisplay } from '../../../../shared/components/display/MoneyDisplay'
import { DateRangeFilter } from '../../../../shared/components/filters/DateRangeFilter'
import { LabelDocumentDialog } from '../../../../shared/components/labels/LabelDocumentDialog'
import { ConfirmActionModal } from '../../../../shared/components/modals/ConfirmActionModal'
import { EmptyState } from '../../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { Button } from '../../../../shared/components/ui/Button'
import { DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '../../../../shared/components/ui/Dropdown'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../shared/components/ui/Card'
import { Input } from '../../../../shared/components/ui/Input'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { SearchableSelect, type SearchableSelectOption } from '../../../../shared/components/ui/SearchableSelect'
import { Select } from '../../../../shared/components/ui/Select'
import { Table, TableCell, TableContainer, TableHead } from '../../../../shared/components/ui/Table'
import { useLocale } from '../../../../shared/i18n/useLocale'
import { merchantPath } from '../../../../shared/routing/paths'
import { formatDate } from '../../../../shared/utils/formatters'
import type { Order } from '../../../orders/types/order.types'
import { getOrderPrintableLabelDocument } from '../../../orders/utils/orderLabel'
import { CanMerchant } from '../../components/CanMerchant'
import { useMerchantPortalContext } from '../../context/merchantPortal.context'
import {
  listMerchantPortalAreas,
  listMerchantPortalGovernorates,
  type MerchantPortalLocationOption,
} from '../../api/merchantPortal.api'
import {
  cancelMerchantPortalOrder,
  confirmMerchantPortalOrder,
  getMerchantPortalOrderLabel,
  listMerchantPortalOrders,
} from '../api/merchantPortalOrders.api'
import { MerchantOrderStatusBadge } from '../components/MerchantOrderStatusBadge'
import type { MerchantPortalOrder, MerchantPortalOrderFilters } from '../types/merchantPortalOrders.types'

type PendingAction = {
  orderId: number
  orderNumber: string
  type: 'confirm' | 'cancel'
}

const initialFilters: Required<Omit<MerchantPortalOrderFilters, 'has_shipment'>> & {
  has_shipment: string
} = {
  customer_phone: '',
  date_from: '',
  date_to: '',
  delivery_area_id: '',
  delivery_governorate_id: '',
  fulfillment_type: '',
  has_shipment: '',
  order_number: '',
  order_type: '',
  payment_type: '',
  search: '',
  status: '',
  warehouse_fulfillment_status: '',
}

function buildLocationSelectOption(
  option: MerchantPortalLocationOption,
  useArabicLabel: boolean,
): SearchableSelectOption {
  const fallbackLabel = String(option.id)

  return {
    label: useArabicLabel
      ? option.name_ar || option.name || fallbackLabel
      : option.name || option.name_ar || fallbackLabel,
    value: String(option.id),
    keywords: [option.name, option.name_ar, fallbackLabel].filter(Boolean) as string[],
  }
}

export function MerchantOrdersListPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const queryClient = useQueryClient()
  const { hasMerchantCapability } = useMerchantPortalContext()
  const [filters, setFilters] = useState(initialFilters)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [selectedOrderForLabel, setSelectedOrderForLabel] = useState<MerchantPortalOrder | null>(null)
  const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const useArabicLabel = locale === 'ar'
  const selectedGovernorateId = Number(filters.delivery_governorate_id || 0)

  const params = useMemo<MerchantPortalOrderFilters>(() => ({
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.date_from ? { date_from: filters.date_from } : {}),
    ...(filters.date_to ? { date_to: filters.date_to } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.order_type ? { order_type: filters.order_type } : {}),
    ...(filters.payment_type ? { payment_type: filters.payment_type } : {}),
    ...(filters.fulfillment_type ? { fulfillment_type: filters.fulfillment_type } : {}),
    ...(filters.customer_phone ? { customer_phone: filters.customer_phone } : {}),
    ...(filters.order_number ? { order_number: filters.order_number } : {}),
    ...(filters.has_shipment ? { has_shipment: filters.has_shipment } : {}),
    ...(filters.warehouse_fulfillment_status ? { warehouse_fulfillment_status: filters.warehouse_fulfillment_status } : {}),
    ...(filters.delivery_governorate_id ? { delivery_governorate_id: filters.delivery_governorate_id } : {}),
    ...(filters.delivery_area_id ? { delivery_area_id: filters.delivery_area_id } : {}),
  }), [filters])

  const ordersQuery = useQuery({
    queryKey: ['merchant-portal-orders', params],
    queryFn: () => listMerchantPortalOrders(params),
  })
  const governoratesQuery = useQuery({
    queryKey: ['merchant-portal-governorates', 'orders-list'],
    queryFn: listMerchantPortalGovernorates,
  })
  const areasQuery = useQuery({
    queryKey: ['merchant-portal-areas', 'orders-list', selectedGovernorateId],
    queryFn: () => listMerchantPortalAreas(selectedGovernorateId),
    enabled: selectedGovernorateId > 0,
  })

  async function invalidateOrders() {
    await queryClient.invalidateQueries({ queryKey: ['merchant-portal-orders'] })
  }

  const confirmMutation = useMutation({
    mutationFn: (orderId: number) => confirmMerchantPortalOrder(orderId),
    onSuccess: async () => {
      setPendingAction(null)
      setSuccessMessage(t('Order confirmed successfully.', { defaultValue: 'Order confirmed successfully.' }))
      await invalidateOrders()
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (orderId: number) => cancelMerchantPortalOrder(orderId),
    onSuccess: async () => {
      setPendingAction(null)
      setSuccessMessage(t('Order cancelled successfully.', { defaultValue: 'Order cancelled successfully.' }))
      await invalidateOrders()
    },
  })

  const governorateOptions = useMemo(
    () => (governoratesQuery.data ?? []).map((option) => buildLocationSelectOption(option, useArabicLabel)),
    [governoratesQuery.data, useArabicLabel],
  )
  const areaOptions = useMemo(
    () => (areasQuery.data ?? []).map((option) => buildLocationSelectOption(option, useArabicLabel)),
    [areasQuery.data, useArabicLabel],
  )
  const orders = ordersQuery.data?.data ?? []
  const canCreate = hasMerchantCapability('orders.create')

  function canShowEdit(order: MerchantPortalOrder) {
    if (!hasMerchantCapability('orders.update')) {
      return false
    }

    return !order.has_shipment && order.status !== 'cancelled' && order.status !== 'delivered'
  }

  function canShowConfirm(order: MerchantPortalOrder) {
    if (!hasMerchantCapability('orders.confirm')) {
      return false
    }

    return !order.has_shipment && (order.status === 'draft' || order.status === 'pending_review')
  }

  function canShowCancel(order: MerchantPortalOrder) {
    if (!hasMerchantCapability('orders.cancel')) {
      return false
    }

    return !order.has_shipment && order.status !== 'cancelled' && order.status !== 'delivered'
  }

  return (
    <section className="page-section page-section--with-sidebar">
      <PageHeader
        eyebrow={t('Merchant Portal', { defaultValue: 'Merchant Portal' })}
        title={t('Orders', { defaultValue: 'Orders' })}
        description={t('Manage and track your orders.', { defaultValue: 'Manage and track your orders.' })}
        actions={canCreate ? (
          <Link className="ui-link-reset" to={merchantPath('/orders/create')}>
            <Button>{t('Create Order', { defaultValue: 'Create Order' })}</Button>
          </Link>
        ) : null}
      />

      <aside className="page-sidebar-filters">
        <Card variant="flat" className="dashboard-filter-card">
          <CardHeader>
            <CardTitle>{t('Filters', { defaultValue: 'Filters' })}</CardTitle>
            <CardDescription>
              {t('Merchant-safe filters applied with merchant portal query params only.', {
                defaultValue: 'Merchant-safe filters applied with merchant portal query params only.',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="dashboard-filters dashboard-filters--sidebar">
            <label className="field">
              <span>{t('Search', { defaultValue: 'Search' })}</span>
              <Input
                placeholder={t('Search orders...', { defaultValue: 'Search orders...' })}
                type="search"
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              />
            </label>

            <label className="field">
              <span>{t('Status', { defaultValue: 'Status' })}</span>
              <Select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
                <option value="">{t('All statuses', { defaultValue: 'All statuses' })}</option>
                <option value="draft">{t('draft', { defaultValue: 'draft' })}</option>
                <option value="pending_review">{t('pending_review', { defaultValue: 'pending_review' })}</option>
                <option value="confirmed">{t('confirmed', { defaultValue: 'confirmed' })}</option>
                <option value="cancelled">{t('cancelled', { defaultValue: 'cancelled' })}</option>
              </Select>
            </label>

            <label className="field">
              <span>{t('Order Type', { defaultValue: 'Order Type' })}</span>
              <Select value={filters.order_type} onChange={(event) => setFilters((current) => ({ ...current, order_type: event.target.value }))}>
                <option value="">{t('All order types', { defaultValue: 'All order types' })}</option>
                <option value="delivery">{t('delivery', { defaultValue: 'delivery' })}</option>
                <option value="swap">{t('swap', { defaultValue: 'swap' })}</option>
                <option value="return">{t('return', { defaultValue: 'return' })}</option>
              </Select>
            </label>

            <label className="field">
              <span>{t('Payment Type', { defaultValue: 'Payment Type' })}</span>
              <Select value={filters.payment_type} onChange={(event) => setFilters((current) => ({ ...current, payment_type: event.target.value }))}>
                <option value="">{t('All payment types', { defaultValue: 'All payment types' })}</option>
                <option value="cod">{t('cod', { defaultValue: 'cod' })}</option>
                <option value="prepaid">{t('prepaid', { defaultValue: 'prepaid' })}</option>
              </Select>
            </label>

            <label className="field">
              <span>{t('Fulfillment Type', { defaultValue: 'Fulfillment Type' })}</span>
              <Select value={filters.fulfillment_type} onChange={(event) => setFilters((current) => ({ ...current, fulfillment_type: event.target.value }))}>
                <option value="">{t('All fulfillment', { defaultValue: 'All fulfillment' })}</option>
                <option value="pickup_from_merchant">{t('pickup_from_merchant', { defaultValue: 'pickup_from_merchant' })}</option>
                <option value="from_warehouse">{t('from_warehouse', { defaultValue: 'from_warehouse' })}</option>
                <option value="pickup_from_customer">{t('pickup_from_customer', { defaultValue: 'pickup_from_customer' })}</option>
              </Select>
            </label>

            <DateRangeFilter
              dateFrom={filters.date_from}
              dateTo={filters.date_to}
              onChange={({ date_from, date_to }) => setFilters((current) => ({ ...current, date_from, date_to }))}
            />

            <label className="field">
              <span>{t('Order Number', { defaultValue: 'Order Number' })}</span>
              <Input
                value={filters.order_number}
                onChange={(event) => setFilters((current) => ({ ...current, order_number: event.target.value }))}
              />
            </label>

            <label className="field">
              <span>{t('Customer Phone', { defaultValue: 'Customer Phone' })}</span>
              <Input
                value={filters.customer_phone}
                onChange={(event) => setFilters((current) => ({ ...current, customer_phone: event.target.value }))}
              />
            </label>

            <label className="field">
              <span>{t('Delivery Governorate', { defaultValue: 'Delivery Governorate' })}</span>
              <SearchableSelect
                value={filters.delivery_governorate_id}
                options={governorateOptions}
                placeholder={governoratesQuery.isLoading
                  ? t('Loading locations...', { defaultValue: 'Loading locations...' })
                  : t('Select governorate', { defaultValue: 'Select governorate' })}
                searchPlaceholder={t('Search governorates...', { defaultValue: 'Search governorates...' })}
                emptyMessage={t('No options found.', { defaultValue: 'No options found.' })}
                disabled={governoratesQuery.isLoading || governoratesQuery.isError}
                onChange={(value) => setFilters((current) => ({
                  ...current,
                  delivery_governorate_id: value,
                  delivery_area_id: '',
                }))}
              />
              {governoratesQuery.isError ? (
                <small>{t('Failed to load locations', { defaultValue: 'Failed to load locations' })}</small>
              ) : null}
            </label>

            <label className="field">
              <span>{t('Delivery Area', { defaultValue: 'Delivery Area' })}</span>
              <SearchableSelect
                value={filters.delivery_area_id}
                options={areaOptions}
                placeholder={!selectedGovernorateId
                  ? t('Select governorate first', { defaultValue: 'Select governorate first' })
                  : areasQuery.isLoading
                    ? t('Loading locations...', { defaultValue: 'Loading locations...' })
                    : t('Select area', { defaultValue: 'Select area' })}
                searchPlaceholder={t('Search areas...', { defaultValue: 'Search areas...' })}
                emptyMessage={t('No options found.', { defaultValue: 'No options found.' })}
                disabled={!selectedGovernorateId || areasQuery.isLoading || areasQuery.isError}
                onChange={(value) => setFilters((current) => ({ ...current, delivery_area_id: value }))}
              />
              {!selectedGovernorateId ? (
                <small>{t('Select governorate first', { defaultValue: 'Select governorate first' })}</small>
              ) : null}
              {areasQuery.isError ? (
                <small>{t('Failed to load locations', { defaultValue: 'Failed to load locations' })}</small>
              ) : null}
            </label>

            <label className="field">
              <span>{t('Has Shipment', { defaultValue: 'Has Shipment' })}</span>
              <Select value={filters.has_shipment} onChange={(event) => setFilters((current) => ({ ...current, has_shipment: event.target.value }))}>
                <option value="">{t('All', { defaultValue: 'All' })}</option>
                <option value="1">{t('Yes', { defaultValue: 'Yes' })}</option>
                <option value="0">{t('No', { defaultValue: 'No' })}</option>
              </Select>
            </label>

            <label className="field">
              <span>{t('Warehouse Fulfillment', { defaultValue: 'Warehouse Fulfillment' })}</span>
              <Select
                value={filters.warehouse_fulfillment_status}
                onChange={(event) => setFilters((current) => ({ ...current, warehouse_fulfillment_status: event.target.value }))}
              >
                <option value="">{t('All', { defaultValue: 'All' })}</option>
                <option value="not_required">{t('not_required', { defaultValue: 'not_required' })}</option>
                <option value="pending_reservation">{t('pending_reservation', { defaultValue: 'pending_reservation' })}</option>
                <option value="reserved">{t('reserved', { defaultValue: 'reserved' })}</option>
                <option value="picking">{t('picking', { defaultValue: 'picking' })}</option>
                <option value="picked">{t('picked', { defaultValue: 'picked' })}</option>
                <option value="packing">{t('packing', { defaultValue: 'packing' })}</option>
                <option value="packed">{t('packed', { defaultValue: 'packed' })}</option>
                <option value="ready_for_dispatch">{t('ready_for_dispatch', { defaultValue: 'ready_for_dispatch' })}</option>
                <option value="fulfilled">{t('fulfilled', { defaultValue: 'fulfilled' })}</option>
                <option value="cancelled">{t('cancelled', { defaultValue: 'cancelled' })}</option>
              </Select>
            </label>
          </CardContent>
          <CardContent>
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => setFilters(initialFilters)}>
                {t('Reset filters', { defaultValue: 'Reset filters' })}
              </Button>
            </div>
          </CardContent>
        </Card>
      </aside>

      <main className="page-main-content">
        <Card className="table-card">
          <CardHeader className="table-card__header">
            <div>
              <CardTitle>{t('Orders', { defaultValue: 'Orders' })}</CardTitle>
              <CardDescription>
                {t('Merchant-scoped orders with conservative action visibility and merchant-safe filter inputs.', {
                  defaultValue: 'Merchant-scoped orders with conservative action visibility and merchant-safe filter inputs.',
                })}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {successMessage ? <div className="form-success">{successMessage}</div> : null}
            {confirmMutation.error ? <div className="form-error">{getApiErrorMessage(confirmMutation.error)}</div> : null}
            {cancelMutation.error ? <div className="form-error">{getApiErrorMessage(cancelMutation.error)}</div> : null}

            {ordersQuery.isLoading ? (
              <LoadingState title={t('Loading Orders', { defaultValue: 'Loading Orders' })} />
            ) : ordersQuery.isError ? (
              <ErrorState
                title={t('Failed to load orders.', { defaultValue: 'Failed to load orders.' })}
                message={getApiErrorMessage(ordersQuery.error)}
                onRetry={() => void ordersQuery.refetch()}
              />
            ) : !orders.length ? (
              <EmptyState
                title={t('No orders found.', { defaultValue: 'No orders found.' })}
                description={canCreate
                  ? t('Create your first order to get started.', { defaultValue: 'Create your first order to get started.' })
                  : t('No orders matched the selected filters.', { defaultValue: 'No orders matched the selected filters.' })}
              />
            ) : (
              <TableContainer>
                <Table variant="striped">
                  <thead>
                    <tr>
                      <TableHead>{t('Order Number', { defaultValue: 'Order Number' })}</TableHead>
                      <TableHead>{t('Customer', { defaultValue: 'Customer' })}</TableHead>
                      <TableHead>{t('Phone', { defaultValue: 'Phone' })}</TableHead>
                      <TableHead>{t('Status', { defaultValue: 'Status' })}</TableHead>
                      <TableHead>{t('Order Type', { defaultValue: 'Order Type' })}</TableHead>
                      <TableHead>{t('Payment Type', { defaultValue: 'Payment Type' })}</TableHead>
                      <TableHead>{t('COD Amount', { defaultValue: 'COD Amount' })}</TableHead>
                      <TableHead>{t('Shipping Fee', { defaultValue: 'Shipping Fee' })}</TableHead>
                      <TableHead>{t('Created At', { defaultValue: 'Created At' })}</TableHead>
                      <TableHead>{t('Actions', { defaultValue: 'Actions' })}</TableHead>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <TableCell>
                          <Link className="table-link" to={merchantPath(`/orders/${order.id}`)}>
                            {order.order_number}
                          </Link>
                        </TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell>{order.customer_phone}</TableCell>
                        <TableCell>
                          <MerchantOrderStatusBadge label={order.status_label} value={order.status} />
                        </TableCell>
                        <TableCell>{order.order_type ? t(order.order_type, { defaultValue: order.order_type }) : '-'}</TableCell>
                        <TableCell>
                          <MerchantOrderStatusBadge label={order.payment_type_label} value={order.payment_type} />
                        </TableCell>
                        <TableCell><MoneyDisplay value={order.cod_amount} /></TableCell>
                        <TableCell><MoneyDisplay value={order.shipping_fee} /></TableCell>
                        <TableCell>{formatDate(order.created_at)}</TableCell>
                        <TableCell>
                          <DropdownMenu align="end">
                            <DropdownTrigger className="ui-btn ui-btn--secondary ui-btn--sm">
                              ...
                            </DropdownTrigger>
                            <DropdownContent>
                              <Link className="ui-link-reset" to={merchantPath(`/orders/${order.id}`)}>
                                <DropdownItem>{t('View', { defaultValue: 'View' })}</DropdownItem>
                              </Link>
                              
                              {canShowEdit(order) ? (
                                <Link className="ui-link-reset" to={merchantPath(`/orders/${order.id}/edit`)}>
                                  <DropdownItem>{t('Edit', { defaultValue: 'Edit' })}</DropdownItem>
                                </Link>
                              ) : null}

                              <CanMerchant capability="labels.print">
                                <DropdownItem
                                  onClick={() => {
                                    setSelectedOrderForLabel(order)
                                    setIsLabelDialogOpen(true)
                                  }}
                                >
                                  {t('Print Label', { defaultValue: 'Print Label' })}
                                </DropdownItem>
                              </CanMerchant>
                            </DropdownContent>
                          </DropdownMenu>
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </main>

      <ConfirmActionModal
        open={Boolean(pendingAction)}
        title={pendingAction?.type === 'confirm'
          ? t('Confirm Order', { defaultValue: 'Confirm Order' })
          : t('Cancel Order', { defaultValue: 'Cancel Order' })}
        description={pendingAction?.type === 'confirm'
          ? t('Confirm order {{orderNumber}}?', {
              defaultValue: `Confirm order ${pendingAction?.orderNumber ?? ''}?`,
              orderNumber: pendingAction?.orderNumber ?? '',
            })
          : t('Cancel order {{orderNumber}}?', {
              defaultValue: `Cancel order ${pendingAction?.orderNumber ?? ''}?`,
              orderNumber: pendingAction?.orderNumber ?? '',
            })}
        confirmLabel={pendingAction?.type === 'confirm'
          ? t('Confirm Order', { defaultValue: 'Confirm Order' })
          : t('Cancel Order', { defaultValue: 'Cancel Order' })}
        loading={confirmMutation.isPending || cancelMutation.isPending}
        variant={pendingAction?.type === 'cancel' ? 'danger' : 'default'}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          if (!pendingAction) {
            return
          }

          if (pendingAction.type === 'confirm') {
            confirmMutation.mutate(pendingAction.orderId)
            return
          }

          cancelMutation.mutate(pendingAction.orderId)
        }}
      />

      {selectedOrderForLabel ? (
        <LabelDocumentDialog
          defaultFormat="html"
          fetchDocument={(options) => getOrderPrintableLabelDocument({
            fetchDocument: (requestOptions) => getMerchantPortalOrderLabel(selectedOrderForLabel.id, requestOptions),
            locale,
            options,
            order: selectedOrderForLabel as unknown as Order,
            t,
          })}
          formats={['html', 'pdf']}
          hideTrigger
          onOpenChange={(nextOpen) => {
            setIsLabelDialogOpen(nextOpen)
            if (!nextOpen) {
              setSelectedOrderForLabel(null)
            }
          }}
          open={isLabelDialogOpen}
          title={t('Order Label - {{orderNumber}}', {
            defaultValue: `Order Label - ${selectedOrderForLabel.order_number}`,
            orderNumber: selectedOrderForLabel.order_number,
          })}
          triggerLabel={t('Print Label', { defaultValue: 'Print Label' })}
        />
      ) : null}
    </section>
  )
}
