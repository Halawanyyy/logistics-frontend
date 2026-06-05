import { apiClient } from '../../../shared/api/axios'
import type {
  CreateExportPayload,
  ExportLogFilters,
  ExportLogResponse,
  ExportLogsResponse,
  ExportType,
} from '../types/exports.types'

export async function listExports(params?: ExportLogFilters) {
  const response = await apiClient.get<ExportLogsResponse>('/exports', { params })
  return response.data
}

export async function createExport(type: ExportType | string, payload: CreateExportPayload) {
  const response = await apiClient.post<ExportLogResponse>(`/exports/${type}`, payload)
  return response.data
}

export async function getExport(exportId: string | number) {
  const response = await apiClient.get<ExportLogResponse>(`/exports/${exportId}`)
  return response.data
}

export async function downloadExport(exportId: string | number) {
  const response = await apiClient.get<Blob>(`/exports/${exportId}/download`, {
    responseType: 'blob',
  })
  return response.data
}
