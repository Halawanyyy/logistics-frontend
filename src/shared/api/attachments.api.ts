import { apiClient } from './axios'
import type {
  AttachmentFilters,
  AttachmentResponse,
  AttachmentsListResponse,
  DeleteAttachmentResponse,
  UploadAttachmentPayload,
} from '../types/attachments.types'

export async function listAttachments(params?: AttachmentFilters) {
  const response = await apiClient.get<AttachmentsListResponse>('/attachments', { params })
  return response.data
}

export async function getAttachment(attachmentId: string | number) {
  const response = await apiClient.get<AttachmentResponse>(`/attachments/${attachmentId}`)
  return response.data
}

export async function uploadAttachment(payload: UploadAttachmentPayload) {
  const formData = new FormData()
  formData.append('attachable_type', payload.attachable_type)
  formData.append('attachable_id', String(payload.attachable_id))
  formData.append('category', payload.category)
  formData.append('file', payload.file)

  if (payload.notes) {
    formData.append('notes', payload.notes)
  }

  const response = await apiClient.post<AttachmentResponse>('/attachments', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export async function downloadAttachment(attachmentId: string | number) {
  const response = await apiClient.get<Blob>(`/attachments/${attachmentId}/download`, {
    responseType: 'blob',
  })
  return response.data
}

export async function deleteAttachment(attachmentId: string | number) {
  const response = await apiClient.delete<DeleteAttachmentResponse>(`/attachments/${attachmentId}`)
  return response.data
}
