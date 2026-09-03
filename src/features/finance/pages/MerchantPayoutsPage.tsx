import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { MoreVertical } from 'lucide-react'
import {
  approveMerchantPayout,
  completeMerchantPayout,
  listMerchantPayouts,
  rejectMerchantPayout,
} from '../api/finance.api'
import type { CompleteMerchantPayoutRequest, FinanceFilters, MerchantPayout } from '../types/finance.types'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { DateRangeFilter } from '../../../shared/components/filters/DateRangeFilter'
import { MerchantSelector } from '../../../shared/components/selectors/MerchantSelector'
import { TreasuryAccountSelector } from '../../../shared/components/selectors/TreasuryAccountSelector'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Dialog } from '../../../shared/components/ui/Dialog'
import { Input } from '../../../shared/components/ui/Input'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { Select } from '../../../shared/components/ui/Select'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { useFormApiErrors } from '../../../shared/hooks/useFormApiErrors'
import { pickDisplayLabel } from '../../../shared/i18n/locale'
import { adminPath } from '../../../shared/routing/paths'
import { formatDate } from '../../../shared/utils/formatters'
import { ConfirmActionModal } from '../../../shared/components/modals/ConfirmActionModal'
import { DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '../../../shared/components/ui/Dropdown'

type PayoutFiltersState = {
  date_from: string
  date_to: string
  merchant_id: string
  status: string
  payment_method: string
}

type RejectPayoutFormValues = {
  rejection_reason: string
}

type CompletePayoutFormValues = {
  treasury_account_id: number
  payment_method: string
  reference_number: string
  notes: string
}

const initialFilters: PayoutFiltersState = {
  date_from: '',
  date_to: '',
  merchant_id: '',
  status: '',
  payment_method: '',
}

function RejectPayoutDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
  payout,
}: {
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: RejectPayoutFormValues) => void
  open: boolean
  payout: MerchantPayout | null
}) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RejectPayoutFormValues>({
    defaultValues: {
      rejection_reason: payout?.rejection_reason ?? '',
    },
  })
  const { formError, getFieldError } = useFormApiErrors(error)

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>{t('Reject Payout', { defaultValue: 'Reject Payout' })}</CardTitle>} variant="small">
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <p>{t('Reject payout for {{merchantName}}?', {
          merchantName: payout?.merchant_name ?? '',
          defaultValue: `Reject payout for ${payout?.merchant_name ?? ''}?`,
        })}</p>
        <label className="field">
          <span>{t('Rejection Reason', { defaultValue: 'Rejection Reason' })}</span>
          <Input {...register('rejection_reason', { required: t('Rejection reason is required.', { defaultValue: 'Rejection reason is required.' }) })} />
          <FieldError error={errors.rejection_reason?.message ?? getFieldError('rejection_reason')} />
        </label>
        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="submit" variant="danger" loading={isSubmitting}>
            {t('Reject Payout', { defaultValue: 'Reject Payout' })}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function CompletePayoutDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
}: {
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: CompletePayoutFormValues) => void
  open: boolean
}) {
  const { t } = useTranslation()
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompletePayoutFormValues>({
    defaultValues: {
      treasury_account_id: 0,
      payment_method: 'cash',
      reference_number: '',
      notes: '',
    },
  })
  const { formError, getFieldError } = useFormApiErrors(error)

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>{t('Complete Payout', { defaultValue: 'Complete Payout' })}</CardTitle>}>
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>{t('Treasury Account')}</span>
          <Controller
            name="treasury_account_id"
            control={control}
            render={({ field }) => (
              <TreasuryAccountSelector
                value={field.value > 0 ? String(field.value) : ''}
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
              />
            )}
          />
          <FieldError error={errors.treasury_account_id?.message ?? getFieldError('treasury_account_id')} />
        </label>
        <label className="field">
          <span>{t('Payment Method', { defaultValue: 'Payment Method' })}</span>
          <Select {...register('payment_method', { required: t('Payment method is required.', { defaultValue: 'Payment method is required.' }) })}>
            <option value="cash">cash</option>
            <option value="bank_transfer">bank_transfer</option>
            <option value="wallet">wallet</option>
          </Select>
          <FieldError error={errors.payment_method?.message ?? getFieldError('payment_method')} />
        </label>
        <label className="field">
          <span>{t('Reference Number', { defaultValue: 'Reference Number' })}</span>
          <Input {...register('reference_number')} />
          <FieldError error={errors.reference_number?.message ?? getFieldError('reference_number')} />
        </label>
        <label className="field">
          <span>{t('Notes')}</span>
          <Input {...register('notes')} />
          <FieldError error={errors.notes?.message ?? getFieldError('notes')} />
        </label>
        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {t('Complete Payout', { defaultValue: 'Complete Payout' })}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function MerchantPayoutsPanel({
  embedded = false,
  onCountChange,
}: {
  embedded?: boolean
  onCountChange?: (count: number) => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<PayoutFiltersState>(initialFilters)
  const [payoutPendingReject, setPayoutPendingReject] = useState<MerchantPayout | null>(null)
  const [payoutPendingComplete, setPayoutPendingComplete] = useState<MerchantPayout | null>(null)
  const [bulkApprovalOpen, setBulkApprovalOpen] = useState(false)
  const params: FinanceFilters = useMemo(
    () => ({
      ...(filters.date_from ? { date_from: filters.date_from } : {}),
      ...(filters.date_to ? { date_to: filters.date_to } : {}),
      ...(filters.merchant_id ? { merchant_id: filters.merchant_id } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.payment_method ? { payment_method: filters.payment_method } : {}),
    }),
    [filters],
  )
  const payoutsQuery = useQuery({
    queryKey: ['merchant-payouts', params],
    queryFn: () => listMerchantPayouts(params),
  })
  const approveMutation = useMutation({
    mutationFn: (merchantPayoutId: number) => approveMerchantPayout(merchantPayoutId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['merchant-payouts'] })
    },
  })
  const rejectMutation = useMutation({
    mutationFn: ({
      merchantPayoutId,
      values,
    }: {
      merchantPayoutId: number
      values: RejectPayoutFormValues
    }) => rejectMerchantPayout(merchantPayoutId, values),
    onSuccess: async () => {
      setPayoutPendingReject(null)
      await queryClient.invalidateQueries({ queryKey: ['merchant-payouts'] })
    },
  })
  const completeMutation = useMutation({
    mutationFn: ({
      merchantPayoutId,
      values,
    }: {
      merchantPayoutId: number
      values: CompletePayoutFormValues
    }) => {
      const payload: CompleteMerchantPayoutRequest = {
        treasury_account_id: values.treasury_account_id || undefined,
        payment_method: values.payment_method,
        reference_number: values.reference_number || undefined,
        notes: values.notes || undefined,
      }
      return completeMerchantPayout(merchantPayoutId, payload)
    },
    onSuccess: async () => {
      setPayoutPendingComplete(null)
      await queryClient.invalidateQueries({ queryKey: ['merchant-payouts'] })
      await queryClient.invalidateQueries({ queryKey: ['treasury-transactions'] })
    },
  })
  const payouts = payoutsQuery.data?.data ?? []
  const pendingPayouts = payouts.filter((payout) => payout.status === 'pending')
  const totalsByStatus = (status: string) => payouts
    .filter((payout) => payout.status === status)
    .reduce((sum, payout) => sum + Number(payout.amount || 0), 0)
  const countByStatus = (status: string) => payouts.filter((payout) => payout.status === status).length
  const bulkApproveMutation = useMutation({
    mutationFn: () => Promise.all(pendingPayouts.map((payout) => approveMerchantPayout(payout.id))),
    onSuccess: async () => {
      setBulkApprovalOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['merchant-payouts'] })
    },
  })

  useEffect(() => {
    if (payoutsQuery.data) {
      onCountChange?.(payoutsQuery.data.data.length)
    }
  }, [onCountChange, payoutsQuery.data])

  const payoutHeaderActions = (
    <div className="page-header__button-row finance-panel-actions">
      {pendingPayouts.length ? (
        <Can permission={PERMISSIONS.FINANCE_PAYOUTS_APPROVE}>
          <Button type="button" variant="secondary" onClick={() => setBulkApprovalOpen(true)}>
            {t('Approve all pending ({{count}})', { count: pendingPayouts.length, defaultValue: `Approve all pending (${pendingPayouts.length})` })}
          </Button>
        </Can>
      ) : null}
      <Can permission={PERMISSIONS.PAYOUTS_CREATE}>
        <Link className="ui-link-reset" to={adminPath('/finance/merchant-payouts/create')}>
          <Button>{t('Create Payout', { defaultValue: 'Create Payout' })}</Button>
        </Link>
      </Can>
    </div>
  )

  return (
    <section className="page-section">
      {!embedded ? <div className="finance-page-header animate-fade-up">
        <PageHeader
          title={t('Merchant Payouts', { defaultValue: 'Merchant Payouts' })}
          description={t('Approve, reject, and complete merchant payouts using backend-owned balances.', { defaultValue: 'Approve, reject, and complete merchant payouts using backend-owned balances.' })}
          actions={payoutHeaderActions}
        />
      </div> : (
        payoutHeaderActions
      )}

      <div className="stats-grid finance-summary-grid">
        <Card variant="stat" className="finance-summary-card finance-summary-card--warning" data-accent="warning"><CardContent><div className="compact-stat"><span className="compact-stat__label">{t('Total Pending', { defaultValue: 'Total Pending' })}</span><span className="compact-stat__value text-warning"><MoneyDisplay value={totalsByStatus('pending')} /></span><span className="compact-stat__count">{t('{{count}} payouts', { count: countByStatus('pending'), defaultValue: `${countByStatus('pending')} payouts` })}</span></div></CardContent></Card>
        <Card variant="stat" className="finance-summary-card finance-summary-card--info" data-accent="finance"><CardContent><div className="compact-stat"><span className="compact-stat__label">{t('Total Approved', { defaultValue: 'Total Approved' })}</span><span className="compact-stat__value text-info"><MoneyDisplay value={totalsByStatus('approved')} /></span><span className="compact-stat__count">{t('{{count}} payouts', { count: countByStatus('approved'), defaultValue: `${countByStatus('approved')} payouts` })}</span></div></CardContent></Card>
        <Card variant="stat" className="finance-summary-card finance-summary-card--success" data-accent="success"><CardContent><div className="compact-stat"><span className="compact-stat__label">{t('Total Paid', { defaultValue: 'Total Paid' })}</span><span className="compact-stat__value text-success"><MoneyDisplay value={totalsByStatus('completed')} /></span><span className="compact-stat__count">{t('{{count}} payouts', { count: countByStatus('completed'), defaultValue: `${countByStatus('completed')} payouts` })}</span></div></CardContent></Card>
      </div>

      <Card variant="flat" className="dashboard-filter-card">
        <CardContent className="dashboard-filters finance-filter-bar">
          <DateRangeFilter
            dateFrom={filters.date_from}
            dateTo={filters.date_to}
            onChange={({ date_from, date_to }) => setFilters((current) => ({ ...current, date_from, date_to }))}
          />
          <label className="field">
            <span>{t('Merchant')}</span>
            <MerchantSelector
              value={filters.merchant_id}
              includeAllOption
              onChange={(merchant_id) => setFilters((current) => ({ ...current, merchant_id }))}
            />
          </label>
          <label className="field">
            <span>{t('Status')}</span>
            <Select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="">{t('All statuses')}</option>
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="completed">completed</option>
              <option value="rejected">rejected</option>
              <option value="cancelled">cancelled</option>
            </Select>
          </label>
          <label className="field">
            <span>{t('Payment Method', { defaultValue: 'Payment Method' })}</span>
            <Select
              value={filters.payment_method}
              onChange={(event) => setFilters((current) => ({ ...current, payment_method: event.target.value }))}
            >
              <option value="">{t('All methods', { defaultValue: 'All methods' })}</option>
              <option value="cash">cash</option>
              <option value="bank_transfer">bank_transfer</option>
              <option value="wallet">wallet</option>
            </Select>
          </label>
          <Button type="button" variant="secondary" onClick={() => setFilters(initialFilters)}>
            {t('Reset filters')}
          </Button>
        </CardContent>
      </Card>

      <Card className="table-card">
        <CardHeader>
          <CardTitle>{t('Payout Records', { defaultValue: 'Payout Records' })}</CardTitle>
          <CardDescription>{t('Pending, approved, and completed payouts returned directly from finance APIs.', { defaultValue: 'Pending, approved, and completed payouts returned directly from finance APIs.' })}</CardDescription>
        </CardHeader>
        <CardContent>
          {payoutsQuery.isLoading ? <LoadingState title={t('Loading merchant payouts', { defaultValue: 'Loading merchant payouts' })} /> : null}
          {payoutsQuery.isError ? (
            <ErrorState
              title={t('Unable to load merchant payouts', { defaultValue: 'Unable to load merchant payouts' })}
              message={getApiErrorMessage(payoutsQuery.error)}
              onRetry={() => void payoutsQuery.refetch()}
            />
          ) : null}
          {bulkApproveMutation.isError ? <div className="form-error">{getApiErrorMessage(bulkApproveMutation.error)}</div> : null}
          {!payoutsQuery.isLoading && !payoutsQuery.isError && !payouts.length ? (
            <EmptyState
              title={t('No payouts found', { defaultValue: 'No payouts found' })}
              description={t('No payout records matched the selected filters.', { defaultValue: 'No payout records matched the selected filters.' })}
            />
          ) : null}
          {payouts.length ? (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>{t('Merchant')}</TableHead>
                    <TableHead>{t('Amount')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Method', { defaultValue: 'Method' })}</TableHead>
                    <TableHead>{t('Reference')}</TableHead>
                    <TableHead>{t('Paid At', { defaultValue: 'Paid At' })}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => (
                    <tr key={payout.id}>
                      <TableCell>
                        <Link className="table-link" to={adminPath(`/finance/merchant-payouts/${payout.id}`)}>
                          {payout.merchant_name}
                        </Link>
                      </TableCell>
                      <TableCell className="amount-cell"><MoneyDisplay value={payout.amount} /></TableCell>
                      <TableCell>
                        <StatusBadge value={payout.status}>
                          {pickDisplayLabel(payout.status, payout.status_label)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>{pickDisplayLabel(payout.payment_method, payout.payment_method_label)}</TableCell>
                      <TableCell>{payout.reference_number ?? '-'}</TableCell>
                      <TableCell>{payout.paid_at ? formatDate(payout.paid_at) : '-'}</TableCell>
                      <TableCell>
                        <div className="finance-row-actions">
                          <Link className="ui-link-reset" to={adminPath(`/finance/merchant-payouts/${payout.id}`)}>
                            <Button size="sm" variant="ghost">{t('View')}</Button>
                          </Link>
                          {payout.status === 'pending' ? (
                            <>
                              <Can permission={PERMISSIONS.FINANCE_PAYOUTS_APPROVE}>
                                <Button size="sm" className="finance-action--approve" loading={approveMutation.isPending} onClick={() => approveMutation.mutate(payout.id)}>{t('Approve', { defaultValue: 'Approve' })}</Button>
                              </Can>
                              <Can permission={PERMISSIONS.FINANCE_PAYOUTS_REJECT}>
                                <Button size="sm" variant="danger" onClick={() => setPayoutPendingReject(payout)}>{t('Reject', { defaultValue: 'Reject' })}</Button>
                              </Can>
                            </>
                          ) : null}
                          <DropdownMenu>
                            <DropdownTrigger aria-label={t('More actions', { defaultValue: 'More actions' })}><MoreVertical size={18} /></DropdownTrigger>
                            <DropdownContent>
                              <Can permission={PERMISSIONS.PAYOUTS_UPDATE}>
                                <DropdownItem><Link className="ui-link-reset" to={adminPath(`/finance/merchant-payouts/${payout.id}/edit`)}>{t('Edit')}</Link></DropdownItem>
                              </Can>
                              {payout.status === 'approved' ? (
                                <Can permission={PERMISSIONS.FINANCE_PAYOUTS_COMPLETE}>
                                  <DropdownItem onClick={() => setPayoutPendingComplete(payout)}>{t('Complete', { defaultValue: 'Complete' })}</DropdownItem>
                                </Can>
                              ) : null}
                              {payout.status === 'approved' ? (
                                <Can permission={PERMISSIONS.FINANCE_PAYOUTS_REJECT}>
                                  <DropdownItem destructive onClick={() => setPayoutPendingReject(payout)}>{t('Reject', { defaultValue: 'Reject' })}</DropdownItem>
                                </Can>
                              ) : null}
                            </DropdownContent>
                          </DropdownMenu>
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

      <RejectPayoutDialog
        error={rejectMutation.error}
        isSubmitting={rejectMutation.isPending}
        onClose={() => setPayoutPendingReject(null)}
        onSubmit={(values) => {
          if (payoutPendingReject) {
            rejectMutation.mutate({ merchantPayoutId: payoutPendingReject.id, values })
          }
        }}
        open={Boolean(payoutPendingReject)}
        payout={payoutPendingReject}
      />
      <CompletePayoutDialog
        error={completeMutation.error}
        isSubmitting={completeMutation.isPending}
        onClose={() => setPayoutPendingComplete(null)}
        onSubmit={(values) => {
          if (payoutPendingComplete) {
            completeMutation.mutate({ merchantPayoutId: payoutPendingComplete.id, values })
          }
        }}
        open={Boolean(payoutPendingComplete)}
      />
      <ConfirmActionModal
        open={bulkApprovalOpen}
        title={t('Approve pending payouts', { defaultValue: 'Approve pending payouts' })}
        description={t('Approve all {{count}} pending payouts in the current filtered list?', {
          count: pendingPayouts.length,
          defaultValue: `Approve all ${pendingPayouts.length} pending payouts in the current filtered list?`,
        })}
        confirmLabel={t('Approve payouts', { defaultValue: 'Approve payouts' })}
        loading={bulkApproveMutation.isPending}
        onCancel={() => setBulkApprovalOpen(false)}
        onConfirm={() => bulkApproveMutation.mutate()}
      />
    </section>
  )
}

export function MerchantPayoutsPage() {
  return <MerchantPayoutsPanel />
}
