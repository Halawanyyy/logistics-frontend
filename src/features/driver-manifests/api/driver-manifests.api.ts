import { apiClient } from '../../../shared/api/axios'
import type {
  CloseDriverManifestPayload,
  DriverManifestFilters,
  DriverManifestResponse,
  DriverManifestsListResponse,
  GenerateDriverManifestPayload,
  PrintableDriverManifestResponse,
} from '../types/driver-manifest.types'

export async function listDriverManifests(params?: DriverManifestFilters) {
  const response = await apiClient.get<DriverManifestsListResponse>('/driver-manifests', { params })
  return response.data
}

export async function generateDriverManifest(payload: GenerateDriverManifestPayload) {
  const response = await apiClient.post<DriverManifestResponse>('/driver-manifests/generate', payload)
  return response.data
}

export async function getDriverManifest(manifestId: string | number) {
  const response = await apiClient.get<DriverManifestResponse>(`/driver-manifests/${manifestId}`)
  return response.data
}

export async function closeDriverManifest(
  manifestId: string | number,
  payload: CloseDriverManifestPayload,
) {
  const response = await apiClient.post<DriverManifestResponse>(
    `/driver-manifests/${manifestId}/close`,
    payload,
  )
  return response.data
}

export async function getDriverManifestPrint(manifestId: string | number) {
  const response = await apiClient.get<PrintableDriverManifestResponse>(
    `/driver-manifests/${manifestId}/print`,
  )
  return response.data
}
