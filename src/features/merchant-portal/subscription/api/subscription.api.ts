import { apiClient } from '../../../../shared/api/axios'
import type {
  BillingCycle,
  SubscriptionPlan,
  SubscriptionPlansResponse,
} from '../types/subscription.types'

export const subscriptionApi = {
  async getPlans() {
    const response = await apiClient.get<SubscriptionPlansResponse>('/merchant/subscription/plans')
    return response.data
  },

  async subscribe(planId: number, billingCycle: BillingCycle) {
    const response = await apiClient.post<{ message: string; data: SubscriptionPlan }>(
      '/merchant/subscription/subscribe',
      {
        pricing_plan_id: planId,
        billing_cycle: billingCycle,
      },
    )

    return response.data
  },
}
