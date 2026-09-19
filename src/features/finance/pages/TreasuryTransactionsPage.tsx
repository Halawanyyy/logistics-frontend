import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { listTreasuryTransactions } from '../api/finance.api'
import type { FinanceFilters } from '../types/finance.types'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { DateRangeFilter } from '../../../shared/components/filters/DateRangeFilter'
import { FilterButton } from '../../../shared/components/filters/FilterButton'
import { FilterPopover } from '../../../shared/components/filters/FilterPopover'
import { FilterField } from '../../../shared/components/filters/FilterField'
import { AppliedFilterChips, type AppliedFilterChip } from '../../../shared/components/filters/AppliedFilterChips'
import { TreasuryAccountSelector } from '../../../shared/components/selectors/TreasuryAccountSelector'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Dialog } from '../../../shared/components/ui/Dialog'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { Select } from '../../../shared/components/ui/Select'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { pickDisplayLabel } from '../../../shared/i18n/locale'
import { formatDate } from '../../../shared/utils/formatters'
type TreasuryFiltersState = {
  treasury_account_id: string
  direction: string
  source_type: string
  date_from: string
  date_to: string
}

const initialFilters: TreasuryFiltersState = {
  treasury_account_id: '',
  direction: '',
  source_type: '',
  date_from: '',
  date_to: '',
}

export function TreasuryTransactionsPanel({
  embedded = false,
  onCountChange,
}: {
  embedded?: boolean
  onCountChange?: (count: number) => void
}) {
  const { t } = useTranslation()
  const [filters, setFilters] = useState<TreasuryFiltersState>(initialFilters)
  const [draftFilters, setDraftFilters] = useState<TreasuryFiltersState>(initialFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null)

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.treasury_account_id) count++
    if (filters.direction) count++
    if (filters.source_type) count++
    if (filters.date_from || filters.date_to) count++
    return count
  }, [filters])

  const appliedChips: AppliedFilterChip[] = useMemo(() => {
    const chips: AppliedFilterChip[] = []
    if (filters.treasury_account_id) {
      chips.push({ key: 'treasury_account_id', label: t('Treasury Account'), value: filters.treasury_account_id })
    }
    if (filters.direction) {
      chips.push({ key: 'direction', label: t('Direction'), value: t(filters.direction) })
    }
    if (filters.source_type) {
      chips.push({ key: 'source_type', label: t('Source Type'), value: t(filters.source_type) })
    }
    if (filters.date_from || filters.date_to) {
      chips.push({
        key: 'date_range',
        label: t('Date Range', { defaultValue: 'Date Range' }),
        value: `${filters.date_from || '...'} → ${filters.date_to || '...'}`,
      })
    }
    return chips
  }, [filters, t])

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraftFilters(filters)
    }
    setFiltersOpen(nextOpen)
  }

  const handleApply = () => {
    setFilters(draftFilters)
    setFiltersOpen(false)
  }

  const handleReset = () => {
    setDraftFilters(initialFilters)
    setFilters(initialFilters)
    setFiltersOpen(false)
  }

  const handleRemoveChip = (key: string) => {
    if (key === 'treasury_account_id') {
      setFilters((c) => ({ ...c, treasury_account_id: '' }))
      setDraftFilters((c) => ({ ...c, treasury_account_id: '' }))
    }
    if (key === 'direction') {
      setFilters((c) => ({ ...c, direction: '' }))
      setDraftFilters((c) => ({ ...c, direction: '' }))
    }
    if (key === 'source_type') {
      setFilters((c) => ({ ...c, source_type: '' }))
      setDraftFilters((c) => ({ ...c, source_type: '' }))
    }
    if (key === 'date_range') {
      setFilters((c) => ({ ...c, date_from: '', date_to: '' }))
      setDraftFilters((c) => ({ ...c, date_from: '', date_to: '' }))
    }
  }

  const params: FinanceFilters = useMemo(
    () => ({
      ...(filters.treasury_account_id ? { treasury_account_id: filters.treasury_account_id } : {}),
      ...(filters.direction ? { direction: filters.direction } : {}),
      ...(filters.source_type ? { source_type: filters.source_type } : {}),
      ...(filters.date_from ? { date_from: filters.date_from } : {}),
      ...(filters.date_to ? { date_to: filters.date_to } : {}),
    }),
    [filters],
  )
  const treasuryTransactionsQuery = useQuery({
    queryKey: ['treasury-transactions', params],
    queryFn: () => listTreasuryTransactions(params),
  })
  const transactions = treasuryTransactionsQuery.data?.data ?? []
  const selectedTransaction = transactions.find((transaction) => transaction.id === selectedTransactionId) ?? null

  useEffect(() => {
    if (treasuryTransactionsQuery.data) {
      onCountChange?.(treasuryTransactionsQuery.data.data.length)
    }
  }, [onCountChange, treasuryTransactionsQuery.data])

  return (
    <section className="page-section">
      {!embedded ? <div className="finance-page-header animate-fade-up">
        <PageHeader
        title={t('Treasury Transactions')}
        description={t('Treasury debits and credits generated by finance and warehouse flows.', { defaultValue: 'Treasury debits and credits generated by finance and warehouse flows.' })}
      />
      </div> : null}

      <div className="page-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
        <AppliedFilterChips
          chips={appliedChips}
          onRemove={handleRemoveChip}
          onClearAll={handleReset}
        />
        <div style={{ marginInlineStart: 'auto' }}>
          <FilterPopover
            title={t('Filter Treasury Transactions', { defaultValue: 'Filter Treasury Transactions' })}
            open={filtersOpen}
            onOpenChange={handleOpenChange}
            onApply={handleApply}
            onReset={handleReset}
            activeCount={activeFilterCount}
            trigger={
              <FilterButton
                activeCount={activeFilterCount}
                open={filtersOpen}
                onClick={() => handleOpenChange(!filtersOpen)}
              />
            }
          >
            <div className="space-y-4">
              <FilterField label={t('Treasury Account')}>
                <TreasuryAccountSelector
                  value={draftFilters.treasury_account_id}
                  includeAllOption
                  onChange={(treasury_account_id) => setDraftFilters((current) => ({ ...current, treasury_account_id }))}
                />
              </FilterField>
              <FilterField label={t('Direction')}>
                <Select
                  value={draftFilters.direction}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, direction: event.target.value }))}
                >
                  <option value="">{t('All directions')}</option>
                  <option value="credit">{t('Credit')}</option>
                  <option value="debit">{t('Debit')}</option>
                </Select>
              </FilterField>
              <FilterField label={t('Source Type')}>
                <Select
                  value={draftFilters.source_type}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, source_type: event.target.value }))}
                >
                  <option value="">{t('All source types')}</option>
                  <option value="merchant_payout">merchant_payout</option>
                  <option value="expense">expense</option>
                  <option value="wallet_transaction">wallet_transaction</option>
                  <option value="warehouse_charge">warehouse_charge</option>
                </Select>
              </FilterField>
              <FilterField label={t('Date Range', { defaultValue: 'Date Range' })}>
                <DateRangeFilter
                  dateFrom={draftFilters.date_from}
                  dateTo={draftFilters.date_to}
                  onChange={({ date_from, date_to }) => setDraftFilters((current) => ({ ...current, date_from, date_to }))}
                />
              </FilterField>
            </div>
          </FilterPopover>
        </div>
      </div>

      <Card className="table-card">
        <CardHeader>
          <CardTitle>{t('Transaction History')}</CardTitle>
          <CardDescription>{t('Cash movements filtered directly from the treasury transaction endpoint.')}</CardDescription>
        </CardHeader>
        <CardContent>
          {treasuryTransactionsQuery.isLoading ? <LoadingState title={t('Loading treasury transactions', { defaultValue: 'Loading treasury transactions' })} /> : null}
          {treasuryTransactionsQuery.isError ? (
            <ErrorState
              title={t('Unable to load treasury transactions', { defaultValue: 'Unable to load treasury transactions' })}
              message={getApiErrorMessage(treasuryTransactionsQuery.error)}
              onRetry={() => void treasuryTransactionsQuery.refetch()}
            />
          ) : null}
          {!treasuryTransactionsQuery.isLoading && !treasuryTransactionsQuery.isError && !transactions.length ? (
            <EmptyState
              title={t('No treasury transactions found', { defaultValue: 'No treasury transactions found' })}
              description={t('No treasury transactions matched the selected filters.', { defaultValue: 'No treasury transactions matched the selected filters.' })}
            />
          ) : null}
          {transactions.length ? (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>{t('Account')}</TableHead>
                    <TableHead>{t('Direction')}</TableHead>
                    <TableHead>{t('Source Type')}</TableHead>
                    <TableHead>{t('Reference')}</TableHead>
                    <TableHead>{t('Amount')}</TableHead>
                    <TableHead>{t('Balance After')}</TableHead>
                    <TableHead>{t('Created By')}</TableHead>
                    <TableHead>{t('Created')}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <TableCell>{transaction.treasury_account_name ?? `#${transaction.treasury_account_id ?? '-'}`}</TableCell>
                      <TableCell>
                        <StatusBadge value={transaction.direction}>
                          {pickDisplayLabel(transaction.direction ?? '-', transaction.direction_label)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={transaction.source_type}>
                          {pickDisplayLabel(transaction.source_type ?? '-', transaction.source_type_label)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>{transaction.reference_number ?? '-'}</TableCell>
                      <TableCell className="amount-cell"><MoneyDisplay value={transaction.amount ?? null} /></TableCell>
                      <TableCell className="amount-cell"><MoneyDisplay value={transaction.balance_after ?? null} /></TableCell>
                      <TableCell>{transaction.created_by_name ?? '-'}</TableCell>
                      <TableCell>{formatDate(transaction.created_at)}</TableCell>
                      <TableCell>
                        
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
        open={Boolean(selectedTransactionId)}
        onClose={() => setSelectedTransactionId(null)}
        title={<CardTitle>{t('Treasury Transaction Details')}</CardTitle>}
      >
        {selectedTransaction ? (
          <div className="page-stack">
            <dl className="detail-list">
              <div><dt>{t('Account')}</dt><dd>{selectedTransaction.treasury_account_name ?? `#${selectedTransaction.treasury_account_id ?? '-'}`}</dd></div>
              <div>
                <dt>{t('Direction')}</dt>
                <dd>
                  <StatusBadge value={selectedTransaction.direction}>
                    {pickDisplayLabel(selectedTransaction.direction ?? '-', selectedTransaction.direction_label)}
                  </StatusBadge>
                </dd>
              </div>
              <div>
                <dt>{t('Source Type')}</dt>
                <dd>
                  <StatusBadge value={selectedTransaction.source_type}>
                    {pickDisplayLabel(selectedTransaction.source_type ?? '-', selectedTransaction.source_type_label)}
                  </StatusBadge>
                </dd>
              </div>
              <div><dt>{t('Reference')}</dt><dd>{selectedTransaction.reference_number ?? '-'}</dd></div>
              <div><dt>{t('Amount')}</dt><dd><MoneyDisplay value={selectedTransaction.amount ?? null} /></dd></div>
              <div><dt>{t('Balance After')}</dt><dd><MoneyDisplay value={selectedTransaction.balance_after ?? null} /></dd></div>
              <div><dt>{t('Notes')}</dt><dd>{selectedTransaction.notes ?? '-'}</dd></div>
              <div><dt>{t('Created By')}</dt><dd>{selectedTransaction.created_by_name ?? '-'}</dd></div>
              <div><dt>{t('Created At')}</dt><dd>{formatDate(selectedTransaction.created_at)}</dd></div>
            </dl>
            
          </div>
        ) : null}
      </Dialog>
    </section>
  )
}

export function TreasuryTransactionsPage() {
  return <TreasuryTransactionsPanel />
}
