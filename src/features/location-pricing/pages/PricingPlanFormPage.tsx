import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'

type PricingPlanFormPageProps = {
  kind: 'plan' | 'rate'
  mode: 'create' | 'edit'
}

export function PricingPlanFormPage({ kind, mode }: PricingPlanFormPageProps) {
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
    return <LoadingState title="Loading pricing form" />
  }

  if ((kind === 'plan' && mode === 'edit' && !planQuery.data) || (kind === 'rate' && mode === 'edit' && !rateQuery.data) || error) {
    return <ErrorState message={getApiErrorMessage(error)} onRetry={() => { void planQuery.refetch(); void rateQuery.refetch(); void pricingPlansQuery.refetch(); void governoratesQuery.refetch(); void areasQuery.refetch() }} />
  }

  return (
    <section className="page-section">
      <PageHeader
        title={mode === 'create' ? `Create Pricing ${kind === 'plan' ? 'Plan' : 'Rate'}` : `Edit Pricing ${kind === 'plan' ? 'Plan' : 'Rate'}`}
        description={kind === 'plan' ? 'Merchant pricing plan.' : 'Pricing plan rate by location.'}
        actions={
          <Link className="ui-link-reset" to={kind === 'plan' ? '/admin/pricing-plans' : '/admin/pricing-plan-rates'}>
            <Button variant="secondary">Back</Button>
          </Link>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{kind === 'plan' ? 'Pricing Plan Details' : 'Pricing Plan Rate Details'}</CardTitle>
        </CardHeader>
        <CardContent>
          {kind === 'plan' ? (
            <PricingPlanForm
              defaultValues={planQuery.data?.data}
              error={mutation.error}
              isSubmitting={mutation.isPending}
              submitLabel={mode === 'create' ? 'Create Pricing Plan' : 'Save Pricing Plan'}
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
              submitLabel={mode === 'create' ? 'Create Pricing Plan Rate' : 'Save Pricing Plan Rate'}
              onSubmit={(values) => mutation.mutate(values)}
            />
          )}
        </CardContent>
      </Card>
    </section>
  )
}
