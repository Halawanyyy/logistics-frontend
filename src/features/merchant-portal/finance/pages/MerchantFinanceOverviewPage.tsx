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
import { getMerchantPortalFinanceSummary } from '../api/merchantPortalFinance.api'
import { CanMerchant } from '../../components/CanMerchant'
import { MoneyDisplay } from '../../../../shared/components/display/MoneyDisplay'

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
        message={getApiErrorMessage(error)}
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
        eyebrow={t('Merchant Portal')}
        description={t('Review your financial summary, wallet, invoices, and payouts.')}
        title={t('Finance')}
        actions={
          <CanMerchant capability="payouts.request">
            <Button>
              <Link to={merchantPath('/finance/payouts/request')}>
                {t('Request Payout')}
              </Link>
            </Button>
          </CanMerchant>
        }
      />

      <div className="stats-grid mb-6">
        {summary.available_balance !== undefined && (
          <Card variant="stat" className="stat-card animate-fade-up animate-delay-0 stat-card--gradient-primary" data-accent="finance">
            <CardHeader className="stat-card__header">
              <div className="stat-card__title">{t('Available Balance')}</div>
              <div className="stat-card__icon bg-primary/10 text-primary">
                <Wallet size={20} />
              </div>
            </CardHeader>
            <CardContent className="stat-card__content">
              <div className="stat-card__value">
                <MoneyDisplay value={summary.available_balance} currency={summary.currency} />
              </div>
            </CardContent>
          </Card>
        )}
        
        {summary.pending_balance !== undefined && (
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
            </CardContent>
          </Card>
        )}

        {summary.total_invoices !== undefined && (
          <Card variant="stat" className="stat-card animate-fade-up animate-delay-200 stat-card--gradient-primary" data-accent="finance">
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
          <Card variant="stat" className="stat-card animate-fade-up animate-delay-300 stat-card--gradient-success" data-accent="warning">
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

      <div className="merchant-finance-cards-grid">
        <Card>
          <CardHeader>
            <CardTitle>{t('Finance Snapshot')}</CardTitle>
          </CardHeader>
          <CardContent className="merchant-finance-snapshot">
            {summary.total_cod !== undefined && (
              <div className="merchant-finance-snapshot__row">
                <span className="text-muted">{t('Total COD')}</span>
                <span className="font-medium"><MoneyDisplay value={summary.total_cod} currency={summary.currency} /></span>
              </div>
            )}
            {summary.total_shipping_fees !== undefined && (
              <div className="merchant-finance-snapshot__row">
                <span className="text-muted">{t('Total Shipping Fees')}</span>
                <span className="font-medium"><MoneyDisplay value={summary.total_shipping_fees} currency={summary.currency} /></span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('Quick Links')}</CardTitle>
          </CardHeader>
          <CardContent className="merchant-finance-quick-links">
            <CanMerchant capability="wallet.view">
              <Link to={merchantPath('/finance/wallet')} className="merchant-finance-quick-link-card">
                <Wallet className="merchant-finance-icon" />
                <span className="font-medium">{t('Wallet Summary')}</span>
              </Link>
            </CanMerchant>
            <CanMerchant capability="invoices.view">
              <Link to={merchantPath('/finance/invoices')} className="merchant-finance-quick-link-card">
                <FileSpreadsheet className="merchant-finance-icon" />
                <span className="font-medium">{t('Invoices')}</span>
              </Link>
            </CanMerchant>
            <CanMerchant capability="payouts.view">
              <Link to={merchantPath('/finance/payouts')} className="merchant-finance-quick-link-card">
                <Landmark className="merchant-finance-icon" />
                <span className="font-medium">{t('Payouts')}</span>
              </Link>
            </CanMerchant>
            <CanMerchant capability="wallet.view">
              <Link to={merchantPath('/finance/wallet/transactions')} className="merchant-finance-quick-link-card">
                <AlertCircle className="merchant-finance-icon" />
                <span className="font-medium">{t('Wallet Transactions')}</span>
              </Link>
            </CanMerchant>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
