import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Store } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getMerchant, updateMerchant } from '../api/merchants.api'
import { MerchantForm, type MerchantFormValues } from '../components/MerchantForm'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { FormPageLayout } from '../../../shared/components/forms/FormPageLayout'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
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
    <FormPageLayout
      backLabel="Back to merchants"
      backTo="/admin/merchants"
      description={query.data.data.name}
      eyebrow={t('Merchants', { defaultValue: 'Merchants' })}
      sectionIcon={<Store size={18} />}
      sectionDescription={t('Adjust merchant profile details, operational status, and the assigned pricing plan without changing the underlying API flow.', {
        defaultValue: 'Adjust merchant profile details, operational status, and the assigned pricing plan without changing the underlying API flow.',
      })}
      sectionTitle={t('Merchant Details')}
      title={t('Edit Merchant')}
    >
      <MerchantForm
        defaultValues={query.data.data}
        error={mutation.error}
        isSubmitting={mutation.isPending}
        pricingPlans={pricingPlansQuery.data.data}
        secondaryAction={(
          <Link className="ui-link-reset" to="/admin/merchants">
            <Button variant="secondary">{t('Cancel', { defaultValue: 'Cancel' })}</Button>
          </Link>
        )}
        submitLabel={t('Save Merchant', { defaultValue: 'Save Merchant' })}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </FormPageLayout>
  )
}
