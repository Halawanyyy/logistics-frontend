import type { ShipmentStatus } from '../../../shipments/types/shipment.types'

export type MerchantPortalShipmentTrackingEvent = {
  id: number
  shipment_id: number
  status: ShipmentStatus
  status_label?: string | null
  notes: string | null
  created_at: string
}

export type MerchantPortalShipment = {
  id: number
  order_id: number
  order_number?: string | null
  shipment_number: string
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
  payment_type?: string | null
  payment_type_label?: string | null
  status: ShipmentStatus
  status_label?: string | null
  tracking_notes: string | null
  assigned_driver_name?: string | null
  histories?: MerchantPortalShipmentTrackingEvent[]
  created_at: string
}

export type MerchantPortalShipmentsFilters = {
  status?: ShipmentStatus | string
  search?: string
  date_from?: string
  date_to?: string
  tracking_number?: string
  order_number?: string
  customer_phone?: string
  delivery_governorate_id?: number | string
  delivery_area_id?: number | string
  page?: number
}

export type MerchantPortalShipmentsListResponse = {
  data: MerchantPortalShipment[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export type MerchantPortalShipmentResponse = {
  data: MerchantPortalShipment
}

export type MerchantPortalShipmentTrackingResponse = {
  data: MerchantPortalShipmentTrackingEvent[]
}
