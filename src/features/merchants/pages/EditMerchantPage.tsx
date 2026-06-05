import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getMerchant, updateMerchant } from '../api/merchants.api'
import { MerchantForm, type MerchantFormValues } from '../components/MerchantForm'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { listPricingPlans } from '../../location-pricing/api/location-pricing.api'

export function EditMerchantPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['merchants', id],
    queryFn: () => getMerchant(id!),
    enabled: Boolean(id),
  })
  const pricingPlansQuery = useQuery({
    queryKey: ['pricing-plans', 'merchant-form'],
    queryFn: () => listPricingPlans(),
  })
  const mutation = useMutation({
    mutationFn: (values: MerchantFormValues) => updateMerchant(id!, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['merchants'] })
      await queryClient.invalidateQueries({ queryKey: ['merchants', id] })
      navigate('/admin/merchants')
    },
  })

  if (query.isLoading || pricingPlansQuery.isLoading) {
    return <LoadingState title={t('Loading merchant', { defaultValue: 'Loading merchant' })} />
  }

  if (query.isError || !query.data || pricingPlansQuery.isError || !pricingPlansQuery.data) {
    return <ErrorState message={getApiErrorMessage(query.error ?? pricingPlansQuery.error)} onRetry={() => { void query.refetch(); void pricingPlansQuery.refetch() }} />
  }

  return (
    <section className="page-section">
      <PageHeader
        title={t('Edit Merchant')}
        description={query.data.data.name}
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
            defaultValues={query.data.data}
            error={mutation.error}
            isSubmitting={mutation.isPending}
            pricingPlans={pricingPlansQuery.data.data}
            submitLabel={t('Save Merchant', { defaultValue: 'Save Merchant' })}
            onSubmit={(values) => mutation.mutate(values)}
          />
        </CardContent>
      </Card>
    </section>
  )
}
