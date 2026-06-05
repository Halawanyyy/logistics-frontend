import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { createOrder } from '../api/orders.api'
import { OrderForm, type OrderFormValues } from '../components/OrderForm'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { adminPath } from '../../../shared/routing/paths'

export function CreateOrderPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
      navigate(adminPath(`/orders/${response.data.id}`))
    },
  })

  return (
    <section className="page-section">
      <PageHeader
        title="Create Order"
        description="Create a manual order with one or more line items."
        actions={
          <Link className="ui-link-reset" to={adminPath('/orders')}>
            <Button variant="secondary">Back to orders</Button>
          </Link>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderForm
            error={mutation.error}
            isSubmitting={mutation.isPending}
            submitLabel="Create Order"
            onSubmit={(values: OrderFormValues) => mutation.mutate(values)}
          />
        </CardContent>
      </Card>
    </section>
  )
}
