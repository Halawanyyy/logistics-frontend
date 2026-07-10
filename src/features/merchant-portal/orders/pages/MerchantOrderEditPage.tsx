import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage, isApiNotFound } from '../../../../shared/api/api-error'
import { FormPageLayout } from '../../../../shared/components/forms/FormPageLayout'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { NotFoundState } from '../../../../shared/components/states/NotFoundState'
import { merchantPath } from '../../../../shared/routing/paths'
import { getMerchantPortalOrder, updateMerchantPortalOrder } from '../api/merchantPortalOrders.api'
import { MerchantOrderForm } from '../components/MerchantOrderForm'
import type { MerchantPortalOrder } from '../types/merchantPortalOrders.types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function unwrapMerchantPortalOrder(payload: unknown): MerchantPortalOrder | null {
  let current: unknown = payload

  for (let depth = 0; depth < 4; depth += 1) {
    if (!isRecord(current)) {
      return null
    }

    if (
      'order_number' in current
      || 'customer_name' in current
      || 'customer' in current
      || 'delivery' in current
    ) {
      return current as unknown as MerchantPortalOrder
    }

    if ('order' in current && isRecord(current.order)) {
      current = current.order
      continue
    }

    if ('data' in current && isRecord(current.data)) {
      current = current.data
      continue
    }

    return null
  }

  return null
}

export function MerchantOrderEditPage() {
  const { t } = useTranslation()
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const orderQuery = useQuery({
    queryKey: ['merchant-portal-order', orderId],
    queryFn: () => getMerchantPortalOrder(orderId!),
    enabled: Boolean(orderId),
  })
  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateMerchantPortalOrder>[1]) => updateMerchantPortalOrder(orderId!, payload),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['merchant-portal-orders'] })
      await queryClient.invalidateQueries({ queryKey: ['merchant-portal-order', orderId] })
      navigate(merchantPath(`/orders/${response.data.id}`))
    },
  })

  if (orderQuery.isLoading) {
    return <LoadingState title={t('Loading Order Details', { defaultValue: 'Loading Order Details' })} />
  }

  if (orderQuery.isError && isApiNotFound(orderQuery.error)) {
    return (
      <NotFoundState
        description={t('The requested order could not be found in the merchant portal.', {
          defaultValue: 'The requested order could not be found in the merchant portal.',
        })}
        title={t('Order not found', { defaultValue: 'Order not found' })}
      />
    )
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <ErrorState
        title={t('Failed to load order.', { defaultValue: 'Failed to load order.' })}
        message={getApiErrorMessage(orderQuery.error)}
        onRetry={() => void orderQuery.refetch()}
      />
    )
  }

  const order = unwrapMerchantPortalOrder(orderQuery.data)

  if (!order) {
    return (
      <ErrorState
        title={t('Failed to load order.', { defaultValue: 'Failed to load order.' })}
        message={t('The merchant order response could not be mapped into the edit form.', {
          defaultValue: 'The merchant order response could not be mapped into the edit form.',
        })}
      />
    )
  }

  return (
    <FormPageLayout
      backTo={merchantPath(`/orders/${orderId}`)}
      description={t('Manage and track your orders.', { defaultValue: 'Manage and track your orders.' })}
      disableInnerPanel
      title={t('Edit Order', { defaultValue: 'Edit Order' })}
    >
      {mutation.isSuccess ? <div className="form-success">{t('Order updated successfully.', { defaultValue: 'Order updated successfully.' })}</div> : null}
      <MerchantOrderForm
        defaultValues={order}
        error={mutation.error}
        isSubmitting={mutation.isPending}
        onSubmit={mutation.mutate}
        submitLabel={t('Edit Order', { defaultValue: 'Edit Order' })}
      />
    </FormPageLayout>
  )
}
