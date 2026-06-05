import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createGovernorate, getGovernorate, updateGovernorate } from '../api/location-pricing.api'
import { GovernorateForm, type GovernorateFormValues } from '../components/GovernorateForm'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'

export function GovernorateFormPage({ mode }: { mode: 'create' | 'edit' }) {
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
    return <LoadingState title="Loading governorate" />
  }

  if (query.isError) {
    return <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
  }

  return (
    <section className="page-section">
      <PageHeader
        title={isEdit ? 'Edit Governorate' : 'Create Governorate'}
        description="Manage governorate coverage."
        actions={<Link className="ui-link-reset" to="/governorates"><Button variant="secondary">Back</Button></Link>}
      />
      <Card>
        <CardHeader><CardTitle>Governorate Details</CardTitle></CardHeader>
        <CardContent>
          <GovernorateForm
            defaultValues={query.data?.data}
            error={mutation.error}
            isSubmitting={mutation.isPending}
            submitLabel={isEdit ? 'Save Governorate' : 'Create Governorate'}
            onSubmit={(values) => mutation.mutate(values)}
          />
        </CardContent>
      </Card>
    </section>
  )
}
