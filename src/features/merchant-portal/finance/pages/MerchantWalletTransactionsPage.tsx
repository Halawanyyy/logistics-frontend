import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { EmptyState } from '../../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/Card'
import { Input } from '../../../../shared/components/ui/Input'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { Select } from '../../../../shared/components/ui/Select'
import { Table, TableCell, TableContainer, TableHead } from '../../../../shared/components/ui/Table'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'
import { Button } from '../../../../shared/components/ui/Button'
import { merchantPath } from '../../../../shared/routing/paths'
import { formatDate } from '../../../../shared/utils/formatters'
import { listMerchantPortalWalletTransactions } from '../api/merchantPortalFinance.api'
import type { MerchantWalletTransactionFilters } from '../types/merchantPortalFinance.types'
import { MoneyDisplay } from '../../../../shared/components/ui/MoneyDisplay'
import { CanMerchant } from '../../components/CanMerchant'

const initialFilters: MerchantWalletTransactionFilters = {
  search: '',
  type: '',
  status: '',
}

export function MerchantWalletTransactionsPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const searchText = searchParams.get('search') ?? ''

  const [filters, setFilters] = useState<MerchantWalletTransactionFilters>(() => ({
    ...initialFilters,
    search: searchText,
  }))
  const [page, setPage] = useState(1)

  const params = useMemo(() => ({
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.search ? { search: filters.search } : {}),
  }), [filters])

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['merchant-portal', 'wallet-transactions', page, params],
    queryFn: () => listMerchantPortalWalletTransactions(page, params),
  })

  function handleClearFilters() {
    setFilters({ ...initialFilters })
    setPage(1)
  }

  const hasActiveFilters = Object.values(filters).some((value) => Boolean(value))

  function renderContent() {
    if (isLoading) {
      return <LoadingState title={t('Loading transactions...')} />
    }

    if (isError) {
      return (
        <ErrorState
          message={getApiErrorMessage(error, t('Failed to load wallet transactions.'))}
          onRetry={refetch}
        />
      )
    }

    if (!data?.data || data.data.length === 0) {
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
        <Table>
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
            {data.data.map((transaction) => (
              <tr key={transaction.id}>
                <TableCell className="whitespace-nowrap">{formatDate(transaction.created_at)}</TableCell>
                <TableCell>{transaction.type}</TableCell>
                <TableCell>{transaction.reference || '-'}</TableCell>
                <TableCell className="max-w-xs truncate">{transaction.description || '-'}</TableCell>
                <TableCell className="text-right font-medium">
                  <MoneyDisplay amount={transaction.amount} currency={transaction.currency} />
                </TableCell>
                <TableCell className="text-right font-medium text-muted">
                  {transaction.balance_after !== undefined && transaction.balance_after !== null ? (
                    <MoneyDisplay amount={transaction.balance_after} currency={transaction.currency} />
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <StatusBadge value={transaction.status} />
                </TableCell>
                <TableCell className="text-right">
                  <CanMerchant capability="wallet.view">
                    <Button variant="neutral" asChild size="sm">
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
      <div className="mb-4">
        <Link
          className="inline-flex items-center text-sm text-muted hover:text-foreground"
          to={merchantPath('/finance/wallet')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('Back to Wallet Summary')}
        </Link>
      </div>

      <PageHeader
        description={t('View and filter your wallet transactions.')}
        title={t('Wallet Transactions')}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">{t('Filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="form-group">
              <label className="form-label" htmlFor="search">
                {t('Search')}
              </label>
              <Input
                id="search"
                placeholder={t('Search reference or description...')}
                value={filters.search}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                  setPage(1)
                }}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="type">
                {t('Transaction Type')}
              </label>
              <Select
                id="type"
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
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="status">
                {t('Status')}
              </label>
              <Select
                id="status"
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
            </div>
          </div>
        </CardContent>
      </Card>

      {renderContent()}
    </>
  )
}
