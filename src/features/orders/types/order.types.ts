import type {
  OrderPackagingItem,
  OrderPackagingItemRequest,
} from '../../company-catalog/types/companyCatalog.types'

export type OrderItem = {
  id: number
  product_name: string
  warehouse_product_id?: number | null
  sku: string | null
  quantity: number
  delivery_status?: DeliveryStatus | null
  delivery_status_label?: string | null
  delivered_quantity?: number
  returned_quantity?: number
  damaged_quantity?: number
  unit_price: string
  weight: string | null
  notes: string | null
  created_at: string
}

export type OrderType = 'delivery' | 'swap' | 'return'
export type PaymentType = 'cod' | 'prepaid'
export type FulfillmentType = 'pickup_from_merchant' | 'from_warehouse' | 'pickup_from_customer'
export type WarehouseFulfillmentStatus =
  | 'not_required'
  | 'pending_reservation'
  | 'reserved'
  | 'picking'
  | 'picked'
  | 'packing'
  | 'packed'
  | 'ready_for_dispatch'
  | 'fulfilled'
  | 'cancelled'
export type DeliveryStatus =
  | 'pending'
  | 'reserved'
  | 'fulfilled'
  | 'partially_delivered'
  | 'delivered'
  | 'returned'
  | 'damaged'
  | 'cancelled'

export type OrderShipmentSummary = {
  id?: number
  shipment_id?: number
  shipment_number: string
  shipment_status?: string
}

export type Order = {
  id: number
  merchant_id: number
  merchant_name: string
  order_number: string
  order_type?: OrderType
  customer_name: string
  customer_phone: string
  customer_phone_alt: string | null
  delivery_governorate_id: number
  delivery_governorate_name: string
  delivery_area_id: number | null
  delivery_area_name: string | null
  delivery_address: string
  delivery_notes: string | null
  pickup_governorate_id: number | null
  pickup_area_id: number | null
  pickup_address: string | null
  pickup_notes: string | null
  cod_amount: string
  shipping_fee: string
  original_order_id?: number | null
  original_order_number?: string | null
  swap_notes?: string | null
  payment_type?: PaymentType
  payment_type_label?: string | null
  pickup_type?: string
  fulfillment_type: FulfillmentType
  fulfillment_type_label?: string | null
  is_fragile: boolean
  allow_inspection: boolean
  requires_packaging: boolean
  package_notes: string | null
  total_packaging_fee?: string | null
  packaging_items?: OrderPackagingItem[]
  source: string
  external_source: string | null
  external_order_id: string | null
  external_order_number: string | null
  requires_review: boolean
  review_reason: string | null
  status: string
  status_label?: string | null
  has_shipment?: boolean
  warehouse_fulfillment_status?: WarehouseFulfillmentStatus | null
  warehouse_fulfillment_status_label?: string | null
  notes: string | null
  items: OrderItem[]
  shipment?: OrderShipmentSummary | null
  shipment_id?: number | null
  shipment_number?: string | null
  stock_reservations?: StockReservation[]
  has_stock_reservations?: boolean
  stock_reservation_status?: string | null
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

export type OrdersListResponse = {
  data: Order[]
}

export type OrderFilters = {
  date_from?: string
  date_to?: string
  merchant_id?: number | string
  status?: string
  order_type?: OrderType | string
  fulfillment_type?: FulfillmentType | string
  payment_type?: PaymentType | string
  delivery_status?: DeliveryStatus | string
  delivery_governorate_id?: number | string
  delivery_area_id?: number | string
  customer_phone?: string
  order_number?: string
  has_shipment?: boolean | '0' | '1' | string
  warehouse_fulfillment_status?: WarehouseFulfillmentStatus | string
  partially_delivered?: boolean | '0' | '1' | string
  merchant_name?: string
  search?: string
}

export type OrderResponse = {
  data: Order
}

export type CreateOrderItemRequest = {
  product_name: string
  sku?: string
  quantity: number
  unit_price: number
  weight?: number
}

export type CreateOrderRequest = {
  merchant_id: number
  order_type: OrderType
  original_order_id?: number | null
  swap_notes?: string | null
  customer_name: string
  customer_phone: string
  customer_phone_alt?: string
  delivery_governorate_id: number
  delivery_area_id?: number
  delivery_address: string
  delivery_notes?: string
  payment_type: PaymentType
  cod_amount: number
  fulfillment_type: FulfillmentType
  is_fragile?: boolean
  allow_inspection: boolean
  requires_packaging?: boolean
  package_notes?: string
  packaging_items?: OrderPackagingItemRequest[]
  notes?: string
  items: CreateOrderItemRequest[]
}

export type UpdateOrderItemRequest = {
  product_name: string
  sku?: string
  quantity: number
  unit_price: number
  weight?: number
}

export type UpdateOrderRequest = {
  order_type?: OrderType
  original_order_id?: number | null
  swap_notes?: string | null
  customer_name?: string
  customer_phone?: string
  customer_phone_alt?: string
  delivery_governorate_id?: number
  delivery_area_id?: number
  delivery_address?: string
  delivery_notes?: string
  payment_type?: PaymentType
  cod_amount?: number
  shipping_fee?: number
  fulfillment_type?: FulfillmentType
  allow_inspection?: boolean
  requires_packaging?: boolean
  package_notes?: string
  packaging_items?: OrderPackagingItemRequest[]
  status?: string
  notes?: string
  items?: UpdateOrderItemRequest[]
}

export type DeleteOrderResponse = {
  message: string
}

export type ReserveStockRequest = {
  warehouse_id: number
  items: {
    order_item_id: number
    warehouse_product_id: number
    quantity: number
  }[]
}

export type StockReservationsResponse = {
  data: StockReservation[]
}
