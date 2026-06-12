import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { ReceiptText } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  createShippingRate,
  getShippingRate,
  listAreas,
  listGovernorates,
  updateShippingRate,
} from '../api/location-pricing.api'
import { ShippingRateForm, type ShippingRateFormValues } from '../components/ShippingRateForm'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { FormPageLayout } from '../../../shared/components/forms/FormPageLayout'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Button } from '../../../shared/components/ui/Button'

export function ShippingRateFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { t } = useTranslation()
  const { shippingRateId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = mode === 'edit'
  const rateQuery = useQuery({
    queryKey: ['shipping-rates', shippingRateId],
    queryFn: () => getShippingRate(shippingRateId!),
    enabled: isEdit && Boolean(shippingRateId),
  })
  const [governoratesQuery, areasQuery] = useQueries({
    queries: [
      { queryKey: ['governorates'], queryFn: listGovernorates },
      { queryKey: ['areas'], queryFn: () => listAreas() },
    ],
  })
  const mutation = useMutation({
    mutationFn: (values: ShippingRateFormValues) =>
      isEdit ? updateShippingRate(shippingRateId!, values) : createShippingRate(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['shipping-rates'] })
      navigate('/shipping-rates')
    },
  })
  const loading = rateQuery.isLoading || governoratesQuery.isLoading || areasQuery.isLoading
  const error = rateQuery.error ?? governoratesQuery.error ?? areasQuery.error

  if (loading) {
    return <LoadingState title={t('Loading shipping rate form', { defaultValue: 'Loading shipping rate form' })} />
  }

  if (error) {
    return <ErrorState message={getApiErrorMessage(error)} />
  }

  return (
    <FormPageLayout
      backTo="/admin/shipping-rates"
      description={t('Manage governorate-level and area-level shipping fees in one structured pricing form.', {
        defaultValue: 'Manage governorate-level and area-level shipping fees in one structured pricing form.',
      })}
      eyebrow={t('Locations & Pricing', { defaultValue: 'Locations & Pricing' })}
      sectionIcon={<ReceiptText size={18} />}
      sectionDescription={t('Choose the destination coverage and define delivery, swap, and return pricing before saving.', {
        defaultValue: 'Choose the destination coverage and define delivery, swap, and return pricing before saving.',
      })}
      sectionTitle={t('Shipping Rate Details', { defaultValue: 'Shipping Rate Details' })}
      title={isEdit
        ? t('Edit Shipping Rate', { defaultValue: 'Edit Shipping Rate' })
        : t('Create Shipping Rate', { defaultValue: 'Create Shipping Rate' })}
    >
      <ShippingRateForm
        areas={areasQuery.data?.data ?? []}
        defaultValues={rateQuery.data?.data}
        error={mutation.error}
        governorates={governoratesQuery.data?.data ?? []}
        isSubmitting={mutation.isPending}
        secondaryAction={(
          <Link className="ui-link-reset" to="/admin/shipping-rates">
            <Button variant="secondary">{t('Cancel', { defaultValue: 'Cancel' })}</Button>
          </Link>
        )}
        submitLabel={isEdit
          ? t('Save Shipping Rate', { defaultValue: 'Save Shipping Rate' })
          : t('Create Shipping Rate', { defaultValue: 'Create Shipping Rate' })}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </FormPageLayout>
  )
}
