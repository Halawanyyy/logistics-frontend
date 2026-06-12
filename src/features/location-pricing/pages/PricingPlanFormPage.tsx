import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BadgeDollarSign } from 'lucide-react'
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
        navigate(`/admin/pricing-plans/${(response as { data: { id: number | string } }).data.id}`)
        return
      }

      navigate(`/admin/pricing-plan-rates/${(response as { data: { id: number | string } }).data.id}`)
    },
  })

  const isLoading = planQuery.isLoading || rateQuery.isLoading || pricingPlansQuery.isLoading || governoratesQuery.isLoading || areasQuery.isLoading
  const error = planQuery.error ?? rateQuery.error ?? pricingPlansQuery.error ?? governoratesQuery.error ?? areasQuery.error

  if (isLoading) {
    return <LoadingState title={t('Loading pricing form', { defaultValue: 'Loading pricing form' })} />
  }

  if ((kind === 'plan' && mode === 'edit' && !planQuery.data) || (kind === 'rate' && mode === 'edit' && !rateQuery.data) || error) {
    return <ErrorState message={getApiErrorMessage(error)} onRetry={() => { void planQuery.refetch(); void rateQuery.refetch(); void pricingPlansQuery.refetch(); void governoratesQuery.refetch(); void areasQuery.refetch() }} />
  }

  return (
    <FormPageLayout
      backTo={kind === 'plan' ? '/admin/pricing-plans' : '/admin/pricing-plan-rates'}
      description={kind === 'plan'
        ? t('Define merchant pricing plans with clean commercial ranges and status control.', {
          defaultValue: 'Define merchant pricing plans with clean commercial ranges and status control.',
        })
        : t('Define location-based rates for each pricing plan without changing the existing API contract.', {
          defaultValue: 'Define location-based rates for each pricing plan without changing the existing API contract.',
        })}
      eyebrow={t('Locations & Pricing', { defaultValue: 'Locations & Pricing' })}
      sectionIcon={<BadgeDollarSign size={18} />}
      sectionDescription={kind === 'plan'
        ? t('Set the plan identity, optional order-volume range, and current plan status.', {
          defaultValue: 'Set the plan identity, optional order-volume range, and current plan status.',
        })
        : t('Choose the plan and location scope, then provide the rate values that apply to that coverage.', {
          defaultValue: 'Choose the plan and location scope, then provide the rate values that apply to that coverage.',
        })}
      sectionTitle={kind === 'plan'
        ? t('Pricing Plan Details', { defaultValue: 'Pricing Plan Details' })
        : t('Pricing Plan Rate Details', { defaultValue: 'Pricing Plan Rate Details' })}
      title={kind === 'plan'
        ? (mode === 'create'
            ? t('Create Pricing Plan', { defaultValue: 'Create Pricing Plan' })
            : t('Edit Pricing Plan', { defaultValue: 'Edit Pricing Plan' }))
        : (mode === 'create'
            ? t('Create Pricing Plan Rate', { defaultValue: 'Create Pricing Plan Rate' })
            : t('Edit Pricing Plan Rate', { defaultValue: 'Edit Pricing Plan Rate' }))}
    >
      {kind === 'plan' ? (
        <PricingPlanForm
          defaultValues={planQuery.data?.data}
          error={mutation.error}
          isSubmitting={mutation.isPending}
          secondaryAction={(
            <Link className="ui-link-reset" to="/admin/pricing-plans">
              <Button variant="secondary">{t('Cancel', { defaultValue: 'Cancel' })}</Button>
            </Link>
          )}
          submitLabel={mode === 'create'
            ? t('Create Pricing Plan', { defaultValue: 'Create Pricing Plan' })
            : t('Save Pricing Plan', { defaultValue: 'Save Pricing Plan' })}
          onSubmit={(values) => mutation.mutate(values)}
        />
      ) : (
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
          submitLabel={mode === 'create'
            ? t('Create Pricing Plan Rate', { defaultValue: 'Create Pricing Plan Rate' })
            : t('Save Pricing Plan Rate', { defaultValue: 'Save Pricing Plan Rate' })}
          onSubmit={(values) => mutation.mutate(values)}
        />
      )}
    </FormPageLayout>
  )
}
