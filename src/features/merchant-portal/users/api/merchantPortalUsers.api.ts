import { apiClient } from '../../../../shared/api/axios'
import type {
  MerchantPortalUsersResponse,
  MerchantPortalUserResponse,
  CreateMerchantPortalUserPayload,
  UpdateMerchantPortalUserPayload,
  DeleteMerchantPortalUserResponse,
} from '../../../merchants/types/merchant.types'

export async function listMerchantUsers(): Promise<MerchantPortalUsersResponse> {
  const response = await apiClient.get<MerchantPortalUsersResponse>('/merchant-portal/users')
  return response.data
}

export async function getMerchantUser(merchantUserId: number): Promise<MerchantPortalUserResponse> {
  const response = await apiClient.get<MerchantPortalUserResponse>(`/merchant-portal/users/${merchantUserId}`)
  return response.data
}

export async function createMerchantUser(payload: CreateMerchantPortalUserPayload): Promise<MerchantPortalUserResponse> {
  const response = await apiClient.post<MerchantPortalUserResponse>('/merchant-portal/users', payload)
  return response.data
}

export async function updateMerchantUser(
  merchantUserId: number,
  payload: UpdateMerchantPortalUserPayload,
): Promise<MerchantPortalUserResponse> {
  const response = await apiClient.put<MerchantPortalUserResponse>(`/merchant-portal/users/${merchantUserId}`, payload)
  return response.data
}

export async function deleteMerchantUser(merchantUserId: number): Promise<DeleteMerchantPortalUserResponse> {
  const response = await apiClient.delete<DeleteMerchantPortalUserResponse>(`/merchant-portal/users/${merchantUserId}`)
  return response.data
}

export async function suspendMerchantUser(merchantUserId: number): Promise<MerchantPortalUserResponse> {
  const response = await apiClient.post<MerchantPortalUserResponse>(`/merchant-portal/users/${merchantUserId}/suspend`)
  return response.data
}

export async function activateMerchantUser(merchantUserId: number): Promise<MerchantPortalUserResponse> {
  const response = await apiClient.post<MerchantPortalUserResponse>(`/merchant-portal/users/${merchantUserId}/activate`)
  return response.data
}
