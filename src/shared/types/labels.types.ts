export type LabelFormat = 'html' | 'pdf' | 'zpl' | 'tspl' | 'json'

export type LabelRequestOptions = {
  format?: LabelFormat
  width_mm?: number
  height_mm?: number
  download?: boolean
}

export type LabelDocument = {
  blob: Blob
  fileName: string
  format: LabelFormat
  mimeType: string
  objectUrl?: string
  text?: string
  json?: unknown
}

export type LabelTemplate = {
  id?: number | string
  key?: string
  name?: string
  type?: string
  description?: string | null
  format?: string | null
}

export type LabelSetting = {
  key: string
  value: string | number | boolean | null
}

export type LabelTemplatesResponse = {
  data: LabelTemplate[]
}

export type LabelSettingsResponse = {
  data: LabelSetting[]
}

export type LabelPreviewPayload = {
  label_type: string
  format?: LabelFormat
  width_mm?: number
  height_mm?: number
  [key: string]: unknown
}

export type LabelTestPayload = {
  label_type?: string
  format?: LabelFormat
  width_mm?: number
  height_mm?: number
  [key: string]: unknown
}
