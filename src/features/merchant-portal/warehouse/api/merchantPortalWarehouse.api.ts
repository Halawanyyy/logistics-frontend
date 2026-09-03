import { apiClient } from '../../../../shared/api/axios'
import type {
  MerchantPortalWarehouseProductListResponse,
  MerchantPortalWarehouseProductDetailResponse,
  MerchantPortalWarehouseProductFilters,
  MerchantPortalInventoryStockListResponse,
  MerchantPortalInventoryStockDetailResponse,
  MerchantPortalInventoryStockFilters,
  MerchantPortalStockMovementListResponse,
  MerchantPortalStockMovementFilters,
  MerchantPortalWarehouseChargeListResponse,
  MerchantPortalWarehouseChargeFilters,
  MerchantPortalInboundStockRequestListResponse,
  MerchantPortalInboundStockRequestDetailResponse,
  MerchantPortalInboundStockRequestCreatePayload,
  MerchantPortalInboundStockRequestFilters,
  MerchantPortalProductLabelResponse,
} from '../types/merchantPortalWarehouse.types'

// Prevent merchant_id from being sent in filters or payloads
function guardMerchantId<T extends Record<string, any>>(params: T): Omit<T, 'merchant_id'> {
  const { merchant_id, ...rest } = params
  return rest
}

// -----------------------------------------------------------------------------
// Warehouse Products
// -----------------------------------------------------------------------------
export async function listMerchantPortalWarehouseProducts(
  page = 1,
  filters: MerchantPortalWarehouseProductFilters = {},
) {
  const params = guardMerchantId(filters)
  const response = await apiClient.get<MerchantPortalWarehouseProductListResponse>(
    '/merchant-portal/warehouse/products',
    { params: { page, ...params } }
  )
  return response.data
}

export async function getMerchantPortalWarehouseProduct(id: number | string) {
  const response = await apiClient.get<MerchantPortalWarehouseProductDetailResponse>(
    `/merchant-portal/warehouse/products/${id}`
  )
  return response.data
}

export async function getMerchantPortalWarehouseProductLabel(id: number | string) {
  const response = await apiClient.get<MerchantPortalProductLabelResponse>(
    `/merchant-portal/warehouse/products/${id}/label`
  )
  return response.data
}

export async function bulkPrintMerchantPortalWarehouseProductLabels(
  items: Array<{ warehouse_product_id: number; quantity: number }>,
  format: 'html' | 'pdf' | 'zpl' | 'tspl' = 'html',
) {
  const response = await apiClient.post<any>(
    '/merchant-portal/warehouse/products/labels/bulk',
    { items, format }
  )
  return response.data
}

// -----------------------------------------------------------------------------
// Inventory Stocks
// -----------------------------------------------------------------------------
export async function listMerchantPortalInventory(
  page = 1,
  filters: MerchantPortalInventoryStockFilters = {},
) {
  const params = guardMerchantId(filters)
  const response = await apiClient.get<MerchantPortalInventoryStockListResponse>(
    '/merchant-portal/warehouse/inventory',
    { params: { page, ...params } }
  )
  return response.data
}

export async function listMerchantPortalLowStock(
  page = 1,
  filters: MerchantPortalInventoryStockFilters = {},
) {
  const params = guardMerchantId(filters)
  const response = await apiClient.get<MerchantPortalInventoryStockListResponse>(
    '/merchant-portal/warehouse/inventory/low-stock',
    { params: { page, ...params } }
  )
  return response.data
}

export async function getMerchantPortalInventoryStock(id: number | string) {
  const response = await apiClient.get<MerchantPortalInventoryStockDetailResponse>(
    `/merchant-portal/warehouse/inventory/${id}`
  )
  return response.data
}

// -----------------------------------------------------------------------------
// Stock Movements
// -----------------------------------------------------------------------------
export async function listMerchantPortalStockMovements(
  page = 1,
  filters: MerchantPortalStockMovementFilters = {},
) {
  const params = guardMerchantId(filters)
  const response = await apiClient.get<MerchantPortalStockMovementListResponse>(
    '/merchant-portal/warehouse/movements',
    { params: { page, ...params } }
  )
  return response.data
}

// -----------------------------------------------------------------------------
// Warehouse Charges
// -----------------------------------------------------------------------------
export async function listMerchantPortalWarehouseCharges(
  page = 1,
  filters: MerchantPortalWarehouseChargeFilters = {},
) {
  const params = guardMerchantId(filters)
  const response = await apiClient.get<MerchantPortalWarehouseChargeListResponse>(
    '/merchant-portal/warehouse/charges',
    { params: { page, ...params } }
  )
  return response.data
}

// -----------------------------------------------------------------------------
// Inbound Requests
// -----------------------------------------------------------------------------
export async function listMerchantPortalInboundRequests(
  page = 1,
  filters: MerchantPortalInboundStockRequestFilters = {},
) {
  const params = guardMerchantId(filters)
  const response = await apiClient.get<MerchantPortalInboundStockRequestListResponse>(
    '/merchant-portal/warehouse/inbound-requests',
    { params: { page, ...params } }
  )
  return response.data
}

export async function createMerchantPortalInboundRequest(
  payload: MerchantPortalInboundStockRequestCreatePayload,
) {
  const safePayload = guardMerchantId(payload)
  const response = await apiClient.post<MerchantPortalInboundStockRequestDetailResponse>(
    '/merchant-portal/warehouse/inbound-requests',
    safePayload
  )
  return response.data
}

export async function getMerchantPortalInboundRequest(id: number | string) {
  const response = await apiClient.get<MerchantPortalInboundStockRequestDetailResponse>(
    `/merchant-portal/warehouse/inbound-requests/${id}`
  )
  return response.data
}

export async function cancelMerchantPortalInboundRequest(id: number | string) {
  const response = await apiClient.post<MerchantPortalInboundStockRequestDetailResponse>(
    `/merchant-portal/warehouse/inbound-requests/${id}/cancel`
  )
  return response.data
}
