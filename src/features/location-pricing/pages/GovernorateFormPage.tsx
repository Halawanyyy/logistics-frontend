import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPinned } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { createGovernorate, getGovernorate, updateGovernorate } from '../api/location-pricing.api'
import { GovernorateForm, type GovernorateFormValues } from '../components/GovernorateForm'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { FormPageLayout } from '../../../shared/components/forms/FormPageLayout'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Button } from '../../../shared/components/ui/Button'

export function GovernorateFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { t } = useTranslation()
  const { governorateId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = mode === 'edit'
  const query = useQuery({
    queryKey: ['governorates', governorateId],
    queryFn: () => getGovernorate(governorateId!),
    enabled: isEdit && Boolean(governorateId),
  })
  const mutation = useMutation({
    mutationFn: (values: GovernorateFormValues) =>
      isEdit ? updateGovernorate(governorateId!, values) : createGovernorate(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['governorates'] })
      navigate('/governorates')
    },
  })

  if (query.isLoading) {
    return <LoadingState title={t('Loading governorate', { defaultValue: 'Loading governorate' })} />
  }

  if (query.isError) {
    return <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
  }

  return (
    <FormPageLayout
      backTo="/governorates"
      description={t('Manage delivery coverage at the governorate level with a focused setup form.', {
        defaultValue: 'Manage delivery coverage at the governorate level with a focused setup form.',
      })}
      eyebrow={t('Locations & Pricing', { defaultValue: 'Locations & Pricing' })}
      sectionIcon={<MapPinned size={18} />}
      sectionDescription={t('Set the governorate name and whether it should stay active in the delivery network.', {
        defaultValue: 'Set the governorate name and whether it should stay active in the delivery network.',
      })}
      sectionTitle={t('Governorate Details', { defaultValue: 'Governorate Details' })}
      title={isEdit
        ? t('Edit Governorate', { defaultValue: 'Edit Governorate' })
        : t('Create Governorate', { defaultValue: 'Create Governorate' })}
    >
      <GovernorateForm
        defaultValues={query.data?.data}
        error={mutation.error}
        isSubmitting={mutation.isPending}
        secondaryAction={(
          <Link className="ui-link-reset" to="/governorates">
            <Button variant="secondary">{t('Cancel', { defaultValue: 'Cancel' })}</Button>
          </Link>
        )}
        submitLabel={isEdit
          ? t('Save Governorate', { defaultValue: 'Save Governorate' })
          : t('Create Governorate', { defaultValue: 'Create Governorate' })}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </FormPageLayout>
  )
}
