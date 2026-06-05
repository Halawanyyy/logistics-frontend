import { apiClient } from '../../../shared/api/axios'
import type {
  CreateMerchantRequest,
  CreateMerchantIntegrationTokenPayload,
  CreateMerchantPortalUserPayload,
  DeleteMerchantPortalUserResponse,
  DeleteMerchantIntegrationTokenResponse,
  DeleteMerchantResponse,
  MerchantDashboardSummaryResponse,
  MerchantFinanceSummaryResponse,
  MerchantIntegrationTokenResponse,
  MerchantIntegrationTokensResponse,
  MerchantPortalUserResponse,
  MerchantPortalUsersResponse,
  MerchantResponse,
  MerchantScopedFilters,
  MerchantWalletSummaryResponse,
  MerchantWalletTransactionResponse,
  MerchantWalletTransactionsFilters,
  MerchantWalletTransactionsResponse,
  MerchantsListResponse,
  ManualDepositPayload,
  ManualWithdrawPayload,
  RejectMerchantWalletTransactionPayload,
  RevokeMerchantIntegrationTokenPayload,
  UpdateMerchantPortalUserPayload,
  UpdateMerchantRequest,
} from '../types/merchant.types'
import type {
  InventoryStocksListResponse,
  StockMovementsListResponse,
  WarehouseChargesListResponse,
  WarehouseFilters,
} from '../../warehouse/types/warehouse.types'

export async function listMerchants() {
  const response = await apiClient.get<MerchantsListResponse>('/merchants')
  return response.data
}

export async function getMerchant(merchantId: string | number) {
  const response = await apiClient.get<MerchantResponse>(`/merchants/${merchantId}`)
  return response.data
}

export async function createMerchant(payload: CreateMerchantRequest) {
  const response = await apiClient.post<MerchantResponse>('/merchants', payload)
  return response.data
}

export async function updateMerchant(
  merchantId: string | number,
  payload: UpdateMerchantRequest,
) {
  const response = await apiClient.put<MerchantResponse>(`/merchants/${merchantId}`, payload)
  return response.data
}

export async function deleteMerchant(merchantId: string | number) {
  const response = await apiClient.delete<DeleteMerchantResponse>(`/merchants/${merchantId}`)
  return response.data
}

export async function getMerchantDashboardSummary(
  merchantId: string | number,
  params?: MerchantScopedFilters,
) {
  const response = await apiClient.get<MerchantDashboardSummaryResponse>(
    `/merchants/${merchantId}/dashboard/summary`,
    { params },
  )
  return response.data
}

export async function getMerchantFinanceSummary(
  merchantId: string | number,
  params?: MerchantScopedFilters,
) {
  const response = await apiClient.get<MerchantFinanceSummaryResponse>(
    `/merchants/${merchantId}/finance/summary`,
    { params },
  )
  return response.data
}

export async function getMerchantWarehouseInventory(merchantId: string | number) {
  const response = await apiClient.get<InventoryStocksListResponse>(
    `/merchants/${merchantId}/warehouse/inventory`,
  )
  return response.data
}

export async function getMerchantWarehouseMovements(merchantId: string | number) {
  const response = await apiClient.get<StockMovementsListResponse>(
    `/merchants/${merchantId}/warehouse/movements`,
  )
  return response.data
}

export async function getMerchantWarehouseCharges(
  merchantId: string | number,
  params?: WarehouseFilters,
) {
  const response = await apiClient.get<WarehouseChargesListResponse>(
    `/merchants/${merchantId}/warehouse/charges`,
    { params },
  )
  return response.data
}

export async function getMerchantWalletSummary(merchantId: string | number) {
  const response = await apiClient.get<MerchantWalletSummaryResponse>(
    `/merchants/${merchantId}/wallet/summary`,
  )
  return response.data
}

export async function listMerchantWalletTransactions(
  merchantId: string | number,
  params?: MerchantWalletTransactionsFilters,
) {
  const response = await apiClient.get<MerchantWalletTransactionsResponse>(
    `/merchants/${merchantId}/wallet/transactions`,
    { params },
  )
  return response.data
}

export async function createMerchantWalletDeposit(
  merchantId: string | number,
  payload: ManualDepositPayload,
) {
  const response = await apiClient.post<MerchantWalletTransactionResponse>(
    `/merchants/${merchantId}/wallet/deposit`,
    payload,
  )
  return response.data
}

export async function createMerchantWalletWithdraw(
  merchantId: string | number,
  payload: ManualWithdrawPayload,
) {
  const response = await apiClient.post<MerchantWalletTransactionResponse>(
    `/merchants/${merchantId}/wallet/withdraw`,
    payload,
  )
  return response.data
}

export async function getMerchantWalletTransaction(transactionId: string | number) {
  const response = await apiClient.get<MerchantWalletTransactionResponse>(
    `/merchant-wallet-transactions/${transactionId}`,
  )
  return response.data
}

export async function approveMerchantWalletTransaction(transactionId: string | number) {
  const response = await apiClient.post<MerchantWalletTransactionResponse>(
    `/merchant-wallet-transactions/${transactionId}/approve`,
  )
  return response.data
}

export async function rejectMerchantWalletTransaction(
  transactionId: string | number,
  payload: RejectMerchantWalletTransactionPayload,
) {
  const response = await apiClient.post<MerchantWalletTransactionResponse>(
    `/merchant-wallet-transactions/${transactionId}/reject`,
    payload,
  )
  return response.data
}

export async function listMerchantIntegrationTokens(merchantId: string | number) {
  const response = await apiClient.get<MerchantIntegrationTokensResponse>(
    `/merchants/${merchantId}/integration-tokens`,
  )
  return response.data
}

export async function createMerchantIntegrationToken(
  merchantId: string | number,
  payload: CreateMerchantIntegrationTokenPayload,
) {
  const response = await apiClient.post<MerchantIntegrationTokenResponse>(
    `/merchants/${merchantId}/integration-tokens`,
    payload,
  )
  return response.data
}

export async function getMerchantIntegrationToken(tokenId: string | number) {
  const response = await apiClient.get<MerchantIntegrationTokenResponse>(
    `/merchant-integration-tokens/${tokenId}`,
  )
  return response.data
}

export async function revokeMerchantIntegrationToken(
  tokenId: string | number,
  payload: RevokeMerchantIntegrationTokenPayload,
) {
  const response = await apiClient.post<MerchantIntegrationTokenResponse>(
    `/merchant-integration-tokens/${tokenId}/revoke`,
    payload,
  )
  return response.data
}

export async function deleteMerchantIntegrationToken(tokenId: string | number) {
  const response = await apiClient.delete<DeleteMerchantIntegrationTokenResponse>(
    `/merchant-integration-tokens/${tokenId}`,
  )
  return response.data
}

export async function listMerchantPortalUsers(merchantId: string | number) {
  const response = await apiClient.get<MerchantPortalUsersResponse>(
    `/merchants/${merchantId}/portal-users`,
  )
  return response.data
}

export async function getMerchantPortalUser(
  merchantId: string | number,
  merchantUserId: string | number,
) {
  const response = await apiClient.get<MerchantPortalUserResponse>(
    `/merchants/${merchantId}/portal-users/${merchantUserId}`,
  )
  return response.data
}

export async function createMerchantPortalUser(
  merchantId: string | number,
  payload: CreateMerchantPortalUserPayload,
) {
  const response = await apiClient.post<MerchantPortalUserResponse>(
    `/merchants/${merchantId}/portal-users`,
    payload,
  )
  return response.data
}

export async function updateMerchantPortalUser(
  merchantId: string | number,
  merchantUserId: string | number,
  payload: UpdateMerchantPortalUserPayload,
) {
  const response = await apiClient.put<MerchantPortalUserResponse>(
    `/merchants/${merchantId}/portal-users/${merchantUserId}`,
    payload,
  )
  return response.data
}

export async function deleteMerchantPortalUser(
  merchantId: string | number,
  merchantUserId: string | number,
) {
  const response = await apiClient.delete<DeleteMerchantPortalUserResponse>(
    `/merchants/${merchantId}/portal-users/${merchantUserId}`,
  )
  return response.data
}

export async function suspendMerchantPortalUser(
  merchantId: string | number,
  merchantUserId: string | number,
) {
  const response = await apiClient.post<MerchantPortalUserResponse>(
    `/merchants/${merchantId}/portal-users/${merchantUserId}/suspend`,
  )
  return response.data
}

export async function activateMerchantPortalUser(
  merchantId: string | number,
  merchantUserId: string | number,
) {
  const response = await apiClient.post<MerchantPortalUserResponse>(
    `/merchants/${merchantId}/portal-users/${merchantUserId}/activate`,
  )
  return response.data
}
