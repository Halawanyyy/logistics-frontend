import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createShippingRate,
  getShippingRate,
  listAreas,
  listGovernorates,
  updateShippingRate,
} from '../api/location-pricing.api'
import { ShippingRateForm, type ShippingRateFormValues } from '../components/ShippingRateForm'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'

export function ShippingRateFormPage({ mode }: { mode: 'create' | 'edit' }) {
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
    return <LoadingState title="Loading shipping rate form" />
  }

  if (error) {
    return <ErrorState message={getApiErrorMessage(error)} />
  }

  return (
    <section className="page-section">
      <PageHeader
        title={isEdit ? 'Edit Shipping Rate' : 'Create Shipping Rate'}
        description="Manage governorate-level and area-level shipping fees."
        actions={<Link className="ui-link-reset" to="/admin/shipping-rates"><Button variant="secondary">Back</Button></Link>}
      />
      <Card>
        <CardHeader><CardTitle>Shipping Rate Details</CardTitle></CardHeader>
        <CardContent>
          <ShippingRateForm
            areas={areasQuery.data?.data ?? []}
            defaultValues={rateQuery.data?.data}
            error={mutation.error}
            governorates={governoratesQuery.data?.data ?? []}
            isSubmitting={mutation.isPending}
            submitLabel={isEdit ? 'Save Shipping Rate' : 'Create Shipping Rate'}
            onSubmit={(values) => mutation.mutate(values)}
          />
        </CardContent>
      </Card>
    </section>
  )
}
