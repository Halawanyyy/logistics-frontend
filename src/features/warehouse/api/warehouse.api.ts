import { apiClient } from '../../../shared/api/axios'
import type {
  AdjustInventoryStockRequest,
  CompletePackingTaskRequest,
  CreatePickPackFeeRuleRequest,
  CreateStorageFeeRuleRequest,
  CreateWarehouseChargeRequest,
  CreateWarehouseBinRequest,
  CreateWarehouseProductRequest,
  CreateWarehouseReceiptRequest,
  CreateWarehouseRequest,
  CreateWarehouseReturnRequest,
  CreateWarehouseShelfRequest,
  CreateWarehouseTransferRequest,
  CreateWarehouseZoneRequest,
  DeleteWarehouseResponse,
  GeneratePackingTaskRequest,
  GeneratePickPackFeesRequest,
  GeneratePickingListRequest,
  GenerateStorageFeesRequest,
  InventoryStockResponse,
  InventoryStocksListResponse,
  MerchantInboundRequestActionPayload,
  MerchantInboundStockRequestResponse,
  MerchantInboundStockRequestsResponse,
  PackingTasksListResponse,
  PickPackFeeRuleResponse,
  PickPackFeeRulesListResponse,
  PickingListResponse,
  PickingListsListResponse,
  PackingTaskResponse,
  ScanPickingListRequest,
  StorageFeeRuleResponse,
  StorageFeeRulesListResponse,
  StockMovementsListResponse,
  StockMovementResponse,
  StockReservationsListResponse,
  UpdateWarehouseChargeRequest,
  UpdateWarehouseBinRequest,
  UpdateWarehouseProductRequest,
  UpdateWarehouseReceiptRequest,
  UpdateWarehouseRequest,
  UpdateWarehouseReturnStatusRequest,
  UpdateWarehouseTransferRequest,
  WarehouseBinResponse,
  WarehouseBinsListResponse,
  WarehouseChargeResponse,
  WarehouseChargesListResponse,
  WarehouseActionResponse,
  WarehouseFilters,
  WarehouseKpisResponse,
  WarehouseProductResponse,
  WarehouseProductsListResponse,
  WarehouseReceiptResponse,
  WarehouseReceiptsListResponse,
  WarehouseResponse,
  WarehouseReturnLifecycleRequest,
  WarehouseReturnResponse,
  WarehouseReturnsListResponse,
  WarehouseShelfResponse,
  WarehouseShelvesListResponse,
  WarehouseTransferResponse,
  WarehouseTransfersListResponse,
  WarehouseZoneResponse,
  WarehouseZonesListResponse,
  WarehousesListResponse,
} from '../types/warehouse.types'

export async function listWarehouses() {
  const response = await apiClient.get<WarehousesListResponse>('/warehouses')
  return response.data
}

export async function createWarehouse(payload: CreateWarehouseRequest) {
  const response = await apiClient.post<WarehouseResponse>('/warehouses', payload)
  return response.data
}

export async function getWarehouse(warehouseId: string | number) {
  const response = await apiClient.get<WarehouseResponse>(`/warehouses/${warehouseId}`)
  return response.data
}

export async function updateWarehouse(warehouseId: string | number, payload: UpdateWarehouseRequest) {
  const response = await apiClient.put<WarehouseResponse>(`/warehouses/${warehouseId}`, payload)
  return response.data
}

export async function deleteWarehouse(warehouseId: string | number) {
  const response = await apiClient.delete<DeleteWarehouseResponse>(`/warehouses/${warehouseId}`)
  return response.data
}

export async function listWarehouseProducts(params?: WarehouseFilters) {
  const response = await apiClient.get<WarehouseProductsListResponse>('/warehouse-products', {
    params,
  })
  return response.data
}

export async function listLowStockWarehouseProducts(params?: WarehouseFilters) {
  const response = await apiClient.get<WarehouseProductsListResponse>('/warehouse-products/low-stock', {
    params,
  })
  return response.data
}

export async function createWarehouseProduct(payload: CreateWarehouseProductRequest) {
  const response = await apiClient.post<WarehouseProductResponse>('/warehouse-products', payload)
  return response.data
}

export async function getWarehouseProduct(warehouseProductId: string | number) {
  const response = await apiClient.get<WarehouseProductResponse>(
    `/warehouse-products/${warehouseProductId}`,
  )
  return response.data
}

export async function updateWarehouseProduct(
  warehouseProductId: string | number,
  payload: UpdateWarehouseProductRequest,
) {
  const response = await apiClient.put<WarehouseProductResponse>(
    `/warehouse-products/${warehouseProductId}`,
    payload,
  )
  return response.data
}

export async function deleteWarehouseProduct(warehouseProductId: string | number) {
  const response = await apiClient.delete<DeleteWarehouseResponse>(
    `/warehouse-products/${warehouseProductId}`,
  )
  return response.data
}

export async function listInventoryStocks(params?: WarehouseFilters) {
  const response = await apiClient.get<InventoryStocksListResponse>('/inventory-stocks', { params })
  return response.data
}

export async function listLowStockInventoryStocks(params?: WarehouseFilters) {
  const response = await apiClient.get<InventoryStocksListResponse>('/inventory-stocks/low-stock', {
    params,
  })
  return response.data
}

export async function adjustInventoryStock(payload: AdjustInventoryStockRequest) {
  const response = await apiClient.post<InventoryStockResponse>('/inventory-stocks/adjust', payload)
  return response.data
}

export async function getInventoryStock(inventoryStockId: string | number) {
  const response = await apiClient.get<InventoryStockResponse>(
    `/inventory-stocks/${inventoryStockId}`,
  )
  return response.data
}

export async function listStockMovements(params?: WarehouseFilters) {
  const response = await apiClient.get<StockMovementsListResponse>('/stock-movements', { params })
  return response.data
}

export async function getStockMovement(stockMovementId: string | number) {
  const response = await apiClient.get<StockMovementResponse>(`/stock-movements/${stockMovementId}`)
  return response.data
}

export async function listMerchantWarehouseInventory(merchantId: string | number) {
  const response = await apiClient.get<InventoryStocksListResponse>(
    `/merchants/${merchantId}/warehouse/inventory`,
  )
  return response.data
}

export async function listMerchantWarehouseMovements(merchantId: string | number) {
  const response = await apiClient.get<StockMovementsListResponse>(
    `/merchants/${merchantId}/warehouse/movements`,
  )
  return response.data
}

export async function createWarehouseReturn(payload: CreateWarehouseReturnRequest) {
  const response = await apiClient.post<WarehouseReturnResponse>('/warehouse-returns', payload)
  return response.data
}

export async function listWarehouseReturns(params?: WarehouseFilters) {
  const response = await apiClient.get<WarehouseReturnsListResponse>('/warehouse-returns', {
    params,
  })
  return response.data
}

export async function getWarehouseReturn(warehouseReturnId: string | number) {
  const response = await apiClient.get<WarehouseReturnResponse>(
    `/warehouse-returns/${warehouseReturnId}`,
  )
  return response.data
}

export async function updateWarehouseReturnStatus(
  warehouseReturnId: string | number,
  payload: UpdateWarehouseReturnStatusRequest,
) {
  const response = await apiClient.patch<WarehouseReturnResponse>(
    `/warehouse-returns/${warehouseReturnId}/status`,
    payload,
  )
  return response.data
}

export async function receiveWarehouseReturn(
  warehouseReturnId: string | number,
  payload?: WarehouseReturnLifecycleRequest,
) {
  const response = await apiClient.post<WarehouseReturnResponse>(
    `/warehouse-returns/${warehouseReturnId}/receive`,
    payload,
  )
  return response.data
}

export async function inspectWarehouseReturn(
  warehouseReturnId: string | number,
  payload?: WarehouseReturnLifecycleRequest,
) {
  const response = await apiClient.post<WarehouseReturnResponse>(
    `/warehouse-returns/${warehouseReturnId}/inspect`,
    payload,
  )
  return response.data
}

export async function restockWarehouseReturn(
  warehouseReturnId: string | number,
  payload?: WarehouseReturnLifecycleRequest,
) {
  const response = await apiClient.post<WarehouseReturnResponse>(
    `/warehouse-returns/${warehouseReturnId}/restock`,
    payload,
  )
  return response.data
}

export async function markWarehouseReturnDamaged(
  warehouseReturnId: string | number,
  payload?: WarehouseReturnLifecycleRequest,
) {
  const response = await apiClient.post<WarehouseReturnResponse>(
    `/warehouse-returns/${warehouseReturnId}/mark-damaged`,
    payload,
  )
  return response.data
}

export async function rejectWarehouseReturn(
  warehouseReturnId: string | number,
  payload?: WarehouseReturnLifecycleRequest,
) {
  const response = await apiClient.post<WarehouseReturnResponse>(
    `/warehouse-returns/${warehouseReturnId}/reject`,
    payload,
  )
  return response.data
}

export async function closeWarehouseReturn(
  warehouseReturnId: string | number,
  payload?: WarehouseReturnLifecycleRequest,
) {
  const response = await apiClient.post<WarehouseReturnResponse>(
    `/warehouse-returns/${warehouseReturnId}/close`,
    payload,
  )
  return response.data
}

export async function listWarehouseCharges(params?: WarehouseFilters) {
  const response = await apiClient.get<WarehouseChargesListResponse>('/warehouse-charges', {
    params,
  })
  return response.data
}

export async function createWarehouseCharge(payload: CreateWarehouseChargeRequest) {
  const response = await apiClient.post<WarehouseChargeResponse>('/warehouse-charges', payload)
  return response.data
}

export async function getWarehouseCharge(warehouseChargeId: string | number) {
  const response = await apiClient.get<WarehouseChargeResponse>(
    `/warehouse-charges/${warehouseChargeId}`,
  )
  return response.data
}

export async function updateWarehouseCharge(
  warehouseChargeId: string | number,
  payload: UpdateWarehouseChargeRequest,
) {
  const response = await apiClient.put<WarehouseChargeResponse>(
    `/warehouse-charges/${warehouseChargeId}`,
    payload,
  )
  return response.data
}

export async function deleteWarehouseCharge(warehouseChargeId: string | number) {
  const response = await apiClient.delete<DeleteWarehouseResponse>(
    `/warehouse-charges/${warehouseChargeId}`,
  )
  return response.data
}

export async function listMerchantWarehouseCharges(
  merchantId: string | number,
  params?: WarehouseFilters,
) {
  const response = await apiClient.get<WarehouseChargesListResponse>(
    `/merchants/${merchantId}/warehouse/charges`,
    { params },
  )
  return response.data
}

export async function listStockReservations(params?: WarehouseFilters) {
  const response = await apiClient.get<StockReservationsListResponse>('/stock-reservations', {
    params,
  })
  return response.data
}

export async function listWarehouseZones(params?: WarehouseFilters) {
  const response = await apiClient.get<WarehouseZonesListResponse>('/warehouse-zones', { params })
  return response.data
}

export async function createWarehouseZone(payload: CreateWarehouseZoneRequest) {
  const response = await apiClient.post<WarehouseZoneResponse>('/warehouse-zones', payload)
  return response.data
}

export async function listWarehouseShelves(params?: WarehouseFilters) {
  const response = await apiClient.get<WarehouseShelvesListResponse>('/warehouse-shelves', {
    params,
  })
  return response.data
}

export async function createWarehouseShelf(payload: CreateWarehouseShelfRequest) {
  const response = await apiClient.post<WarehouseShelfResponse>('/warehouse-shelves', payload)
  return response.data
}

export async function listWarehouseBins(params?: WarehouseFilters) {
  const response = await apiClient.get<WarehouseBinsListResponse>('/warehouse-bins', { params })
  return response.data
}

export async function createWarehouseBin(payload: CreateWarehouseBinRequest) {
  const response = await apiClient.post<WarehouseBinResponse>('/warehouse-bins', payload)
  return response.data
}

export async function getWarehouseBin(warehouseBinId: string | number) {
  const response = await apiClient.get<WarehouseBinResponse>(`/warehouse-bins/${warehouseBinId}`)
  return response.data
}

export async function updateWarehouseBin(
  warehouseBinId: string | number,
  payload: UpdateWarehouseBinRequest,
) {
  const response = await apiClient.put<WarehouseBinResponse>(`/warehouse-bins/${warehouseBinId}`, payload)
  return response.data
}

export async function deleteWarehouseBin(warehouseBinId: string | number) {
  const response = await apiClient.delete<DeleteWarehouseResponse>(`/warehouse-bins/${warehouseBinId}`)
  return response.data
}

export async function listWarehouseReceipts(params?: WarehouseFilters) {
  const response = await apiClient.get<WarehouseReceiptsListResponse>('/warehouse-receipts', { params })
  return response.data
}

export async function getWarehouseReceipt(warehouseReceiptId: string | number) {
  const response = await apiClient.get<WarehouseReceiptResponse>(`/warehouse-receipts/${warehouseReceiptId}`)
  return response.data
}

export async function createWarehouseReceipt(payload: CreateWarehouseReceiptRequest) {
  const response = await apiClient.post<WarehouseReceiptResponse>('/warehouse-receipts', payload)
  return response.data
}

export async function updateWarehouseReceipt(
  warehouseReceiptId: string | number,
  payload: UpdateWarehouseReceiptRequest,
) {
  const response = await apiClient.put<WarehouseReceiptResponse>(
    `/warehouse-receipts/${warehouseReceiptId}`,
    payload,
  )
  return response.data
}

export async function confirmWarehouseReceipt(warehouseReceiptId: string | number) {
  const response = await apiClient.post<WarehouseReceiptResponse>(`/warehouse-receipts/${warehouseReceiptId}/confirm`)
  return response.data
}

export async function cancelWarehouseReceipt(warehouseReceiptId: string | number) {
  const response = await apiClient.post<WarehouseReceiptResponse>(`/warehouse-receipts/${warehouseReceiptId}/cancel`)
  return response.data
}

export async function listWarehouseTransfers(params?: WarehouseFilters) {
  const response = await apiClient.get<WarehouseTransfersListResponse>('/warehouse-transfers', { params })
  return response.data
}

export async function getWarehouseTransfer(warehouseTransferId: string | number) {
  const response = await apiClient.get<WarehouseTransferResponse>(`/warehouse-transfers/${warehouseTransferId}`)
  return response.data
}

export async function createWarehouseTransfer(payload: CreateWarehouseTransferRequest) {
  const response = await apiClient.post<WarehouseTransferResponse>('/warehouse-transfers', payload)
  return response.data
}

export async function updateWarehouseTransfer(
  warehouseTransferId: string | number,
  payload: UpdateWarehouseTransferRequest,
) {
  const response = await apiClient.put<WarehouseTransferResponse>(
    `/warehouse-transfers/${warehouseTransferId}`,
    payload,
  )
  return response.data
}

export async function confirmWarehouseTransfer(warehouseTransferId: string | number) {
  const response = await apiClient.post<WarehouseTransferResponse>(`/warehouse-transfers/${warehouseTransferId}/confirm`)
  return response.data
}

export async function dispatchWarehouseTransfer(warehouseTransferId: string | number) {
  const response = await apiClient.post<WarehouseTransferResponse>(`/warehouse-transfers/${warehouseTransferId}/dispatch`)
  return response.data
}

export async function receiveWarehouseTransfer(warehouseTransferId: string | number) {
  const response = await apiClient.post<WarehouseTransferResponse>(`/warehouse-transfers/${warehouseTransferId}/receive`)
  return response.data
}

export async function cancelWarehouseTransfer(warehouseTransferId: string | number) {
  const response = await apiClient.post<WarehouseTransferResponse>(`/warehouse-transfers/${warehouseTransferId}/cancel`)
  return response.data
}

export async function listMerchantInboundStockRequests(params?: WarehouseFilters) {
  const response = await apiClient.get<MerchantInboundStockRequestsResponse>('/merchant-inbound-stock-requests', {
    params,
  })
  return response.data
}

export async function getMerchantInboundStockRequest(inboundRequestId: string | number) {
  const response = await apiClient.get<MerchantInboundStockRequestResponse>(
    `/merchant-inbound-stock-requests/${inboundRequestId}`,
  )
  return response.data
}

export async function approveMerchantInboundStockRequest(
  inboundRequestId: string | number,
  payload?: MerchantInboundRequestActionPayload,
) {
  const response = await apiClient.post<MerchantInboundStockRequestResponse>(
    `/merchant-inbound-stock-requests/${inboundRequestId}/approve`,
    payload,
  )
  return response.data
}

export async function rejectMerchantInboundStockRequestAction(
  inboundRequestId: string | number,
  payload: MerchantInboundRequestActionPayload,
) {
  const response = await apiClient.post<MerchantInboundStockRequestResponse>(
    `/merchant-inbound-stock-requests/${inboundRequestId}/reject`,
    payload,
  )
  return response.data
}

export async function linkMerchantInboundStockRequestReceipt(
  inboundRequestId: string | number,
  payload: MerchantInboundRequestActionPayload,
) {
  const response = await apiClient.post<MerchantInboundStockRequestResponse>(
    `/merchant-inbound-stock-requests/${inboundRequestId}/link-warehouse-receipt`,
    payload,
  )
  return response.data
}

export async function listPickingLists(params?: WarehouseFilters) {
  const response = await apiClient.get<PickingListsListResponse>('/picking-lists', { params })
  return response.data
}

export async function getPickingList(pickingListId: string | number) {
  const response = await apiClient.get<PickingListResponse>(`/picking-lists/${pickingListId}`)
  return response.data
}

export async function generatePickingList(payload: GeneratePickingListRequest) {
  const response = await apiClient.post<WarehouseActionResponse>('/picking-lists/generate', payload)
  return response.data
}

export async function scanPickingList(
  pickingListId: string | number,
  payload: ScanPickingListRequest,
) {
  const response = await apiClient.post<WarehouseActionResponse>(
    `/picking-lists/${pickingListId}/scan-pick`,
    payload,
  )
  return response.data
}

export async function cancelPickingList(pickingListId: string | number) {
  const response = await apiClient.post<WarehouseActionResponse>(`/picking-lists/${pickingListId}/cancel`)
  return response.data
}

export async function listPackingTasks(params?: WarehouseFilters) {
  const response = await apiClient.get<PackingTasksListResponse>('/packing-tasks', { params })
  return response.data
}

export async function getPackingTask(packingTaskId: string | number) {
  const response = await apiClient.get<PackingTaskResponse>(`/packing-tasks/${packingTaskId}`)
  return response.data
}

export async function generatePackingTask(payload: GeneratePackingTaskRequest) {
  const response = await apiClient.post<WarehouseActionResponse>('/packing-tasks/generate', payload)
  return response.data
}

export async function completePackingTask(
  packingTaskId: string | number,
  payload: CompletePackingTaskRequest,
) {
  const response = await apiClient.post<WarehouseActionResponse>(
    `/packing-tasks/${packingTaskId}/complete`,
    payload,
  )
  return response.data
}

export async function listStorageFeeRules(params?: WarehouseFilters) {
  const response = await apiClient.get<StorageFeeRulesListResponse>('/storage-fee-rules', {
    params,
  })
  return response.data
}

export async function createStorageFeeRule(payload: CreateStorageFeeRuleRequest) {
  const response = await apiClient.post<StorageFeeRuleResponse>('/storage-fee-rules', payload)
  return response.data
}

export async function generateStorageFees(payload: GenerateStorageFeesRequest) {
  const response = await apiClient.post<WarehouseActionResponse>('/storage-fees/generate', payload)
  return response.data
}

export async function listPickPackFeeRules(params?: WarehouseFilters) {
  const response = await apiClient.get<PickPackFeeRulesListResponse>('/pick-pack-fee-rules', {
    params,
  })
  return response.data
}

export async function createPickPackFeeRule(payload: CreatePickPackFeeRuleRequest) {
  const response = await apiClient.post<PickPackFeeRuleResponse>(
    '/pick-pack-fee-rules',
    payload,
  )
  return response.data
}

export async function generatePickPackFees(payload: GeneratePickPackFeesRequest) {
  const response = await apiClient.post<WarehouseActionResponse>('/pick-pack-fees/generate', payload)
  return response.data
}

export async function getWarehouseKpis(params?: WarehouseFilters) {
  const response = await apiClient.get<WarehouseKpisResponse>('/warehouse/kpis', { params })
  return response.data
}
