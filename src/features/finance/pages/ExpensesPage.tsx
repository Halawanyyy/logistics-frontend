import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  approveExpense,
  listExpenses,
  markExpensePaid,
  rejectExpense,
} from '../api/finance.api'
import type { Expense, FinanceFilters, MarkExpensePaidRequest } from '../types/finance.types'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { ApprovalActionButtons } from '../../../shared/components/actions/ApprovalActionButtons'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { DateRangeFilter } from '../../../shared/components/filters/DateRangeFilter'
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

type ExpenseFiltersState = {
  date_from: string
  date_to: string
  category: string
  payment_method: string
  status: string
}

type RejectExpenseFormValues = {
  rejection_reason: string
}

type MarkExpensePaidFormValues = {
  treasury_account_id: number
  notes: string
}

const initialFilters: ExpenseFiltersState = {
  date_from: '',
  date_to: '',
  category: '',
  payment_method: '',
  status: '',
}

function RejectExpenseDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
}: {
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: RejectExpenseFormValues) => void
  open: boolean
}) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RejectExpenseFormValues>({
    defaultValues: {
      rejection_reason: '',
    },
  })
  const { formError, getFieldError } = useFormApiErrors(error)

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>{t('Reject Expense', { defaultValue: 'Reject Expense' })}</CardTitle>} variant="small">
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
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
            {t('Reject Expense', { defaultValue: 'Reject Expense' })}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function MarkExpensePaidDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
}: {
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: MarkExpensePaidFormValues) => void
  open: boolean
}) {
  const { t } = useTranslation()
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MarkExpensePaidFormValues>({
    defaultValues: {
      treasury_account_id: 0,
      notes: '',
    },
  })
  const { formError, getFieldError } = useFormApiErrors(error)

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>{t('Mark Expense Paid', { defaultValue: 'Mark Expense Paid' })}</CardTitle>}>
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
            {t('Mark Paid', { defaultValue: 'Mark Paid' })}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function ExpensesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<ExpenseFiltersState>(initialFilters)
  const [expensePendingReject, setExpensePendingReject] = useState<Expense | null>(null)
  const [expensePendingPaid, setExpensePendingPaid] = useState<Expense | null>(null)
  const params: FinanceFilters = useMemo(
    () => ({
      ...(filters.date_from ? { date_from: filters.date_from } : {}),
      ...(filters.date_to ? { date_to: filters.date_to } : {}),
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.payment_method ? { payment_method: filters.payment_method } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    }),
    [filters],
  )
  const expensesQuery = useQuery({
    queryKey: ['expenses', params],
    queryFn: () => listExpenses(params),
  })
  const approveMutation = useMutation({
    mutationFn: (expenseId: number) => approveExpense(expenseId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
  const rejectMutation = useMutation({
    mutationFn: ({
      expenseId,
      values,
    }: {
      expenseId: number
      values: RejectExpenseFormValues
    }) => rejectExpense(expenseId, values),
    onSuccess: async () => {
      setExpensePendingReject(null)
      await queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
  const markPaidMutation = useMutation({
    mutationFn: ({
      expenseId,
      values,
    }: {
      expenseId: number
      values: MarkExpensePaidFormValues
    }) => {
      const payload: MarkExpensePaidRequest = {
        treasury_account_id: values.treasury_account_id || undefined,
        notes: values.notes || undefined,
      }
      return markExpensePaid(expenseId, payload)
    },
    onSuccess: async () => {
      setExpensePendingPaid(null)
      await queryClient.invalidateQueries({ queryKey: ['expenses'] })
      await queryClient.invalidateQueries({ queryKey: ['treasury-transactions'] })
    },
  })
  const expenses = expensesQuery.data?.data ?? []

  return (
    <section className="page-section">
      <PageHeader
        title="Expenses"
        description="Approve, reject, and mark expenses paid through documented finance actions."
        actions={(
          <Can permission={PERMISSIONS.EXPENSES_CREATE}>
            <Link className="ui-link-reset" to={adminPath('/finance/expenses/create')}>
              <Button>{t('Create Expense', { defaultValue: 'Create Expense' })}</Button>
            </Link>
          </Can>
        )}
      />

      <Card variant="flat" className="dashboard-filter-card">
        <CardContent className="dashboard-filters">
          <DateRangeFilter
            dateFrom={filters.date_from}
            dateTo={filters.date_to}
            onChange={({ date_from, date_to }) => setFilters((current) => ({ ...current, date_from, date_to }))}
          />
          <label className="field">
            <span>{t('Category')}</span>
            <Input
              value={filters.category}
              onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
            />
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
          <label className="field">
            <span>{t('Status')}</span>
            <Select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="">{t('All statuses')}</option>
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="paid">paid</option>
              <option value="rejected">rejected</option>
              <option value="cancelled">cancelled</option>
            </Select>
          </label>
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
        <CardHeader>
          <CardTitle>{t('Expense Records', { defaultValue: 'Expense Records' })}</CardTitle>
          <CardDescription>{t('Expenses and their approval state from the finance API.', { defaultValue: 'Expenses and their approval state from the finance API.' })}</CardDescription>
        </CardHeader>
        <CardContent>
          {expensesQuery.isLoading ? <LoadingState title={t('Loading expenses', { defaultValue: 'Loading expenses' })} /> : null}
          {expensesQuery.isError ? (
            <ErrorState
              title={t('Unable to load expenses', { defaultValue: 'Unable to load expenses' })}
              message={getApiErrorMessage(expensesQuery.error)}
              onRetry={() => void expensesQuery.refetch()}
            />
          ) : null}
          {!expensesQuery.isLoading && !expensesQuery.isError && !expenses.length ? (
            <EmptyState
              title={t('No expenses found', { defaultValue: 'No expenses found' })}
              description={t('No expense records matched the selected filters.', { defaultValue: 'No expense records matched the selected filters.' })}
            />
          ) : null}
          {expenses.length ? (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>{t('Category')}</TableHead>
                    <TableHead>{t('Amount')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Method', { defaultValue: 'Method' })}</TableHead>
                    <TableHead>{t('Expense Date', { defaultValue: 'Expense Date' })}</TableHead>
                    <TableHead>{t('Created')}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <TableCell>
                        <Link className="table-link" to={adminPath(`/finance/expenses/${expense.id}`)}>
                          {pickDisplayLabel(expense.category, expense.category_label)}
                        </Link>
                      </TableCell>
                      <TableCell><MoneyDisplay value={expense.amount} /></TableCell>
                      <TableCell>
                        <StatusBadge value={expense.status ?? 'pending'}>
                          {pickDisplayLabel(expense.status ?? 'pending', expense.status_label)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>{pickDisplayLabel(expense.payment_method, expense.payment_method_label)}</TableCell>
                      <TableCell>{expense.expense_date}</TableCell>
                      <TableCell>{formatDate(expense.created_at)}</TableCell>
                      <TableCell>
                        <div className="page-header__button-row">
                          <Link className="table-link" to={adminPath(`/finance/expenses/${expense.id}`)}>
                            {t('View')}
                          </Link>
                          <Can permission={PERMISSIONS.EXPENSES_UPDATE}>
                            <Link className="table-link" to={adminPath(`/finance/expenses/${expense.id}/edit`)}>
                              {t('Edit')}
                            </Link>
                          </Can>
                        </div>
                        <ApprovalActionButtons
                          approve={expense.status === 'pending' ? {
                            label: t('Approve', { defaultValue: 'Approve' }),
                            permission: PERMISSIONS.FINANCE_EXPENSES_APPROVE,
                            loading: approveMutation.isPending,
                            onClick: () => approveMutation.mutate(expense.id),
                          } : undefined}
                          reject={['pending', 'approved'].includes(expense.status ?? '') ? {
                            label: t('Reject', { defaultValue: 'Reject' }),
                            permission: PERMISSIONS.FINANCE_EXPENSES_REJECT,
                            onClick: () => setExpensePendingReject(expense),
                          } : undefined}
                          markPaid={expense.status === 'approved' ? {
                            label: t('Mark Paid', { defaultValue: 'Mark Paid' }),
                            permission: PERMISSIONS.FINANCE_EXPENSES_PAY,
                            onClick: () => setExpensePendingPaid(expense),
                          } : undefined}
                        />
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          ) : null}
        </CardContent>
      </Card>

      <RejectExpenseDialog
        error={rejectMutation.error}
        isSubmitting={rejectMutation.isPending}
        onClose={() => setExpensePendingReject(null)}
        onSubmit={(values) => {
          if (expensePendingReject) {
            rejectMutation.mutate({ expenseId: expensePendingReject.id, values })
          }
        }}
        open={Boolean(expensePendingReject)}
      />
      <MarkExpensePaidDialog
        error={markPaidMutation.error}
        isSubmitting={markPaidMutation.isPending}
        onClose={() => setExpensePendingPaid(null)}
        onSubmit={(values) => {
          if (expensePendingPaid) {
            markPaidMutation.mutate({ expenseId: expensePendingPaid.id, values })
          }
        }}
        open={Boolean(expensePendingPaid)}
      />
    </section>
  )
}
