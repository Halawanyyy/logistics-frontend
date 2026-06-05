export type Attachment = {
  id: number
  attachable_type: string
  attachable_id: number
  file_name: string
  original_name: string
  file_path?: string
  mime_type: string
  file_size: number
  category: string
  notes: string | null
  download_url?: string | null
  uploaded_by_name: string
  created_at: string
}

export type AttachmentFilters = {
  attachable_type?: string
  attachable_id?: string | number
  category?: string
  per_page?: string | number
}

export type UploadAttachmentPayload = {
  attachable_type: string
  attachable_id: string | number
  category: string
  file: File
  notes?: string | null
}

export type AttachmentsListResponse = {
  data: Attachment[]
  meta?: Record<string, unknown>
  links?: Record<string, unknown>
}

export type AttachmentResponse = {
  data: Attachment
}

export type DeleteAttachmentResponse = {
  message: string
}
