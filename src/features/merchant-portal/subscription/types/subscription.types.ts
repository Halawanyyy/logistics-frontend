export interface PricingPlanFeature {
  id: number | string
  pricing_plan_id?: number
  label: string
  is_included: boolean
  sort_order: number
}

export interface SubscriptionPlan {
  id: number
  name: string
  code: string
  description: string | null
  monthly_price: number | null
  yearly_price: number | null
  price?: number | null
  currency: string
  billing_period?: string
  features: PricingPlanFeature[]
  is_popular: boolean
  is_custom_pricing: boolean
  requires_contact?: boolean
  display_order: number
  monthly_orders_from?: number | null
  monthly_orders_to?: number | null
}

export interface SubscriptionPlansResponse {
  data: {
    plans: SubscriptionPlan[]
    current_plan_id: number | null
    pricing_contact_email?: string | null
  }
}

export type BillingCycle = 'monthly' | 'yearly'
