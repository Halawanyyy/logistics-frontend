import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BadgeDollarSign, Eye } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  createPricingPlan,
  createPricingPlanRate,
  getPricingPlan,
  getPricingPlanRate,
  listAreas,
  listGovernorates,
  listPricingPlans,
  updatePricingPlan,
  updatePricingPlanRate,
} from '../api/location-pricing.api'
import { PricingPlanForm, PricingPlanRateForm } from '../components/PricingPlanForms'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { FormPageLayout } from '../../../shared/components/forms/FormPageLayout'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Button } from '../../../shared/components/ui/Button'

type PricingPlanFormPageProps = {
  kind: 'plan' | 'rate'
  mode: 'create' | 'edit'
}

export function PricingPlanFormPage({ kind, mode }: PricingPlanFormPageProps) {
  const { t } = useTranslation()
  const { pricingPlanId, pricingPlanRateId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const planQuery = useQuery({
    queryKey: ['pricing-plans', pricingPlanId],
    queryFn: () => getPricingPlan(pricingPlanId!),
    enabled: kind === 'plan' && mode === 'edit' && Boolean(pricingPlanId),
  })
  const rateQuery = useQuery({
    queryKey: ['pricing-plan-rates', pricingPlanRateId],
    queryFn: () => getPricingPlanRate(pricingPlanRateId!),
    enabled: kind === 'rate' && mode === 'edit' && Boolean(pricingPlanRateId),
  })
  const pricingPlansQuery = useQuery({
    queryKey: ['pricing-plans', 'selector'],
    queryFn: () => listPricingPlans(),
    enabled: kind === 'rate',
  })
  const governoratesQuery = useQuery({
    queryKey: ['governorates', 'selector'],
    queryFn: listGovernorates,
    enabled: kind === 'rate',
  })
  const areasQuery = useQuery({
    queryKey: ['areas', 'selector'],
    queryFn: () => listAreas(),
    enabled: kind === 'rate',
  })

  const mutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      if (kind === 'plan') {
        return mode === 'create'
          ? createPricingPlan(values as never)
          : updatePricingPlan(pricingPlanId!, values as never)
      }

      return mode === 'create'
        ? createPricingPlanRate(values as never)
        : updatePricingPlanRate(pricingPlanRateId!, values as never)
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: [kind === 'plan' ? 'pricing-plans' : 'pricing-plan-rates'] })
      if (kind === 'plan') {
        await queryClient.invalidateQueries({ queryKey: ['subscription-plans'] })
        navigate(`/admin/pricing-plans/${(response as { data: { id: number | string } }).data.id}`)
        return
      }

      navigate(`/admin/pricing-plan-rates/${(response as { data: { id: number | string } }).data.id}`)
    },
  })

  const isLoading =
    planQuery.isLoading ||
    rateQuery.isLoading ||
    pricingPlansQuery.isLoading ||
    governoratesQuery.isLoading ||
    areasQuery.isLoading

  const error =
    planQuery.error ?? rateQuery.error ?? pricingPlansQuery.error ?? governoratesQuery.error ?? areasQuery.error

  if (isLoading) {
    return <LoadingState title={t('Loading pricing form', { defaultValue: 'Loading pricing form' })} />
  }

  if (
    (kind === 'plan' && mode === 'edit' && !planQuery.data) ||
    (kind === 'rate' && mode === 'edit' && !rateQuery.data) ||
    error
  ) {
    return (
      <ErrorState
        message={getApiErrorMessage(error)}
        onRetry={() => {
          void planQuery.refetch()
          void rateQuery.refetch()
          void pricingPlansQuery.refetch()
          void governoratesQuery.refetch()
          void areasQuery.refetch()
        }}
      />
    )
  }

  function handleScrollToPreview() {
    const el = document.getElementById('pricing-plan-live-preview')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el.classList.add('pricing-plan-preview--highlighted')
      setTimeout(() => el.classList.remove('pricing-plan-preview--highlighted'), 1500)
    }
  }

  // Custom 2-column wide layout for Pricing Plan (Create & Edit)
  if (kind === 'plan') {
    return (
      <div className="pricing-plan-form-page">
        <header className="pricing-plan-form-page__header">
          <div className="pricing-plan-form-page__header-copy">
            <nav className="pricing-plan-form-page__breadcrumb" aria-label="Breadcrumb">
              <Link to="/admin/pricing-plans" className="pricing-plan-form-page__breadcrumb-link">
                {t('Pricing Plans', { defaultValue: 'Pricing Plans' })}
              </Link>
              <span className="pricing-plan-form-page__breadcrumb-sep" aria-hidden="true">
                /
              </span>
              <span className="pricing-plan-form-page__breadcrumb-current">
                {mode === 'create'
                  ? t('Create Plan', { defaultValue: 'Create Plan' })
                  : t('Edit Plan', { defaultValue: 'Edit Plan' })}
              </span>
            </nav>

            <h1 className="pricing-plan-form-page__title">
              {mode === 'create'
                ? t('Create Pricing Plan', { defaultValue: 'Create Pricing Plan' })
                : t('Edit Pricing Plan', { defaultValue: 'Edit Pricing Plan' })}
            </h1>
            <p className="pricing-plan-form-page__subtitle">
              {t('Configure pricing, order limits, visibility, and plan features.', {
                defaultValue: 'Configure pricing, order limits, visibility, and plan features.',
              })}
            </p>
          </div>

          <div className="pricing-plan-form-page__header-actions">
            <button
              type="button"
              className="pricing-plan-form-page__preview-btn"
              onClick={handleScrollToPreview}
              title={t('Jump to live preview')}
            >
              <Eye size={16} aria-hidden="true" />
              <span>{t('Preview', { defaultValue: 'Preview' })}</span>
            </button>
          </div>
        </header>

        <PricingPlanForm
          defaultValues={planQuery.data?.data}
          error={mutation.error}
          isSubmitting={mutation.isPending}
          secondaryAction={(
            <Link className="ui-link-reset" to="/admin/pricing-plans">
              <button type="button" className="pricing-plan-editor__cancel-btn">
                {t('Cancel', { defaultValue: 'Cancel' })}
              </button>
            </Link>
          )}
          submitLabel={
            mode === 'create'
              ? t('Save Pricing Plan', { defaultValue: 'Save Pricing Plan' })
              : t('Save Pricing Plan', { defaultValue: 'Save Pricing Plan' })
          }
          onSubmit={(values) => mutation.mutate(values)}
        />
      </div>
    )
  }

  // Preserve FormPageLayout for rate form
  return (
    <FormPageLayout
      backTo="/admin/pricing-plan-rates"
      description={t(
        'Define location-based rates for each pricing plan without changing the existing API contract.',
        {
          defaultValue:
            'Define location-based rates for each pricing plan without changing the existing API contract.',
        }
      )}
      eyebrow={t('Locations & Pricing', { defaultValue: 'Locations & Pricing' })}
      sectionIcon={<BadgeDollarSign size={18} />}
      sectionDescription={t(
        'Choose the plan and location scope, then provide the rate values that apply to that coverage.',
        {
          defaultValue:
            'Choose the plan and location scope, then provide the rate values that apply to that coverage.',
        }
      )}
      sectionTitle={t('Pricing Plan Rate Details', { defaultValue: 'Pricing Plan Rate Details' })}
      title={
        mode === 'create'
          ? t('Create Pricing Plan Rate', { defaultValue: 'Create Pricing Plan Rate' })
          : t('Edit Pricing Plan Rate', { defaultValue: 'Edit Pricing Plan Rate' })
      }
    >
      <PricingPlanRateForm
        areas={areasQuery.data?.data ?? []}
        defaultValues={rateQuery.data?.data}
        error={mutation.error}
        governorates={governoratesQuery.data?.data ?? []}
        isSubmitting={mutation.isPending}
        pricingPlans={pricingPlansQuery.data?.data ?? []}
        secondaryAction={(
          <Link className="ui-link-reset" to="/admin/pricing-plan-rates">
            <Button variant="secondary">{t('Cancel', { defaultValue: 'Cancel' })}</Button>
          </Link>
        )}
        submitLabel={
          mode === 'create'
            ? t('Create Pricing Plan Rate', { defaultValue: 'Create Pricing Plan Rate' })
            : t('Save Pricing Plan Rate', { defaultValue: 'Save Pricing Plan Rate' })
        }
        onSubmit={(values) => mutation.mutate(values)}
      />
    </FormPageLayout>
  )
}
