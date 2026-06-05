import { apiClient } from '../../../shared/api/axios'
import type { PublicTrackingResponse } from '../types/public-tracking.types'

export async function getPublicTracking(shipmentNumber: string) {
  const response = await apiClient.get<PublicTrackingResponse>(`/track/${shipmentNumber}`)
  return response.data
}
