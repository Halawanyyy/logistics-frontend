export type MerchantAttachment = {
  id: number
  file_name: string
  original_name?: string
  mime_type: string
  file_size: number
  category?: string
  notes?: string
  attachable_type?: string
  attachable_id?: number
  download_url?: string
  uploaded_by_name?: string
  created_at: string
}

export type MerchantAttachmentFilters = {
  category?: string
  attachable_type?: string
  date_from?: string
  date_to?: string
  search?: string
  page?: string | number
  per_page?: string | number
}

export type MerchantAttachmentUploadPayload = {
  file: File
  category?: string
  notes?: string
  attachable_type?: string
  attachable_id?: string | number
}

export type MerchantAttachmentResponse = {
  data: MerchantAttachment
}

export type MerchantAttachmentsResponse = {
  data: MerchantAttachment[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
