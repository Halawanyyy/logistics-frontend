import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Map } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { createArea, getArea, listGovernorates, updateArea } from '../api/location-pricing.api'
import { AreaForm, type AreaFormValues } from '../components/AreaForm'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { FormPageLayout } from '../../../shared/components/forms/FormPageLayout'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Button } from '../../../shared/components/ui/Button'

export function AreaFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { t } = useTranslation()
  const { areaId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = mode === 'edit'
  const areaQuery = useQuery({
    queryKey: ['areas', areaId],
    queryFn: () => getArea(areaId!),
    enabled: isEdit && Boolean(areaId),
  })
  const governoratesQuery = useQuery({ queryKey: ['governorates'], queryFn: listGovernorates })
  const mutation = useMutation({
    mutationFn: (values: AreaFormValues) =>
      isEdit ? updateArea(areaId!, values) : createArea(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['areas'] })
      navigate('/areas')
    },
  })

  if (areaQuery.isLoading || governoratesQuery.isLoading) {
    return <LoadingState title={t('Loading area form', { defaultValue: 'Loading area form' })} />
  }

  const error = areaQuery.error ?? governoratesQuery.error
  if (error) {
    return <ErrorState message={getApiErrorMessage(error)} />
  }

  return (
    <FormPageLayout
      backTo="/areas"
      description={t('Manage delivery areas under their parent governorates with clean, responsive spacing.', {
        defaultValue: 'Manage delivery areas under their parent governorates with clean, responsive spacing.',
      })}
      eyebrow={t('Locations & Pricing', { defaultValue: 'Locations & Pricing' })}
      sectionIcon={<Map size={18} />}
      sectionDescription={t('Choose the parent governorate, set the area name, and control whether the area stays active.', {
        defaultValue: 'Choose the parent governorate, set the area name, and control whether the area stays active.',
      })}
      sectionTitle={t('Area Details', { defaultValue: 'Area Details' })}
      title={isEdit
        ? t('Edit Area', { defaultValue: 'Edit Area' })
        : t('Create Area', { defaultValue: 'Create Area' })}
    >
      <AreaForm
        defaultValues={areaQuery.data?.data}
        error={mutation.error}
        governorates={governoratesQuery.data?.data ?? []}
        isSubmitting={mutation.isPending}
        secondaryAction={(
          <Link className="ui-link-reset" to="/areas">
            <Button variant="secondary">{t('Cancel', { defaultValue: 'Cancel' })}</Button>
          </Link>
        )}
        submitLabel={isEdit
          ? t('Save Area', { defaultValue: 'Save Area' })
          : t('Create Area', { defaultValue: 'Create Area' })}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </FormPageLayout>
  )
}
