import { apiClient } from '../../../../shared/api/axios'
import type { LabelDocument, LabelRequestOptions } from '../../../../shared/types/labels.types'
import { requestLabelDocument } from '../../../../shared/api/labels.api'
import { guardMerchantId } from '../../api/merchantPortal.api'
import type {
  MerchantPortalShipmentsFilters,
  MerchantPortalShipmentsListResponse,
  MerchantPortalShipmentResponse,
  MerchantPortalShipmentTrackingResponse
} from '../types/merchantPortalShipments.types'

export async function getMerchantPortalShipments(params?: MerchantPortalShipmentsFilters) {
  guardMerchantId(params)
  const response = await apiClient.get<MerchantPortalShipmentsListResponse>('/merchant-portal/shipments', { params })
  return response.data
}

export async function getMerchantPortalShipment(shipmentId: string | number) {
  const response = await apiClient.get<MerchantPortalShipmentResponse>(`/merchant-portal/shipments/${shipmentId}`)
  return response.data
}

export async function getMerchantPortalShipmentTracking(shipmentId: string | number) {
  const response = await apiClient.get<MerchantPortalShipmentTrackingResponse>(`/merchant-portal/shipments/${shipmentId}/tracking`)
  return response.data
}

export async function getMerchantPortalShipmentLabel(shipmentId: string | number, options: LabelRequestOptions): Promise<LabelDocument> {
  return requestLabelDocument({
    path: `/merchant-portal/shipments/${shipmentId}/label`,
    ...options,
  })
}

export async function getMerchantPortalShipmentWaybill(shipmentId: string | number, options: LabelRequestOptions): Promise<LabelDocument> {
  return requestLabelDocument({
    path: `/merchant-portal/shipments/${shipmentId}/waybill`,
    ...options,
  })
}
