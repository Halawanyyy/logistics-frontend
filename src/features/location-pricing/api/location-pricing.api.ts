import { apiClient } from '../../../shared/api/axios'
import type {
  AreaResponse,
  CreatePricingPlanRateRequest,
  CreatePricingPlanRequest,
  AreaFilters,
  AreasListResponse,
  CalculateShippingRateRequest,
  CalculateShippingRateResponse,
  CreateAreaRequest,
  CreateGovernorateRequest,
  CreateShippingRateRequest,
  DeleteLocationResponse,
  GovernorateResponse,
  GovernoratesListResponse,
  PricingPlanFilters,
  PricingPlanRateFilters,
  PricingPlanRateResponse,
  PricingPlanRatesListResponse,
  PricingPlanResponse,
  PricingPlansListResponse,
  ShippingRateResponse,
  ShippingRatesListResponse,
  UpdatePricingPlanRateRequest,
  UpdatePricingPlanRequest,
  UpdateAreaRequest,
  UpdateGovernorateRequest,
  UpdateShippingRateRequest,
} from '../types/location-pricing.types'

export async function listGovernorates() {
  const response = await apiClient.get<GovernoratesListResponse>('/governorates')
  return response.data
}

export async function getGovernorate(governorateId: string | number) {
  const response = await apiClient.get<GovernorateResponse>(`/governorates/${governorateId}`)
  return response.data
}

export async function createGovernorate(payload: CreateGovernorateRequest) {
  const response = await apiClient.post<GovernorateResponse>('/governorates', payload)
  return response.data
}

export async function updateGovernorate(
  governorateId: string | number,
  payload: UpdateGovernorateRequest,
) {
  const response = await apiClient.put<GovernorateResponse>(`/governorates/${governorateId}`, payload)
  return response.data
}

export async function deleteGovernorate(governorateId: string | number) {
  const response = await apiClient.delete<DeleteLocationResponse>(`/governorates/${governorateId}`)
  return response.data
}

export async function listAreas(params?: AreaFilters) {
  const response = await apiClient.get<AreasListResponse>('/areas', { params })
  return response.data
}

export async function getArea(areaId: string | number) {
  const response = await apiClient.get<AreaResponse>(`/areas/${areaId}`)
  return response.data
}

export async function createArea(payload: CreateAreaRequest) {
  const response = await apiClient.post<AreaResponse>('/areas', payload)
  return response.data
}

export async function updateArea(areaId: string | number, payload: UpdateAreaRequest) {
  const response = await apiClient.put<AreaResponse>(`/areas/${areaId}`, payload)
  return response.data
}

export async function deleteArea(areaId: string | number) {
  const response = await apiClient.delete<DeleteLocationResponse>(`/areas/${areaId}`)
  return response.data
}

export async function listShippingRates() {
  const response = await apiClient.get<ShippingRatesListResponse>('/shipping-rates')
  response.data.data = response.data.data.map(rate => ({
    ...rate,
    delivery_fee: (rate as any).shipping_fee ?? rate.delivery_fee,
  }))
  return response.data
}

export async function getShippingRate(shippingRateId: string | number) {
  const response = await apiClient.get<ShippingRateResponse>(`/shipping-rates/${shippingRateId}`)
  if (response.data?.data) {
    response.data.data.delivery_fee = (response.data.data as any).shipping_fee ?? response.data.data.delivery_fee
  }
  return response.data
}

export async function createShippingRate(payload: CreateShippingRateRequest) {
  const apiPayload = { ...payload, shipping_fee: payload.delivery_fee } as any
  const response = await apiClient.post<ShippingRateResponse>('/shipping-rates', apiPayload)
  if (response.data?.data) {
    response.data.data.delivery_fee = (response.data.data as any).shipping_fee ?? response.data.data.delivery_fee
  }
  return response.data
}

export async function updateShippingRate(
  shippingRateId: string | number,
  payload: UpdateShippingRateRequest,
) {
  const apiPayload = { ...payload } as any
  if (apiPayload.delivery_fee !== undefined) {
    apiPayload.shipping_fee = apiPayload.delivery_fee
  }
  const response = await apiClient.put<ShippingRateResponse>(
    `/shipping-rates/${shippingRateId}`,
    apiPayload,
  )
  if (response.data?.data) {
    response.data.data.delivery_fee = (response.data.data as any).shipping_fee ?? response.data.data.delivery_fee
  }
  return response.data
}

export async function deleteShippingRate(shippingRateId: string | number) {
  const response = await apiClient.delete<DeleteLocationResponse>(
    `/shipping-rates/${shippingRateId}`,
  )
  return response.data
}

export async function restoreShippingRate(shippingRateId: string | number) {
  const response = await apiClient.post<DeleteLocationResponse>(
    `/shipping-rates/${shippingRateId}/restore`,
  )
  return response.data
}

export async function forceDeleteShippingRate(shippingRateId: string | number) {
  const response = await apiClient.delete<DeleteLocationResponse>(
    `/shipping-rates/${shippingRateId}/force`,
  )
  return response.data
}

export async function calculateShippingRate(payload: CalculateShippingRateRequest) {
  const response = await apiClient.post<CalculateShippingRateResponse>(
    '/shipping-rates/calculate',
    payload,
  )
  return response.data
}

export async function listPricingPlans(params?: PricingPlanFilters) {
  const response = await apiClient.get<PricingPlansListResponse>('/pricing-plans', { params })
  return response.data
}

export async function getPricingPlan(pricingPlanId: string | number) {
  const response = await apiClient.get<PricingPlanResponse>(`/pricing-plans/${pricingPlanId}`)
  return response.data
}

export async function createPricingPlan(payload: CreatePricingPlanRequest) {
  const response = await apiClient.post<PricingPlanResponse>('/pricing-plans', payload)
  return response.data
}

export async function updatePricingPlan(pricingPlanId: string | number, payload: UpdatePricingPlanRequest) {
  const response = await apiClient.put<PricingPlanResponse>(`/pricing-plans/${pricingPlanId}`, payload)
  return response.data
}

export async function deletePricingPlan(pricingPlanId: string | number) {
  const response = await apiClient.delete<DeleteLocationResponse>(`/pricing-plans/${pricingPlanId}`)
  return response.data
}

export async function listPricingPlanRates(params?: PricingPlanRateFilters) {
  const response = await apiClient.get<PricingPlanRatesListResponse>('/pricing-plan-rates', { params })
  return response.data
}

export async function getPricingPlanRate(pricingPlanRateId: string | number) {
  const response = await apiClient.get<PricingPlanRateResponse>(`/pricing-plan-rates/${pricingPlanRateId}`)
  return response.data
}

export async function createPricingPlanRate(payload: CreatePricingPlanRateRequest) {
  const response = await apiClient.post<PricingPlanRateResponse>('/pricing-plan-rates', payload)
  return response.data
}

export async function updatePricingPlanRate(
  pricingPlanRateId: string | number,
  payload: UpdatePricingPlanRateRequest,
) {
  const response = await apiClient.put<PricingPlanRateResponse>(
    `/pricing-plan-rates/${pricingPlanRateId}`,
    payload,
  )
  return response.data
}

export async function deletePricingPlanRate(pricingPlanRateId: string | number) {
  const response = await apiClient.delete<DeleteLocationResponse>(`/pricing-plan-rates/${pricingPlanRateId}`)
  return response.data
}
