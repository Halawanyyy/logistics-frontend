import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getOrder, updateOrder } from '../api/orders.api'
import { OrderForm, type OrderFormValues } from '../components/OrderForm'
import { getApiErrorMessage, isApiNotFound } from '../../../shared/api/api-error'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { adminPath } from '../../../shared/routing/paths'
import { NotFoundState } from '../../../shared/components/states/NotFoundState'

export function EditOrderPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const orderQuery = useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => getOrder(orderId!),
    enabled: Boolean(orderId),
  })
  const mutation = useMutation({
    mutationFn: (values: OrderFormValues) => updateOrder(orderId!, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
      await queryClient.invalidateQueries({ queryKey: ['orders', orderId] })
      navigate(adminPath(`/orders/${orderId}`))
    },
  })
  const loading = orderQuery.isLoading

  if (loading) {
    return <LoadingState title="Loading order form" />
  }

  if (orderQuery.isError && isApiNotFound(orderQuery.error)) {
    return (
      <NotFoundState
        title="Order not found"
        description="This order could not be found in the orders API."
      />
    )
  }

  if (orderQuery.isError || !orderQuery.data) {
    return <ErrorState message={getApiErrorMessage(orderQuery.error)} />
  }

  return (
    <section className="page-section">
      <PageHeader
        title="Edit Order"
        description={orderQuery.data.data.order_number}
        actions={
          <Link className="ui-link-reset" to={adminPath(`/orders/${orderId}`)}>
            <Button variant="secondary">Back to order</Button>
          </Link>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderForm
            defaultValues={orderQuery.data.data}
            error={mutation.error}
            isEdit
            isSubmitting={mutation.isPending}
            submitLabel="Save Order"
            onSubmit={(values) => mutation.mutate(values)}
          />
        </CardContent>
      </Card>
    </section>
  )
}
