import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { MoreVertical } from 'lucide-react'
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
import { FieldError } from '../../../shared/components/forms/FieldError'
import {
  FilterButton,
  FilterPopover,
  FilterField,
  AppliedFilterChips,
  DateRangeFilter,
  type AppliedChip,
} from '../../../shared/components/filters'
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
import { DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '../../../shared/components/ui/Dropdown'

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

export function ExpensesPanel({
  embedded = false,
  onCountChange,
}: {
  embedded?: boolean
  onCountChange?: (count: number) => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [appliedFilters, setAppliedFilters] = useState<ExpenseFiltersState>(initialFilters)
  const [draftFilters, setDraftFilters] = useState<ExpenseFiltersState>(initialFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterError, setFilterError] = useState('')
  const [expensePendingReject, setExpensePendingReject] = useState<Expense | null>(null)
  const [expensePendingPaid, setExpensePendingPaid] = useState<Expense | null>(null)

  const params: FinanceFilters = useMemo(
    () => ({
      ...(appliedFilters.date_from ? { date_from: appliedFilters.date_from } : {}),
      ...(appliedFilters.date_to ? { date_to: appliedFilters.date_to } : {}),
      ...(appliedFilters.category ? { category: appliedFilters.category } : {}),
      ...(appliedFilters.payment_method ? { payment_method: appliedFilters.payment_method } : {}),
      ...(appliedFilters.status ? { status: appliedFilters.status } : {}),
    }),
    [appliedFilters],
  )

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (appliedFilters.date_from || appliedFilters.date_to) count += 1
    if (appliedFilters.category) count += 1
    if (appliedFilters.payment_method) count += 1
    if (appliedFilters.status) count += 1
    return count
  }, [appliedFilters])

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
    setDraftFilters(initialFilters)
    setAppliedFilters(initialFilters)
    setFilterError('')
    setFiltersOpen(false)
  }

  const appliedChips = useMemo<AppliedChip[]>(() => {
    const chips: AppliedChip[] = []
    if (appliedFilters.category) {
      chips.push({
        id: 'category',
        label: t('Category'),
        value: appliedFilters.category,
      })
    }
    if (appliedFilters.payment_method) {
      chips.push({
        id: 'payment_method',
        label: t('Payment Method', { defaultValue: 'Payment Method' }),
        value: appliedFilters.payment_method,
      })
    }
    if (appliedFilters.status) {
      chips.push({
        id: 'status',
        label: t('Status'),
        value: appliedFilters.status,
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
    setAppliedFilters(initialFilters)
  }
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
  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthExpenses = expenses.filter((expense) => expense.expense_date?.startsWith(currentMonth))
  const monthTotal = monthExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
  const categoryTotals = monthExpenses.reduce<Record<string, number>>((totals, expense) => {
    totals[expense.category] = (totals[expense.category] ?? 0) + Number(expense.amount || 0)
    return totals
  }, {})
  const topCategory = Object.entries(categoryTotals).sort(([, left], [, right]) => right - left)[0]

  useEffect(() => {
    if (expensesQuery.data) {
      onCountChange?.(expensesQuery.data.data.length)
    }
  }, [expensesQuery.data, onCountChange])

  return (
    <section className="page-section">
      {!embedded ? <div className="finance-page-header animate-fade-up">
        <PageHeader
          title={t('Expenses', { defaultValue: 'Expenses' })}
          description={t('Approve, reject, and mark expenses paid through documented finance actions.', { defaultValue: 'Approve, reject, and mark expenses paid through documented finance actions.' })}
          actions={(
            <Can permission={PERMISSIONS.EXPENSES_CREATE}>
              <Link className="ui-link-reset" to={adminPath('/finance/expenses/create')}>
                <Button>{t('Create Expense', { defaultValue: 'Create Expense' })}</Button>
              </Link>
            </Can>
          )}
        />
      </div> : (
        <div className="page-header__button-row">
          <Can permission={PERMISSIONS.EXPENSES_CREATE}>
            <Link className="ui-link-reset" to={adminPath('/finance/expenses/create')}>
              <Button>{t('Create Expense', { defaultValue: 'Create Expense' })}</Button>
            </Link>
          </Can>
        </div>
      )}

      <div className="stats-grid finance-summary-grid">
        <Card variant="stat" className="finance-summary-card finance-summary-card--danger" data-accent="warning"><CardContent><div className="compact-stat"><span className="compact-stat__label">{t('Total This Month', { defaultValue: 'Total This Month' })}</span><span className="compact-stat__value text-danger"><MoneyDisplay value={monthTotal} /></span><span className="compact-stat__count">{t('{{count}} expenses', { count: monthExpenses.length, defaultValue: `${monthExpenses.length} expenses` })}</span></div></CardContent></Card>
        <Card variant="stat" className="finance-summary-card finance-summary-card--warning" data-accent="warning"><CardContent><div className="compact-stat"><span className="compact-stat__label">{t('Top Category', { defaultValue: 'Top Category' })}</span><span className="compact-stat__value text-warning">{topCategory ? pickDisplayLabel(topCategory[0]) : '-'}</span><span className="compact-stat__count">{topCategory ? <MoneyDisplay value={topCategory[1]} /> : t('No expenses this month', { defaultValue: 'No expenses this month' })}</span></div></CardContent></Card>
      </div>

      <div className="page-toolbar" style={{ justifyContent: 'flex-end', marginBottom: '16px' }}>
        <div className="page-toolbar__actions">
          <FilterPopover
            title={t('Filter Expenses', { defaultValue: 'Filter Expenses' })}
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
              <FilterField label={t('Category')}>
                <Input
                  value={draftFilters.category}
                  onChange={(event) => setDraftFilters((c) => ({ ...c, category: event.target.value }))}
                />
              </FilterField>
              <FilterField label={t('Payment Method', { defaultValue: 'Payment Method' })}>
                <Select
                  value={draftFilters.payment_method}
                  onChange={(event) => setDraftFilters((c) => ({ ...c, payment_method: event.target.value }))}
                >
                  <option value="">{t('All methods', { defaultValue: 'All methods' })}</option>
                  <option value="cash">cash</option>
                  <option value="bank_transfer">bank_transfer</option>
                  <option value="wallet">wallet</option>
                </Select>
              </FilterField>
              <FilterField label={t('Status')}>
                <Select
                  value={draftFilters.status}
                  onChange={(event) => setDraftFilters((c) => ({ ...c, status: event.target.value }))}
                >
                  <option value="">{t('All statuses')}</option>
                  <option value="pending">pending</option>
                  <option value="approved">approved</option>
                  <option value="paid">paid</option>
                  <option value="rejected">rejected</option>
                  <option value="cancelled">cancelled</option>
                </Select>
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
                      <TableCell className="amount-cell"><MoneyDisplay value={expense.amount} /></TableCell>
                      <TableCell>
                        <StatusBadge value={expense.status ?? 'pending'}>
                          {pickDisplayLabel(expense.status ?? 'pending', expense.status_label)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>{pickDisplayLabel(expense.payment_method, expense.payment_method_label)}</TableCell>
                      <TableCell>{expense.expense_date}</TableCell>
                      <TableCell>{formatDate(expense.created_at)}</TableCell>
                      <TableCell>
                        <div className="finance-row-actions">
                          <Link className="ui-link-reset" to={adminPath(`/finance/expenses/${expense.id}`)}><Button size="sm" variant="ghost">{t('View')}</Button></Link>
                          {expense.status === 'pending' ? <><Can permission={PERMISSIONS.FINANCE_EXPENSES_APPROVE}><Button size="sm" className="finance-action--approve" loading={approveMutation.isPending} onClick={() => approveMutation.mutate(expense.id)}>{t('Approve', { defaultValue: 'Approve' })}</Button></Can><Can permission={PERMISSIONS.FINANCE_EXPENSES_REJECT}><Button size="sm" variant="danger" onClick={() => setExpensePendingReject(expense)}>{t('Reject', { defaultValue: 'Reject' })}</Button></Can></> : null}
                          <DropdownMenu>
                            <DropdownTrigger aria-label={t('More actions', { defaultValue: 'More actions' })}><MoreVertical size={18} /></DropdownTrigger>
                            <DropdownContent>
                              <Can permission={PERMISSIONS.EXPENSES_UPDATE}><DropdownItem><Link className="ui-link-reset" to={adminPath(`/finance/expenses/${expense.id}/edit`)}>{t('Edit')}</Link></DropdownItem></Can>
                              {expense.status === 'approved' ? <Can permission={PERMISSIONS.FINANCE_EXPENSES_PAY}><DropdownItem onClick={() => setExpensePendingPaid(expense)}>{t('Mark Paid', { defaultValue: 'Mark Paid' })}</DropdownItem></Can> : null}
                              {expense.status === 'approved' ? <Can permission={PERMISSIONS.FINANCE_EXPENSES_REJECT}><DropdownItem destructive onClick={() => setExpensePendingReject(expense)}>{t('Reject', { defaultValue: 'Reject' })}</DropdownItem></Can> : null}
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

export function ExpensesPage() {
  return <ExpensesPanel />
}
