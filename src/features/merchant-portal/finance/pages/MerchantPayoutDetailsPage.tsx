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
import { getMerchantPortalPayout } from '../api/merchantPortalFinance.api'
import { MoneyDisplay } from '../../../../shared/components/ui/MoneyDisplay'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'

export function MerchantPayoutDetailsPage() {
  const { t } = useTranslation()
  const { payoutId } = useParams<{ payoutId: string }>()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['merchant-portal', 'payout', payoutId],
    queryFn: () => getMerchantPortalPayout(payoutId!),
    enabled: !!payoutId,
  })

  if (isLoading) {
    return <LoadingState title={t('Loading payout details...')} />
  }

  if (isError) {
    return (
      <ErrorState
        actions={
          <Link to={merchantPath('/finance/payouts')} className="btn btn-secondary">
            {t('Back to Payouts')}
          </Link>
        }
        message={getApiErrorMessage(error, t('Failed to load payout details.'))}
        onRetry={refetch}
      />
    )
  }

  if (!data?.data) {
    return (
      <ErrorState
        actions={
          <Link to={merchantPath('/finance/payouts')} className="btn btn-secondary">
            {t('Back to Payouts')}
          </Link>
        }
        message={t('Payout not found.')}
      />
    )
  }

  const payout = data.data

  return (
    <>
      <div className="mb-4">
        <Link
          className="inline-flex items-center text-sm text-muted hover:text-foreground"
          to={merchantPath('/finance/payouts')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('Back to Payouts')}
        </Link>
      </div>

      <PageHeader
        description={t('Detailed view of your payout request.')}
        title={`${t('Payout')} #${payout.payout_number}`}
      />

      <div className="mb-6">
        <StatusBadge value={payout.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle2 className="mr-2 h-5 w-5 text-muted" />
                {t('Payout Information')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted">{t('Payout Number')}</dt>
                  <dd className="mt-1 text-sm font-medium">{payout.payout_number}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted">{t('Amount')}</dt>
                  <dd className="mt-1 text-lg font-bold">
                    <MoneyDisplay amount={payout.amount} currency={payout.currency} />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted">{t('Requested At')}</dt>
                  <dd className="mt-1 text-sm">{formatDate(payout.requested_at)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted">{t('Paid At')}</dt>
                  <dd className="mt-1 text-sm">
                    {payout.paid_at ? formatDate(payout.paid_at) : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted">{t('Reference')}</dt>
                  <dd className="mt-1 text-sm">{payout.reference || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted">{t('Method')}</dt>
                  <dd className="mt-1 text-sm">{payout.method || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted">{t('Account')}</dt>
                  <dd className="mt-1 text-sm">{payout.account || '-'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-muted">{t('Notes')}</dt>
                  <dd className="mt-1 text-sm whitespace-pre-wrap">{payout.notes || '-'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
