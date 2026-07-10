import type {
  FulfillmentType,
  OrderType,
  PaymentType,
  WarehouseFulfillmentStatus,
} from '../../../orders/types/order.types'

export type MerchantPortalOrderPackagingItem = {
  id: number
  company_catalog_item_id: number
  item_name: string
  item_sku?: string | null
  category?: string | null
  size_label?: string | null
  unit_price: string
  quantity: number
  total_price: string
  notes?: string | null
}

export type MerchantPortalOrderItem = {
  id: number
  product_name: string
  sku?: string | null
  quantity: number
  unit_price: string
  weight?: string | null
  notes?: string | null
}

export type MerchantPortalOrderShipmentSummary = {
  id?: number
  shipment_id?: number
  shipment_number?: string | null
  shipment_status?: string | null
}

export type MerchantPortalOrderCustomer = {
  name?: string | null
  phone?: string | null
  phone_alt?: string | null
  customer_name?: string | null
  customer_phone?: string | null
  alternative_phone?: string | null
  alternate_phone?: string | null
}

export type MerchantPortalOrderLocationOption = {
  id?: number | string | null
  name?: string | null
  name_ar?: string | null
}

export type MerchantPortalOrderDelivery = {
  governorate_id?: number | string | null
  governorate_name?: string | null
  area_id?: number | string | null
  area_name?: string | null
  address?: string | null
  notes?: string | null
}

export type MerchantPortalOrderPaymentSummary = {
  payment_type?: PaymentType | string | null
  payment_type_label?: string | null
  cod_amount?: string | number | null
  shipping_fee?: string | number | null
  total_packaging_fee?: string | number | null
  total_amount?: string | number | null
  payment_status?: string | null
}

export type MerchantPortalOrderPayment = {
  type?: PaymentType | string | null
  method?: PaymentType | string | null
  cod_amount?: string | number | null
  payment_status?: string | null
}

export type MerchantPortalOrderAmounts = {
  cod_amount?: string | number | null
  shipping_fee?: string | number | null
  delivery_fee?: string | number | null
  total_amount?: string | number | null
}

export type MerchantPortalOrderWarehouseSummary = {
  fulfillment_type?: FulfillmentType | string | null
  fulfillment_type_label?: string | null
  warehouse_fulfillment_status?: WarehouseFulfillmentStatus | string | null
  warehouse_fulfillment_status_label?: string | null
  has_stock_reservations?: boolean | null
  latest_stock_reservation_status?: string | null
}

export type MerchantPortalOrder = {
  id: number
  order_number: string
  order_type?: OrderType | null
  customer_name: string
  customer_phone: string
  customer_phone_alt?: string | null
  delivery_governorate_id?: number | null
  delivery_governorate_name?: string | null
  delivery_area_id?: number | null
  delivery_area_name?: string | null
  delivery_address: string
  delivery_notes?: string | null
  payment_type?: PaymentType | null
  payment_type_label?: string | null
  cod_amount?: string | number | null
  shipping_fee?: string | number | null
  total_amount?: string | number | null
  fulfillment_type: FulfillmentType
  fulfillment_type_label?: string | null
  is_fragile?: boolean
  allow_inspection?: boolean
  requires_packaging?: boolean
  package_notes?: string | null
  total_packaging_fee?: string | number | null
  packaging_items?: MerchantPortalOrderPackagingItem[]
  status: string
  status_label?: string | null
  notes?: string | null
  has_shipment?: boolean
  warehouse_fulfillment_status?: WarehouseFulfillmentStatus | null
  warehouse_fulfillment_status_label?: string | null
  shipment?: MerchantPortalOrderShipmentSummary | null
  shipment_id?: number | null
  shipment_number?: string | null
  customer?: MerchantPortalOrderCustomer | null
  delivery?: MerchantPortalOrderDelivery | null
  payment_summary?: MerchantPortalOrderPaymentSummary | null
  payment?: MerchantPortalOrderPayment | null
  payment_method?: PaymentType | string | null
  delivery_fee?: string | number | null
  amounts?: MerchantPortalOrderAmounts | null
  payment_status?: string | null
  warehouse_summary?: MerchantPortalOrderWarehouseSummary | null
  delivery_governorate?: MerchantPortalOrderLocationOption | null
  delivery_area?: MerchantPortalOrderLocationOption | null
  customer_alt_phone?: string | null
  governorate_name?: string | null
  area_name?: string | null
  address?: string | null
  items: MerchantPortalOrderItem[]
  created_at: string
  updated_at?: string
  [key: string]: unknown
}

export type MerchantPortalOrderFilters = {
  date_from?: string
  date_to?: string
  status?: string
  fulfillment_type?: FulfillmentType | string
  payment_type?: PaymentType | string
  order_type?: OrderType | string
  customer_phone?: string
  order_number?: string
  search?: string
  has_shipment?: boolean | '0' | '1' | string
  warehouse_fulfillment_status?: WarehouseFulfillmentStatus | string
  delivery_governorate_id?: number | string
  delivery_area_id?: number | string
}

export type MerchantPortalOrderListResponse = {
  data: MerchantPortalOrder[]
}

export type MerchantPortalOrderResponse = {
  data: MerchantPortalOrder
}

export type MerchantPortalOrderItemInput = {
  product_name: string
  sku?: string
  quantity: number
  unit_price: number
  weight?: number
  notes?: string
}

export type MerchantPortalCreateOrderPayload = {
  order_type: OrderType
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
  notes?: string
  items: MerchantPortalOrderItemInput[]
}

export type MerchantPortalUpdateOrderPayload = Partial<
  Omit<MerchantPortalCreateOrderPayload, 'items'>
> & {
  items?: MerchantPortalOrderItemInput[]
}
