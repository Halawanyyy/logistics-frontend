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
