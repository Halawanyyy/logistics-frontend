import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createDriver, getDriver, updateDriver } from '../api/drivers.api'
import { DriverForm, type DriverFormValues } from '../components/DriverForm'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'

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
    <section className="page-section">
      <PageHeader
        title={t(isEdit ? 'Edit Driver' : 'Create Driver', {
          defaultValue: isEdit ? 'Edit Driver' : 'Create Driver',
        })}
        description={t('Manage operational driver records.', { defaultValue: 'Manage operational driver records.' })}
        actions={<Link className="ui-link-reset" to="/drivers"><Button variant="secondary">{t('Back')}</Button></Link>}
      />
      <Card>
        <CardHeader><CardTitle>{t('Driver Details', { defaultValue: 'Driver Details' })}</CardTitle></CardHeader>
        <CardContent>
          <DriverForm
            defaultValues={query.data?.data}
            error={mutation.error}
            isSubmitting={mutation.isPending}
            submitLabel={t(isEdit ? 'Save Driver' : 'Create Driver', {
              defaultValue: isEdit ? 'Save Driver' : 'Create Driver',
            })}
            onSubmit={(values) => mutation.mutate(values)}
          />
        </CardContent>
      </Card>
    </section>
  )
}
