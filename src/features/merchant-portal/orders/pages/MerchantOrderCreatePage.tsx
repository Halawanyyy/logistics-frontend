import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { FormPageLayout } from '../../../../shared/components/forms/FormPageLayout'
import { merchantPath } from '../../../../shared/routing/paths'
import { createMerchantPortalOrder } from '../api/merchantPortalOrders.api'
import { MerchantOrderForm } from '../components/MerchantOrderForm'

export function MerchantOrderCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: createMerchantPortalOrder,
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['merchant-portal-orders'] })
      navigate(merchantPath(`/orders/${response.data.id}`))
    },
  })

  return (
    <FormPageLayout
      backTo={merchantPath('/orders')}
      description={t('Manage and track your orders.', { defaultValue: 'Manage and track your orders.' })}
      disableInnerPanel
      title={t('Create Order', { defaultValue: 'Create Order' })}
    >
      {mutation.isSuccess ? <div className="form-success">{t('Order created successfully.', { defaultValue: 'Order created successfully.' })}</div> : null}
      <MerchantOrderForm
        error={mutation.error}
        isSubmitting={mutation.isPending}
        onSubmit={mutation.mutate}
        submitLabel={t('Create Order', { defaultValue: 'Create Order' })}
      />
    </FormPageLayout>
  )
}
