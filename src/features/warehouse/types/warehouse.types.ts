export type WarehouseFilters = {
  warehouse_id?: number | string
  merchant_id?: number | string
  source_warehouse_id?: number | string
  destination_warehouse_id?: number | string
  zone_id?: number | string
  shelf_id?: number | string
  warehouse_bin_id?: number | string
  pricing_plan_id?: number | string
  warehouse_product_id?: number | string
  order_id?: number | string
  shipment_id?: number | string
  status?: string
  type?: string
  movement_type?: string
  reference_type?: string
  reference_id?: number | string
  receipt_number?: string
  transfer_number?: string
  condition?: string
  sku?: string
  barcode?: string
  low_stock?: boolean | string
  has_reserved?: boolean | string
  available_only?: boolean | string
  date_from?: string
  date_to?: string
  search?: string
}

export type WarehouseLocationStatus = 'active' | 'inactive'
export type StorageCalculationType = 'per_item_per_month' | 'per_sku_per_month'

export type Warehouse = {
  id: number
  name: string
  code: string
  address: string
  governorate_id: number
  governorate_name: string
  area_id: number | null
  area_name: string | null
  status: string
  notes: string | null
  created_at: string
}

export type WarehouseProduct = {
  id: number
  merchant_id: number
  merchant_name: string
  name: string
  sku: string
  barcode: string | null
  description: string | null
  unit_weight: string | null
  unit_length: string | null
  unit_width: string | null
  unit_height: string | null
  is_fragile: boolean
  requires_packaging: boolean
  status: string
  status_label?: string | null
  minimum_stock_quantity?: number | null
  low_stock_alert_enabled?: boolean
  barcode_type?: string | null
  barcode_generated_at?: string | null
  notes: string | null
  created_at: string
}

export type InventoryStock = {
  id: number
  warehouse_id: number
  warehouse_name: string
  warehouse_product_id: number
  product_name: string
  merchant_id: number
  merchant_name: string
  sku: string
  barcode: string | null
  quantity_available: number
  quantity_reserved: number
  quantity_damaged: number
  created_at: string
  updated_at: string
}

export type StockMovement = {
  id: number
  warehouse_id: number
  warehouse_name: string
  warehouse_product_id: number
  product_name: string
  merchant_id: number
  merchant_name: string
  type: string
  type_label?: string | null
  movement_type?: string | null
  movement_type_label?: string | null
  quantity: number
  before_available: number
  after_available: number
  before_reserved: number
  after_reserved: number
  before_damaged: number
  after_damaged: number
  reference_type: string | null
  reference_id: number | null
  notes: string | null
  created_by: number
  created_by_name: string
  created_at: string
}

export type WarehouseReturn = {
  id: number
  return_number?: string | null
  shipment_id: number | null
  order_id: number | null
  warehouse_id: number
  warehouse_name: string
  merchant_id: number | null
  merchant_name: string | null
  status?: string | null
  status_label?: string | null
  items?: WarehouseReturnItem[]
  warehouse_product_id?: number | null
  product_name?: string | null
  quantity?: number | null
  condition: string
  condition_label?: string | null
  notes: string | null
  created_by: number
  created_by_name: string
  created_at: string
}

export type WarehouseReturnItem = {
  id?: number
  warehouse_product_id?: number | null
  product_name?: string | null
  sku?: string | null
  expected_quantity?: number | null
  received_quantity?: number | null
  restocked_quantity?: number | null
  damaged_quantity?: number | null
  rejected_quantity?: number | null
  condition?: string | null
  condition_label?: string | null
  notes?: string | null
}

export type WarehouseCharge = {
  id: number
  merchant_id: number
  merchant_name: string
  warehouse_id: number
  warehouse_name: string
  order_id: number | null
  shipment_id: number | null
  warehouse_product_id: number | null
  product_name: string | null
  type: string
  description: string
  quantity: string
  unit_price: string
  amount: string
  status: string
  charge_date: string
  notes: string | null
  created_by: number
  created_by_name: string
  created_at: string
}

export type WarehouseReceiptItem = {
  id?: number
  warehouse_product_id: number
  product_name?: string | null
  sku?: string | null
  quantity: number
  accepted_quantity: number
  rejected_quantity: number
  condition?: string | null
  notes?: string | null
}

export type WarehouseReceipt = {
  id: number
  receipt_number?: string | null
  merchant_id: number
  merchant_name?: string | null
  warehouse_id: number
  warehouse_name?: string | null
  status: string
  status_label?: string | null
  notes?: string | null
  items: WarehouseReceiptItem[]
  created_by?: number | null
  created_by_name?: string | null
  confirmed_at?: string | null
  cancelled_at?: string | null
  created_at: string
}

export type WarehouseTransferItem = {
  id?: number
  warehouse_product_id: number
  product_name?: string | null
  sku?: string | null
  quantity: number
  source_available_quantity?: number | null
  destination_available_quantity?: number | null
  notes?: string | null
}

export type WarehouseTransfer = {
  id: number
  transfer_number?: string | null
  source_warehouse_id: number
  source_warehouse_name?: string | null
  destination_warehouse_id: number
  destination_warehouse_name?: string | null
  status: string
  status_label?: string | null
  notes?: string | null
  items: WarehouseTransferItem[]
  created_by?: number | null
  created_by_name?: string | null
  dispatched_at?: string | null
  received_at?: string | null
  created_at: string
}

export type MerchantInboundStockRequest = {
  id: number
  request_number?: string | null
  merchant_id: number
  merchant_name?: string | null
  warehouse_id?: number | null
  warehouse_name?: string | null
  status: string
  status_label?: string | null
  notes?: string | null
  rejection_reason?: string | null
  linked_warehouse_receipt_id?: number | null
  linked_warehouse_receipt_number?: string | null
  items?: Array<{
    id?: number
    warehouse_product_id?: number | null
    product_name?: string | null
    sku?: string | null
    requested_quantity?: number | null
    approved_quantity?: number | null
    received_quantity?: number | null
    notes?: string | null
  }>
  created_at: string
}

export type StockReservation = {
  id: number
  order_id: number
  order_item_id: number
  warehouse_id: number
  warehouse_name: string
  warehouse_product_id: number
  product_name: string
  merchant_id: number
  merchant_name: string
  quantity: number
  status: string
  notes: string | null
  created_by: number
  created_by_name: string
  fulfilled_at: string | null
  released_at: string | null
  created_at: string
}

export type WarehousesListResponse = {
  data: Warehouse[]
}

export type WarehouseResponse = {
  data: Warehouse
}

export type WarehouseProductsListResponse = {
  data: WarehouseProduct[]
}

export type WarehouseProductResponse = {
  data: WarehouseProduct
}

export type InventoryStocksListResponse = {
  data: InventoryStock[]
}

export type InventoryStockResponse = {
  data: InventoryStock
}

export type StockMovementsListResponse = {
  data: StockMovement[]
}

export type StockMovementResponse = {
  data: StockMovement
}

export type WarehouseReturnsListResponse = {
  data: WarehouseReturn[]
}

export type WarehouseReturnResponse = {
  data: WarehouseReturn
}

export type WarehouseChargesListResponse = {
  data: WarehouseCharge[]
}

export type WarehouseChargeResponse = {
  data: WarehouseCharge
}

export type WarehouseReceiptsListResponse = {
  data: WarehouseReceipt[]
}

export type WarehouseReceiptResponse = {
  data: WarehouseReceipt
}

export type WarehouseTransfersListResponse = {
  data: WarehouseTransfer[]
}

export type WarehouseTransferResponse = {
  data: WarehouseTransfer
}

export type MerchantInboundStockRequestsResponse = {
  data: MerchantInboundStockRequest[]
}

export type MerchantInboundStockRequestResponse = {
  data: MerchantInboundStockRequest
}

export type StockReservationsListResponse = {
  data: StockReservation[]
}

export type CreateWarehouseRequest = {
  name: string
  code: string
  address: string
  governorate_id: number
  area_id?: number | null
  status: string
  notes?: string | null
}

export type CreateWarehouseProductRequest = {
  merchant_id: number
  name: string
  sku: string
  barcode?: string | null
  description?: string | null
  unit_weight?: number | null
  is_fragile: boolean
  requires_packaging: boolean
  status: string
}

export type UpdateWarehouseRequest = Partial<CreateWarehouseRequest>

export type UpdateWarehouseProductRequest = Partial<CreateWarehouseProductRequest>

export type AdjustInventoryStockRequest = {
  warehouse_id: number
  warehouse_product_id: number
  type: string
  quantity: number
  notes?: string | null
}

export type CreateWarehouseReturnRequest = {
  shipment_id?: number | null
  order_id?: number | null
  warehouse_id: number
  warehouse_product_id?: number
  quantity?: number
  condition?: string
  items?: Array<{
    warehouse_product_id: number
    expected_quantity: number
    condition: string
    notes?: string | null
  }>
  notes?: string | null
}

export type UpdateWarehouseReturnStatusRequest = {
  status: string
  notes?: string | null
}

export type WarehouseReturnLifecycleRequest = {
  notes?: string | null
}

export type CreateWarehouseChargeRequest = {
  merchant_id: number
  warehouse_id: number
  order_id?: number | null
  shipment_id?: number | null
  warehouse_product_id?: number | null
  type: string
  description: string
  quantity?: number
  unit_price: number
  status: string
  charge_date?: string
  notes?: string | null
}

export type UpdateWarehouseChargeRequest = Partial<CreateWarehouseChargeRequest>

export type CreateWarehouseReceiptRequest = {
  merchant_id: number
  warehouse_id: number
  notes?: string | null
  items: WarehouseReceiptItem[]
}

export type UpdateWarehouseReceiptRequest = CreateWarehouseReceiptRequest

export type CreateWarehouseTransferRequest = {
  source_warehouse_id: number
  destination_warehouse_id: number
  notes?: string | null
  items: WarehouseTransferItem[]
}

export type UpdateWarehouseTransferRequest = CreateWarehouseTransferRequest

export type MerchantInboundRequestActionPayload = {
  notes?: string | null
  rejection_reason?: string | null
  warehouse_receipt_id?: number | null
}

export type DeleteWarehouseResponse = {
  message: string
}

export type WarehouseZone = {
  id: number
  warehouse_id: number
  warehouse_name?: string | null
  barcode?: string | null
  name: string
  code: string
  status: string
  status_label?: string | null
  notes?: string | null
  created_at: string
  updated_at?: string | null
}

export type WarehouseShelf = {
  id: number
  warehouse_id: number
  warehouse_name?: string | null
  warehouse_zone_id?: number | null
  zone_id?: number | null
  zone_name?: string | null
  barcode?: string | null
  name: string
  code: string
  status: string
  status_label?: string | null
  notes?: string | null
  created_at: string
  updated_at?: string | null
}

export type WarehouseBin = {
  id: number
  warehouse_id: number
  warehouse_name?: string | null
  warehouse_zone_id?: number | null
  zone_id?: number | null
  zone_name?: string | null
  warehouse_shelf_id?: number | null
  shelf_id?: number | null
  shelf_name?: string | null
  name: string
  code: string
  barcode?: string | null
  status: string
  status_label?: string | null
  notes?: string | null
  created_at: string
  updated_at?: string | null
}

export type PickingListItem = {
  id?: number
  order_id?: number | null
  order_number?: string | null
  product_name?: string | null
  warehouse_product_name?: string | null
  warehouse_product_barcode?: string | null
  bin_name?: string | null
  bin_code?: string | null
  bin_barcode?: string | null
  quantity_required?: number | null
  quantity_picked?: number | null
  status?: string | null
}

export type PickingList = {
  id: number
  picking_number?: string | null
  picking_list_number?: string | null
  warehouse_id?: number | null
  warehouse_name?: string | null
  assigned_to?: number | null
  assigned_to_name?: string | null
  created_by?: number | null
  created_by_name?: string | null
  status?: string | null
  notes?: string | null
  total_orders?: number | null
  total_items?: number | null
  picked_items?: number | null
  picked_at?: string | null
  created_at: string
  items?: PickingListItem[]
}

export type PackingTask = {
  id: number
  packing_number?: string | null
  packing_task_number?: string | null
  picking_list_id?: number | null
  picking_number_ref?: string | null
  order_id?: number | null
  order_number?: string | null
  shipment_id?: number | null
  shipment_number?: string | null
  merchant_name?: string | null
  status?: string | null
  package_weight?: string | number | null
  package_length?: string | number | null
  package_width?: string | number | null
  package_height?: string | number | null
  packaging_fee?: string | number | null
  notes?: string | null
  packed_by?: number | null
  packed_by_name?: string | null
  packed_at?: string | null
  created_at: string
}

export type StorageFeeRule = {
  id: number
  name: string
  merchant_id?: number | null
  merchant_name?: string | null
  pricing_plan_id?: number | null
  pricing_plan_name?: string | null
  calculation_type?: StorageCalculationType | null
  unit_price?: string | null
  fee_type?: string | null
  billing_period?: string | null
  rate?: string | null
  free_units?: number | null
  status: string
  notes?: string | null
  created_at: string
}

export type PickPackFeeRule = {
  id: number
  name: string
  merchant_id?: number | null
  merchant_name?: string | null
  pricing_plan_id?: number | null
  pricing_plan_name?: string | null
  pick_fee_first_item?: string | null
  pick_fee_additional_item?: string | null
  first_item_fee?: string | null
  additional_item_fee?: string | null
  packing_fee_base?: string | null
  fragile_extra_fee?: string | null
  status: string
  notes?: string | null
  created_at: string
}

export type WarehouseKpis = {
  inventory: {
    total_available: number
    total_reserved: number
    total_damaged: number
    total_skus: number
  }
  operations: {
    picking_lists_total: number
    picking_lists_completed: number
    packing_tasks_total: number
    packing_tasks_packed: number
  }
  returns: {
    total_returns: number
    sellable_returns: number
    damaged_returns: number
    disposed_returns: number
  }
  billing: {
    storage_charges: string
    packaging_charges: string
    fulfillment_charges: string
  }
}

export type WarehouseZonesListResponse = {
  data: WarehouseZone[]
}

export type WarehouseZoneResponse = {
  data: WarehouseZone
}

export type CreateWarehouseZoneRequest = {
  warehouse_id: number
  name: string
  code: string
  status?: WarehouseLocationStatus
  notes?: string | null
}

export type WarehouseShelvesListResponse = {
  data: WarehouseShelf[]
}

export type WarehouseShelfResponse = {
  data: WarehouseShelf
}

export type CreateWarehouseShelfRequest = {
  warehouse_id: number
  warehouse_zone_id?: number | null
  name: string
  code: string
  status?: WarehouseLocationStatus
  notes?: string | null
}

export type WarehouseBinsListResponse = {
  data: WarehouseBin[]
}

export type WarehouseBinResponse = {
  data: WarehouseBin
}

export type CreateWarehouseBinRequest = {
  warehouse_id: number
  warehouse_zone_id?: number | null
  warehouse_shelf_id?: number | null
  name: string
  code: string
  barcode?: string | null
  status?: WarehouseLocationStatus
  notes?: string | null
}

export type UpdateWarehouseBinRequest = Partial<CreateWarehouseBinRequest>

export type PickingListsListResponse = {
  data: PickingList[]
}

export type PickingListResponse = {
  data: PickingList
}

export type GeneratePickingListRequest = {
  warehouse_id: number
  order_ids: number[]
  assigned_to?: number | null
  notes?: string | null
}

export type ScanPickingListRequest = {
  barcode: string
  quantity: number
}

export type PackingTasksListResponse = {
  data: PackingTask[]
}

export type PackingTaskResponse = {
  data: PackingTask
}

export type GeneratePackingTaskRequest = {
  picking_list_id: number
}

export type CompletePackingTaskRequest = {
  package_weight?: number | null
  package_length?: number | null
  package_width?: number | null
  package_height?: number | null
  packaging_fee?: number | null
  notes?: string | null
}

export type StorageFeeRulesListResponse = {
  data: StorageFeeRule[]
}

export type StorageFeeRuleResponse = {
  data: StorageFeeRule
}

export type CreateStorageFeeRuleRequest = {
  name: string
  merchant_id?: number | null
  pricing_plan_id?: number | null
  calculation_type: StorageCalculationType
  free_units?: number | null
  unit_price?: number | null
  status?: WarehouseLocationStatus
  notes?: string | null
}

export type GenerateStorageFeesRequest = {
  merchant_id: number
  period_start: string
  period_end: string
}

export type PickPackFeeRulesListResponse = {
  data: PickPackFeeRule[]
}

export type PickPackFeeRuleResponse = {
  data: PickPackFeeRule
}

export type CreatePickPackFeeRuleRequest = {
  name: string
  merchant_id?: number | null
  pricing_plan_id?: number | null
  pick_fee_first_item?: number | null
  pick_fee_additional_item?: number | null
  packing_fee_base?: number | null
  fragile_extra_fee?: number | null
  status?: WarehouseLocationStatus
  notes?: string | null
}

export type GeneratePickPackFeesRequest = {
  order_id: number
}

export type WarehouseKpisResponse = {
  data: WarehouseKpis
}

export type WarehouseActionResponse = {
  data?: Record<string, unknown>
  message?: string
}
