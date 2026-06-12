import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Truck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createDriver, getDriver, updateDriver } from '../api/drivers.api'
import { DriverForm, type DriverFormValues } from '../components/DriverForm'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { FormPageLayout } from '../../../shared/components/forms/FormPageLayout'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Button } from '../../../shared/components/ui/Button'

export function DriverFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { t } = useTranslation()
  const { driverId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = mode === 'edit'
  const query = useQuery({
    queryKey: ['drivers', driverId],
    queryFn: () => getDriver(driverId!),
    enabled: isEdit && Boolean(driverId),
  })
  const mutation = useMutation({
    mutationFn: (values: DriverFormValues) => isEdit ? updateDriver(driverId!, values) : createDriver(values),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['drivers'] })
      navigate(isEdit ? `/drivers/${driverId}` : `/drivers/${response.data.id}`)
    },
  })

  if (query.isLoading) {
    return <LoadingState title={t('Loading driver', { defaultValue: 'Loading driver' })} />
  }

  if (query.isError) {
    return <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
  }

  return (
    <FormPageLayout
      backTo="/drivers"
      description={t('Manage operational driver records, contact details, and fleet information from one structured form.', {
        defaultValue: 'Manage operational driver records, contact details, and fleet information from one structured form.',
      })}
      eyebrow={t('Drivers', { defaultValue: 'Drivers' })}
      sectionIcon={<Truck size={18} />}
      sectionDescription={t('Capture the driver profile, vehicle information, and current operating status.', {
        defaultValue: 'Capture the driver profile, vehicle information, and current operating status.',
      })}
      sectionTitle={t('Driver Details', { defaultValue: 'Driver Details' })}
      title={t(isEdit ? 'Edit Driver' : 'Create Driver', {
        defaultValue: isEdit ? 'Edit Driver' : 'Create Driver',
      })}
    >
      <DriverForm
        defaultValues={query.data?.data}
        error={mutation.error}
        isSubmitting={mutation.isPending}
        secondaryAction={(
          <Link className="ui-link-reset" to="/drivers">
            <Button variant="secondary">{t('Cancel', { defaultValue: 'Cancel' })}</Button>
          </Link>
        )}
        submitLabel={t(isEdit ? 'Save Driver' : 'Create Driver', {
          defaultValue: isEdit ? 'Save Driver' : 'Create Driver',
        })}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </FormPageLayout>
  )
}
