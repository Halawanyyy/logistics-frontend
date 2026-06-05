export type AuditTimelineFilters = {
  auditable_type: string
  auditable_id: string | number
}

export type AuditLogsFilters = {
  user_id?: string | number
  event_type?: string
  action?: string
  auditable_type?: string
  auditable_id?: string | number
  date_from?: string
  date_to?: string
  search?: string
  per_page?: string | number
}

export type AuditLogItem = {
  id: number
  user: {
    id: number
    name: string
  } | null
  event_type: string
  action: string
  auditable_type: string
  auditable_id: number
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  notes: string | null
  ip_address: string | null
  created_at: string
}

export type AuditLogsResponse = {
  data: AuditLogItem[]
  links?: {
    first?: string | null
    last?: string | null
    prev?: string | null
    next?: string | null
  }
  meta?: {
    current_page?: number
    from?: number | null
    last_page?: number
    path?: string
    per_page?: number
    to?: number | null
    total?: number
  }
}

export type AuditTimelineResponse = {
  data: AuditLogItem[]
}
