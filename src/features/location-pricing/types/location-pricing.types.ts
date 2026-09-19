export type Governorate = {
  id: number
  name: string
  is_active: boolean
  created_at: string
}

export type Area = {
  id: number
  governorate_id: number
  governorate_name: string
  name: string
  is_active: boolean
  created_at: string
}

export type ShippingRate = {
  id: number
  governorate_id: number
  governorate_name: string
  area_id: number | null
  area_name: string | null
  delivery_fee: string
  swap_fee: string
  return_fee: string
  is_active: boolean
  created_at: string
}

export type PricingPlanFeature = {
  id?: number | string
  pricing_plan_id?: number
  label: string
  is_included: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
}

export type PricingPlanFeatureFormValue = {
  clientKey: string
  id?: number | string
  label: string
  is_included: boolean
  sort_order: number
}

export type PricingPlan = {
  id: number
  name: string
  code: string
  description: string | null
  monthly_orders_from: number | null
  monthly_orders_to: number | null
  monthly_price: number | string | null
  yearly_price: number | string | null
  price?: number | string | null
  currency?: string
  billing_period?: string
  requires_contact?: boolean
  is_custom_pricing?: boolean
  is_popular?: boolean
  is_active?: boolean
  display_order?: number
  sort_order?: number
  status: string
  features?: PricingPlanFeature[]
  merchants_count?: number
  created_at: string
}

export type PricingPlanRate = {
  id: number
  pricing_plan_id: number
  pricing_plan_name: string
  governorate_id: number
  governorate_name: string
  area_id: number | null
  area_name: string | null
  delivery_fee: string
  swap_fee: string
  return_fee: string
  is_active: boolean
}

export type GovernoratesListResponse = {
  data: Governorate[]
}

export type GovernorateResponse = {
  data: Governorate
}

export type AreasListResponse = {
  data: Area[]
}

export type AreaFilters = {
  governorate_id?: number | string
}

export type AreaResponse = {
  data: Area
}

export type ShippingRatesListResponse = {
  data: ShippingRate[]
}

export type ShippingRateResponse = {
  data: ShippingRate
}

export type PricingPlansListResponse = {
  data: PricingPlan[]
}

export type PricingPlanResponse = {
  data: PricingPlan
}

export type PricingPlanRatesListResponse = {
  data: PricingPlanRate[]
}

export type PricingPlanRateResponse = {
  data: PricingPlanRate
}

export type CreateGovernorateRequest = {
  name: string
  is_active: boolean
}

export type UpdateGovernorateRequest = {
  name?: string
  is_active?: boolean
}

export type CreateAreaRequest = {
  governorate_id: number
  name: string
  is_active: boolean
}

export type UpdateAreaRequest = {
  governorate_id?: number
  name?: string
  is_active?: boolean
}

export type CreateShippingRateRequest = {
  governorate_id: number
  area_id: number | null
  delivery_fee: number
  swap_fee: number
  return_fee: number
  is_active: boolean
}

export type UpdateShippingRateRequest = {
  governorate_id?: number
  area_id?: number | null
  delivery_fee?: number
  swap_fee?: number
  return_fee?: number
  is_active?: boolean
}

export type PricingPlanFilters = {
  status?: string
}

export type PricingPlanRateFilters = {
  pricing_plan_id?: number | string
  governorate_id?: number | string
  area_id?: number | string
}

export type CreatePricingPlanRequest = {
  name: string
  code: string
  description?: string | null
  monthly_orders_from?: number | null
  monthly_orders_to?: number | null
  monthly_price?: number | null
  yearly_price?: number | null
  currency?: string
  is_popular?: boolean
  requires_contact?: boolean
  is_custom_pricing?: boolean
  display_order?: number
  status: string
  features?: Array<{
    id?: number | string
    label: string
    is_included: boolean
    sort_order: number
  }>
}

export type UpdatePricingPlanRequest = Partial<CreatePricingPlanRequest>

export type CreatePricingPlanRateRequest = {
  pricing_plan_id: number
  governorate_id: number
  area_id?: number | null
  delivery_fee: number
  swap_fee: number
  return_fee: number
  is_active: boolean
}

export type UpdatePricingPlanRateRequest = Partial<CreatePricingPlanRateRequest>

export type CalculateShippingRateRequest = {
  governorate_id: number
  area_id: number | null
  merchant_id?: number | null
  order_type?: string
}

export type CalculateShippingRateResponse = {
  data: {
    governorate_id: number
    area_id: number | null
    shipping_fee?: string
    delivery_fee?: string
    swap_fee?: string
    return_fee?: string
    source: string
  }
}

export type DeleteLocationResponse = {
  message: string
}
