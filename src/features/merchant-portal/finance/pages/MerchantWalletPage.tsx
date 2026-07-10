import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Wallet, AlertCircle, Calendar, ArrowRight } from 'lucide-react'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { EmptyState } from '../../../../shared/components/states/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/Card'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { Button } from '../../../../shared/components/ui/Button'
import { merchantPath } from '../../../../shared/routing/paths'
import { formatDate } from '../../../../shared/utils/formatters'
import { getMerchantPortalWalletSummary } from '../api/merchantPortalFinance.api'
import { CanMerchant } from '../../components/CanMerchant'
import { MoneyDisplay } from '../../../../shared/components/ui/MoneyDisplay'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'

export function MerchantWalletPage() {
  const { t } = useTranslation()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['merchant-portal', 'wallet-summary'],
    queryFn: getMerchantPortalWalletSummary,
  })

  if (isLoading) {
    return <LoadingState title={t('Loading wallet summary...')} />
  }

  if (isError) {
    return (
      <ErrorState
        message={getApiErrorMessage(error, t('Failed to load wallet summary.'))}
        onRetry={refetch}
      />
    )
  }

  const summary = data?.data

  if (!summary) {
    return (
      <ErrorState
        message={t('No wallet data available.')}
        onRetry={refetch}
      />
    )
  }

  return (
    <>
      <PageHeader
        description={t('View your current wallet balance and recent transaction history.')}
        title={t('Wallet Summary')}
        actions={
          <CanMerchant capability="wallet.view">
            <Button variant="secondary" asChild>
              <Link to={merchantPath('/finance/wallet/transactions')}>
                {t('View All Transactions')}
              </Link>
            </Button>
          </CanMerchant>
        }
      />

      <div className="stats-grid mb-6">
        <Card variant="stat" className="stat-card">
          <CardHeader className="stat-card__header">
            <div className="stat-card__title">{t('Available Balance')}</div>
            <div className="stat-card__icon bg-primary/10 text-primary">
              <Wallet size={20} />
            </div>
          </CardHeader>
          <CardContent className="stat-card__content">
            <div className="stat-card__value text-primary">
              <MoneyDisplay amount={summary.available_balance} currency={summary.currency} />
            </div>
            <div className="stat-card__trend text-muted">
              {t('Total wallet balance')}: <MoneyDisplay amount={summary.wallet_balance} currency={summary.currency} />
            </div>
          </CardContent>
        </Card>
        
        <Card variant="stat" className="stat-card">
          <CardHeader className="stat-card__header">
            <div className="stat-card__title">{t('Pending Balance')}</div>
            <div className="stat-card__icon bg-warning/10 text-warning">
              <AlertCircle size={20} />
            </div>
          </CardHeader>
          <CardContent className="stat-card__content">
            <div className="stat-card__value">
              <MoneyDisplay amount={summary.pending_balance} currency={summary.currency} />
            </div>
            <div className="stat-card__trend text-muted">
              {t('Funds currently held or processing')}
            </div>
          </CardContent>
        </Card>

        {summary.last_transaction_date && (
          <Card variant="stat" className="stat-card">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('Recent Transactions')}</CardTitle>
            <CanMerchant capability="wallet.view">
              <Link
                to={merchantPath('/finance/wallet/transactions')}
                className="text-sm text-primary hover:underline flex items-center"
              >
                {t('View all')}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </CanMerchant>
          </CardHeader>
          <CardContent>
            {!summary.recent_transactions?.length ? (
              <EmptyState
                description={t('You have no recent wallet transactions.')}
                title={t('No recent activity')}
              />
            ) : (
              <div className="space-y-4">
                {summary.recent_transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex flex-col">
                      <span className="font-medium">{transaction.type}</span>
                      <span className="text-sm text-muted">{formatDate(transaction.created_at)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-bold">
                        <MoneyDisplay amount={transaction.amount} currency={transaction.currency} />
                      </span>
                      <StatusBadge value={transaction.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
