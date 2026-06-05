export type DriverManifestFilters = {
  driver_id?: number | string
  manifest_date?: string
  status?: string
  date_from?: string
  date_to?: string
}

export type DriverManifestDriver = {
  id: number
  name: string
  phone: string
  vehicle_type: string
  vehicle_plate: string
}

export type DriverManifestSummary = {
  total_shipments: number
  expected_cod_amount: string
  actual_received_amount: string | null
  difference_amount: string
  closed_shipments_count: number
}

export type DriverManifestItem = {
  id: number
  shipment_id: number
  shipment_number: string
  order_id: number
  order_number: string
  merchant_name: string
  customer_name: string
  customer_phone: string
  delivery_address: string
  cod_amount: string
  shipping_fee: string
  shipment_status_at_loadout: string
  final_status: string | null
  delivered_cod_amount: string
  notes: string | null
  created_at: string
}

export type DriverManifestCashClosure = {
  id: number
  driver_id: number
  driver_name: string
  driver_manifest_id: number
  manifest_number: string
  date: string
  expected_amount: string
  received_amount: string
  difference_amount: string
  status: string
}

export type DriverManifest = {
  id: number
  manifest_number: string
  manifest_date: string
  status: string
  driver: DriverManifestDriver
  summary: DriverManifestSummary
  notes: string | null
  items: DriverManifestItem[]
  created_by?: number | null
  created_by_name?: string | null
  closed_by?: number | null
  closed_by_name?: string | null
  closed_at?: string | null
  cash_closure?: DriverManifestCashClosure | null
  created_at: string
}

export type PrintableDriverManifest = {
  manifest: {
    manifest_number: string
    date: string
    driver_name: string
    driver_phone: string
    total_shipments: number
    expected_cod_amount: string
    status: string
    notes: string | null
  }
  shipments: Array<{
    shipment_number: string
    order_number: string
    customer_name: string
    customer_phone: string
    delivery_address: string
    cod_amount: string
    shipping_fee: string
    merchant_name: string
    notes: string | null
  }>
  summary: {
    total_cod: string
    total_shipments: number
    delivered_shipments: number
    failed_shipments: number
  }
}

export type GenerateDriverManifestPayload = {
  driver_id: number
  manifest_date: string
  shipment_ids: number[]
  notes?: string | null
}

export type CloseDriverManifestPayload = {
  actual_received_amount: number
  notes?: string | null
}

export type DriverManifestsListResponse = {
  data: DriverManifest[]
}

export type DriverManifestResponse = {
  data: DriverManifest
}

export type PrintableDriverManifestResponse = {
  data: PrintableDriverManifest
}
