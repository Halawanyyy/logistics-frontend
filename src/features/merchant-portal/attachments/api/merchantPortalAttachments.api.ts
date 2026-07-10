import { apiClient } from '../../../../shared/api/axios'
import type {
  MerchantAttachmentFilters,
  MerchantAttachmentResponse,
  MerchantAttachmentsResponse,
  MerchantAttachmentUploadPayload,
} from '../types/merchantPortalAttachments.types'

/**
 * Removes merchant_id from any outgoing payload to comply with security rules.
 */
function guardMerchantId<T extends Record<string, any>>(params: T): Omit<T, 'merchant_id'> {
  const { merchant_id, ...rest } = params
  return rest
}

export async function listMerchantPortalAttachments(params?: MerchantAttachmentFilters) {
  const safeParams = params ? guardMerchantId(params) : undefined
  const response = await apiClient.get<MerchantAttachmentsResponse>('/merchant-portal/attachments', { params: safeParams })
  return response.data
}

export async function uploadMerchantPortalAttachment(payload: MerchantAttachmentUploadPayload) {
  const formData = new FormData()
  formData.append('file', payload.file)
  if (payload.category) formData.append('category', payload.category)
  if (payload.notes) formData.append('notes', payload.notes)
  if (payload.attachable_type) formData.append('attachable_type', payload.attachable_type)
  if (payload.attachable_id) formData.append('attachable_id', String(payload.attachable_id))

  const response = await apiClient.post<MerchantAttachmentResponse>('/merchant-portal/attachments', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export async function getMerchantPortalAttachment(attachmentId: string | number) {
  const response = await apiClient.get<MerchantAttachmentResponse>(`/merchant-portal/attachments/${attachmentId}`)
  return response.data
}

export async function downloadMerchantPortalAttachment(attachmentId: string | number) {
  const response = await apiClient.get<Blob>(`/merchant-portal/attachments/${attachmentId}/download`, {
    responseType: 'blob',
  })
  return response.data
}

export async function deleteMerchantPortalAttachment(attachmentId: string | number) {
  const response = await apiClient.delete<{ message: string }>(`/merchant-portal/attachments/${attachmentId}`)
  return response.data
}
