import { apiClient } from '../../../shared/api/axios'
import type {
  AssignShipmentDriverRequest,
  AssignShipmentDriverResponse,
  CompleteDeliveryPayload,
  CompleteDeliveryResponse,
  CreateDeliveryAttemptPayload,
  DeliveryAttemptFilters,
  DeliveryAttemptResponse,
  DeliveryAttemptsListResponse,
  ShipmentFilters,
  ShipmentPrintListFilters,
  ShipmentPrintListResponse,
  ShipmentResponse,
  ShipmentsListResponse,
  UpdateShipmentStatusRequest,
  UpdateShipmentStatusResponse,
} from '../types/shipment.types'

export async function listShipments(params?: ShipmentFilters) {
  const response = await apiClient.get<ShipmentsListResponse>('/shipments', { params })
  return response.data
}

export async function getShipment(shipmentId: string | number) {
  const response = await apiClient.get<ShipmentResponse>(`/shipments/${shipmentId}`)
  return response.data
}

export async function getShipmentsPrintList(params: ShipmentPrintListFilters) {
  const response = await apiClient.get<ShipmentPrintListResponse>('/shipments/print-list', {
    params,
  })
  return response.data
}

export async function createShipmentFromOrder(orderId: string | number) {
  const response = await apiClient.post<ShipmentResponse>(`/orders/${orderId}/shipments`)
  return response.data
}

export async function updateShipmentStatus(
  shipmentId: string | number,
  payload: UpdateShipmentStatusRequest,
) {
  const response = await apiClient.patch<UpdateShipmentStatusResponse>(
    `/shipments/${shipmentId}/status`,
    payload,
  )
  return response.data
}

export async function assignShipmentDriver(
  shipmentId: string | number,
  payload: AssignShipmentDriverRequest,
) {
  const response = await apiClient.post<AssignShipmentDriverResponse>(
    `/shipments/${shipmentId}/assign-driver`,
    payload,
  )
  return response.data
}

export async function completeShipmentDelivery(
  shipmentId: string | number,
  payload: CompleteDeliveryPayload,
) {
  const response = await apiClient.post<CompleteDeliveryResponse>(
    `/shipments/${shipmentId}/complete-delivery`,
    payload,
  )
  return response.data
}

export async function listDeliveryAttempts(params?: DeliveryAttemptFilters) {
  const response = await apiClient.get<DeliveryAttemptsListResponse>('/delivery-attempts', {
    params,
  })
  return response.data
}

export async function createShipmentDeliveryAttempt(
  shipmentId: string | number,
  payload: CreateDeliveryAttemptPayload,
) {
  const response = await apiClient.post<DeliveryAttemptResponse>(
    `/shipments/${shipmentId}/delivery-attempt`,
    payload,
  )
  return response.data
}
