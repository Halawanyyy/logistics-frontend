import { apiClient } from '../../../../shared/api/axios'
import type {
  MerchantNotificationFilters,
  MerchantNotificationsResponse,
  MerchantNotificationUnreadCountResponse,
} from '../types/merchantPortalNotifications.types'

/**
 * Removes merchant_id from any outgoing payload to comply with security rules.
 */
function guardMerchantId<T extends Record<string, any>>(params: T): Omit<T, 'merchant_id'> {
  const { merchant_id, ...rest } = params
  return rest
}

export async function listMerchantPortalNotifications(params?: MerchantNotificationFilters) {
  const safeParams = params ? guardMerchantId(params) : undefined
  const response = await apiClient.get<MerchantNotificationsResponse>('/merchant-portal/notifications', { params: safeParams })
  return response.data
}

export async function getMerchantPortalUnreadNotificationCount() {
  const response = await apiClient.get<MerchantNotificationUnreadCountResponse>('/merchant-portal/notifications/unread-count')
  return response.data
}

export async function markMerchantPortalNotificationAsRead(notificationId: string) {
  const response = await apiClient.post<{ message: string }>(`/merchant-portal/notifications/${notificationId}/mark-read`)
  return response.data
}

export async function markAllMerchantPortalNotificationsAsRead() {
  const response = await apiClient.post<{ message: string }>('/merchant-portal/notifications/mark-all-read')
  return response.data
}
