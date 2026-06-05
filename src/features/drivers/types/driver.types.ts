import type { Shipment } from '../../shipments/types/shipment.types'

export type Driver = {
  id: number
  user_id: number | null
  name: string
  phone: string
  national_id: string
  vehicle_type: string
  vehicle_plate: string
  status: string
  status_label?: string | null
  notes: string | null
  created_at: string
}

export type DriverFilters = {
  status?: string
  date?: string
}

export type DriversListResponse = {
  data: Driver[]
}

export type DriverResponse = {
  data: Driver
}

export type CreateDriverRequest = {
  name: string
  phone: string
  national_id: string
  vehicle_type: string
  vehicle_plate: string
  status: string
  notes?: string | null
}

export type UpdateDriverRequest = Partial<CreateDriverRequest>

export type DeleteDriverResponse = {
  message: string
}

export type DriverShipmentsResponse = {
  data: Shipment[]
}

export type DriverManifest = {
  driver: {
    id: number
    name: string
    phone: string
    vehicle_type: string
    vehicle_plate: string
  }
  generated_at: string
  summary: {
    total_shipments: number
    total_cod_shipments: number
    total_prepaid_shipments: number
    total_cod_amount: string
    total_shipping_fee: string
  }
  shipments: {
    shipment_id: number
    shipment_number: string
    status: string
    customer_name: string
    customer_phone: string
    delivery_governorate_name: string
    delivery_area_name: string | null
    delivery_address: string
    cod_amount: string
    shipping_fee: string
    merchant_name: string
    merchant_phone: string
    notes: string | null
  }[]
}

export type DriverManifestResponse = {
  data: DriverManifest
}

export type DriverCashExpectedResponse = {
  data: {
    driver_id: number
    expected_amount: string
  }
}
