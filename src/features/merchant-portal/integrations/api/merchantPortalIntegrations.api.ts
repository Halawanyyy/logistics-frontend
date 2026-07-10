import { apiClient } from '../../../shared/api/client'
import { ApiResponse } from '../../../shared/types/api.types'
import {
  MerchantIntegrationToken,
  CreateMerchantIntegrationTokenPayload,
  RevokeMerchantIntegrationTokenPayload,
  MerchantIntegrationDocs,
  TestMerchantIntegrationPayload,
  MerchantIntegrationTestResult,
} from './merchantPortalIntegrations.types'

/**
 * Lists all integration tokens for the authenticated merchant.
 * Does not pass merchant_id per Phase 7 constraints.
 */
export async function listMerchantIntegrationTokens(): Promise<ApiResponse<MerchantIntegrationToken[]>> {
  const response = await apiClient.get('/merchant-portal/integration-tokens')
  return response.data
}

/**
 * Gets a specific integration token by ID.
 */
export async function getMerchantIntegrationToken(tokenId: number): Promise<ApiResponse<MerchantIntegrationToken>> {
  const response = await apiClient.get(`/merchant-portal/integration-tokens/${tokenId}`)
  return response.data
}

/**
 * Creates a new integration token.
 * Does not pass merchant_id.
 */
export async function createMerchantIntegrationToken(
  payload: CreateMerchantIntegrationTokenPayload,
): Promise<ApiResponse<MerchantIntegrationToken>> {
  const response = await apiClient.post('/merchant-portal/integration-tokens', payload)
  return response.data
}

/**
 * Revokes an integration token.
 */
export async function revokeMerchantIntegrationToken(
  tokenId: number,
  payload: RevokeMerchantIntegrationTokenPayload,
): Promise<ApiResponse<MerchantIntegrationToken>> {
  const response = await apiClient.post(`/merchant-portal/integration-tokens/${tokenId}/revoke`, payload)
  return response.data
}

/**
 * Deletes an integration token.
 */
export async function deleteMerchantIntegrationToken(tokenId: number): Promise<ApiResponse<void>> {
  const response = await apiClient.delete(`/merchant-portal/integration-tokens/${tokenId}`)
  return response.data
}

/**
 * Fetches integration documentation for the merchant.
 */
export async function getMerchantIntegrationDocs(): Promise<ApiResponse<MerchantIntegrationDocs>> {
  const response = await apiClient.get('/merchant-portal/integrations/docs')
  return response.data
}

/**
 * Tests the merchant integration connection.
 */
export async function testMerchantIntegration(
  payload: TestMerchantIntegrationPayload,
): Promise<ApiResponse<MerchantIntegrationTestResult>> {
  const response = await apiClient.post('/merchant-portal/integrations/test', payload)
  return response.data
}
