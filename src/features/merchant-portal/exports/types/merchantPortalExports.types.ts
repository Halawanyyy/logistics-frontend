export type MerchantExportType =
  | 'orders'
  | 'shipments'
  | 'warehouse_inventory'
  | 'stock_movements'
  | 'wallet_transactions'
  | 'invoices'
  | 'payouts'
  | 'inbound_stock_requests'
  | string

export type MerchantExportFilters = {
  export_type?: MerchantExportType
  format?: string
  status?: string
  date_from?: string
  date_to?: string
  per_page?: string | number
  page?: string | number
}

export type MerchantExportGenerateFilters = {
  date_from?: string
  date_to?: string
  status?: string
}

export type CreateMerchantExportPayload = {
  type: MerchantExportType
  format: 'csv' | string
  filters?: MerchantExportGenerateFilters
}

export type MerchantExportLog = {
  id: number
  type?: MerchantExportType
  export_type?: MerchantExportType
  format: string
  filters: Record<string, unknown> | null
  status: string
  file_name?: string | null
  completed_at?: string | null
  failed_at?: string | null
  error_message?: string | null
  created_at: string
}

export type MerchantExportLogResponse = {
  data: MerchantExportLog
}

export type MerchantExportLogsResponse = {
  data: MerchantExportLog[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export type MerchantExportTypeInfo = {
  id: string
  name: string
  description?: string
}

export type MerchantExportTypesResponse = {
  data: MerchantExportTypeInfo[] | string[] | any
}
