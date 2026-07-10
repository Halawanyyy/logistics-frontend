import { apiClient } from '../../../shared/api/axios'
import type { MerchantShopPreviewResponse } from '../types/merchantShop.types'

export async function getMerchantShopPreview(merchantId: string | number) {
  const response = await apiClient.get<MerchantShopPreviewResponse>(`/merchants/${merchantId}/shop-preview`)
  return response.data
}
