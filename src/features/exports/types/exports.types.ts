export type ExportType =
  | 'orders'
  | 'shipments'
  | 'driver_manifests'
  | 'merchant_wallet_transactions'
  | 'finance_reports'
  | 'warehouse_inventory'
  | 'treasury_transactions'
  | 'audit_logs'

export type ExportLogFilters = {
  export_type?: ExportType | string
  format?: string
  status?: string
  date_from?: string
  date_to?: string
  per_page?: string | number
}

export type ExportGenerateFilters = {
  date_from?: string
  date_to?: string
  merchant_id?: number | string
  driver_id?: number | string
  status?: string
}

export type CreateExportPayload = {
  format: 'csv' | string
  filters?: ExportGenerateFilters
}

export type ExportLog = {
  id: number
  export_type: ExportType | string
  format: string
  filters: Record<string, unknown> | null
  status: string
  file_path?: string | null
  download_url?: string | null
  file_name?: string | null
  created_by?: number | null
  created_by_name?: string | null
  generated_by_name?: string | null
  completed_at?: string | null
  failed_at?: string | null
  error_message?: string | null
  metadata?: Record<string, unknown> | null
  generated_at?: string | null
  created_at: string
}

export type ExportLogResponse = {
  data: ExportLog
}

export type ExportLogsResponse = {
  data: ExportLog[]
  links?: Record<string, unknown>
  meta?: Record<string, unknown>
}
