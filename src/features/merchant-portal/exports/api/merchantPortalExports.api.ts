import { apiClient } from '../../../../shared/api/axios'
import type {
  CreateMerchantExportPayload,
  MerchantExportFilters,
  MerchantExportLogResponse,
  MerchantExportLogsResponse,
  MerchantExportTypesResponse,
} from '../types/merchantPortalExports.types'

/**
 * Removes merchant_id from any outgoing payload to comply with security rules.
 */
function guardMerchantId<T extends Record<string, any>>(params: T): Omit<T, 'merchant_id'> {
  const { merchant_id, ...rest } = params
  return rest
}

export async function listMerchantPortalExportTypes() {
  const response = await apiClient.get<MerchantExportTypesResponse>('/merchant-portal/exports/types')
  return response.data
}

export async function listMerchantPortalExports(params?: MerchantExportFilters) {
  const safeParams = params ? guardMerchantId(params) : undefined
  const response = await apiClient.get<MerchantExportLogsResponse>('/merchant-portal/exports', { params: safeParams })
  return response.data
}

export async function createMerchantPortalExport(payload: CreateMerchantExportPayload) {
  // Payload might contain filters, we need to ensure filters don't contain merchant_id.
  const safePayload = {
    ...payload,
    filters: payload.filters ? guardMerchantId(payload.filters) : undefined,
  }
  const response = await apiClient.post<MerchantExportLogResponse>('/merchant-portal/exports', safePayload)
  return response.data
}

export async function getMerchantPortalExport(exportId: string | number) {
  const response = await apiClient.get<MerchantExportLogResponse>(`/merchant-portal/exports/${exportId}`)
  return response.data
}

export async function downloadMerchantPortalExport(exportId: string | number) {
  const response = await apiClient.get<Blob>(`/merchant-portal/exports/${exportId}/download`, {
    responseType: 'blob',
  })
  return response.data
}
