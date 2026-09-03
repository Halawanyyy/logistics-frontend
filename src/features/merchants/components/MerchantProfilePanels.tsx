import { useMemo, useState, type ReactNode } from 'react'
import { inferStatAccent, type StatAccent } from '../../../shared/utils/statAccent'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { listOrders } from '../../orders/api/orders.api'
import { listShipments } from '../../shipments/api/shipments.api'
import {
  approveMerchantWalletTransaction,
  createMerchantIntegrationToken,
  createMerchantWalletDeposit,
  createMerchantWalletWithdraw,
  deleteMerchantIntegrationToken,
  getMerchantIntegrationToken,
  getMerchantWalletSummary,
  getMerchantWalletTransaction,
  listMerchantIntegrationTokens,
  listMerchantWalletTransactions,
  rejectMerchantWalletTransaction,
  revokeMerchantIntegrationToken,
} from '../api/merchants.api'
import type {
  CreateMerchantIntegrationTokenPayload,
  Merchant,
  MerchantIntegrationToken,
  MerchantWalletTransaction,
  MerchantWalletTransactionsFilters,
  RejectMerchantWalletTransactionPayload,
} from '../types/merchant.types'
import {
  downloadMerchantInvoice,
  getMerchantInvoicePreview,
  listMerchantInvoices,
} from '../../finance/api/finance.api'
import type { MerchantInvoice } from '../../finance/types/finance.types'
import { listAuditTimeline } from '../../../shared/api/audit.api'
import type { AuditLogItem } from '../../../shared/types/audit.types'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Select } from '../../../shared/components/ui/Select'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { DateRangeFilter } from '../../../shared/components/filters/DateRangeFilter'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { StringMultiSelect } from '../../../shared/components/ui/StringMultiSelect'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { DriverSelector } from '../../../shared/components/selectors/DriverSelector'
import { GovernorateAreaSelector } from '../../../shared/components/selectors/GovernorateAreaSelector'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { formatDate } from '../../../shared/utils/formatters'
import { adminPath } from '../../../shared/routing/paths'
import { Dialog } from '../../../shared/components/ui/Dialog'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { useFormApiErrors } from '../../../shared/hooks/useFormApiErrors'
import { Input } from '../../../shared/components/ui/Input'
import { useForm } from 'react-hook-form'
import { ApprovalActionButtons } from '../../../shared/components/actions/ApprovalActionButtons'
import { ConfirmActionModal } from '../../../shared/components/modals/ConfirmActionModal'
import { Timeline } from '../../../shared/components/timeline/Timeline'
import { pickDisplayLabel } from '../../../shared/i18n/locale'

type MerchantOrdersFilters = {
  date_from: string
  date_to: string
  status: string
  order_type: string
  fulfillment_type: string
  payment_type: string
}

type MerchantShipmentsFilters = {
  date_from: string
  date_to: string
  status: string
  assigned_driver_id: string
  delivery_governorate_id: string
  delivery_area_id: string
}

type MerchantWalletFilters = MerchantWalletTransactionsFilters & {
  transaction_type: string
  direction: string
  status: string
  date_from: string
  date_to: string
  source_type: string
}

type MerchantInvoicesFilters = {
  date_from: string
  date_to: string
  status: string
}

type WalletTransactionFormValues = {
  amount: number
  reason: string
  notes: string
  reference_number: string
}

type RejectTransactionFormValues = {
  rejection_reason: string
}

type CreateTokenFormValues = {
  name: string
  provider: 'woocommerce' | 'shopify' | 'custom'
  permissions: string[]
  expires_at: string
  notes: string
}

type RevokeTokenFormValues = {
  notes: string
}

const merchantOrdersInitialFilters: MerchantOrdersFilters = {
  date_from: '',
  date_to: '',
  status: '',
  order_type: '',
  fulfillment_type: '',
  payment_type: '',
}

const merchantShipmentsInitialFilters: MerchantShipmentsFilters = {
  date_from: '',
  date_to: '',
  status: '',
  assigned_driver_id: '',
  delivery_governorate_id: '',
  delivery_area_id: '',
}

const merchantWalletInitialFilters: MerchantWalletFilters = {
  transaction_type: '',
  direction: '',
  status: '',
  date_from: '',
  date_to: '',
  source_type: '',
}

const merchantInvoicesInitialFilters: MerchantInvoicesFilters = {
  date_from: '',
  date_to: '',
  status: '',
}

const tokenPermissionOptions = [
  'orders.create',
  'orders.view',
  'shipments.view',
  'tracking.view',
  'products.view',
  'inventory.view',
]

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function safeMetaSummary(values: Record<string, unknown> | null | undefined) {
  if (!values) {
    return null
  }

  const sensitiveKeys = ['password', 'token', 'token_hash', 'plain_token', 'authorization', 'secret']
  const visibleEntries = Object.entries(values).filter(([key]) => !sensitiveKeys.includes(key))

  if (!visibleEntries.length) {
    return null
  }

  return visibleEntries
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' | ')
}

export function MerchantOrdersPanel({ merchantId }: { merchantId: string }) {
  const { t } = useTranslation()
  const [filters, setFilters] = useState(merchantOrdersInitialFilters)
  const params = {
    merchant_id: merchantId,
    ...(filters.date_from ? { date_from: filters.date_from } : {}),
    ...(filters.date_to ? { date_to: filters.date_to } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.order_type ? { order_type: filters.order_type } : {}),
    ...(filters.fulfillment_type ? { fulfillment_type: filters.fulfillment_type } : {}),
    ...(filters.payment_type ? { payment_type: filters.payment_type } : {}),
  }
  const ordersQuery = useQuery({
    queryKey: ['merchant-profile', merchantId, 'orders', params],
    queryFn: () => listOrders(params),
  })

  const orders = ordersQuery.data?.data ?? []
  const draftCount = orders.filter((order) => order.status === 'draft').length
  const confirmedCount = orders.filter((order) => order.status === 'confirmed').length
  const shipmentCreatedCount = orders.filter((order) => order.status === 'shipment_created').length

  return (
    <div className="page-stack">
      <Card variant="flat" className="dashboard-filter-card">
        <CardContent className="dashboard-filters">
          <DateRangeFilter
            dateFrom={filters.date_from}
            dateTo={filters.date_to}
            onChange={({ date_from, date_to }) =>
              setFilters((current) => ({ ...current, date_from, date_to }))
            }
          />
          <label className="field">
            <span>{t('Status')}</span>
            <Select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="">{t('All statuses')}</option>
              <option value="draft">draft</option>
              <option value="pending_review">pending_review</option>
              <option value="confirmed">confirmed</option>
              <option value="shipment_created">shipment_created</option>
            </Select>
          </label>
          <label className="field">
            <span>{t('Order Type', { defaultValue: 'Order Type' })}</span>
            <Select
              value={filters.order_type}
              onChange={(event) => setFilters((current) => ({ ...current, order_type: event.target.value }))}
            >
              <option value="">{t('All order types', { defaultValue: 'All order types' })}</option>
              <option value="delivery">delivery</option>
              <option value="swap">swap</option>
              <option value="return">return</option>
            </Select>
          </label>
          <label className="field">
            <span>{t('Fulfillment', { defaultValue: 'Fulfillment' })}</span>
            <Select
              value={filters.fulfillment_type}
              onChange={(event) => setFilters((current) => ({ ...current, fulfillment_type: event.target.value }))}
            >
              <option value="">{t('All fulfillment', { defaultValue: 'All fulfillment' })}</option>
              <option value="pickup_from_merchant">pickup_from_merchant</option>
              <option value="from_warehouse">from_warehouse</option>
              <option value="pickup_from_customer">pickup_from_customer</option>
            </Select>
          </label>
          <label className="field">
            <span>{t('Payment Type', { defaultValue: 'Payment Type' })}</span>
            <Select
              value={filters.payment_type}
              onChange={(event) => setFilters((current) => ({ ...current, payment_type: event.target.value }))}
            >
              <option value="">{t('All payment types', { defaultValue: 'All payment types' })}</option>
              <option value="cod">cod</option>
              <option value="prepaid">prepaid</option>
            </Select>
          </label>
        </CardContent>
        <CardContent>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setFilters(merchantOrdersInitialFilters)}>
              {t('Reset filters')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {!ordersQuery.isLoading && !ordersQuery.isError ? (
        <div className="stats-grid">
          <StatTile accent="orders" label={t('Total Orders', { defaultValue: 'Total Orders' })} value={orders.length} />
          <StatTile accent="warning" label={t('Draft', { defaultValue: 'Draft' })} value={draftCount} />
          <StatTile accent="success" label={t('Confirmed', { defaultValue: 'Confirmed' })} value={confirmedCount} />
          <StatTile accent="shipments" label={t('Shipment Created', { defaultValue: 'Shipment Created' })} value={shipmentCreatedCount} />
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t('Merchant Orders', { defaultValue: 'Merchant Orders' })}</CardTitle>
          <CardDescription>{t('Orders filtered directly from the backend for this merchant.', { defaultValue: 'Orders filtered directly from the backend for this merchant.' })}</CardDescription>
        </CardHeader>
        <CardContent>
          {ordersQuery.isLoading ? <LoadingState title={t('Loading merchant orders', { defaultValue: 'Loading merchant orders' })} /> : null}
          {ordersQuery.isError ? (
            <ErrorState
              title={t('Unable to load merchant orders', { defaultValue: 'Unable to load merchant orders' })}
              message={getApiErrorMessage(ordersQuery.error)}
              onRetry={() => void ordersQuery.refetch()}
            />
          ) : null}
          {!ordersQuery.isLoading && !ordersQuery.isError && !orders.length ? (
            <EmptyState
              title={t('No orders found', { defaultValue: 'No orders found' })}
              description={t('No merchant orders matched the selected filters.', { defaultValue: 'No merchant orders matched the selected filters.' })}
            />
          ) : null}
          {orders.length ? (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>{t('Order', { defaultValue: 'Order' })}</TableHead>
                    <TableHead>{t('Customer')}</TableHead>
                    <TableHead>{t('Order Type', { defaultValue: 'Order Type' })}</TableHead>
                    <TableHead>{t('Fulfillment', { defaultValue: 'Fulfillment' })}</TableHead>
                    <TableHead>{t('Payment', { defaultValue: 'Payment' })}</TableHead>
                    <TableHead>{t('COD')}</TableHead>
                    <TableHead>{t('Shipping Fee', { defaultValue: 'Shipping Fee' })}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Created', { defaultValue: 'Created' })}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <TableCell>
                        <Link className="table-link" to={adminPath(`/orders/${order.id}`)}>
                          {order.order_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {order.customer_name}
                        <p className="table-meta">{order.customer_phone}</p>
                      </TableCell>
                      <TableCell>{order.order_type ?? '-'}</TableCell>
                      <TableCell>
                        <StatusBadge value={order.fulfillment_type}>
                          {pickDisplayLabel(order.fulfillment_type, order.fulfillment_type_label)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={order.payment_type}>
                          {pickDisplayLabel(order.payment_type ?? '-', order.payment_type_label)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell><MoneyDisplay value={order.cod_amount} /></TableCell>
                      <TableCell><MoneyDisplay value={order.shipping_fee} /></TableCell>
                      <TableCell><StatusBadge value={order.status} /></TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>
                        <Link className="table-link" to={adminPath(`/orders/${order.id}`)}>
                          {t('View order', { defaultValue: 'View order' })}
                        </Link>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

export function MerchantShipmentsPanel({ merchantId }: { merchantId: string }) {
  const { t } = useTranslation()
  const [filters, setFilters] = useState(merchantShipmentsInitialFilters)
  const params = {
    merchant_id: merchantId,
    ...(filters.date_from ? { date_from: filters.date_from } : {}),
    ...(filters.date_to ? { date_to: filters.date_to } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.assigned_driver_id ? { assigned_driver_id: filters.assigned_driver_id } : {}),
    ...(filters.delivery_governorate_id ? { delivery_governorate_id: filters.delivery_governorate_id } : {}),
    ...(filters.delivery_area_id ? { delivery_area_id: filters.delivery_area_id } : {}),
  }
  const shipmentsQuery = useQuery({
    queryKey: ['merchant-profile', merchantId, 'shipments', params],
    queryFn: () => listShipments(params),
  })
  const shipments = shipmentsQuery.data?.data ?? []

  return (
    <div className="page-stack">
      <Card variant="flat" className="dashboard-filter-card">
        <CardContent className="dashboard-filters">
          <DateRangeFilter
            dateFrom={filters.date_from}
            dateTo={filters.date_to}
            onChange={({ date_from, date_to }) =>
              setFilters((current) => ({ ...current, date_from, date_to }))
            }
          />
          <label className="field">
            <span>{t('Status')}</span>
            <Select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="">{t('All statuses')}</option>
              <option value="pending_pickup">{t('pending_pickup', { defaultValue: 'pending_pickup' })}</option>
              <option value="driver_assigned">{t('driver_assigned', { defaultValue: 'driver_assigned' })}</option>
              <option value="in_transit">{t('in_transit', { defaultValue: 'in_transit' })}</option>
              <option value="out_for_delivery">{t('out_for_delivery', { defaultValue: 'out_for_delivery' })}</option>
              <option value="delivered">{t('delivered', { defaultValue: 'delivered' })}</option>
              <option value="failed">{t('failed', { defaultValue: 'failed' })}</option>
              <option value="returned">{t('returned', { defaultValue: 'returned' })}</option>
            </Select>
          </label>
          <label className="field">
            <span>{t('Assigned Driver')}</span>
            <DriverSelector
              value={filters.assigned_driver_id}
              onChange={(assigned_driver_id) =>
                setFilters((current) => ({ ...current, assigned_driver_id }))
              }
              includeAllOption
            />
          </label>
          <GovernorateAreaSelector
            governorateId={filters.delivery_governorate_id}
            areaId={filters.delivery_area_id}
            includeAllOption
            onChange={({ governorate_id, area_id }) =>
              setFilters((current) => ({
                ...current,
                delivery_governorate_id: governorate_id,
                delivery_area_id: area_id,
              }))
            }
          />
        </CardContent>
        <CardContent>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setFilters(merchantShipmentsInitialFilters)}>
              {t('Reset filters')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Merchant Shipments', { defaultValue: 'Merchant Shipments' })}</CardTitle>
          <CardDescription>{t('Shipments filtered directly from the backend for this merchant.', { defaultValue: 'Shipments filtered directly from the backend for this merchant.' })}</CardDescription>
        </CardHeader>
        <CardContent>
          {shipmentsQuery.isLoading ? <LoadingState title={t('Loading merchant shipments', { defaultValue: 'Loading merchant shipments' })} /> : null}
          {shipmentsQuery.isError ? (
            <ErrorState
              title={t('Unable to load merchant shipments', { defaultValue: 'Unable to load merchant shipments' })}
              message={getApiErrorMessage(shipmentsQuery.error)}
              onRetry={() => void shipmentsQuery.refetch()}
            />
          ) : null}
          {!shipmentsQuery.isLoading && !shipmentsQuery.isError && !shipments.length ? (
            <EmptyState
              title={t('No shipments found', { defaultValue: 'No shipments found' })}
              description={t('No merchant shipments matched the selected filters.', { defaultValue: 'No merchant shipments matched the selected filters.' })}
            />
          ) : null}
          {shipments.length ? (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>{t('Shipment', { defaultValue: 'Shipment' })}</TableHead>
                    <TableHead>{t('Order', { defaultValue: 'Order' })}</TableHead>
                    <TableHead>{t('Customer')}</TableHead>
                    <TableHead>{t('Location', { defaultValue: 'Location' })}</TableHead>
                    <TableHead>{t('Assigned Driver')}</TableHead>
                    <TableHead>{t('COD')}</TableHead>
                    <TableHead>{t('Shipping Fee', { defaultValue: 'Shipping Fee' })}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Created', { defaultValue: 'Created' })}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((shipment) => (
                    <tr key={shipment.id}>
                      <TableCell>
                        <Link className="table-link" to={adminPath(`/shipments/${shipment.id}`)}>
                          {shipment.shipment_number}
                        </Link>
                      </TableCell>
                      <TableCell>{shipment.order_number ?? `#${shipment.order_id}`}</TableCell>
                      <TableCell>
                        {shipment.customer_name}
                        <p className="table-meta">{shipment.customer_phone}</p>
                      </TableCell>
                      <TableCell>
                        {shipment.delivery_governorate_name}
                        <p className="table-meta">{shipment.delivery_area_name ?? '-'}</p>
                      </TableCell>
                      <TableCell>{shipment.assigned_driver_name ?? '-'}</TableCell>
                      <TableCell><MoneyDisplay value={shipment.cod_amount} /></TableCell>
                      <TableCell><MoneyDisplay value={shipment.shipping_fee} /></TableCell>
                      <TableCell><StatusBadge value={shipment.status} /></TableCell>
                      <TableCell>{formatDate(shipment.created_at)}</TableCell>
                      <TableCell>
                        <Link className="table-link" to={adminPath(`/shipments/${shipment.id}`)}>
                          {t('View shipment', { defaultValue: 'View shipment' })}
                        </Link>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function WalletTransactionModal({
  merchantId,
  mode,
  open,
  onClose,
}: {
  merchantId: string
  mode: 'deposit' | 'withdraw'
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WalletTransactionFormValues>()
  const mutation = useMutation({
    mutationFn: (values: WalletTransactionFormValues) => (
      mode === 'deposit'
        ? createMerchantWalletDeposit(merchantId, values)
        : createMerchantWalletWithdraw(merchantId, values)
    ),
    onSuccess: async () => {
      reset()
      onClose()
      await queryClient.invalidateQueries({
        queryKey: ['merchant-profile', merchantId, 'wallet-summary'],
      })
      await queryClient.invalidateQueries({
        queryKey: ['merchant-profile', merchantId, 'wallet-transactions'],
      })
    },
  })
  const { formError, getFieldError } = useFormApiErrors(mutation.error)

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!mutation.isPending) {
          onClose()
        }
      }}
      title={<CardTitle>{mode === 'deposit'
        ? t('Manual Deposit', { defaultValue: 'Manual Deposit' })
        : t('Manual Withdraw', { defaultValue: 'Manual Withdraw' })}</CardTitle>}
      variant="small"
    >
      <form
        className="form-grid"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
      >
        <label className="field">
          <span>{t('Amount', { defaultValue: 'Amount' })}</span>
          <Input type="number" step="0.01" {...register('amount', { valueAsNumber: true, required: 'Amount is required.' })} />
          <FieldError error={errors.amount?.message ?? getFieldError('amount')} />
        </label>
        <label className="field">
          <span>{t('Reason', { defaultValue: 'Reason' })}</span>
          <Input {...register('reason', { required: 'Reason is required.' })} />
          <FieldError error={errors.reason?.message ?? getFieldError('reason')} />
        </label>
        <label className="field">
          <span>{t('Reference Number', { defaultValue: 'Reference Number' })}</span>
          <Input {...register('reference_number')} />
        </label>
        <label className="field">
          <span>{t('Notes', { defaultValue: 'Notes' })}</span>
          <Input {...register('notes')} />
        </label>
        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {mode === 'deposit'
              ? t('Create Deposit', { defaultValue: 'Create Deposit' })
              : t('Create Withdraw', { defaultValue: 'Create Withdraw' })}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function RejectWalletTransactionModal({
  transaction,
  open,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: {
  transaction: MerchantWalletTransaction | null
  open: boolean
  onClose: () => void
  onSubmit: (values: RejectMerchantWalletTransactionPayload) => void
  isSubmitting: boolean
  error: unknown
}) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectTransactionFormValues>()
  const { formError, getFieldError } = useFormApiErrors(error)

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!isSubmitting) {
          reset()
          onClose()
        }
      }}
      title={<CardTitle>{t('Reject Transaction', { defaultValue: 'Reject Transaction' })}</CardTitle>}
      variant="small"
    >
      <form
        className="form-grid"
        onSubmit={handleSubmit((values) => onSubmit(values))}
      >
        <p>{t('Reject wallet transaction {{reference}}.', {
          reference: transaction?.reference_number ?? `#${transaction?.id ?? ''}`,
          defaultValue: `Reject wallet transaction ${transaction?.reference_number ?? `#${transaction?.id ?? ''}`}.`,
        })}</p>
        <label className="field">
          <span>{t('Rejection Reason', { defaultValue: 'Rejection Reason' })}</span>
          <Input {...register('rejection_reason', { required: 'Rejection reason is required.' })} />
          <FieldError error={errors.rejection_reason?.message ?? getFieldError('rejection_reason')} />
        </label>
        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {t('Reject Transaction', { defaultValue: 'Reject Transaction' })}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function MerchantWalletPanel({ merchant, merchantId }: { merchant: Merchant; merchantId: string }) {
  const { t } = useTranslation()
  const [filters, setFilters] = useState(merchantWalletInitialFilters)
  const [depositOpen, setDepositOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null)
  const [transactionPendingReject, setTransactionPendingReject] = useState<MerchantWalletTransaction | null>(null)
  const queryClient = useQueryClient()
  const summaryQuery = useQuery({
    queryKey: ['merchant-profile', merchantId, 'wallet-summary'],
    queryFn: () => getMerchantWalletSummary(merchantId),
  })
  const transactionParams = useMemo(() => ({
    ...(filters.transaction_type ? { transaction_type: filters.transaction_type } : {}),
    ...(filters.direction ? { direction: filters.direction } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.date_from ? { date_from: filters.date_from } : {}),
    ...(filters.date_to ? { date_to: filters.date_to } : {}),
    ...(filters.source_type ? { source_type: filters.source_type } : {}),
  }), [filters])
  const transactionsQuery = useQuery({
    queryKey: ['merchant-profile', merchantId, 'wallet-transactions', transactionParams],
    queryFn: () => listMerchantWalletTransactions(merchantId, transactionParams),
  })
  const transactionDetailsQuery = useQuery({
    queryKey: ['merchant-profile', 'wallet-transaction', selectedTransactionId],
    queryFn: () => getMerchantWalletTransaction(selectedTransactionId!),
    enabled: Boolean(selectedTransactionId),
  })
  const transactionTimelineQuery = useQuery({
    queryKey: ['merchant-profile', 'wallet-transaction', selectedTransactionId, 'timeline'],
    queryFn: () =>
      listAuditTimeline({
        auditable_type: 'merchant_wallet_transaction',
        auditable_id: selectedTransactionId!,
      }),
    enabled: Boolean(selectedTransactionId),
  })
  const approveMutation = useMutation({
    mutationFn: (transactionId: number) => approveMerchantWalletTransaction(transactionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['merchant-profile', merchantId, 'wallet-summary'],
      })
      await queryClient.invalidateQueries({
        queryKey: ['merchant-profile', merchantId, 'wallet-transactions'],
      })
      if (selectedTransactionId) {
        await queryClient.invalidateQueries({
          queryKey: ['merchant-profile', 'wallet-transaction', selectedTransactionId],
        })
      }
    },
  })
  const rejectMutation = useMutation({
    mutationFn: ({
      transactionId,
      payload,
    }: {
      transactionId: number
      payload: RejectMerchantWalletTransactionPayload
    }) => rejectMerchantWalletTransaction(transactionId, payload),
    onSuccess: async () => {
      setTransactionPendingReject(null)
      await queryClient.invalidateQueries({
        queryKey: ['merchant-profile', merchantId, 'wallet-summary'],
      })
      await queryClient.invalidateQueries({
        queryKey: ['merchant-profile', merchantId, 'wallet-transactions'],
      })
      if (selectedTransactionId) {
        await queryClient.invalidateQueries({
          queryKey: ['merchant-profile', 'wallet-transaction', selectedTransactionId],
        })
      }
    },
  })
  const summary = summaryQuery.data?.data
  const transactions = transactionsQuery.data?.data ?? []

  return (
    <div className="page-stack">
      <Card variant="flat" className="dashboard-filter-card">
        <CardContent className="dashboard-filters">
          <DateRangeFilter
            dateFrom={filters.date_from}
            dateTo={filters.date_to}
            onChange={({ date_from, date_to }) =>
              setFilters((current) => ({ ...current, date_from, date_to }))
            }
          />
          <label className="field">
            <span>{t('Transaction Type', { defaultValue: 'Transaction Type' })}</span>
            <Select
              value={filters.transaction_type}
              onChange={(event) => setFilters((current) => ({ ...current, transaction_type: event.target.value }))}
            >
              <option value="">{t('All transaction types', { defaultValue: 'All transaction types' })}</option>
              <option value="cod_collection">cod_collection</option>
              <option value="shipping_fee">shipping_fee</option>
              <option value="warehouse_charge">warehouse_charge</option>
              <option value="manual_deposit">manual_deposit</option>
              <option value="manual_withdraw">manual_withdraw</option>
              <option value="payout">payout</option>
            </Select>
          </label>
          <label className="field">
            <span>{t('Direction', { defaultValue: 'Direction' })}</span>
            <Select
              value={filters.direction}
              onChange={(event) => setFilters((current) => ({ ...current, direction: event.target.value }))}
            >
              <option value="">{t('All directions', { defaultValue: 'All directions' })}</option>
              <option value="credit">{t('credit', { defaultValue: 'credit' })}</option>
              <option value="debit">{t('debit', { defaultValue: 'debit' })}</option>
            </Select>
          </label>
          <label className="field">
            <span>{t('Status')}</span>
            <Select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="">{t('All statuses')}</option>
              <option value="pending">{t('pending', { defaultValue: 'pending' })}</option>
              <option value="approved">{t('approved', { defaultValue: 'approved' })}</option>
              <option value="rejected">{t('rejected', { defaultValue: 'rejected' })}</option>
            </Select>
          </label>
          <label className="field">
            <span>{t('Source Type', { defaultValue: 'Source Type' })}</span>
            <Select
              value={filters.source_type}
              onChange={(event) => setFilters((current) => ({ ...current, source_type: event.target.value }))}
            >
              <option value="">{t('All source types', { defaultValue: 'All source types' })}</option>
              <option value="shipment">shipment</option>
              <option value="merchant_payout">merchant_payout</option>
              <option value="manual_adjustment">manual_adjustment</option>
              <option value="merchant_invoice">merchant_invoice</option>
            </Select>
          </label>
        </CardContent>
        <CardContent>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setFilters(merchantWalletInitialFilters)}>
              {t('Reset filters')}
            </Button>
            <Can permission={PERMISSIONS.MERCHANT_WALLET_DEPOSIT}>
              <Button type="button" variant="secondary" onClick={() => setDepositOpen(true)}>
                {t('Manual Deposit', { defaultValue: 'Manual Deposit' })}
              </Button>
            </Can>
            <Can permission={PERMISSIONS.MERCHANT_WALLET_WITHDRAW}>
              <Button type="button" variant="secondary" onClick={() => setWithdrawOpen(true)}>
                {t('Manual Withdraw', { defaultValue: 'Manual Withdraw' })}
              </Button>
            </Can>
          </div>
        </CardContent>
      </Card>

      {summaryQuery.isLoading ? <LoadingState title={t('Loading wallet summary', { defaultValue: 'Loading wallet summary' })} /> : null}
      {summaryQuery.isError ? (
        <ErrorState
          title={t('Unable to load wallet summary', { defaultValue: 'Unable to load wallet summary' })}
          message={getApiErrorMessage(summaryQuery.error)}
          onRetry={() => void summaryQuery.refetch()}
        />
      ) : null}
      {summary ? (
        <div className="stats-grid">
          <StatTile label={t('Available Balance', { defaultValue: 'Available Balance' })} value={<MoneyDisplay value={summary.available_balance} />} />
          <StatTile label={t('Pending Credits', { defaultValue: 'Pending Credits' })} value={<MoneyDisplay value={summary.pending_credits} />} />
          <StatTile label={t('Pending Debits', { defaultValue: 'Pending Debits' })} value={<MoneyDisplay value={summary.pending_debits} />} />
          <StatTile label={t('Total COD Collected', { defaultValue: 'Total COD Collected' })} value={<MoneyDisplay value={summary.total_cod_collected} />} />
          <StatTile label={t('Total Fees', { defaultValue: 'Total Fees' })} value={<MoneyDisplay value={summary.total_fees} />} />
          <StatTile label={t('Total Payouts', { defaultValue: 'Total Payouts' })} value={<MoneyDisplay value={summary.total_payouts} />} />
          <StatTile label={t('Wallet Credits', { defaultValue: 'Wallet Credits' })} value={<MoneyDisplay value={summary.total_wallet_credits} />} />
          <StatTile label={t('Wallet Debits', { defaultValue: 'Wallet Debits' })} value={<MoneyDisplay value={summary.total_wallet_debits} />} />
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t('{{merchant}} Wallet Transactions', {
            merchant: merchant.name,
            defaultValue: `${merchant.name} Wallet Transactions`,
          })}</CardTitle>
          <CardDescription>{t('Backend wallet balances and ledger entries only. No frontend calculations.', {
            defaultValue: 'Backend wallet balances and ledger entries only. No frontend calculations.',
          })}</CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsQuery.isLoading ? <LoadingState title={t('Loading wallet transactions', { defaultValue: 'Loading wallet transactions' })} /> : null}
          {transactionsQuery.isError ? (
            <ErrorState
              title={t('Unable to load wallet transactions', { defaultValue: 'Unable to load wallet transactions' })}
              message={getApiErrorMessage(transactionsQuery.error)}
              onRetry={() => void transactionsQuery.refetch()}
            />
          ) : null}
          {!transactionsQuery.isLoading && !transactionsQuery.isError && !transactions.length ? (
            <EmptyState
              title={t('No wallet transactions', { defaultValue: 'No wallet transactions' })}
              description={t('No wallet transactions matched the selected filters.', {
                defaultValue: 'No wallet transactions matched the selected filters.',
              })}
            />
          ) : null}
          {transactions.length ? (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>{t('Transaction Type', { defaultValue: 'Transaction Type' })}</TableHead>
                    <TableHead>{t('Direction', { defaultValue: 'Direction' })}</TableHead>
                    <TableHead>{t('Amount', { defaultValue: 'Amount' })}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Source Type', { defaultValue: 'Source Type' })}</TableHead>
                    <TableHead>{t('Reference', { defaultValue: 'Reference' })}</TableHead>
                    <TableHead>{t('Created', { defaultValue: 'Created' })}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <TableCell>
                        <StatusBadge value={transaction.transaction_type}>
                          {pickDisplayLabel(transaction.transaction_type, null)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={transaction.direction}>
                          {pickDisplayLabel(transaction.direction, null)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell><MoneyDisplay value={transaction.amount} /></TableCell>
                      <TableCell><StatusBadge value={transaction.status} /></TableCell>
                      <TableCell>
                        <StatusBadge value={transaction.source_type}>
                          {pickDisplayLabel(transaction.source_type ?? '-', null)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>{transaction.reference_number ?? '-'}</TableCell>
                      <TableCell>{formatDate(transaction.created_at)}</TableCell>
                      <TableCell>
                        <div className="page-header__button-row">
                          <Button type="button" variant="secondary" onClick={() => setSelectedTransactionId(transaction.id)}>
                            {t('Details', { defaultValue: 'Details' })}
                          </Button>
                          {transaction.status === 'pending' ? (
                            <ApprovalActionButtons
                              approve={{
                                label: t('Approve', { defaultValue: 'Approve' }),
                                permission: PERMISSIONS.MERCHANT_WALLET_APPROVE,
                                loading: approveMutation.isPending,
                                onClick: () => approveMutation.mutate(transaction.id),
                              }}
                              reject={{
                                label: t('Reject', { defaultValue: 'Reject' }),
                                permission: PERMISSIONS.MERCHANT_WALLET_REJECT,
                                variant: 'danger',
                                onClick: () => setTransactionPendingReject(transaction),
                              }}
                            />
                          ) : null}
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          ) : null}
        </CardContent>
      </Card>

      <WalletTransactionModal
        merchantId={merchantId}
        mode="deposit"
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
      />
      <WalletTransactionModal
        merchantId={merchantId}
        mode="withdraw"
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
      />
      <RejectWalletTransactionModal
        transaction={transactionPendingReject}
        open={Boolean(transactionPendingReject)}
        onClose={() => setTransactionPendingReject(null)}
        error={rejectMutation.error}
        isSubmitting={rejectMutation.isPending}
        onSubmit={(values) => {
          if (transactionPendingReject) {
            rejectMutation.mutate({
              transactionId: transactionPendingReject.id,
              payload: values,
            })
          }
        }}
      />
      <Dialog
        open={Boolean(selectedTransactionId)}
        onClose={() => setSelectedTransactionId(null)}
        title={<CardTitle>{t('Wallet Transaction Details', { defaultValue: 'Wallet Transaction Details' })}</CardTitle>}
        variant="small"
      >
        {transactionDetailsQuery.isLoading ? <LoadingState title={t('Loading transaction details', { defaultValue: 'Loading transaction details' })} /> : null}
        {transactionDetailsQuery.isError ? (
          <ErrorState
            title={t('Unable to load transaction details', { defaultValue: 'Unable to load transaction details' })}
            message={getApiErrorMessage(transactionDetailsQuery.error)}
            onRetry={() => void transactionDetailsQuery.refetch()}
          />
        ) : null}
        {transactionDetailsQuery.data ? (
          <div className="page-stack">
            <dl className="detail-list">
              <div>
                <dt>{t('Transaction Type', { defaultValue: 'Transaction Type' })}</dt>
                <dd>
                  <StatusBadge value={transactionDetailsQuery.data.data.transaction_type}>
                    {pickDisplayLabel(transactionDetailsQuery.data.data.transaction_type, null)}
                  </StatusBadge>
                </dd>
              </div>
              <div>
                <dt>{t('Direction', { defaultValue: 'Direction' })}</dt>
                <dd>
                  <StatusBadge value={transactionDetailsQuery.data.data.direction}>
                    {pickDisplayLabel(transactionDetailsQuery.data.data.direction, null)}
                  </StatusBadge>
                </dd>
              </div>
              <div><dt>{t('Amount', { defaultValue: 'Amount' })}</dt><dd><MoneyDisplay value={transactionDetailsQuery.data.data.amount} /></dd></div>
              <div><dt>{t('Status')}</dt><dd><StatusBadge value={transactionDetailsQuery.data.data.status} /></dd></div>
              <div><dt>{t('Reference Number', { defaultValue: 'Reference Number' })}</dt><dd>{transactionDetailsQuery.data.data.reference_number ?? '-'}</dd></div>
              <div><dt>{t('Balance After', { defaultValue: 'Balance After' })}</dt><dd><MoneyDisplay value={transactionDetailsQuery.data.data.balance_after} /></dd></div>
              <div><dt>{t('Reason', { defaultValue: 'Reason' })}</dt><dd>{transactionDetailsQuery.data.data.reason ?? '-'}</dd></div>
              <div><dt>{t('Notes', { defaultValue: 'Notes' })}</dt><dd>{transactionDetailsQuery.data.data.notes ?? '-'}</dd></div>
              <div><dt>{t('Approved By', { defaultValue: 'Approved By' })}</dt><dd>{transactionDetailsQuery.data.data.approved_by_name ?? '-'}</dd></div>
              <div><dt>{t('Rejected By', { defaultValue: 'Rejected By' })}</dt><dd>{transactionDetailsQuery.data.data.rejected_by_name ?? '-'}</dd></div>
              <div><dt>{t('Rejection Reason', { defaultValue: 'Rejection Reason' })}</dt><dd>{transactionDetailsQuery.data.data.rejection_reason ?? '-'}</dd></div>
              <div><dt>{t('Created', { defaultValue: 'Created' })}</dt><dd>{formatDate(transactionDetailsQuery.data.data.created_at)}</dd></div>
            </dl>
            <Can permission={PERMISSIONS.AUDIT_LOGS_TIMELINE}>
              {transactionTimelineQuery.isLoading ? <LoadingState title={t('Loading activity timeline', { defaultValue: 'Loading activity timeline' })} /> : null}
              {transactionTimelineQuery.isError ? (
                <ErrorState
                  title={t('Unable to load activity timeline', { defaultValue: 'Unable to load activity timeline' })}
                  message={getApiErrorMessage(transactionTimelineQuery.error)}
                  onRetry={() => void transactionTimelineQuery.refetch()}
                />
              ) : null}
              {!transactionTimelineQuery.isLoading && !transactionTimelineQuery.isError ? (
                <Timeline
                  title={t('Activity Timeline', { defaultValue: 'Activity Timeline' })}
                  items={(transactionTimelineQuery.data?.data ?? []).map((item: AuditLogItem) => ({
                    id: item.id,
                    title: `${item.event_type} - ${item.action}`,
                    subtitle: item.user?.name ?? t('System', { defaultValue: 'System' }),
                    description: item.notes ?? t('No notes were recorded for this event.', {
                      defaultValue: 'No notes were recorded for this event.',
                    }),
                    meta: safeMetaSummary(item.metadata) ?? safeMetaSummary(item.new_values) ?? null,
                    timestamp: item.created_at,
                  }))}
                  emptyDescription={t('No wallet transaction activity timeline entries were returned.', {
                    defaultValue: 'No wallet transaction activity timeline entries were returned.',
                  })}
                />
              ) : null}
            </Can>
          </div>
        ) : null}
      </Dialog>
    </div>
  )
}

export function MerchantInvoicesPanel({ merchantId }: { merchantId: string }) {
  const { t } = useTranslation()
  const [filters, setFilters] = useState(merchantInvoicesInitialFilters)
  const [previewInvoice, setPreviewInvoice] = useState<MerchantInvoice | null>(null)
  const params = {
    merchant_id: merchantId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.date_from ? { date_from: filters.date_from } : {}),
    ...(filters.date_to ? { date_to: filters.date_to } : {}),
  }
  const invoicesQuery = useQuery({
    queryKey: ['merchant-profile', merchantId, 'invoices', params],
    queryFn: () => listMerchantInvoices(params),
  })
  const previewQuery = useQuery({
    queryKey: ['merchant-profile', 'invoice-preview', previewInvoice?.id],
    queryFn: () => getMerchantInvoicePreview(previewInvoice!.id),
    enabled: Boolean(previewInvoice?.id),
  })
  const downloadMutation = useMutation({
    mutationFn: (invoice: MerchantInvoice) =>
      downloadMerchantInvoice(invoice.id).then((blob) => ({ blob, fileName: `${invoice.invoice_number}.pdf` })),
    onSuccess: ({ blob, fileName }) => {
      triggerBlobDownload(blob, fileName)
    },
  })
  const invoices = invoicesQuery.data?.data ?? []

  return (
    <div className="page-stack">
      <Card variant="flat" className="dashboard-filter-card">
        <CardContent className="dashboard-filters">
          <DateRangeFilter
            dateFrom={filters.date_from}
            dateTo={filters.date_to}
            onChange={({ date_from, date_to }) =>
              setFilters((current) => ({ ...current, date_from, date_to }))
            }
          />
          <label className="field">
            <span>{t('Status')}</span>
            <Select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="">{t('All statuses')}</option>
              <option value="draft">{t('draft', { defaultValue: 'draft' })}</option>
              <option value="issued">{t('issued', { defaultValue: 'issued' })}</option>
              <option value="paid">{t('paid', { defaultValue: 'paid' })}</option>
              <option value="cancelled">{t('cancelled', { defaultValue: 'cancelled' })}</option>
            </Select>
          </label>
        </CardContent>
        <CardContent>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setFilters(merchantInvoicesInitialFilters)}>
              {t('Reset filters')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Merchant Invoices', { defaultValue: 'Merchant Invoices' })}</CardTitle>
          <CardDescription>{t('Invoices filtered directly from the backend for this merchant.', {
            defaultValue: 'Invoices filtered directly from the backend for this merchant.',
          })}</CardDescription>
        </CardHeader>
        <CardContent>
          {invoicesQuery.isLoading ? <LoadingState title={t('Loading merchant invoices', { defaultValue: 'Loading merchant invoices' })} /> : null}
          {invoicesQuery.isError ? (
            <ErrorState
              title={t('Unable to load merchant invoices', { defaultValue: 'Unable to load merchant invoices' })}
              message={getApiErrorMessage(invoicesQuery.error)}
              onRetry={() => void invoicesQuery.refetch()}
            />
          ) : null}
          {!invoicesQuery.isLoading && !invoicesQuery.isError && !invoices.length ? (
            <EmptyState
              title={t('No invoices found', { defaultValue: 'No invoices found' })}
              description={t('No merchant invoices matched the selected filters.', {
                defaultValue: 'No merchant invoices matched the selected filters.',
              })}
            />
          ) : null}
          {invoices.length ? (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>{t('Invoice', { defaultValue: 'Invoice' })}</TableHead>
                    <TableHead>{t('Period', { defaultValue: 'Period' })}</TableHead>
                    <TableHead>{t('Total COD', { defaultValue: 'Total COD' })}</TableHead>
                    <TableHead>{t('Shipping Fees', { defaultValue: 'Shipping Fees' })}</TableHead>
                    <TableHead>{t('Warehouse Charges', { defaultValue: 'Warehouse Charges' })}</TableHead>
                    <TableHead>{t('Total Payable', { defaultValue: 'Total Payable' })}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Issued', { defaultValue: 'Issued' })}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <TableCell>{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.period_start} to {invoice.period_end}</TableCell>
                      <TableCell><MoneyDisplay value={invoice.total_cod} /></TableCell>
                      <TableCell><MoneyDisplay value={invoice.total_shipping_fees} /></TableCell>
                      <TableCell><MoneyDisplay value={invoice.total_warehouse_charges} /></TableCell>
                      <TableCell><MoneyDisplay value={invoice.total_payable} /></TableCell>
                      <TableCell><StatusBadge value={invoice.status} /></TableCell>
                      <TableCell>{invoice.issued_at ? formatDate(invoice.issued_at) : '-'}</TableCell>
                      <TableCell>
                        <div className="page-header__button-row">
                          <Link className="table-link" to={adminPath(`/finance/merchant-invoices/${invoice.id}`)}>
                            {t('View')}
                          </Link>
                          <Button type="button" variant="secondary" onClick={() => setPreviewInvoice(invoice)}>
                            {t('Preview', { defaultValue: 'Preview' })}
                          </Button>
                          <Can permission={PERMISSIONS.FINANCE_INVOICES_DOWNLOAD}>
                            <Button
                              type="button"
                              variant="secondary"
                              loading={downloadMutation.isPending}
                              onClick={() => downloadMutation.mutate(invoice)}
                            >
                              {t('Download')}
                            </Button>
                          </Can>
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(previewInvoice)}
        onClose={() => setPreviewInvoice(null)}
        title={<CardTitle>{t('Invoice Preview', { defaultValue: 'Invoice Preview' })}</CardTitle>}
      >
        {previewQuery.isLoading ? <LoadingState title={t('Loading invoice preview', { defaultValue: 'Loading invoice preview' })} /> : null}
        {previewQuery.isError ? (
          <ErrorState
            title={t('Unable to load invoice preview', { defaultValue: 'Unable to load invoice preview' })}
            message={getApiErrorMessage(previewQuery.error)}
            onRetry={() => void previewQuery.refetch()}
          />
        ) : null}
        {previewQuery.data ? (
          <div className="page-stack">
            <div className="stats-grid">
              <StatTile label={t('Total COD', { defaultValue: 'Total COD' })} value={<MoneyDisplay value={previewQuery.data.data.totals.total_cod} />} />
              <StatTile label={t('Shipping Fees', { defaultValue: 'Shipping Fees' })} value={<MoneyDisplay value={previewQuery.data.data.totals.total_shipping_fees} />} />
              <StatTile label={t('Warehouse Charges', { defaultValue: 'Warehouse Charges' })} value={<MoneyDisplay value={previewQuery.data.data.totals.total_warehouse_charges} />} />
              <StatTile label={t('Total Payable', { defaultValue: 'Total Payable' })} value={<MoneyDisplay value={previewQuery.data.data.totals.total_payable} />} />
            </div>
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>{t('Shipment', { defaultValue: 'Shipment' })}</TableHead>
                    <TableHead>{t('Customer')}</TableHead>
                    <TableHead>{t('COD')}</TableHead>
                    <TableHead>{t('Delivered', { defaultValue: 'Delivered' })}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {previewQuery.data.data.shipments.map((shipment) => (
                    <tr key={shipment.shipment_id}>
                      <TableCell>{shipment.shipment_number}</TableCell>
                      <TableCell>{shipment.customer_name}</TableCell>
                      <TableCell><MoneyDisplay value={shipment.cod_amount} /></TableCell>
                      <TableCell>{formatDate(shipment.delivered_at)}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          </div>
        ) : null}
      </Dialog>
    </div>
  )
}

function CreateTokenModal({
  merchantId,
  open,
  onClose,
  onCreated,
}: {
  merchantId: string
  open: boolean
  onClose: () => void
  onCreated: (token: MerchantIntegrationToken) => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateTokenFormValues>({
    defaultValues: {
      name: '',
      provider: 'woocommerce',
      permissions: [],
      expires_at: '',
      notes: '',
    },
  })
  const mutation = useMutation({
    mutationFn: (values: CreateTokenFormValues) => {
      const payload: CreateMerchantIntegrationTokenPayload = {
        name: values.name,
        provider: values.provider,
        permissions: values.permissions,
        expires_at: values.expires_at || null,
        notes: values.notes || null,
      }
      return createMerchantIntegrationToken(merchantId, payload)
    },
    onSuccess: async (response) => {
      reset()
      onCreated(response.data)
      onClose()
      await queryClient.invalidateQueries({
        queryKey: ['merchant-profile', merchantId, 'integration-tokens'],
      })
    },
  })
  const { formError, getFieldError } = useFormApiErrors(mutation.error)
  const selectedPermissions = watch('permissions') ?? []
  const permissionsRegistration = register('permissions', {
    validate: (value) => (value?.length ? true : 'Select at least one permission.'),
  })



  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>{t('Create Integration Token', { defaultValue: 'Create Integration Token' })}</CardTitle>}>
      <form className="form-grid" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <label className="field">
          <span>{t('Name')}</span>
          <Input {...register('name', { required: 'Name is required.' })} />
          <FieldError error={errors.name?.message ?? getFieldError('name')} />
        </label>
        <label className="field">
          <span>{t('Provider', { defaultValue: 'Provider' })}</span>
          <Select {...register('provider')}>
            <option value="woocommerce">woocommerce</option>
            <option value="shopify">shopify</option>
            <option value="custom">custom</option>
          </Select>
        </label>
        <label className="field">
          <span>{t('Expires At', { defaultValue: 'Expires At' })}</span>
          <Input type="date" {...register('expires_at')} />
        </label>
        <label className="field">
          <span>{t('Notes', { defaultValue: 'Notes' })}</span>
          <Input {...register('notes')} />
        </label>
        <input type="hidden" {...permissionsRegistration} />
        <div className="field">
          <span>{t('Permissions')}</span>
          <div className="form-grid">
            <StringMultiSelect
              options={tokenPermissionOptions}
              value={selectedPermissions}
              onChange={(values) => setValue('permissions', values, { shouldValidate: true })}
              placeholder={t('Select permissions', { defaultValue: 'Select permissions' })}
            />
          </div>
          <FieldError error={getFieldError('permissions')} />
        </div>
        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {t('Create Token', { defaultValue: 'Create Token' })}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function RevokeTokenModal({
  token,
  open,
  onClose,
  onSubmit,
  error,
  isSubmitting,
}: {
  token: MerchantIntegrationToken | null
  open: boolean
  onClose: () => void
  onSubmit: (values: RevokeTokenFormValues) => void
  error: unknown
  isSubmitting: boolean
}) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RevokeTokenFormValues>({
    defaultValues: {
      notes: '',
    },
  })
  const { formError, getFieldError } = useFormApiErrors(error)

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>{t('Revoke Token', { defaultValue: 'Revoke Token' })}</CardTitle>} variant="small">
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <p>{t('Revoke {{token}}? This token will stop authenticating immediately.', {
          token: token?.name ?? '',
          defaultValue: `Revoke ${token?.name ?? ''}? This token will stop authenticating immediately.`,
        })}</p>
        <label className="field">
          <span>{t('Notes', { defaultValue: 'Notes' })}</span>
          <Input {...register('notes')} />
          <FieldError error={errors.notes?.message ?? getFieldError('notes')} />
        </label>
        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="submit" variant="danger" loading={isSubmitting}>
            {t('Revoke Token', { defaultValue: 'Revoke Token' })}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function MerchantIntegrationTokensPanel({ merchantId }: { merchantId: string }) {
  const { t } = useTranslation()
  const [createOpen, setCreateOpen] = useState(false)
  const [tokenCreated, setTokenCreated] = useState<MerchantIntegrationToken | null>(null)
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null)
  const [tokenPendingDelete, setTokenPendingDelete] = useState<MerchantIntegrationToken | null>(null)
  const [tokenPendingRevoke, setTokenPendingRevoke] = useState<MerchantIntegrationToken | null>(null)
  const [copied, setCopied] = useState(false)
  const queryClient = useQueryClient()
  const tokensQuery = useQuery({
    queryKey: ['merchant-profile', merchantId, 'integration-tokens'],
    queryFn: () => listMerchantIntegrationTokens(merchantId),
  })
  const tokenDetailsQuery = useQuery({
    queryKey: ['merchant-profile', 'integration-token', selectedTokenId],
    queryFn: () => getMerchantIntegrationToken(selectedTokenId!),
    enabled: Boolean(selectedTokenId),
  })
  const revokeMutation = useMutation({
    mutationFn: ({
      tokenId,
      notes,
    }: {
      tokenId: number
      notes: string | null
    }) => revokeMerchantIntegrationToken(tokenId, { notes }),
    onSuccess: async () => {
      setTokenPendingRevoke(null)
      await queryClient.invalidateQueries({
        queryKey: ['merchant-profile', merchantId, 'integration-tokens'],
      })
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (tokenId: number) => deleteMerchantIntegrationToken(tokenId),
    onSuccess: async () => {
      setTokenPendingDelete(null)
      await queryClient.invalidateQueries({
        queryKey: ['merchant-profile', merchantId, 'integration-tokens'],
      })
    },
  })
  const tokens = tokensQuery.data?.data ?? []

  async function copyToken() {
    if (!tokenCreated?.plain_token) {
      return
    }

    await navigator.clipboard.writeText(tokenCreated.plain_token)
    setCopied(true)
  }

  return (
    <div className="page-stack">
      {tokenCreated?.plain_token ? (
        <Card className="feedback-card">
          <CardHeader>
            <CardTitle>{t('Copy this token now', { defaultValue: 'Copy this token now' })}</CardTitle>
            <CardDescription>{t('This raw token will not be shown again.', {
              defaultValue: 'This raw token will not be shown again.',
            })}</CardDescription>
          </CardHeader>
          <CardContent className="form-grid">
            <Input value={tokenCreated.plain_token} readOnly />
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => void copyToken()}>
                {copied
                  ? t('Copied')
                  : t('Copy Token', { defaultValue: 'Copy Token' })}
              </Button>
              <Button type="button" variant="secondary" onClick={() => { setTokenCreated(null); setCopied(false) }}>
                {t('Dismiss', { defaultValue: 'Dismiss' })}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div className="section-title-row">
            <div>
              <CardTitle>{t('Integration Tokens', { defaultValue: 'Integration Tokens' })}</CardTitle>
              <CardDescription>{t('Admin-generated tokens for WooCommerce, Shopify, or custom integrations.', {
                defaultValue: 'Admin-generated tokens for WooCommerce, Shopify, or custom integrations.',
              })}</CardDescription>
            </div>
            <Can permission={PERMISSIONS.MERCHANT_INTEGRATIONS_CREATE}>
              <Button type="button" variant="secondary" onClick={() => setCreateOpen(true)}>
                {t('Create Token', { defaultValue: 'Create Token' })}
              </Button>
            </Can>
          </div>
        </CardHeader>
        <CardContent>
          {tokensQuery.isLoading ? <LoadingState title={t('Loading integration tokens', { defaultValue: 'Loading integration tokens' })} /> : null}
          {tokensQuery.isError ? (
            <ErrorState
              title={t('Unable to load integration tokens', { defaultValue: 'Unable to load integration tokens' })}
              message={getApiErrorMessage(tokensQuery.error)}
              onRetry={() => void tokensQuery.refetch()}
            />
          ) : null}
          {!tokensQuery.isLoading && !tokensQuery.isError && !tokens.length ? (
            <EmptyState
              title={t('No integration tokens', { defaultValue: 'No integration tokens' })}
              description={t('No integration tokens have been created for this merchant.', {
                defaultValue: 'No integration tokens have been created for this merchant.',
              })}
            />
          ) : null}
          {tokens.length ? (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>{t('Name')}</TableHead>
                    <TableHead>{t('Provider', { defaultValue: 'Provider' })}</TableHead>
                    <TableHead>{t('Token Prefix', { defaultValue: 'Token Prefix' })}</TableHead>
                    <TableHead>{t('Permissions')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Last Used', { defaultValue: 'Last Used' })}</TableHead>
                    <TableHead>{t('Expires', { defaultValue: 'Expires' })}</TableHead>
                    <TableHead>{t('Created By', { defaultValue: 'Created By' })}</TableHead>
                    <TableHead>{t('Created', { defaultValue: 'Created' })}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token) => (
                    <tr key={token.id}>
                      <TableCell>{token.name}</TableCell>
                      <TableCell><StatusBadge value={token.provider}>{token.provider}</StatusBadge></TableCell>
                      <TableCell>{token.token_prefix}</TableCell>
                      <TableCell>{token.permissions.join(', ')}</TableCell>
                      <TableCell><StatusBadge value={token.status} /></TableCell>
                      <TableCell>{token.last_used_at ? formatDate(token.last_used_at) : '-'}</TableCell>
                      <TableCell>{token.expires_at ? formatDate(token.expires_at) : '-'}</TableCell>
                      <TableCell>{token.created_by_name}</TableCell>
                      <TableCell>{formatDate(token.created_at)}</TableCell>
                      <TableCell>
                        <div className="page-header__button-row">
                          <Button type="button" variant="secondary" onClick={() => setSelectedTokenId(token.id)}>
                            {t('Details', { defaultValue: 'Details' })}
                          </Button>
                          <Can permission={PERMISSIONS.MERCHANT_INTEGRATIONS_REVOKE}>
                            <Button type="button" variant="secondary" onClick={() => setTokenPendingRevoke(token)}>
                              {t('Revoke', { defaultValue: 'Revoke' })}
                            </Button>
                          </Can>
                          <Can permission={PERMISSIONS.MERCHANT_INTEGRATIONS_DELETE}>
                            <Button type="button" variant="danger" onClick={() => setTokenPendingDelete(token)}>
                              {t('Delete')}
                            </Button>
                          </Can>
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          ) : null}
        </CardContent>
      </Card>

      <CreateTokenModal
        merchantId={merchantId}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(token) => {
          setCopied(false)
          setTokenCreated(token)
        }}
      />
      <Dialog
        open={Boolean(selectedTokenId)}
        onClose={() => setSelectedTokenId(null)}
        title={<CardTitle>{t('Integration Token Details', { defaultValue: 'Integration Token Details' })}</CardTitle>}
      >
        {tokenDetailsQuery.isLoading ? <LoadingState title={t('Loading token details', { defaultValue: 'Loading token details' })} /> : null}
        {tokenDetailsQuery.isError ? (
          <ErrorState
            title={t('Unable to load token details', { defaultValue: 'Unable to load token details' })}
            message={getApiErrorMessage(tokenDetailsQuery.error)}
            onRetry={() => void tokenDetailsQuery.refetch()}
          />
        ) : null}
        {tokenDetailsQuery.data ? (
          <dl className="detail-list">
            <div><dt>{t('Name')}</dt><dd>{tokenDetailsQuery.data.data.name}</dd></div>
            <div><dt>{t('Provider', { defaultValue: 'Provider' })}</dt><dd><StatusBadge value={tokenDetailsQuery.data.data.provider}>{tokenDetailsQuery.data.data.provider}</StatusBadge></dd></div>
            <div><dt>{t('Token Prefix', { defaultValue: 'Token Prefix' })}</dt><dd>{tokenDetailsQuery.data.data.token_prefix}</dd></div>
            <div><dt>{t('Permissions')}</dt><dd>{tokenDetailsQuery.data.data.permissions.join(', ')}</dd></div>
            <div><dt>{t('Status')}</dt><dd><StatusBadge value={tokenDetailsQuery.data.data.status} /></dd></div>
            <div><dt>{t('Last Used', { defaultValue: 'Last Used' })}</dt><dd>{tokenDetailsQuery.data.data.last_used_at ? formatDate(tokenDetailsQuery.data.data.last_used_at) : '-'}</dd></div>
            <div><dt>{t('Expires', { defaultValue: 'Expires' })}</dt><dd>{tokenDetailsQuery.data.data.expires_at ? formatDate(tokenDetailsQuery.data.data.expires_at) : '-'}</dd></div>
            <div><dt>{t('Revoked By', { defaultValue: 'Revoked By' })}</dt><dd>{tokenDetailsQuery.data.data.revoked_by_name ?? '-'}</dd></div>
            <div><dt>{t('Notes', { defaultValue: 'Notes' })}</dt><dd>{tokenDetailsQuery.data.data.notes ?? '-'}</dd></div>
            <div><dt>{t('Created', { defaultValue: 'Created' })}</dt><dd>{formatDate(tokenDetailsQuery.data.data.created_at)}</dd></div>
          </dl>
        ) : null}
      </Dialog>
      <RevokeTokenModal
        token={tokenPendingRevoke}
        open={Boolean(tokenPendingRevoke)}
        onClose={() => setTokenPendingRevoke(null)}
        error={revokeMutation.error}
        isSubmitting={revokeMutation.isPending}
        onSubmit={(values) => {
          if (tokenPendingRevoke) {
            revokeMutation.mutate({
              tokenId: tokenPendingRevoke.id,
              notes: values.notes || null,
            })
          }
        }}
      />
      <ConfirmActionModal
        open={Boolean(tokenPendingDelete)}
        title={t('Delete integration token', { defaultValue: 'Delete integration token' })}
        description={tokenPendingDelete
          ? t('Delete {{token}}?', {
            token: tokenPendingDelete.name,
            defaultValue: `Delete ${tokenPendingDelete.name}?`,
          })
          : ''}
        confirmLabel={t('Delete token', { defaultValue: 'Delete token' })}
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setTokenPendingDelete(null)}
        onConfirm={() => {
          if (tokenPendingDelete) {
            deleteMutation.mutate(tokenPendingDelete.id)
          }
        }}
      />
    </div>
  )
}


function StatTile({ accent, label, value }: { accent?: StatAccent; label: string; value: ReactNode }) {
  return (
    <Card variant="stat" className="stat-card stat-card--neutral" data-accent={accent ?? inferStatAccent(label)}>
      <CardHeader className="stat-card__header">
        <span className="eyebrow">{label}</span>
      </CardHeader>
      <CardContent className="stat-card__content">
        <CardTitle className="stat-card__value">{value}</CardTitle>
      </CardContent>
    </Card>
  )
}
