import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { confirmOrder, deleteOrder, listOrders } from '../api/orders.api'
import { createShipmentFromOrder } from '../../shipments/api/shipments.api'
import { getOrderLabel } from '../../../shared/api/labels.api'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import {
  FilterButton,
  FilterPopover,
  FilterField,
  AppliedFilterChips,
  DateRangeFilter,
  type AppliedChip,
} from '../../../shared/components/filters'
import { LabelDocumentDialog } from '../../../shared/components/labels/LabelDocumentDialog'
import { GovernorateAreaSelector } from '../../../shared/components/selectors/GovernorateAreaSelector'
import { MerchantSelector } from '../../../shared/components/selectors/MerchantSelector'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { ConfirmActionModal } from '../../../shared/components/modals/ConfirmActionModal'
import { Button } from '../../../shared/components/ui/Button'
import { BulkActionBar } from '../../../shared/components/ui/BulkActionBar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '../../../shared/components/ui/Dropdown'
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
import { buildBulkOrderLabelDocument, getOrderPrintableLabelDocument } from '../utils/orderLabel'

type AdvancedOrdersFilters = {
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
}

const initialAdvancedFilters: AdvancedOrdersFilters = {
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
}

export function OrdersListPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const searchText = searchParams.get('search') ?? ''

  const [searchValue, setSearchValue] = useState(searchText)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<AdvancedOrdersFilters>(initialAdvancedFilters)
  const [draftFilters, setDraftFilters] = useState<AdvancedOrdersFilters>(initialAdvancedFilters)
  const [filterError, setFilterError] = useState('')

  const [orderPendingDelete, setOrderPendingDelete] = useState<{ id: number; orderNumber: string } | null>(null)
  const [selectedOrderForLabel, setSelectedOrderForLabel] = useState<Order | null>(null)
  const [isOrderLabelDialogOpen, setIsOrderLabelDialogOpen] = useState(false)
  const [isBulkLabelDialogOpen, setIsBulkLabelDialogOpen] = useState(false)
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([])
  const [bulkConfirmation, setBulkConfirmation] = useState<'confirm' | 'delete' | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const queryClient = useQueryClient()

  useEffect(() => {
    setSearchValue(searchText)
  }, [searchText])

  const params = useMemo(() => ({
    ...(searchValue ? { search: searchValue.trim() } : {}),
    ...(appliedFilters.status ? { status: appliedFilters.status } : {}),
    ...(appliedFilters.order_type ? { order_type: appliedFilters.order_type } : {}),
    ...(appliedFilters.fulfillment_type ? { fulfillment_type: appliedFilters.fulfillment_type } : {}),
    ...(appliedFilters.payment_type ? { payment_type: appliedFilters.payment_type } : {}),
    ...(appliedFilters.delivery_status ? { delivery_status: appliedFilters.delivery_status } : {}),
    ...(appliedFilters.delivery_governorate_id ? { delivery_governorate_id: appliedFilters.delivery_governorate_id } : {}),
    ...(appliedFilters.delivery_area_id ? { delivery_area_id: appliedFilters.delivery_area_id } : {}),
    ...(appliedFilters.customer_phone ? { customer_phone: appliedFilters.customer_phone } : {}),
    ...(appliedFilters.order_number ? { order_number: appliedFilters.order_number } : {}),
    ...(appliedFilters.has_shipment ? { has_shipment: appliedFilters.has_shipment } : {}),
    ...(appliedFilters.warehouse_fulfillment_status ? { warehouse_fulfillment_status: appliedFilters.warehouse_fulfillment_status } : {}),
    ...(appliedFilters.partially_delivered ? { partially_delivered: appliedFilters.partially_delivered } : {}),
    ...(appliedFilters.merchant_id ? { merchant_id: appliedFilters.merchant_id } : {}),
    ...(appliedFilters.date_from ? { date_from: appliedFilters.date_from } : {}),
    ...(appliedFilters.date_to ? { date_to: appliedFilters.date_to } : {}),
  }), [searchValue, appliedFilters])

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

  const bulkOrderMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: 'confirm' | 'delete'; ids: number[] }) => {
      const results = await Promise.allSettled(
        ids.map((orderId) => action === 'confirm' ? confirmOrder(orderId) : deleteOrder(orderId)),
      )
      return {
        action,
        attempted: ids.length,
        failedIds: ids.filter((_, index) => results[index]?.status === 'rejected'),
        succeededIds: ids.filter((_, index) => results[index]?.status === 'fulfilled'),
      }
    },
    onSuccess: async ({ action, attempted, failedIds, succeededIds }) => {
      setBulkConfirmation(null)
      setSelectedOrderIds((current) => current.filter((id) => !succeededIds.includes(id)))
      const actionLabel = action === 'confirm' ? 'confirmed' : 'deleted'
      setSuccessMessage(failedIds.length
        ? `${succeededIds.length} of ${attempted} orders ${actionLabel}; ${failedIds.length} could not be updated.`
        : `${succeededIds.length} orders ${actionLabel} successfully.`)
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  const orders = useMemo(() => query.data?.data ?? [], [query.data?.data])
  const selectedOrders = useMemo(
    () => orders.filter((order) => selectedOrderIds.includes(order.id)),
    [orders, selectedOrderIds],
  )
  const confirmableSelectedOrders = selectedOrders.filter((order) =>
    (order.status === 'draft' || order.status === 'pending_review')
      && !order.requires_review
      && order.items.length > 0,
  )
  const deletableSelectedOrders = selectedOrders.filter((order) =>
    order.status === 'draft'
      && !order.shipment
      && !order.shipment_id
      && !order.shipment_number,
  )
  const allOrdersSelected = orders.length > 0
    && orders.every((order) => selectedOrderIds.includes(order.id))

  // Active filter count (excluding main search text)
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (appliedFilters.status) count += 1
    if (appliedFilters.order_type) count += 1
    if (appliedFilters.fulfillment_type) count += 1
    if (appliedFilters.payment_type) count += 1
    if (appliedFilters.delivery_status) count += 1
    if (appliedFilters.warehouse_fulfillment_status) count += 1
    if (appliedFilters.partially_delivered) count += 1
    if (appliedFilters.merchant_id) count += 1
    if (appliedFilters.delivery_governorate_id || appliedFilters.delivery_area_id) count += 1
    if (appliedFilters.order_number) count += 1
    if (appliedFilters.customer_phone) count += 1
    if (appliedFilters.date_from || appliedFilters.date_to) count += 1
    return count
  }, [appliedFilters])

  // Filter Popover handlers
  const handleOpenChange = (open: boolean) => {
    setFiltersOpen(open)
    if (open) {
      setDraftFilters(appliedFilters)
      setFilterError('')
    }
  }

  const handleApply = () => {
    if (draftFilters.date_from && draftFilters.date_to && draftFilters.date_from > draftFilters.date_to) {
      setFilterError(t('Date From must not be later than Date To.', { defaultValue: 'Date From must not be later than Date To.' }))
      return
    }
    setFilterError('')
    setAppliedFilters(draftFilters)
    setFiltersOpen(false)
  }

  const handleReset = () => {
    setDraftFilters(initialAdvancedFilters)
    setAppliedFilters(initialAdvancedFilters)
    setFilterError('')
    setFiltersOpen(false)
  }

  // Applied Filter Chips
  const appliedChips = useMemo<AppliedChip[]>(() => {
    const chips: AppliedChip[] = []
    if (appliedFilters.status) {
      chips.push({
        id: 'status',
        label: t('Status'),
        value: t(appliedFilters.status, { defaultValue: appliedFilters.status }),
      })
    }
    if (appliedFilters.order_type) {
      chips.push({
        id: 'order_type',
        label: t('Order Type', { defaultValue: 'Order Type' }),
        value: t(appliedFilters.order_type, { defaultValue: appliedFilters.order_type }),
      })
    }
    if (appliedFilters.fulfillment_type) {
      chips.push({
        id: 'fulfillment_type',
        label: t('Fulfillment Type', { defaultValue: 'Fulfillment Type' }),
        value: t(appliedFilters.fulfillment_type, { defaultValue: appliedFilters.fulfillment_type }),
      })
    }
    if (appliedFilters.payment_type) {
      chips.push({
        id: 'payment_type',
        label: t('Payment Type', { defaultValue: 'Payment Type' }),
        value: t(appliedFilters.payment_type, { defaultValue: appliedFilters.payment_type }),
      })
    }
    if (appliedFilters.delivery_status) {
      chips.push({
        id: 'delivery_status',
        label: t('Delivery Status', { defaultValue: 'Delivery Status' }),
        value: t(appliedFilters.delivery_status, { defaultValue: appliedFilters.delivery_status }),
      })
    }
    if (appliedFilters.warehouse_fulfillment_status) {
      chips.push({
        id: 'warehouse_fulfillment_status',
        label: t('Warehouse Flow', { defaultValue: 'Warehouse Flow' }),
        value: t(appliedFilters.warehouse_fulfillment_status, { defaultValue: appliedFilters.warehouse_fulfillment_status }),
      })
    }
    if (appliedFilters.partially_delivered) {
      chips.push({
        id: 'partially_delivered',
        label: t('Partially Delivered', { defaultValue: 'Partially Delivered' }),
        value: appliedFilters.partially_delivered === '1' ? t('Yes') : t('No'),
      })
    }
    if (appliedFilters.order_number) {
      chips.push({
        id: 'order_number',
        label: t('Order Number', { defaultValue: 'Order Number' }),
        value: appliedFilters.order_number,
      })
    }
    if (appliedFilters.customer_phone) {
      chips.push({
        id: 'customer_phone',
        label: t('Customer Phone', { defaultValue: 'Customer Phone' }),
        value: appliedFilters.customer_phone,
      })
    }
    if (appliedFilters.date_from || appliedFilters.date_to) {
      chips.push({
        id: 'date_range',
        label: t('Date'),
        value: `${appliedFilters.date_from || ''} → ${appliedFilters.date_to || ''}`,
      })
    }
    return chips
  }, [appliedFilters, t])

  const handleRemoveChip = (chipId: string) => {
    if (chipId === 'date_range') {
      setAppliedFilters((c) => ({ ...c, date_from: '', date_to: '' }))
    } else {
      setAppliedFilters((c) => ({ ...c, [chipId]: '' }))
    }
  }

  const handleClearAllChips = () => {
    setAppliedFilters(initialAdvancedFilters)
  }

  return (
    <section className="page-section page-layout--fullwidth">
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

      {/* Toolbar: Search input + Filters Button */}
      <div className="page-toolbar">
        <div style={{ position: 'relative', flex: '1 1 280px' }}>
          <Search size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, pointerEvents: 'none' }} />
          <Input
            placeholder={t('Search orders by customer, phone, code...', { defaultValue: 'Search orders by customer, phone, code...' })}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
        </div>

        <div className="page-toolbar__actions">
          <FilterPopover
            title={t('Filter Orders', { defaultValue: 'Filter Orders' })}
            open={filtersOpen}
            onOpenChange={handleOpenChange}
            onApply={handleApply}
            onReset={handleReset}
            trigger={
              <FilterButton
                activeCount={activeFilterCount}
                onClick={() => handleOpenChange(!filtersOpen)}
              />
            }
          >
            <div className="space-y-4">
              <FilterField label={t('Status')}>
                <Select value={draftFilters.status} onChange={(event) => setDraftFilters((c) => ({ ...c, status: event.target.value }))}>
                  <option value="">{t('All statuses')}</option>
                  <option value="draft">{t('draft', { defaultValue: 'draft' })}</option>
                  <option value="pending_review">{t('pending_review', { defaultValue: 'pending_review' })}</option>
                  <option value="confirmed">{t('confirmed', { defaultValue: 'confirmed' })}</option>
                  <option value="shipment_created">{t('shipment_created', { defaultValue: 'shipment_created' })}</option>
                  <option value="delivered">{t('delivered', { defaultValue: 'delivered' })}</option>
                  <option value="partially_delivered">{t('partially_delivered', { defaultValue: 'partially_delivered' })}</option>
                  <option value="failed">{t('failed', { defaultValue: 'failed' })}</option>
                  <option value="cancelled">{t('cancelled', { defaultValue: 'cancelled' })}</option>
                </Select>
              </FilterField>

              <DateRangeFilter
                dateFrom={draftFilters.date_from}
                dateTo={draftFilters.date_to}
                error={filterError}
                onChange={({ date_from, date_to }) => {
                  setFilterError('')
                  setDraftFilters((c) => ({ ...c, date_from, date_to }))
                }}
              />

              <FilterField label={t('Order Type', { defaultValue: 'Order Type' })}>
                <Select value={draftFilters.order_type} onChange={(event) => setDraftFilters((c) => ({ ...c, order_type: event.target.value }))}>
                  <option value="">{t('All order types', { defaultValue: 'All order types' })}</option>
                  <option value="delivery">{t('delivery', { defaultValue: 'delivery' })}</option>
                  <option value="swap">{t('swap', { defaultValue: 'swap' })}</option>
                  <option value="return">{t('return', { defaultValue: 'return' })}</option>
                </Select>
              </FilterField>

              <FilterField label={t('Fulfillment Type', { defaultValue: 'Fulfillment Type' })}>
                <Select value={draftFilters.fulfillment_type} onChange={(event) => setDraftFilters((c) => ({ ...c, fulfillment_type: event.target.value }))}>
                  <option value="">{t('All fulfillment types', { defaultValue: 'All fulfillment types' })}</option>
                  <option value="pickup_from_merchant">{t('pickup_from_merchant', { defaultValue: 'pickup_from_merchant' })}</option>
                  <option value="from_warehouse">{t('from_warehouse', { defaultValue: 'from_warehouse' })}</option>
                  <option value="pickup_from_customer">{t('pickup_from_customer', { defaultValue: 'pickup_from_customer' })}</option>
                </Select>
              </FilterField>

              <FilterField label={t('Payment Type', { defaultValue: 'Payment Type' })}>
                <Select value={draftFilters.payment_type} onChange={(event) => setDraftFilters((c) => ({ ...c, payment_type: event.target.value }))}>
                  <option value="">{t('All payment types', { defaultValue: 'All payment types' })}</option>
                  <option value="cod">{t('cod', { defaultValue: 'cod' })}</option>
                  <option value="prepaid">{t('prepaid', { defaultValue: 'prepaid' })}</option>
                </Select>
              </FilterField>

              <FilterField label={t('Delivery Status', { defaultValue: 'Delivery Status' })}>
                <Select value={draftFilters.delivery_status} onChange={(event) => setDraftFilters((c) => ({ ...c, delivery_status: event.target.value }))}>
                  <option value="">{t('All delivery statuses', { defaultValue: 'All delivery statuses' })}</option>
                  <option value="pending">{t('pending', { defaultValue: 'pending' })}</option>
                  <option value="reserved">{t('reserved', { defaultValue: 'reserved' })}</option>
                  <option value="fulfilled">{t('fulfilled', { defaultValue: 'fulfilled' })}</option>
                  <option value="partially_delivered">{t('partially_delivered', { defaultValue: 'partially_delivered' })}</option>
                  <option value="delivered">{t('delivered', { defaultValue: 'delivered' })}</option>
                  <option value="returned">{t('returned', { defaultValue: 'returned' })}</option>
                  <option value="damaged">{t('damaged', { defaultValue: 'damaged' })}</option>
                  <option value="cancelled">{t('cancelled', { defaultValue: 'cancelled' })}</option>
                </Select>
              </FilterField>

              <FilterField label={t('Warehouse Fulfillment', { defaultValue: 'Warehouse Fulfillment' })}>
                <Select value={draftFilters.warehouse_fulfillment_status} onChange={(event) => setDraftFilters((c) => ({ ...c, warehouse_fulfillment_status: event.target.value }))}>
                  <option value="">{t('All warehouse states', { defaultValue: 'All warehouse states' })}</option>
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
              </FilterField>

              <FilterField label={t('Partially Delivered', { defaultValue: 'Partially Delivered' })}>
                <Select value={draftFilters.partially_delivered} onChange={(event) => setDraftFilters((c) => ({ ...c, partially_delivered: event.target.value }))}>
                  <option value="">{t('All orders', { defaultValue: 'All orders' })}</option>
                  <option value="1">{t('Yes', { defaultValue: 'Yes' })}</option>
                  <option value="0">{t('No', { defaultValue: 'No' })}</option>
                </Select>
              </FilterField>

              <FilterField label={t('Merchant')}>
                <MerchantSelector
                  value={draftFilters.merchant_id}
                  onChange={(merchant_id) => setDraftFilters((c) => ({ ...c, merchant_id }))}
                  includeAllOption
                />
              </FilterField>

              <GovernorateAreaSelector
                governorateId={draftFilters.delivery_governorate_id}
                areaId={draftFilters.delivery_area_id}
                includeAllOption
                onChange={({ governorate_id, area_id }) => {
                  setDraftFilters((c) => ({
                    ...c,
                    delivery_governorate_id: governorate_id,
                    delivery_area_id: area_id,
                  }))
                }}
              />

              <FilterField label={t('Order Number', { defaultValue: 'Order Number' })}>
                <Input
                  value={draftFilters.order_number}
                  onChange={(event) => setDraftFilters((c) => ({ ...c, order_number: event.target.value }))}
                  placeholder={t('ORD-...', { defaultValue: 'ORD-...' })}
                />
              </FilterField>

              <FilterField label={t('Customer Phone', { defaultValue: 'Customer Phone' })}>
                <Input
                  value={draftFilters.customer_phone}
                  onChange={(event) => setDraftFilters((c) => ({ ...c, customer_phone: event.target.value }))}
                  placeholder="01..."
                />
              </FilterField>
            </div>
          </FilterPopover>
        </div>
      </div>

      <AppliedFilterChips
        chips={appliedChips}
        onRemove={handleRemoveChip}
        onClearAll={handleClearAllChips}
      />

      <main className="page-main-content">
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
              <TableContainer className="table-responsive-wrapper">
                <Table variant="striped">
                  <thead>
                    <tr>
                      <TableHead>
                        <input
                          aria-label={t('Select all orders', { defaultValue: 'Select all orders' })}
                          checked={allOrdersSelected}
                          className="bulk-select-checkbox"
                          type="checkbox"
                          onChange={(event) => {
                            setSelectedOrderIds(event.target.checked ? orders.map((order) => order.id) : [])
                          }}
                        />
                      </TableHead>
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
                      const isSelected = selectedOrderIds.includes(order.id)
                      const isDraft = order.status === 'draft'
                      const isPendingReview = order.status === 'pending_review'
                      const isConfirmed = order.status === 'confirmed'
                      const hasShipment = Boolean(order.shipment || order.shipment_id || order.shipment_number)
                      const canDelete = isDraft && !hasShipment
                      const canConfirm = (isDraft || isPendingReview) && !order.requires_review && order.items.length > 0
                      const canCreateShipment = isConfirmed && (order.fulfillment_type !== 'from_warehouse' || order.warehouse_fulfillment_status === 'fulfilled')

                      return (
                        <tr key={order.id} className={isSelected ? 'table-row--selected' : undefined}>
                          <TableCell>
                            <input
                              aria-label={t('Select order {{orderNumber}}', {
                                defaultValue: `Select order ${order.order_number}`,
                                orderNumber: order.order_number,
                              })}
                              checked={isSelected}
                              className="bulk-select-checkbox"
                              type="checkbox"
                              onChange={(event) => {
                                setSelectedOrderIds((current) => (
                                  event.target.checked
                                    ? [...current, order.id]
                                    : current.filter((id) => id !== order.id)
                                ))
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Link className="table-link font-medium" to={adminPath(`/orders/${order.id}`)}>
                              {order.order_number}
                            </Link>
                          </TableCell>
                          <TableCell>{order.merchant_name ?? '-'}</TableCell>
                          <TableCell>{order.order_type ? pickDisplayLabel(order.order_type, order.order_type) : '-'}</TableCell>
                          <TableCell>{order.fulfillment_type ? pickDisplayLabel(order.fulfillment_type, order.fulfillment_type) : '-'}</TableCell>
                          <TableCell>
                            <StatusBadge value={order.warehouse_fulfillment_status}>
                              {order.warehouse_fulfillment_status ? pickDisplayLabel(order.warehouse_fulfillment_status, order.warehouse_fulfillment_status) : '-'}
                            </StatusBadge>
                          </TableCell>
                          <TableCell>{order.payment_type ? pickDisplayLabel(order.payment_type, order.payment_type) : '-'}</TableCell>
                          <TableCell>
                            <StatusBadge value={order.status}>{order.status_label ?? order.status}</StatusBadge>
                          </TableCell>
                          <TableCell>{formatDate(order.created_at)}</TableCell>
                          <TableCell>
                            <DropdownMenu align="end">
                              <DropdownTrigger aria-label={t('Actions')} className="ui-btn ui-btn--secondary ui-btn--sm">
                                {t('Actions')}
                              </DropdownTrigger>
                              <DropdownContent>
                                <DropdownItem onClick={() => navigate(adminPath(`/orders/${order.id}`))}>
                                  {t('View Details')}
                                </DropdownItem>
                                {isDraft ? (
                                  <Can permission={PERMISSIONS.ORDERS_UPDATE}>
                                    <DropdownItem onClick={() => navigate(adminPath(`/orders/${order.id}/edit`))}>
                                      {t('Edit')}
                                    </DropdownItem>
                                  </Can>
                                ) : null}
                                {canDelete ? (
                                  <Can permission={PERMISSIONS.ORDERS_DELETE}>
                                    <DropdownItem
                                      className="text-danger"
                                      onClick={() => setOrderPendingDelete({ id: order.id, orderNumber: order.order_number })}
                                    >
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
                                {!hasShipment ? (
                                  <Can permission={PERMISSIONS.SHIPMENTS_CREATE}>
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

        <BulkActionBar selectedCount={selectedOrderIds.length} onClear={() => setSelectedOrderIds([])}>
          <Can permission={PERMISSIONS.ORDERS_CONFIRM}>
            <Button
              disabled={!confirmableSelectedOrders.length}
              size="sm"
              type="button"
              onClick={() => setBulkConfirmation('confirm')}
            >
              {t('Confirm Orders', { defaultValue: 'Confirm Orders' })}
            </Button>
          </Can>
          <Can permission={PERMISSIONS.ORDERS_VIEW}>
            <Button size="sm" type="button" variant="secondary" onClick={() => setIsBulkLabelDialogOpen(true)}>
              {t('Print Labels', { defaultValue: 'Print Labels' })}
            </Button>
          </Can>
          <Can permission={PERMISSIONS.ORDERS_DELETE}>
            <Button
              disabled={!deletableSelectedOrders.length}
              size="sm"
              type="button"
              variant="danger"
              onClick={() => setBulkConfirmation('delete')}
            >
              {t('Delete Draft Orders', { defaultValue: 'Delete Draft Orders' })}
            </Button>
          </Can>
        </BulkActionBar>

        <LabelDocumentDialog
          defaultFormat="html"
          fetchDocument={(options) => buildBulkOrderLabelDocument({
            dimensions: { heightMm: options.height_mm, widthMm: options.width_mm },
            locale,
            orders: selectedOrders,
            t,
          })}
          formats={['html', 'pdf']}
          hideTrigger
          onOpenChange={setIsBulkLabelDialogOpen}
          open={isBulkLabelDialogOpen}
          title={t('Bulk Order Waybills ({{count}})', {
            count: selectedOrderIds.length,
            defaultValue: `Bulk Order Waybills (${selectedOrderIds.length})`,
          })}
          triggerLabel={t('Print Labels', { defaultValue: 'Print Labels' })}
        />

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

        <ConfirmActionModal
          open={bulkConfirmation === 'confirm'}
          title={t('Confirm selected orders', { defaultValue: 'Confirm selected orders' })}
          description={t('Confirm {{count}} eligible selected orders? Ineligible orders will remain selected.', {
            count: confirmableSelectedOrders.length,
            defaultValue: `Confirm ${confirmableSelectedOrders.length} eligible selected orders? Ineligible orders will remain selected.`,
          })}
          confirmLabel={t('Confirm Orders', { defaultValue: 'Confirm Orders' })}
          loading={bulkOrderMutation.isPending}
          onCancel={() => setBulkConfirmation(null)}
          onConfirm={() => bulkOrderMutation.mutate({
            action: 'confirm',
            ids: confirmableSelectedOrders.map((order) => order.id),
          })}
        />

        <ConfirmActionModal
          open={bulkConfirmation === 'delete'}
          title={t('Delete selected drafts', { defaultValue: 'Delete selected drafts' })}
          description={t('Permanently delete {{count}} eligible draft orders? Other selected orders will not be changed.', {
            count: deletableSelectedOrders.length,
            defaultValue: `Permanently delete ${deletableSelectedOrders.length} eligible draft orders? Other selected orders will not be changed.`,
          })}
          confirmLabel={t('Delete Draft Orders', { defaultValue: 'Delete Draft Orders' })}
          loading={bulkOrderMutation.isPending}
          variant="danger"
          onCancel={() => setBulkConfirmation(null)}
          onConfirm={() => bulkOrderMutation.mutate({
            action: 'delete',
            ids: deletableSelectedOrders.map((order) => order.id),
          })}
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
          title={t('Order Waybill - {{orderNumber}}', {
            orderNumber: selectedOrderForLabel?.order_number ?? '',
            defaultValue: selectedOrderForLabel
              ? `Order Label - ${selectedOrderForLabel.order_number}`
              : 'Order Waybill',
          })}
          triggerLabel={t('Waybill', { defaultValue: 'Waybill' })}
        />
      </main>
    </section>
  )
}
