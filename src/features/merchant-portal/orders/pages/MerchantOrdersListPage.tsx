import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { MoneyDisplay } from '../../../../shared/components/display/MoneyDisplay'
import { LabelDocumentDialog } from '../../../../shared/components/labels/LabelDocumentDialog'
import { ConfirmActionModal } from '../../../../shared/components/modals/ConfirmActionModal'
import { EmptyState } from '../../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { Button } from '../../../../shared/components/ui/Button'
import { DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '../../../../shared/components/ui/Dropdown'
import { Card, CardContent } from '../../../../shared/components/ui/Card'
import { SearchableSelect } from '../../../../shared/components/ui/SearchableSelect'
import { Table, TableCell, TableContainer, TableHead } from '../../../../shared/components/ui/Table'
import { FilterButton, FilterPopover, FilterField, AppliedFilterChips, DateRangeFilter } from '../../../../shared/components/filters'
import type { AppliedChip } from '../../../../shared/components/filters'
import { useLocale } from '../../../../shared/i18n/useLocale'
import { merchantPath } from '../../../../shared/routing/paths'
import { formatDate } from '../../../../shared/utils/formatters'
import type { Order } from '../../../orders/types/order.types'
import { getOrderPrintableLabelDocument } from '../../../orders/utils/orderLabel'
import { CanMerchant } from '../../components/CanMerchant'
import { useMerchantPortalContext } from '../../context/merchantPortal.context'
import {
  cancelMerchantPortalOrder,
  confirmMerchantPortalOrder,
  getMerchantPortalOrderLabel,
  listMerchantPortalOrders,
} from '../api/merchantPortalOrders.api'
import { MerchantOrderStatusBadge } from '../components/MerchantOrderStatusBadge'
import { OrderQuickViewDrawer } from '../components/OrderQuickViewDrawer'
import type { MerchantPortalOrder, MerchantPortalOrderFilters } from '../types/merchantPortalOrders.types'

type PendingAction = {
  orderId: number
  orderNumber: string
  type: 'confirm' | 'cancel'
}

type OrderFilterState = {
  customer_phone: string
  date_from: string
  date_to: string
  delivery_area_id: string
  delivery_governorate_id: string
  fulfillment_type: string
  has_shipment: string
  order_number: string
  order_type: string
  payment_type: string
  status: string
  warehouse_fulfillment_status: string
}

const initialAdvancedFilters: OrderFilterState = {
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
  status: '',
  warehouse_fulfillment_status: '',
}

export function MerchantOrdersListPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const queryClient = useQueryClient()
  const { hasMerchantCapability } = useMerchantPortalContext()

  // Main search (stays visible outside popup)
  const [searchValue, setSearchValue] = useState('')

  // Filter popup and state management (draft vs applied)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<OrderFilterState>(initialAdvancedFilters)
  const [draftFilters, setDraftFilters] = useState<OrderFilterState>(initialAdvancedFilters)
  const [filterError, setFilterError] = useState('')

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [selectedOrderForLabel, setSelectedOrderForLabel] = useState<MerchantPortalOrder | null>(null)
  const [quickViewOrderId, setQuickViewOrderId] = useState<number | null>(null)
  const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const params = useMemo<MerchantPortalOrderFilters>(() => ({
    ...(searchValue ? { search: searchValue.trim() } : {}),
    ...(appliedFilters.date_from ? { date_from: appliedFilters.date_from } : {}),
    ...(appliedFilters.date_to ? { date_to: appliedFilters.date_to } : {}),
    ...(appliedFilters.status ? { status: appliedFilters.status } : {}),
    ...(appliedFilters.order_type ? { order_type: appliedFilters.order_type } : {}),
    ...(appliedFilters.payment_type ? { payment_type: appliedFilters.payment_type } : {}),
    ...(appliedFilters.fulfillment_type ? { fulfillment_type: appliedFilters.fulfillment_type } : {}),
    ...(appliedFilters.customer_phone ? { customer_phone: appliedFilters.customer_phone } : {}),
    ...(appliedFilters.order_number ? { order_number: appliedFilters.order_number } : {}),
    ...(appliedFilters.has_shipment ? { has_shipment: appliedFilters.has_shipment } : {}),
    ...(appliedFilters.warehouse_fulfillment_status ? { warehouse_fulfillment_status: appliedFilters.warehouse_fulfillment_status } : {}),
    ...(appliedFilters.delivery_governorate_id ? { delivery_governorate_id: appliedFilters.delivery_governorate_id } : {}),
    ...(appliedFilters.delivery_area_id ? { delivery_area_id: appliedFilters.delivery_area_id } : {}),
  }), [searchValue, appliedFilters])

  const ordersQuery = useQuery({
    queryKey: ['merchant-portal-orders', params],
    queryFn: () => listMerchantPortalOrders(params),
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

  const orders = ordersQuery.data?.data ?? []
  const canCreate = hasMerchantCapability('orders.create')

  // Calculate active filter count (excluding main search)
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (appliedFilters.status) count += 1
    if (appliedFilters.order_type) count += 1
    if (appliedFilters.payment_type) count += 1
    if (appliedFilters.date_from || appliedFilters.date_to) count += 1
    if (appliedFilters.customer_phone) count += 1
    if (appliedFilters.order_number) count += 1
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
        label: t('Status', { defaultValue: 'Status' }),
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
    if (appliedFilters.payment_type) {
      chips.push({
        id: 'payment_type',
        label: t('Payment Type', { defaultValue: 'Payment Type' }),
        value: t(appliedFilters.payment_type, { defaultValue: appliedFilters.payment_type }),
      })
    }
    if (appliedFilters.date_from || appliedFilters.date_to) {
      chips.push({
        id: 'date_range',
        label: t('Date', { defaultValue: 'Date' }),
        value: appliedFilters.date_from && appliedFilters.date_to
          ? `${appliedFilters.date_from} → ${appliedFilters.date_to}`
          : (appliedFilters.date_from || appliedFilters.date_to),
      })
    }
    return chips
  }, [appliedFilters, t])

  const handleRemoveChip = (chipId: string) => {
    if (chipId === 'date_range') {
      setAppliedFilters((curr) => ({ ...curr, date_from: '', date_to: '' }))
    } else {
      setAppliedFilters((curr) => ({ ...curr, [chipId]: '' }))
    }
  }

  const handleClearAllChips = () => {
    setAppliedFilters(initialAdvancedFilters)
  }

  function canShowEdit(order: MerchantPortalOrder) {
    if (!hasMerchantCapability('orders.update')) {
      return false
    }
    return !order.has_shipment && order.status !== 'cancelled' && order.status !== 'delivered'
  }

  return (
    <section className="merchant-data-workspace orders-workspace space-y-4 p-1 sm:p-2">
      {/* Top Header Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100" style={{ margin: 0, fontSize: '1.5rem' }}>
            {t('Orders', { defaultValue: 'Orders' })}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1" style={{ margin: '4px 0 0 0', fontSize: '0.75rem' }}>
            {t('Total {{count}} orders', { defaultValue: 'Total {{count}} orders', count: orders.length })}
          </p>
        </div>

        {/* Top Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          {canCreate ? (
            <Link className="ui-link-reset" to={merchantPath('/orders/create')}>
              <Button variant="primary">
                <Plus size={16} />
                {t('Add Order', { defaultValue: 'Add Order' })}
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {/* Toolbar: Visible Search Input + Filters Button */}
      <div className="page-toolbar">
        <div style={{ position: 'relative', flex: '1 1 280px' }}>
          <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--content)', opacity: 0.5, pointerEvents: 'none' }}>
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder={t('Search by customer name, phone or order code...', { defaultValue: 'Search by customer name, phone or order code...' })}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            style={{ width: '100%', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--content)', borderRadius: '12px', padding: '10px 40px 10px 16px', fontSize: '0.875rem', outline: 'none' }}
          />
        </div>

        <div className="page-toolbar__actions">
          <FilterPopover
            title={t('Filter Orders', { defaultValue: 'Filter Orders' })}
            activeCount={activeFilterCount}
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
              <DateRangeFilter
                dateFrom={draftFilters.date_from}
                dateTo={draftFilters.date_to}
                error={filterError}
                onChange={({ date_from, date_to }) => {
                  setFilterError('')
                  setDraftFilters((c) => ({ ...c, date_from, date_to }))
                }}
              />

              <FilterField label={t('Status', { defaultValue: 'Status' })}>
                <SearchableSelect
                  value={draftFilters.status}
                  placeholder={t('All statuses', { defaultValue: 'All statuses' })}
                  searchPlaceholder={t('Search status...', { defaultValue: 'Search status...' })}
                  emptyMessage={t('No status found.', { defaultValue: 'No status found.' })}
                  options={[
                    { label: t('All statuses', { defaultValue: 'All statuses' }), value: '' },
                    { label: t('draft', { defaultValue: 'draft' }), value: 'draft' },
                    { label: t('pending_review', { defaultValue: 'pending_review' }), value: 'pending_review' },
                    { label: t('confirmed', { defaultValue: 'confirmed' }), value: 'confirmed' },
                    { label: t('cancelled', { defaultValue: 'cancelled' }), value: 'cancelled' },
                  ]}
                  onChange={(value) => setDraftFilters((c) => ({ ...c, status: value }))}
                />
              </FilterField>

              <FilterField label={t('Order Type', { defaultValue: 'Order Type' })}>
                <SearchableSelect
                  value={draftFilters.order_type}
                  placeholder={t('All orders', { defaultValue: 'All orders' })}
                  searchPlaceholder={t('Search order type...', { defaultValue: 'Search order type...' })}
                  emptyMessage={t('No order type found.', { defaultValue: 'No order type found.' })}
                  options={[
                    { label: t('All orders', { defaultValue: 'All orders' }), value: '' },
                    { label: t('delivery', { defaultValue: 'delivery' }), value: 'delivery' },
                    { label: t('swap', { defaultValue: 'swap' }), value: 'swap' },
                    { label: t('return', { defaultValue: 'return' }), value: 'return' },
                  ]}
                  onChange={(value) => setDraftFilters((c) => ({ ...c, order_type: value }))}
                />
              </FilterField>

              <FilterField label={t('Payment Type', { defaultValue: 'Payment Type' })}>
                <SearchableSelect
                  value={draftFilters.payment_type}
                  placeholder={t('All payments', { defaultValue: 'All payments' })}
                  searchPlaceholder={t('Search payment type...', { defaultValue: 'Search payment type...' })}
                  emptyMessage={t('No payment type found.', { defaultValue: 'No payment type found.' })}
                  options={[
                    { label: t('All payments', { defaultValue: 'All payments' }), value: '' },
                    { label: t('cod', { defaultValue: 'cod' }), value: 'cod' },
                    { label: t('prepaid', { defaultValue: 'prepaid' }), value: 'prepaid' },
                  ]}
                  onChange={(value) => setDraftFilters((c) => ({ ...c, payment_type: value }))}
                />
              </FilterField>
            </div>
          </FilterPopover>
        </div>
      </div>

      {/* Applied Filter Chips */}
      <AppliedFilterChips
        chips={appliedChips}
        onRemove={handleRemoveChip}
        onClearAll={handleClearAllChips}
      />

      {/* Table Section */}
      <main className="w-full">
        <Card className="table-card bg-[#182331]/90 border-slate-700/60 rounded-2xl">
          <CardContent className="p-4">
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
                title={t('No orders found', { defaultValue: 'No orders found' })}
                description={t('No orders match the selected criteria.', { defaultValue: 'No orders match the selected criteria.' })}
              />
            ) : (
              <TableContainer className="merchant-data-table-scroll table-responsive-wrapper">
                <Table variant="striped">
                  <thead>
                    <tr>
                      <TableHead>{t('Order Code', { defaultValue: 'Order Code' })}</TableHead>
                      <TableHead>{t('Customer', { defaultValue: 'Customer' })}</TableHead>
                      <TableHead>{t('Phone', { defaultValue: 'Phone' })}</TableHead>
                      <TableHead>{t('Status', { defaultValue: 'Status' })}</TableHead>
                      <TableHead>{t('Order Type', { defaultValue: 'Order Type' })}</TableHead>
                      <TableHead>{t('Payment', { defaultValue: 'Payment' })}</TableHead>
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
                          <Link className="table-link font-medium" to={merchantPath(`/orders/${order.id}`)}>
                            {order.order_number}
                          </Link>
                        </TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell>{order.customer_phone}</TableCell>
                        <TableCell>
                          <MerchantOrderStatusBadge className="order-table-badge" label={order.status_label} value={order.status} />
                        </TableCell>
                        <TableCell>
                          <MerchantOrderStatusBadge className="order-table-badge order-table-badge--type" label={order.order_type ? t(order.order_type, { defaultValue: order.order_type }) : null} value={order.order_type} />
                        </TableCell>
                        <TableCell>
                          <MerchantOrderStatusBadge className="order-table-badge order-table-badge--payment" label={order.payment_type_label} value={order.payment_type} />
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
                              <DropdownItem onClick={() => setQuickViewOrderId(order.id)}>
                                {t('Quick Preview', { defaultValue: 'Quick Preview' })}
                              </DropdownItem>
                              <Link className="ui-link-reset" to={merchantPath(`/orders/${order.id}`)}>
                                <DropdownItem>{t('View Details', { defaultValue: 'View Details' })}</DropdownItem>
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
      <OrderQuickViewDrawer
        orderId={quickViewOrderId}
        open={!!quickViewOrderId}
        onClose={() => setQuickViewOrderId(null)}
      />
    </section>
  )
}
