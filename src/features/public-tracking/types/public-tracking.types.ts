export type PublicTrackingHistory = {
  status: string
  notes: string | null
  created_at: string
}

export type PublicTrackingShipment = {
  shipment_number: string
  status: string
  customer_name: string
  delivery_governorate_name: string
  delivery_area_name: string | null
  delivery_address: string
  histories: PublicTrackingHistory[]
}

export type PublicTrackingResponse = {
  data: PublicTrackingShipment
}
