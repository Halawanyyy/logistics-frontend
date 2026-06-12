import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ShoppingCart } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getOrder, updateOrder } from '../api/orders.api'
import { OrderForm, type OrderFormValues } from '../components/OrderForm'
import { getApiErrorMessage, isApiNotFound } from '../../../shared/api/api-error'
import { FormPageLayout } from '../../../shared/components/forms/FormPageLayout'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { adminPath } from '../../../shared/routing/paths'
import { NotFoundState } from '../../../shared/components/states/NotFoundState'

export function EditOrderPage() {
  const { t } = useTranslation()
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
    return <LoadingState title={t('Loading order form', { defaultValue: 'Loading order form' })} />
  }

  if (orderQuery.isError && isApiNotFound(orderQuery.error)) {
    return (
      <NotFoundState
        title={t('Order not found', { defaultValue: 'Order not found' })}
        description={t('This order could not be found in the orders API.', {
          defaultValue: 'This order could not be found in the orders API.',
        })}
      />
    )
  }

  if (orderQuery.isError || !orderQuery.data) {
    return <ErrorState message={getApiErrorMessage(orderQuery.error)} />
  }

  return (
    <FormPageLayout
      backLabel="Back to order"
      backTo={adminPath(`/orders/${orderId}`)}
      description={orderQuery.data.data.order_number}
      eyebrow={t('Orders', { defaultValue: 'Orders' })}
      sectionIcon={<ShoppingCart size={18} />}
      sectionDescription={t('Update customer, delivery, payment, and fulfillment details while keeping the same validation and submit flow.', {
        defaultValue: 'Update customer, delivery, payment, and fulfillment details while keeping the same validation and submit flow.',
      })}
      sectionTitle={t('Order Details', { defaultValue: 'Order Details' })}
      title={t('Edit Order', { defaultValue: 'Edit Order' })}
    >
      <OrderForm
        defaultValues={orderQuery.data.data}
        error={mutation.error}
        isEdit
        isSubmitting={mutation.isPending}
        secondaryAction={(
          <Link className="ui-link-reset" to={adminPath(`/orders/${orderId}`)}>
            <Button variant="secondary">{t('Cancel', { defaultValue: 'Cancel' })}</Button>
          </Link>
        )}
        submitLabel={t('Save Order', { defaultValue: 'Save Order' })}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </FormPageLayout>
  )
}
