import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { createMerchant } from '../api/merchants.api'
import { MerchantForm, type MerchantFormValues } from '../components/MerchantForm'
import { listPricingPlans } from '../../location-pricing/api/location-pricing.api'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'

export function CreateMerchantPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const pricingPlansQuery = useQuery({
    queryKey: ['pricing-plans', 'merchant-form'],
    queryFn: () => listPricingPlans(),
  })
  const mutation = useMutation({
    mutationFn: createMerchant,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['merchants'] })
      navigate('/admin/merchants')
    },
  })

  if (pricingPlansQuery.isLoading) {
    return <LoadingState title={t('Loading pricing plans')} />
  }

  if (pricingPlansQuery.isError || !pricingPlansQuery.data) {
    return <ErrorState message={getApiErrorMessage(pricingPlansQuery.error)} onRetry={() => void pricingPlansQuery.refetch()} />
  }

  function handleSubmit(values: MerchantFormValues) {
    mutation.mutate(values)
  }

  return (
    <section className="page-section">
      <PageHeader
        title={t('Create Merchant')}
        description={t('Add a merchant account using the documented merchants API.')}
        actions={
          <Link className="ui-link-reset" to="/admin/merchants">
            <Button variant="secondary">{t('Back to merchants')}</Button>
          </Link>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{t('Merchant Details')}</CardTitle>
        </CardHeader>
        <CardContent>
          <MerchantForm
            error={mutation.error}
            isSubmitting={mutation.isPending}
            pricingPlans={pricingPlansQuery.data.data}
            submitLabel={t('Create Merchant')}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </section>
  )
}
