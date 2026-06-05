import { apiClient } from '../../../shared/api/axios'
import type {
  BarcodeLookupPayload,
  BarcodeLookupResponse,
  BarcodeProductLookupPayload,
  BarcodeProductLookupResponse,
  BarcodeScanShipmentStatusPayload,
  BarcodeScanShipmentStatusResponse,
} from '../types/barcodes.types'

export async function lookupBarcode(payload: BarcodeLookupPayload) {
  const response = await apiClient.post<BarcodeLookupResponse>('/barcodes/lookup', payload)
  return response.data
}

export async function scanShipmentStatusBarcode(payload: BarcodeScanShipmentStatusPayload) {
  const response = await apiClient.post<BarcodeScanShipmentStatusResponse>(
    '/barcodes/scan/shipment-status',
    payload,
  )
  return response.data
}

export async function lookupProductBarcode(payload: BarcodeProductLookupPayload) {
  const response = await apiClient.post<BarcodeProductLookupResponse>(
    '/barcodes/scan/product-lookup',
    payload,
  )
  return response.data
}
