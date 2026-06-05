import { apiClient } from '../../../shared/api/axios'
import type {
  BulkUpdateSettingsRequest,
  SettingResponse,
  SettingsGroupsResponse,
  SettingsListResponse,
  UpdateSettingRequest,
} from '../types/settings.types'

export async function listSettings(params?: Record<string, string | number | boolean>) {
  const response = await apiClient.get<SettingsListResponse>('/settings', { params })
  return response.data
}

export async function listSettingsGroups() {
  const response = await apiClient.get<SettingsGroupsResponse>('/settings/groups')
  return response.data
}

export async function getSettingsGroup(group: string) {
  const response = await apiClient.get<SettingsListResponse>(`/settings/group/${group}`)
  return response.data
}

export async function getSetting(settingId: string | number) {
  const response = await apiClient.get<SettingResponse>(`/settings/${settingId}`)
  return response.data
}

export async function updateSetting(settingId: string | number, payload: UpdateSettingRequest) {
  const response = await apiClient.put<SettingResponse>(`/settings/${settingId}`, payload)
  return response.data
}

export async function bulkUpdateSettings(payload: BulkUpdateSettingsRequest) {
  const response = await apiClient.put<SettingsListResponse>('/settings/bulk-update', payload)
  return response.data
}

export async function listPublicSettings() {
  const response = await apiClient.get<SettingsListResponse>('/public/settings')
  return response.data
}
