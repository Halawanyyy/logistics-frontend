import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Calendar, Plus, RotateCcw, Search } from 'lucide-react'
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

export function MerchantOrdersListPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const queryClient = useQueryClient()
  const { hasMerchantCapability } = useMerchantPortalContext()
  const [filters, setFilters] = useState(initialFilters)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [selectedOrderForLabel, setSelectedOrderForLabel] = useState<MerchantPortalOrder | null>(null)
  const [quickViewOrderId, setQuickViewOrderId] = useState<number | null>(null)
  const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

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

  function canShowEdit(order: MerchantPortalOrder) {
    if (!hasMerchantCapability('orders.update')) {
      return false
    }

    return !order.has_shipment && order.status !== 'cancelled' && order.status !== 'delivered'
  }

  return (
    <section className="merchant-data-workspace orders-workspace space-y-4 p-1 sm:p-2">
      {/* Top Header Row matching screenshot */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100" style={{ margin: 0, fontSize: '1.5rem' }}>{t('Orders', { defaultValue: 'Orders' })}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1" style={{ margin: '4px 0 0 0', fontSize: '0.75rem' }}>
            {t('Total {{count}} orders', { defaultValue: 'Total {{count}} orders', count: orders.length })}
          </p>
        </div>

        {/* Top Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          {canCreate ? (
            <Link className="ui-link-reset" to={merchantPath('/orders/create')}>
              <Button style={{ backgroundColor: '#FF7A00', color: '#fff', border: 'none', fontWeight: '600', padding: '8px 16px', borderRadius: '12px' }}>
                <Plus size={16} />
                {t('Add Order', { defaultValue: 'Add Order' })}
              </Button>
            </Link>
          ) : null}

        </div>
      </div>

      {/* Full-width Search Input */}
      <div style={{ position: 'relative', width: '100%', marginTop: '16px', marginBottom: '16px' }}>
        <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--content)', opacity: 0.5, pointerEvents: 'none' }}>
          <Search size={16} />
        </div>
        <input
          type="text"
          placeholder={t('Search by customer name, phone or order code...', { defaultValue: 'Search by customer name, phone or order code...' })}
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          style={{ width: '100%', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--content)', borderRadius: '12px', padding: '10px 40px 10px 16px', fontSize: '0.875rem', outline: 'none' }}
        />
      </div>

      {/* Inline Filters Row (Side-by-side flex row, NO card, NO outer container or border) */}
      <div className="merchant-filters-row" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', width: '100%', marginBottom: '24px' }}>
        
        {/* Date Input */}
        <div style={{ flex: '1 1 140px', minWidth: '140px' }}>
          <input
            lang={locale === 'ar' ? 'ar-EG' : 'en-GB'}
            type="date"
            value={filters.date_from}
            onChange={(event) => setFilters((current) => ({
              ...current,
              date_from: event.target.value,
              date_to: event.target.value,
            }))}
            style={{ width: '100%', height: '42px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--content)', borderRadius: '12px', padding: '10px 16px', fontSize: '0.875rem', outline: 'none' }}
          />
        </div>

        {/* All Dates toggle button */}
        <div style={{ flex: '1 1 140px', minWidth: '140px' }}>
          <button
            type="button"
            onClick={() => setFilters((current) => ({ ...current, date_from: '', date_to: '' }))}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '10px 16px', fontSize: '0.875rem', borderRadius: '12px', transition: '0.2s', width: '100%', height: '42px',
              backgroundColor: !filters.date_from ? 'rgba(255,122,0,0.15)' : 'var(--surface)',
              border: !filters.date_from ? '1px solid rgba(255,122,0,0.5)' : '1px solid var(--border)',
              color: !filters.date_from ? '#FF7A00' : 'var(--content)',
              fontWeight: !filters.date_from ? '600' : 'normal',
            }}
          >
            <Calendar size={15} />
            {t('All Dates', { defaultValue: 'All Dates' })}
          </button>
        </div>

        {/* Status dropdown */}
        <div style={{ flex: '1 1 140px', minWidth: '140px' }}>
          <SearchableSelect
            value={filters.status}
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
            onChange={(value) => setFilters((current) => ({ ...current, status: value }))}
          />
        </div>

        {/* Order Type dropdown */}
        <div style={{ flex: '1 1 140px', minWidth: '140px' }}>
          <SearchableSelect
            value={filters.order_type}
            placeholder={t('All orders', { defaultValue: 'All orders' })}
            searchPlaceholder={t('Search order type...', { defaultValue: 'Search order type...' })}
            emptyMessage={t('No order type found.', { defaultValue: 'No order type found.' })}
            options={[
              { label: t('All orders', { defaultValue: 'All orders' }), value: '' },
              { label: t('delivery', { defaultValue: 'delivery' }), value: 'delivery' },
              { label: t('swap', { defaultValue: 'swap' }), value: 'swap' },
              { label: t('return', { defaultValue: 'return' }), value: 'return' },
            ]}
            onChange={(value) => setFilters((current) => ({ ...current, order_type: value }))}
          />
        </div>

        {/* Payment Type dropdown */}
        <div style={{ flex: '1 1 140px', minWidth: '140px' }}>
          <SearchableSelect
            value={filters.payment_type}
            placeholder={t('All payments', { defaultValue: 'All payments' })}
            searchPlaceholder={t('Search payment type...', { defaultValue: 'Search payment type...' })}
            emptyMessage={t('No payment type found.', { defaultValue: 'No payment type found.' })}
            options={[
              { label: t('All payments', { defaultValue: 'All payments' }), value: '' },
              { label: t('cod', { defaultValue: 'cod' }), value: 'cod' },
              { label: t('prepaid', { defaultValue: 'prepaid' }), value: 'prepaid' },
            ]}
            onChange={(value) => setFilters((current) => ({ ...current, payment_type: value }))}
          />
        </div>

        {/* Reset Filters Icon Button - ICON ONLY */}
        <div style={{ flex: '0 0 auto' }}>
          <button
            type="button"
            onClick={() => setFilters(initialFilters)}
            title={t('Reset filters', { defaultValue: 'Reset filters' })}
            aria-label={t('Reset filters', { defaultValue: 'Reset filters' })}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', borderRadius: '12px', cursor: 'pointer', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--content)', transition: '0.2s' }}
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

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
                title={t('No orders found.', { defaultValue: 'No orders found.' })}
                description={canCreate
                  ? t('Create your first order to get started.', { defaultValue: 'Create your first order to get started.' })
                  : t('No orders matched the selected filters.', { defaultValue: 'No orders matched the selected filters.' })}
              />
            ) : (
              <TableContainer className="merchant-data-table-scroll">
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
                          <MerchantOrderStatusBadge className="order-table-badge order-table-badge--status" label={order.status_label} value={order.status} />
                        </TableCell>
                        <TableCell>{order.order_type ? t(order.order_type, { defaultValue: order.order_type }) : '-'}</TableCell>
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
