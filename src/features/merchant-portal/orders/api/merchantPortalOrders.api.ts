import { requestLabelDocument } from '../../../../shared/api/labels.api'
import { apiClient } from '../../../../shared/api/axios'
import type { LabelRequestOptions } from '../../../../shared/types/labels.types'
import { guardMerchantId } from '../../api/merchantPortal.api'
import type {
  MerchantPortalCreateOrderPayload,
  MerchantPortalOrderFilters,
  MerchantPortalOrderListResponse,
  MerchantPortalOrderResponse,
  MerchantPortalUpdateOrderPayload,
} from '../types/merchantPortalOrders.types'

export async function listMerchantPortalOrders(params?: MerchantPortalOrderFilters) {
  guardMerchantId(params)
  const response = await apiClient.get<MerchantPortalOrderListResponse>('/merchant-portal/orders', { params })
  return response.data
}

export async function createMerchantPortalOrder(payload: MerchantPortalCreateOrderPayload) {
  guardMerchantId(payload)
  const response = await apiClient.post<MerchantPortalOrderResponse>('/merchant-portal/orders', payload)
  return response.data
}

export async function getMerchantPortalOrder(orderId: string | number) {
  const response = await apiClient.get<MerchantPortalOrderResponse>(`/merchant-portal/orders/${orderId}`)
  return response.data
}

export async function updateMerchantPortalOrder(
  orderId: string | number,
  payload: MerchantPortalUpdateOrderPayload,
) {
  guardMerchantId(payload)
  const response = await apiClient.put<MerchantPortalOrderResponse>(`/merchant-portal/orders/${orderId}`, payload)
  return response.data
}

export async function confirmMerchantPortalOrder(orderId: string | number) {
  const response = await apiClient.post<MerchantPortalOrderResponse>(`/merchant-portal/orders/${orderId}/confirm`)
  return response.data
}

export async function cancelMerchantPortalOrder(orderId: string | number) {
  const response = await apiClient.post<MerchantPortalOrderResponse>(`/merchant-portal/orders/${orderId}/cancel`)
  return response.data
}

export async function getMerchantPortalOrderLabel(
  orderId: string | number,
  options: LabelRequestOptions,
) {
  return requestLabelDocument({
    ...options,
    path: `/merchant-portal/orders/${orderId}/label`,
  })
}
