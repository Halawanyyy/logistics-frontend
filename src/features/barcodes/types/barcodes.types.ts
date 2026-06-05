export type BarcodeLookupEntityType = 'order' | 'shipment' | 'warehouse_product' | 'bin' | string

export type BarcodeLookupPayload = {
  barcode: string
}

export type BarcodeLookupResult = {
  type: BarcodeLookupEntityType
  id: number
  barcode: string
  data: Record<string, unknown>
}

export type BarcodeLookupResponse = {
  data: BarcodeLookupResult
}

export type BarcodeScanShipmentStatusPayload = {
  barcode: string
  status: string
  notes?: string | null
}

export type BarcodeScanShipmentStatusResponse = {
  data: Record<string, unknown>
}

export type BarcodeProductLookupPayload = {
  barcode: string
}

export type BarcodeProductLookupResponse = {
  data: Record<string, unknown>
}
