import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { EmptyState } from '../../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { listPublicSettings } from '../../../settings/api/settings.api'
import { subscriptionApi } from '../api/subscription.api'
import { PricingCard } from '../components/PricingCard'
import { useMerchantPortalContext } from '../../context/merchantPortal.context'
import type { BillingCycle } from '../types/subscription.types'

export default function MerchantSubscriptionPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [successMessage, setSuccessMessage] = useState('')

  const portalContext = useMerchantPortalContext()
  const merchantName = portalContext?.merchant?.company_name || portalContext?.merchant?.name || portalContext?.user?.name || ''
  const merchantEmail = portalContext?.user?.email || ''

  const plansQuery = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: subscriptionApi.getPlans,
  })

  const publicSettingsQuery = useQuery({
    queryKey: ['public-settings'],
    queryFn: listPublicSettings,
    staleTime: 5 * 60 * 1000,
  })

  const fallbackEmail = (publicSettingsQuery.data?.data?.find(
    (s) => s.key === 'pricing_contact_email' || s.key === 'support_email' || s.key === 'company_email'
  )?.value as string) || ''

  const contactEmail = plansQuery.data?.data?.pricing_contact_email || fallbackEmail

  const subscribeMutation = useMutation({
    mutationFn: (planId: number) => subscriptionApi.subscribe(planId, billingCycle),
    onSuccess: async (response) => {
      setSuccessMessage(response.message || t('Subscription updated successfully.', {
        defaultValue: 'Subscription updated successfully.',
      }))
      await queryClient.invalidateQueries({ queryKey: ['subscription-plans'] })
      await queryClient.invalidateQueries({ queryKey: ['merchant-portal-me'] })
    },
    onMutate: () => {
      setSuccessMessage('')
    },
  })

  const plans = plansQuery.data?.data.plans ?? []
  const currentPlanId = plansQuery.data?.data.current_plan_id ?? null
  const currentPlan = plans.find((plan) => plan.id === currentPlanId)

  return (
    <section className="page-section subscription-page">
      <PageHeader
        eyebrow={t('Merchant Portal', { defaultValue: 'Merchant Portal' })}
        title={t('Shipping Packages', { defaultValue: 'Shipping Packages' })}
        description={t('Choose the plan that fits your shipping operation', {
          defaultValue: 'Choose the plan that fits your shipping operation',
        })}
        actions={(
          <div className="billing-toggle" role="group" aria-label={t('Billing cycle', { defaultValue: 'Billing cycle' })}>
            <button
              aria-pressed={billingCycle === 'monthly'}
              className={`billing-toggle__option ${billingCycle === 'monthly' ? 'billing-toggle__option--active' : ''}`}
              type="button"
              onClick={() => setBillingCycle('monthly')}
            >
              {t('Monthly', { defaultValue: 'Monthly' })}
            </button>
            <button
              aria-pressed={billingCycle === 'yearly'}
              className={`billing-toggle__option ${billingCycle === 'yearly' ? 'billing-toggle__option--active' : ''}`}
              type="button"
              onClick={() => setBillingCycle('yearly')}
            >
              {t('Yearly', { defaultValue: 'Yearly' })}
              <span className="billing-toggle__save">{t('Save 20%', { defaultValue: 'Save 20%' })}</span>
            </button>
          </div>
        )}
      />

      {successMessage ? <div className="form-success">{successMessage}</div> : null}
      {subscribeMutation.isError ? (
        <div className="form-error">{getApiErrorMessage(subscribeMutation.error)}</div>
      ) : null}

      {plansQuery.isLoading ? (
        <LoadingState title={t('Loading shipping packages...', { defaultValue: 'Loading shipping packages...' })} />
      ) : plansQuery.isError ? (
        <ErrorState
          title={t('Unable to load shipping packages', { defaultValue: 'Unable to load shipping packages' })}
          message={getApiErrorMessage(plansQuery.error)}
          onRetry={() => void plansQuery.refetch()}
        />
      ) : plans.length === 0 ? (
        <EmptyState
          title={t('No packages available', { defaultValue: 'No packages available' })}
          description={t('There are currently no subscription packages available for your account.', {
            defaultValue: 'There are currently no subscription packages available for your account.',
          })}
        />
      ) : (
        <div className="pricing-cards-grid">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              billingCycle={billingCycle}
              isCurrentPlan={plan.id === currentPlanId}
              contactEmail={contactEmail}
              merchantName={merchantName}
              merchantEmail={merchantEmail}
              isSubscribing={subscribeMutation.isPending}
              onSubscribe={() => subscribeMutation.mutate(plan.id)}
            />
          ))}
        </div>
      )}

      {currentPlanId !== null ? (
        <div className="current-plan-banner" role="status">
          <span className="current-plan-banner__icon" aria-hidden="true">
            <CheckCircle2 size={21} />
          </span>
          <div>
            <strong>{t('Current Plan', { defaultValue: 'Current Plan' })}: </strong>
            <span>{currentPlan?.name ?? t('Selected package', { defaultValue: 'Selected package' })}</span>
          </div>
        </div>
      ) : null}
    </section>
  )
}
