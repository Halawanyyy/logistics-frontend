import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { FileSpreadsheet, Landmark, Wallet, AlertCircle } from 'lucide-react'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/Card'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { Button } from '../../../../shared/components/ui/Button'
import { merchantPath } from '../../../../shared/routing/paths'
import { formatMoney } from '../../../../shared/utils/formatters'
import { getMerchantPortalFinanceSummary } from '../api/merchantPortalFinance.api'
import { CanMerchant } from '../../components/CanMerchant'
import { MoneyDisplay } from '../../../../shared/components/ui/MoneyDisplay'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'

export function MerchantFinanceOverviewPage() {
  const { t } = useTranslation()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['merchant-portal', 'finance-summary'],
    queryFn: getMerchantPortalFinanceSummary,
  })

  if (isLoading) {
    return <LoadingState title={t('Loading finance overview...')} />
  }

  if (isError) {
    return (
      <ErrorState
        message={getApiErrorMessage(error, t('Failed to load finance overview.'))}
        onRetry={refetch}
      />
    )
  }

  const summary = data?.data

  if (!summary) {
    return (
      <ErrorState
        message={t('No finance data available.')}
        onRetry={refetch}
      />
    )
  }

  return (
    <>
      <PageHeader
        description={t('Review your financial summary, wallet, invoices, and payouts.')}
        title={t('Finance')}
        actions={
          <CanMerchant capability="payouts.request">
            <Button asChild>
              <Link to={merchantPath('/finance/payouts/request')}>
                {t('Request Payout')}
              </Link>
            </Button>
          </CanMerchant>
        }
      />

      <div className="stats-grid mb-6">
        {summary.available_balance !== undefined && (
          <Card variant="stat" className="stat-card">
            <CardHeader className="stat-card__header">
              <div className="stat-card__title">{t('Available Balance')}</div>
              <div className="stat-card__icon bg-primary/10 text-primary">
                <Wallet size={20} />
              </div>
            </CardHeader>
            <CardContent className="stat-card__content">
              <div className="stat-card__value">
                <MoneyDisplay amount={summary.available_balance} currency={summary.currency} />
              </div>
            </CardContent>
          </Card>
        )}
        
        {summary.pending_balance !== undefined && (
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
            </CardContent>
          </Card>
        )}

        {summary.total_invoices !== undefined && (
          <Card variant="stat" className="stat-card">
            <CardHeader className="stat-card__header">
              <div className="stat-card__title">{t('Total Invoices')}</div>
              <div className="stat-card__icon bg-info/10 text-info">
                <FileSpreadsheet size={20} />
              </div>
            </CardHeader>
            <CardContent className="stat-card__content">
              <div className="stat-card__value">{summary.total_invoices}</div>
              <div className="stat-card__trend text-muted">
                {summary.unpaid_invoices} {t('unpaid')}, {summary.paid_invoices} {t('paid')}
              </div>
            </CardContent>
          </Card>
        )}

        {summary.pending_payouts !== undefined && (
          <Card variant="stat" className="stat-card">
            <CardHeader className="stat-card__header">
              <div className="stat-card__title">{t('Pending Payouts')}</div>
              <div className="stat-card__icon bg-success/10 text-success">
                <Landmark size={20} />
              </div>
            </CardHeader>
            <CardContent className="stat-card__content">
              <div className="stat-card__value">{summary.pending_payouts}</div>
              <div className="stat-card__trend text-muted">
                {summary.paid_payouts} {t('completed payouts')}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('Finance Snapshot')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.total_cod !== undefined && (
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted">{t('Total COD')}</span>
                <span className="font-medium"><MoneyDisplay amount={summary.total_cod} currency={summary.currency} /></span>
              </div>
            )}
            {summary.total_shipping_fees !== undefined && (
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted">{t('Total Shipping Fees')}</span>
                <span className="font-medium"><MoneyDisplay amount={summary.total_shipping_fees} currency={summary.currency} /></span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('Quick Links')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CanMerchant capability="wallet.view">
              <Link to={merchantPath('/finance/wallet')} className="flex items-center p-4 border rounded-md hover:bg-muted/50 transition-colors">
                <Wallet className="h-6 w-6 mr-3 text-primary" />
                <span className="font-medium">{t('Wallet Summary')}</span>
              </Link>
            </CanMerchant>
            <CanMerchant capability="invoices.view">
              <Link to={merchantPath('/finance/invoices')} className="flex items-center p-4 border rounded-md hover:bg-muted/50 transition-colors">
                <FileSpreadsheet className="h-6 w-6 mr-3 text-primary" />
                <span className="font-medium">{t('Invoices')}</span>
              </Link>
            </CanMerchant>
            <CanMerchant capability="payouts.view">
              <Link to={merchantPath('/finance/payouts')} className="flex items-center p-4 border rounded-md hover:bg-muted/50 transition-colors">
                <Landmark className="h-6 w-6 mr-3 text-primary" />
                <span className="font-medium">{t('Payouts')}</span>
              </Link>
            </CanMerchant>
            <CanMerchant capability="wallet.view">
              <Link to={merchantPath('/finance/wallet/transactions')} className="flex items-center p-4 border rounded-md hover:bg-muted/50 transition-colors">
                <AlertCircle className="h-6 w-6 mr-3 text-primary" />
                <span className="font-medium">{t('Wallet Transactions')}</span>
              </Link>
            </CanMerchant>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
