export type SettingRecord = {
  id: number
  group: string
  key: string
  value: string | number | boolean | string[] | null
  type: string
  label: string
  description: string | null
  is_public: boolean
  is_encrypted: boolean
  is_editable: boolean
  options: string[] | null
  validation_rules: {
    rules?: string
  } | null
  sort_order: number
  updated_by_name?: string | null
  updated_at?: string | null
}

export type SettingGroup = {
  group: string
  settings_count: number
}

export type SettingsListResponse = {
  data: SettingRecord[]
}

export type SettingResponse = {
  data: SettingRecord
}

export type SettingsGroupsResponse = {
  data: SettingGroup[]
}

export type UpdateSettingRequest = {
  value: string | number | boolean | string[] | null
}

export type BulkUpdateSettingsRequest = {
  settings: Array<{
    key: string
    value: string | number | boolean | string[] | null
  }>
}

export type PublicBrandingData = {
  app_name: string
  company_name: string
  logo_url: string | null
  logo_path?: string | null
  tenant_id?: string | null
}

export type PublicBrandingResponse = {
  data: PublicBrandingData
}

export type UploadLogoResponse = {
  message: string
  data: PublicBrandingData & {
    company_id?: number
  }
}
