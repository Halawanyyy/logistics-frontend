import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Store } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { createMerchant } from '../api/merchants.api'
import { MerchantForm, type MerchantFormValues } from '../components/MerchantForm'
import { listPricingPlans } from '../../location-pricing/api/location-pricing.api'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { FormPageLayout } from '../../../shared/components/forms/FormPageLayout'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Button } from '../../../shared/components/ui/Button'

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
    <FormPageLayout
      backLabel="Back to merchants"
      backTo="/admin/merchants"
      description={t('Add a merchant account with the core commercial and contact details your operations team needs.', {
        defaultValue: 'Add a merchant account with the core commercial and contact details your operations team needs.',
      })}
      eyebrow={t('Merchants', { defaultValue: 'Merchants' })}
      sectionIcon={<Store size={18} />}
      sectionDescription={t('Enter the merchant profile, contact information, and pricing-plan relationship before saving.', {
        defaultValue: 'Enter the merchant profile, contact information, and pricing-plan relationship before saving.',
      })}
      sectionTitle={t('Merchant Details')}
      title={t('Create Merchant')}
    >
      <MerchantForm
        error={mutation.error}
        isSubmitting={mutation.isPending}
        pricingPlans={pricingPlansQuery.data.data}
        secondaryAction={(
          <Link className="ui-link-reset" to="/admin/merchants">
            <Button variant="secondary">{t('Cancel', { defaultValue: 'Cancel' })}</Button>
          </Link>
        )}
        submitLabel={t('Create Merchant')}
        onSubmit={handleSubmit}
      />
    </FormPageLayout>
  )
}
