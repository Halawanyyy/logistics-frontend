import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createArea, getArea, listGovernorates, updateArea } from '../api/location-pricing.api'
import { AreaForm, type AreaFormValues } from '../components/AreaForm'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'

export function AreaFormPage({ mode }: { mode: 'create' | 'edit' }) {
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
    return <LoadingState title="Loading area form" />
  }

  const error = areaQuery.error ?? governoratesQuery.error
  if (error) {
    return <ErrorState message={getApiErrorMessage(error)} />
  }

  return (
    <section className="page-section">
      <PageHeader
        title={isEdit ? 'Edit Area' : 'Create Area'}
        description="Manage delivery areas under governorates."
        actions={<Link className="ui-link-reset" to="/areas"><Button variant="secondary">Back</Button></Link>}
      />
      <Card>
        <CardHeader><CardTitle>Area Details</CardTitle></CardHeader>
        <CardContent>
          <AreaForm
            defaultValues={areaQuery.data?.data}
            error={mutation.error}
            governorates={governoratesQuery.data?.data ?? []}
            isSubmitting={mutation.isPending}
            submitLabel={isEdit ? 'Save Area' : 'Create Area'}
            onSubmit={(values) => mutation.mutate(values)}
          />
        </CardContent>
      </Card>
    </section>
  )
}
