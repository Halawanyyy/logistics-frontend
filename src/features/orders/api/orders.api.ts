import { apiClient } from '../../../shared/api/axios'
import type {
  CreateOrderRequest,
  DeleteOrderResponse,
  OrderFilters,
  OrderResponse,
  OrdersListResponse,
  ReserveStockRequest,
  StockReservationsResponse,
  UpdateOrderRequest,
} from '../types/order.types'

export async function listOrders(params?: OrderFilters) {
  const response = await apiClient.get<OrdersListResponse>('/orders', { params })
  return response.data
}

export async function getOrder(orderId: string | number) {
  const response = await apiClient.get<OrderResponse>(`/orders/${orderId}`)
  return response.data
}

export async function createOrder(payload: CreateOrderRequest) {
  const response = await apiClient.post<OrderResponse>('/orders', payload)
  return response.data
}

export async function confirmOrder(orderId: string | number) {
  const response = await apiClient.post<OrderResponse>(`/orders/${orderId}/confirm`)
  return response.data
}

export async function updateOrder(orderId: string | number, payload: UpdateOrderRequest) {
  const response = await apiClient.put<OrderResponse>(`/orders/${orderId}`, payload)
  return response.data
}

export async function deleteOrder(orderId: string | number) {
  const response = await apiClient.delete<DeleteOrderResponse>(`/orders/${orderId}`)
  return response.data
}

export async function reserveOrderStock(orderId: string | number, payload: ReserveStockRequest) {
  const response = await apiClient.post<OrderResponse>(`/orders/${orderId}/reserve-stock`, payload)
  return response.data
}

export async function releaseOrderStock(orderId: string | number) {
  const response = await apiClient.post<StockReservationsResponse>(`/orders/${orderId}/release-stock`)
  return response.data
}

export async function fulfillOrderFromWarehouse(orderId: string | number) {
  const response = await apiClient.post<StockReservationsResponse>(
    `/orders/${orderId}/fulfill-from-warehouse`,
  )
  return response.data
}

export async function startOrderPicking(orderId: string | number) {
  const response = await apiClient.post<OrderResponse>(`/orders/${orderId}/warehouse/start-picking`)
  return response.data
}

export async function markOrderPicked(orderId: string | number) {
  const response = await apiClient.post<OrderResponse>(`/orders/${orderId}/warehouse/mark-picked`)
  return response.data
}

export async function startOrderPacking(orderId: string | number) {
  const response = await apiClient.post<OrderResponse>(`/orders/${orderId}/warehouse/start-packing`)
  return response.data
}

export async function markOrderPacked(orderId: string | number) {
  const response = await apiClient.post<OrderResponse>(`/orders/${orderId}/warehouse/mark-packed`)
  return response.data
}

export async function readyOrderForDispatch(orderId: string | number) {
  const response = await apiClient.post<OrderResponse>(`/orders/${orderId}/warehouse/ready-for-dispatch`)
  return response.data
}

export async function listOrderStockReservations(orderId: string | number) {
  const response = await apiClient.get<StockReservationsResponse>(
    `/orders/${orderId}/stock-reservations`,
  )
  return response.data
}
