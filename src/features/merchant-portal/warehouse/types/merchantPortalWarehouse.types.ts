export type MerchantPortalWarehouseProduct = {
  id: number
  name: string
  sku: string
  barcode: string | null
  status: string
  status_label: string
  merchant_summary: {
    id: number
    name: string | null
  }
  inventory_summary: {
    on_hand_quantity: number
    available_quantity: number
    reserved_quantity: number
    damaged_quantity: number
    warehouses_count: number
  }
  low_stock: boolean
  created_at: string
}

export type MerchantPortalWarehouseProductDetail = MerchantPortalWarehouseProduct & {
  category_id?: number | null
  category_name?: string | null
  description?: string | null
  minimum_stock_quantity?: number | null
  low_stock_alert_enabled?: boolean
  requires_batch_tracking?: boolean
  requires_expiry_tracking?: boolean
  weight?: number | null
  dimensions?: {
    length: number | null
    width: number | null
    height: number | null
  }
}

export type MerchantPortalInventoryStock = {
  id: number
  warehouse_summary: {
    id: number
    name: string | null
  } | null
  product_summary: {
    id: number
    name: string | null
    sku: string | null
    barcode: string | null
  } | null
  on_hand_quantity: number
  reserved_quantity: number
  available_quantity: number
  damaged_quantity: number
  low_stock: boolean
  updated_at: string
}

export type MerchantPortalStockMovement = {
  id: number
  movement_type: string
  movement_type_label: string
  quantity: number
  warehouse_summary: {
    id: number
    name: string | null
  } | null
  product_summary: {
    id: number
    name: string | null
    sku: string | null
    barcode: string | null
  } | null
  reference_summary: {
    reference_type: string | null
    reference_id: number | null
    order_id: number | null
    order_number: string | null
    shipment_id: number | null
    shipment_number: string | null
  } | null
  notes: string | null
  created_at: string
}

export type MerchantPortalWarehouseCharge = {
  id: number
  charge_type: string
  amount: string | number
  description: string | null
  status: string
  warehouse_summary: {
    id: number
    name: string | null
  } | null
  related_product: {
    id: number
    name: string | null
  } | null
  related_order: {
    id: number
    order_number: string | null
  } | null
  charge_date: string | null
  created_at: string
}

export type MerchantPortalInboundStockRequest = {
  id: number
  request_number: string
  status: string
  status_label: string
  warehouse_summary: {
    id: number
    name: string | null
  } | null
  items_count: number
  total_requested_quantity: number
  expected_arrival_date: string | null
  submitted_at: string | null
  cancelled_at: string | null
  received_at: string | null
  closed_at: string | null
  created_at: string
}

export type MerchantPortalInboundStockRequestItem = {
  id: number
  inbound_stock_request_id: number
  warehouse_product_id: number | null
  requested_product_name: string | null
  requested_sku: string | null
  quantity: number
  received_quantity: number
  notes: string | null
  product_summary: {
    id: number
    name: string | null
    sku: string | null
    barcode: string | null
  } | null
  status: string
}

export type MerchantPortalInboundStockRequestDetail = MerchantPortalInboundStockRequest & {
  notes: string | null
  items: MerchantPortalInboundStockRequestItem[]
}

export type MerchantPortalInboundStockRequestCreatePayload = {
  warehouse_id?: number | null
  expected_arrival_date?: string | null
  notes?: string | null
  items: Array<{
    warehouse_product_id?: number | null
    requested_product_name?: string | null
    requested_sku?: string | null
    quantity: number
    notes?: string | null
  }>
}

export type MerchantPortalWarehouseProductListResponse = {
  data: MerchantPortalWarehouseProduct[]
  meta?: any
}

export type MerchantPortalWarehouseProductDetailResponse = {
  data: MerchantPortalWarehouseProductDetail
}

export type MerchantPortalInventoryStockListResponse = {
  data: MerchantPortalInventoryStock[]
  meta?: any
}

export type MerchantPortalInventoryStockDetailResponse = {
  data: MerchantPortalInventoryStock
}

export type MerchantPortalStockMovementListResponse = {
  data: MerchantPortalStockMovement[]
  meta?: any
}

export type MerchantPortalWarehouseChargeListResponse = {
  data: MerchantPortalWarehouseCharge[]
  meta?: any
}

export type MerchantPortalInboundStockRequestListResponse = {
  data: MerchantPortalInboundStockRequest[]
  meta?: any
}

export type MerchantPortalInboundStockRequestDetailResponse = {
  data: MerchantPortalInboundStockRequestDetail
}

export type MerchantPortalWarehouseProductFilters = {
  search?: string
  status?: string
}

export type MerchantPortalInventoryStockFilters = {
  search?: string
  warehouse_id?: number | string
}

export type MerchantPortalStockMovementFilters = {
  date_from?: string
  date_to?: string
  warehouse_product_id?: number | string
}

export type MerchantPortalWarehouseChargeFilters = {
  date_from?: string
  date_to?: string
  type?: string
}

export type MerchantPortalInboundStockRequestFilters = {
  status?: string
  date_from?: string
  date_to?: string
}

export type MerchantPortalProductLabelResponse = {
  data: {
    product_id: number
    label_url?: string
    html?: string
    barcode_data?: string
  }
}
