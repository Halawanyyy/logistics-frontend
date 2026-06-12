import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ShoppingCart } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { createOrder } from '../api/orders.api'
import { OrderForm, type OrderFormValues } from '../components/OrderForm'
import { FormPageLayout } from '../../../shared/components/forms/FormPageLayout'
import { Button } from '../../../shared/components/ui/Button'
import { adminPath } from '../../../shared/routing/paths'

export function CreateOrderPage() {
  const { t } = useTranslation()
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
    <FormPageLayout
      backLabel="Back to orders"
      backTo={adminPath('/orders')}
      description={t('Create a manual order with customer, delivery, payment, and fulfillment details in one place.', {
        defaultValue: 'Create a manual order with customer, delivery, payment, and fulfillment details in one place.',
      })}
      disableInnerPanel
      eyebrow={t('Orders', { defaultValue: 'Orders' })}
      sectionIcon={<ShoppingCart size={18} />}
      sectionDescription={t('Complete the order profile, choose the fulfillment path, and define the line items before saving.', {
        defaultValue: 'Complete the order profile, choose the fulfillment path, and define the line items before saving.',
      })}
      sectionTitle={t('Order Details', { defaultValue: 'Order Details' })}
      title={t('Create Order', { defaultValue: 'Create Order' })}
    >
      <OrderForm
        error={mutation.error}
        isSubmitting={mutation.isPending}
        secondaryAction={(
          <Link className="ui-link-reset" to={adminPath('/orders')}>
            <Button variant="secondary">{t('Cancel', { defaultValue: 'Cancel' })}</Button>
          </Link>
        )}
        submitLabel={t('Create Order', { defaultValue: 'Create Order' })}
        onSubmit={(values: OrderFormValues) => mutation.mutate(values)}
      />
    </FormPageLayout>
  )
}
