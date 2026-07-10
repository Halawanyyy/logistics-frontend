import { apiClient } from '../../../shared/api/axios'
import type { ShipmentResponse, ShipmentsListResponse, ShipmentFilters } from '../../shipments/types/shipment.types'
import type { 
  MerchantPortalMeResponse, 
  MerchantPortalDashboardSummaryResponse,
  MerchantPortalProfileResponse,
  UpdateMerchantPortalProfilePayload,
  MerchantPortalSettingsResponse,
  UpdateMerchantPortalSettingsPayload
} from '../types/merchantPortal.types'

export type MerchantPortalLocationOption = {
  id: number
  name?: string | null
  name_ar?: string | null
}

type MerchantPortalLocationOptionsResponse =
  | MerchantPortalLocationOption[]
  | { data?: MerchantPortalLocationOption[] | { data?: MerchantPortalLocationOption[] | null } | null }

function normalizeMerchantPortalLocationOptions(
  payload: MerchantPortalLocationOptionsResponse,
): MerchantPortalLocationOption[] {
  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload.data)) {
    return payload.data
  }

  if (payload.data && typeof payload.data === 'object' && Array.isArray(payload.data.data)) {
    return payload.data.data
  }

  return []
}

export function guardMerchantId(payloadOrParams: any) {
  if (import.meta.env.DEV && payloadOrParams && typeof payloadOrParams === 'object') {
    const keys = Object.keys(payloadOrParams)
    const hasMerchantId = keys.some(k => k.toLowerCase() === 'merchant_id')
    if (hasMerchantId) {
      throw new Error(
        'Security Violation: Do not send merchant_id from the Merchant Portal. The backend derives merchant context from session authentication.'
      )
    }
  }
}

export async function getMerchantPortalMe() {
  const response = await apiClient.get<{ data: MerchantPortalMeResponse }>('/merchant-portal/me')
  return response.data
}

export async function getMerchantPortalDashboardSummary() {
  const response = await apiClient.get<{ data: MerchantPortalDashboardSummaryResponse }>('/merchant-portal/dashboard/summary')
  return response.data
}

export async function listMerchantPortalGovernorates() {
  const response = await apiClient.get<MerchantPortalLocationOptionsResponse>('/merchant-portal/locations/governorates')
  return normalizeMerchantPortalLocationOptions(response.data)
}

export async function listMerchantPortalAreas(governorateId: number) {
  const params = { governorate_id: governorateId }
  guardMerchantId(params)
  const response = await apiClient.get<MerchantPortalLocationOptionsResponse>('/merchant-portal/locations/areas', { params })
  return normalizeMerchantPortalLocationOptions(response.data)
}

export async function getMerchantPortalShipments(params?: ShipmentFilters) {
  guardMerchantId(params)
  const response = await apiClient.get<ShipmentsListResponse>('/merchant-portal/shipments', { params })
  return response.data
}

export async function getMerchantPortalShipment(shipmentId: string | number) {
  const response = await apiClient.get<ShipmentResponse>(`/merchant-portal/shipments/${shipmentId}`)
  return response.data
}

export async function getMerchantPortalProducts(params?: any) {
  guardMerchantId(params)
  const response = await apiClient.get<any>('/merchant-portal/warehouse/products', { params })
  return response.data
}

export async function getMerchantPortalProduct(productId: string | number) {
  const response = await apiClient.get<any>(`/merchant-portal/warehouse/products/${productId}`)
  return response.data
}

export async function getMerchantPortalInventory(params?: any) {
  guardMerchantId(params)
  const response = await apiClient.get<any>('/merchant-portal/warehouse/inventory', { params })
  return response.data
}

export async function getMerchantPortalProfile() {
  const response = await apiClient.get<{ data: MerchantPortalProfileResponse }>('/merchant-portal/profile')
  return response.data
}

export async function updateMerchantPortalProfile(payload: UpdateMerchantPortalProfilePayload) {
  guardMerchantId(payload)
  const response = await apiClient.put<{ data: MerchantPortalProfileResponse }>('/merchant-portal/profile', payload)
  return response.data
}

export async function getMerchantPortalSettings() {
  const response = await apiClient.get<{ data: MerchantPortalSettingsResponse }>('/merchant-portal/settings')
  return response.data
}

export async function updateMerchantPortalSettings(payload: UpdateMerchantPortalSettingsPayload) {
  guardMerchantId(payload)
  const response = await apiClient.put<{ data: MerchantPortalSettingsResponse }>('/merchant-portal/settings', payload)
  return response.data
}
