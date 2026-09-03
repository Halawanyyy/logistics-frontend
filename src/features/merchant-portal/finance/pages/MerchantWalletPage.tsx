import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Wallet, AlertCircle, Calendar } from 'lucide-react'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { EmptyState } from '../../../../shared/components/states/EmptyState'
import { Card, CardContent, CardHeader } from '../../../../shared/components/ui/Card'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { Button } from '../../../../shared/components/ui/Button'
import { Input } from '../../../../shared/components/ui/Input'
import { Select } from '../../../../shared/components/ui/Select'
import { Table, TableCell, TableContainer, TableHead } from '../../../../shared/components/ui/Table'
import { ActionToolbar } from '../../../../shared/components/ui/ActionToolbar'
import { merchantPath } from '../../../../shared/routing/paths'
import { formatDate } from '../../../../shared/utils/formatters'
import {
  getMerchantPortalWalletSummary,
  listMerchantPortalWalletTransactions,
} from '../api/merchantPortalFinance.api'
import type { MerchantWalletTransactionFilters } from '../types/merchantPortalFinance.types'
import { CanMerchant } from '../../components/CanMerchant'
import { MoneyDisplay } from '../../../../shared/components/display/MoneyDisplay'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'

const initialFilters: MerchantWalletTransactionFilters = {
  search: '',
  type: '',
  status: '',
}
export function MerchantWalletPage() {
  const { t } = useTranslation()
  const [filters, setFilters] = useState<MerchantWalletTransactionFilters>(initialFilters)
  const [page, setPage] = useState(1)

  const summaryQuery = useQuery({
    queryKey: ['merchant-portal', 'wallet-summary'],
    queryFn: getMerchantPortalWalletSummary,
  })

  const params = useMemo(() => ({
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.search ? { search: filters.search } : {}),
  }), [filters])

  const transactionsQuery = useQuery({
    queryKey: ['merchant-portal', 'wallet-transactions', page, params],
    queryFn: () => listMerchantPortalWalletTransactions(page, params),
  })

  if (summaryQuery.isLoading) {
    return <LoadingState title={t('Loading wallet...')} />
  }

  if (summaryQuery.isError) {
    return (
      <ErrorState
        message={getApiErrorMessage(summaryQuery.error)}
        onRetry={summaryQuery.refetch}
      />
    )
  }

  const summary = summaryQuery.data?.data

  function handleClearFilters() {
    setFilters({ ...initialFilters })
    setPage(1)
  }

  const hasActiveFilters = Object.values(filters).some((value) => Boolean(value))

  function renderLedgerContent() {
    if (transactionsQuery.isLoading) {
      return <LoadingState title={t('Loading transactions...')} />
    }

    if (transactionsQuery.isError) {
      return (
        <ErrorState
          message={getApiErrorMessage(transactionsQuery.error)}
          onRetry={transactionsQuery.refetch}
        />
      )
    }

    const transactions = transactionsQuery.data?.data

    if (!transactions || transactions.length === 0) {
      if (hasActiveFilters) {
        return (
          <EmptyState
            description={t('No wallet transactions match your current filters.')}
            title={t('No results found')}
            actionLabel={t('Clear filters')}
            onAction={handleClearFilters}
          />
        )
      }

      return (
        <EmptyState
          description={t('You have no wallet transactions.')}
          title={t('No wallet transactions')}
        />
      )
    }

    return (
      <TableContainer>
        <Table className="finance-table">
          <thead>
            <tr>
              <TableHead>{t('Date')}</TableHead>
              <TableHead>{t('Type')}</TableHead>
              <TableHead>{t('Reference')}</TableHead>
              <TableHead>{t('Description')}</TableHead>
              <TableHead className="text-right">{t('Amount')}</TableHead>
              <TableHead className="text-right">{t('Balance After')}</TableHead>
              <TableHead>{t('Status')}</TableHead>
              <TableHead className="text-right">{t('Actions')}</TableHead>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <TableCell className="whitespace-nowrap">{formatDate(transaction.created_at)}</TableCell>
                <TableCell>{transaction.type}</TableCell>
                <TableCell>{transaction.reference || '-'}</TableCell>
                <TableCell className="max-w-xs truncate">{transaction.description || '-'}</TableCell>
                <TableCell className="text-right font-medium">
                  <MoneyDisplay value={transaction.amount} currency={transaction.currency} />
                </TableCell>
                <TableCell className="text-right font-medium text-muted">
                  {transaction.balance_after !== undefined && transaction.balance_after !== null ? (
                    <MoneyDisplay value={transaction.balance_after} currency={transaction.currency} />
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <StatusBadge value={transaction.status} />
                </TableCell>
                <TableCell className="text-right">
                  <CanMerchant capability="wallet.view">
                    <Button variant="secondary" size="sm">
                      <Link to={merchantPath(`/finance/wallet/transactions/${transaction.id}`)}>
                        {t('View')}
                      </Link>
                    </Button>
                  </CanMerchant>
                </TableCell>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>
    )
  }

  return (
    <>
      <PageHeader
        description={t('View your wallet balance and complete transaction ledger.')}
        title={t('Wallet')}
        actions={
          <CanMerchant capability="payouts.request">
            <Link className="ui-link-reset" to={merchantPath('/finance/payouts/request')}>
              <Button>{t('Request Payout')}</Button>
            </Link>
          </CanMerchant>
        }
      />

      {summary && (
        <div className="stats-grid mb-6">
          <Card variant="stat" className="stat-card animate-fade-up animate-delay-0 stat-card--gradient-primary" data-accent="finance">
            <CardHeader className="stat-card__header">
              <div className="stat-card__title">{t('Available Balance')}</div>
              <div className="stat-card__icon bg-primary/10 text-primary">
                <Wallet size={20} />
              </div>
            </CardHeader>
            <CardContent className="stat-card__content">
              <div className="stat-card__value text-primary">
                <MoneyDisplay value={summary.available_balance} currency={summary.currency} />
              </div>
              <div className="stat-card__trend text-muted">
                {t('Total wallet balance')}: <MoneyDisplay value={summary.wallet_balance} currency={summary.currency} />
              </div>
            </CardContent>
          </Card>

          <Card variant="stat" className="stat-card animate-fade-up animate-delay-100 stat-card--gradient-success" data-accent="warning">
            <CardHeader className="stat-card__header">
              <div className="stat-card__title">{t('Pending Balance')}</div>
              <div className="stat-card__icon bg-warning/10 text-warning">
                <AlertCircle size={20} />
              </div>
            </CardHeader>
            <CardContent className="stat-card__content">
              <div className="stat-card__value">
                <MoneyDisplay value={summary.pending_balance} currency={summary.currency} />
              </div>
              <div className="stat-card__trend text-muted">
                {t('Funds currently held or processing')}
              </div>
            </CardContent>
          </Card>

          {summary.last_transaction_date && (
            <Card variant="stat" className="stat-card animate-fade-up animate-delay-200 stat-card--gradient-primary" data-accent="finance">
              <CardHeader className="stat-card__header">
                <div className="stat-card__title">{t('Last Activity')}</div>
                <div className="stat-card__icon bg-muted/20 text-muted-foreground">
                  <Calendar size={20} />
                </div>
              </CardHeader>
              <CardContent className="stat-card__content">
                <div className="stat-card__value">
                  {formatDate(summary.last_transaction_date)}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <ActionToolbar
        title={t('Transaction Ledger')}
        searchComponent={
          <Input
            id="wallet-search"
            placeholder={t('Search reference or description...')}
            value={filters.search}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, search: e.target.value }))
              setPage(1)
            }}
          />
        }
        filterComponents={
          <>
            <Select
              id="wallet-type"
              value={filters.type}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, type: e.target.value }))
                setPage(1)
              }}
            >
              <option value="">{t('All Types')}</option>
              <option value="credit">{t('Credit')}</option>
              <option value="debit">{t('Debit')}</option>
            </Select>

            <Select
              id="wallet-status"
              value={filters.status}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, status: e.target.value }))
                setPage(1)
              }}
            >
              <option value="">{t('All Statuses')}</option>
              <option value="completed">{t('Completed')}</option>
              <option value="pending">{t('Pending')}</option>
              <option value="failed">{t('Failed')}</option>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" onClick={handleClearFilters}>
                {t('Clear Filters')}
              </Button>
            )}
          </>
        }
      />

      <Card>
        <CardContent className="p-0">
          {renderLedgerContent()}
        </CardContent>
      </Card>
    </>
  )
}
