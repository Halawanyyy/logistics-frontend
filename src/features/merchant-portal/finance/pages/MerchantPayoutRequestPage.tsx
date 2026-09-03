import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Landmark, AlertCircle } from 'lucide-react'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../shared/components/ui/Card'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { Input } from '../../../../shared/components/ui/Input'
import { Button } from '../../../../shared/components/ui/Button'
import { merchantPath } from '../../../../shared/routing/paths'
import { requestMerchantPortalPayout, getMerchantPortalWalletSummary } from '../api/merchantPortalFinance.api'
import type { MerchantPayoutRequestPayload } from '../types/merchantPortalFinance.types'
import { MoneyDisplay } from '../../../../shared/components/display/MoneyDisplay'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'

export function MerchantPayoutRequestPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<MerchantPayoutRequestPayload>({
    amount: 0,
    method: 'bank_transfer',
    account: '',
    notes: '',
  })
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { data: summaryData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['merchant-portal', 'wallet-summary'],
    queryFn: getMerchantPortalWalletSummary,
  })

  const { mutate: requestPayout, isPending } = useMutation({
    mutationFn: requestMerchantPortalPayout,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['merchant-portal', 'payouts'] })
      queryClient.invalidateQueries({ queryKey: ['merchant-portal', 'wallet-summary'] })
      queryClient.invalidateQueries({ queryKey: ['merchant-portal', 'finance-summary'] })
      navigate(merchantPath(`/finance/payouts/${response.data.id}`))
    },
    onError: (err) => {
      setErrorMsg(getApiErrorMessage(err))
    },
  })

  if (isLoading) {
    return <LoadingState title={t('Loading...')} />
  }

  if (isError) {
    return (
      <ErrorState
        actions={
          <Link to={merchantPath('/finance/payouts')} className="btn btn-secondary">
            {t('Back to Payouts')}
          </Link>
        }
        message={getApiErrorMessage(error)}
        onRetry={refetch}
      />
    )
  }

  const availableBalance = summaryData?.data?.available_balance || 0
  const currency = summaryData?.data?.currency || 'USD'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    
    if (form.amount <= 0) {
      setErrorMsg(t('Amount must be greater than zero.'))
      return
    }

    if (form.amount > availableBalance) {
      setErrorMsg(t('Amount cannot exceed available balance.'))
      return
    }

    requestPayout(form)
  }

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
        description={t('Request a withdrawal from your available wallet balance.')}
        title={t('Request Payout')}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Landmark className="mr-2 h-5 w-5 text-muted" />
                {t('Payout Details')}
              </CardTitle>
              <CardDescription>
                {t('Available Balance')}: <MoneyDisplay value={availableBalance} currency={currency} />
              </CardDescription>
            </CardHeader>
            <CardContent>
              {errorMsg && (
                <div className="mb-4 p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md flex items-center">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                  <label className="form-label" htmlFor="amount">
                    {t('Amount')} <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={availableBalance}
                    required
                    value={form.amount || ''}
                    onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) })}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted mt-1">
                    {t('Maximum amount you can request is')} <MoneyDisplay value={availableBalance} currency={currency} />
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="method">
                    {t('Payout Method')}
                  </label>
                  <select
                    id="method"
                    className="form-control"
                    value={form.method}
                    onChange={(e) => setForm({ ...form, method: e.target.value })}
                  >
                    <option value="bank_transfer">{t('Bank Transfer')}</option>
                    <option value="cash">{t('Cash')}</option>
                    <option value="wallet">{t('Mobile Wallet')}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="account">
                    {t('Account Details / Number')}
                  </label>
                  <Input
                    id="account"
                    type="text"
                    value={form.account || ''}
                    onChange={(e) => setForm({ ...form, account: e.target.value })}
                    placeholder={t('Enter IBAN, wallet number, etc.')}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="notes">
                    {t('Additional Notes')}
                  </label>
                  <textarea
                    id="notes"
                    className="form-control h-24"
                    value={form.notes || ''}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder={t('Any additional instructions...')}
                  />
                </div>

                <div className="pt-4 flex justify-end space-x-2 border-t">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate(merchantPath('/finance/payouts'))}
                    disabled={isPending}
                  >
                    {t('Cancel')}
                  </Button>
                  <Button type="submit" disabled={isPending || form.amount <= 0 || form.amount > availableBalance}>
                    {isPending ? t('Submitting...') : t('Submit Request')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('Important Information')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-3 text-muted">
                <li>
                  <strong className="text-foreground">{t('Processing Time')}:</strong> {t('Payout requests are typically processed within 1-3 business days.')}
                </li>
                <li>
                  <strong className="text-foreground">{t('Status')}:</strong> {t('New requests will appear as "pending" until approved by the finance team.')}
                </li>
                <li>
                  <strong className="text-foreground">{t('Fees')}:</strong> {t('Some payout methods may incur transfer fees deducted from the requested amount.')}
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
