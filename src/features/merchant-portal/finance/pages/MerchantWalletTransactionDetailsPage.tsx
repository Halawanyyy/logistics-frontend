import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/Card'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { merchantPath } from '../../../../shared/routing/paths'
import { formatDate } from '../../../../shared/utils/formatters'
import { getMerchantPortalWalletTransaction } from '../api/merchantPortalFinance.api'
import { MoneyDisplay } from '../../../../shared/components/display/MoneyDisplay'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'

export function MerchantWalletTransactionDetailsPage() {
  const { t } = useTranslation()
  const { transactionId } = useParams<{ transactionId: string }>()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['merchant-portal', 'wallet-transaction', transactionId],
    queryFn: () => getMerchantPortalWalletTransaction(transactionId!),
    enabled: !!transactionId,
  })

  if (isLoading) {
    return <LoadingState title={t('Loading transaction details...')} />
  }

  if (isError) {
    return (
      <ErrorState
        actions={
          <Link to={merchantPath('/finance/wallet/transactions')} className="btn btn-secondary">
            {t('Back to Transactions')}
          </Link>
        }
        message={getApiErrorMessage(error)}
        onRetry={refetch}
      />
    )
  }

  if (!data?.data) {
    return (
      <ErrorState
        actions={
          <Link to={merchantPath('/finance/wallet/transactions')} className="btn btn-secondary">
            {t('Back to Transactions')}
          </Link>
        }
        message={t('Transaction not found.')}
      />
    )
  }

  const transaction = data.data

  return (
    <>
      <div className="mb-4">
        <Link
          className="inline-flex items-center text-sm text-muted hover:text-foreground"
          to={merchantPath('/finance/wallet/transactions')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('Back to Wallet Transactions')}
        </Link>
      </div>

      <PageHeader
        description={t('Detailed view of your wallet transaction.')}
        title={t('Transaction Details')}
      />

      <div className="mb-6">
        <StatusBadge value={transaction.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle2 className="mr-2 h-5 w-5 text-muted" />
                {t('Transaction Information')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted">{t('Transaction Type')}</dt>
                  <dd className="mt-1 text-sm font-medium capitalize">{transaction.type}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted">{t('Amount')}</dt>
                  <dd className="mt-1 text-lg font-bold">
                    <MoneyDisplay value={transaction.amount} currency={transaction.currency} />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted">{t('Reference')}</dt>
                  <dd className="mt-1 text-sm">{transaction.reference || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted">{t('Description')}</dt>
                  <dd className="mt-1 text-sm">{transaction.description || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted">{t('Balance After')}</dt>
                  <dd className="mt-1 text-sm font-medium text-muted">
                    {transaction.balance_after !== undefined && transaction.balance_after !== null ? (
                      <MoneyDisplay value={transaction.balance_after} currency={transaction.currency} />
                    ) : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted">{t('Date')}</dt>
                  <dd className="mt-1 text-sm">{formatDate(transaction.created_at)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {transaction.reference_type && transaction.reference_id && (
            <Card>
              <CardHeader>
                <CardTitle>{t('Related Record')}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-muted">{t('Record Type')}</dt>
                    <dd className="mt-1 text-sm capitalize">{transaction.reference_type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted">{t('Record ID')}</dt>
                    <dd className="mt-1 text-sm">
                      {transaction.reference_type === 'invoice' ? (
                        <Link to={merchantPath(`/finance/invoices/${transaction.reference_id}`)} className="text-primary hover:underline">
                          #{transaction.reference_id}
                        </Link>
                      ) : transaction.reference_type === 'payout' ? (
                        <Link to={merchantPath(`/finance/payouts/${transaction.reference_id}`)} className="text-primary hover:underline">
                          #{transaction.reference_id}
                        </Link>
                      ) : (
                        transaction.reference_id
                      )}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
