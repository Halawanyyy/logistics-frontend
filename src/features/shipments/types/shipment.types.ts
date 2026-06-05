export type ShipmentHistory = {
  id: number
  shipment_id: number
  status: string
  notes: string | null
  changed_by: number
  changed_by_name: string
  created_at: string
}

export type ShipmentStatus =
  | 'pending_pickup'
  | 'driver_assigned'
  | 'picked_up'
  | 'arrived_at_hub'
  | 'sorting'
  | 'ready_for_dispatch'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivery_attempted'
  | 'rescheduled'
  | 'delivered'
  | 'partially_delivered'
  | 'failed'
  | 'returned'
  | 'returned_to_hub'
  | 'returned_to_warehouse'
  | 'cancelled'

export type ShipmentItemResultStatus = 'delivered' | 'returned' | 'damaged' | 'cancelled'
export type ReturnCondition = 'sellable' | 'damaged' | 'disposed'

export type ShipmentItemResult = {
  id: number
  shipment_id: number
  order_item_id: number
  product_name: string
  result_status: ShipmentItemResultStatus
  quantity: number
  warehouse_product_id?: number | null
  return_condition: ReturnCondition | null
  notes: string | null
  created_at: string
}

export type DeliveryAttempt = {
  id: number
  shipment_id: number
  shipment_number: string
  shipment_status: ShipmentStatus
  driver_id: number | null
  driver_name: string | null
  attempt_number: number
  attempt_date: string
  result: string
  reason: string
  notes: string | null
  next_action: string | null
  next_attempt_date: string | null
  created_by: number
  created_by_name: string
  created_at: string
}

export type Shipment = {
  id: number
  order_id: number
  order_number?: string | null
  shipment_number: string
  merchant_id: number
  merchant_name: string
  customer_name: string
  customer_phone: string
  delivery_governorate_id: number
  delivery_governorate_name: string
  delivery_area_id: number | null
  delivery_area_name: string | null
  delivery_address: string
  cod_amount: string
  shipping_fee: string
  delivered_cod_amount?: string | null
  order_type?: string
  fulfillment_type?: string
  payment_type?: string | null
  payment_type_label?: string | null
  status: ShipmentStatus
  status_label?: string | null
  tracking_notes: string | null
  assigned_driver_id?: number | null
  assigned_driver_name?: string | null
  item_results?: ShipmentItemResult[]
  histories: ShipmentHistory[]
  created_at: string
}

export type ShipmentFilters = {
  status?: ShipmentStatus | string
  order_type?: string
  payment_type?: string
  cod_only?: boolean | '0' | '1' | string
  shipment_number?: string
  partially_delivered?: boolean | '0' | '1' | string
  merchant_id?: number | string
  assigned_driver_id?: number | string
  driver_id?: number | string
  delivery_governorate_id?: number | string
  governorate_id?: number | string
  delivery_area_id?: number | string
  area_id?: number | string
  date_from?: string
  date_to?: string
  search?: string
}

export type ShipmentsListResponse = {
  data: Shipment[]
}

export type ShipmentPrintListFilters = {
  date: string
  assigned_driver_id?: number | string
  merchant_id?: number | string
  delivery_governorate_id?: number | string
  delivery_area_id?: number | string
  delivery_date?: string
  status?: string
}

export type ShipmentPrintListItem = {
  shipment_number: string
  merchant_name: string
  merchant_phone: string | null
  customer_name: string
  customer_phone: string
  delivery_address: string
  delivery_governorate_name: string
  delivery_area_name: string | null
  driver_name: string | null
  cod_amount: string
}

export type ShipmentPrintListResponse = {
  data: {
    generated_at: string
    filters: ShipmentPrintListFilters
    summary: {
      total_shipments: number
      total_cod_amount: string
      total_shipping_fee: string
    }
    shipments: ShipmentPrintListItem[]
  }
}

export type ShipmentResponse = {
  data: Shipment
}

export type UpdateShipmentStatusRequest = {
  status: ShipmentStatus
  notes?: string
}

export type UpdateShipmentStatusResponse = {
  data: Shipment
}

export type AssignShipmentDriverRequest = {
  driver_id: number
}

export type AssignShipmentDriverResponse = {
  data: Shipment
}

export type CompleteDeliveryItemPayload = {
  order_item_id: number
  result_status: ShipmentItemResultStatus
  quantity: number
  warehouse_product_id?: number | null
  return_condition?: ReturnCondition | null
  notes?: string | null
}

export type CompleteDeliveryPayload = {
  shipment_status: 'delivered' | 'partially_delivered' | 'failed'
  notes?: string | null
  items: CompleteDeliveryItemPayload[]
}

export type CompleteDeliveryResponse = {
  data: Shipment
}

export type DeliveryAttemptFilters = {
  shipment_id?: number | string
  driver_id?: number | string
  result?: string
  reason?: string
  date_from?: string
  date_to?: string
}

export type DeliveryAttemptsListResponse = {
  data: DeliveryAttempt[]
}

export type CreateDeliveryAttemptPayload = {
  result: string
  reason: string
  notes?: string | null
  next_action?: string | null
  next_attempt_date?: string | null
}

export type DeliveryAttemptResponse = {
  data: DeliveryAttempt
}
