import { apiClient } from './axios'
import type {
  AuditLogsFilters,
  AuditLogsResponse,
  AuditTimelineFilters,
  AuditTimelineResponse,
} from '../types/audit.types'

export async function listAuditLogs(params?: AuditLogsFilters) {
  const response = await apiClient.get<AuditLogsResponse>('/audit-logs', { params })
  return response.data
}

export async function listAuditTimeline(params: AuditTimelineFilters) {
  const response = await apiClient.get<AuditTimelineResponse>('/audit-logs/timeline', { params })
  return response.data
}
