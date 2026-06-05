export type Merchant = {
  id: number
  name: string
  company_name: string
  phone: string
  email: string
  address: string
  status: string
  pricing_plan_id?: number | null
  pricing_plan_name?: string | null
  pricing_plan_code?: string | null
  created_at: string
}

export type MerchantsListResponse = {
  data: Merchant[]
}

export type MerchantResponse = {
  data: Merchant
}

export type CreateMerchantRequest = {
  name: string
  company_name: string
  phone: string
  email: string
  address: string
  status: string
  pricing_plan_id?: number | null
}

export type UpdateMerchantRequest = {
  name?: string
  company_name?: string
  phone?: string
  email?: string
  address?: string
  status?: string
  pricing_plan_id?: number | null
}

export type DeleteMerchantResponse = {
  message: string
}

export type MerchantScopedFilters = {
  date_from?: string
  date_to?: string
  assigned_driver_id?: number | string
}

export type MerchantDashboardSummary = {
  company_profit: string
  merchants_payables: string
  cod_collected: string
  shipments: {
    total: number
    pending_pickup: number
    in_transit: number
    delivered: number
    assigned: number
    unassigned: number
  }
  filters: MerchantScopedFilters & {
    merchant_id: number
  }
}

export type MerchantDashboardSummaryResponse = {
  data: MerchantDashboardSummary
}

export type MerchantFinanceSummary = {
  merchant_id: number
  merchant_name: string
  cod_collected: string
  shipping_fees: string
  warehouse_charges: string
  merchant_payable: string
  paid_out: string
  pending_payouts: string
  remaining_balance: string
  company_profit_from_shipping: string
  shipments: {
    delivered_count: number
    cod_delivered_count: number
    prepaid_delivered_count: number
  }
  filters: {
    date_from: string | null
    date_to: string | null
  }
}

export type MerchantFinanceSummaryResponse = {
  data: MerchantFinanceSummary
}

export type MerchantWalletSummary = {
  merchant_id: number
  merchant_name: string
  available_balance: string
  pending_credits: string
  pending_debits: string
  total_cod_collected: string
  total_fees: string
  total_payouts: string
  total_manual_deposits: string
  total_manual_withdraws: string
  total_wallet_credits: string
  total_wallet_debits: string
}

export type MerchantWalletSummaryResponse = {
  data: MerchantWalletSummary
}

export type MerchantWalletTransaction = {
  id: number
  merchant_id?: number
  merchant_name?: string
  transaction_type: string
  direction: string
  amount: string
  status: string
  source_type: string | null
  source_id?: number | null
  reference_number: string | null
  reason?: string | null
  notes?: string | null
  balance_after?: string | null
  approved_by_name?: string | null
  approved_at?: string | null
  rejected_by_name?: string | null
  rejected_at?: string | null
  rejection_reason?: string | null
  created_by_name?: string | null
  created_at: string
}

export type MerchantWalletTransactionsFilters = {
  transaction_type?: string
  direction?: string
  status?: string
  date_from?: string
  date_to?: string
  source_type?: string
}

export type MerchantWalletTransactionsResponse = {
  data: MerchantWalletTransaction[]
}

export type MerchantWalletTransactionResponse = {
  data: MerchantWalletTransaction
}

export type ManualDepositPayload = {
  amount: number
  reason: string
  notes?: string | null
  reference_number?: string | null
}

export type ManualWithdrawPayload = {
  amount: number
  reason: string
  notes?: string | null
  reference_number?: string | null
}

export type RejectMerchantWalletTransactionPayload = {
  rejection_reason: string
}

export type MerchantIntegrationToken = {
  id: number
  merchant_id: number
  merchant_name: string
  name: string
  provider: 'woocommerce' | 'shopify' | 'custom'
  token_prefix: string
  permissions: string[]
  status: string
  last_used_at: string | null
  expires_at: string | null
  revoked_at: string | null
  revoked_by_name: string | null
  created_by_name: string
  notes: string | null
  created_at: string
  plain_token?: string
}

export type MerchantIntegrationTokensResponse = {
  data: MerchantIntegrationToken[]
}

export type MerchantIntegrationTokenResponse = {
  data: MerchantIntegrationToken
}

export type CreateMerchantIntegrationTokenPayload = {
  name: string
  provider: 'woocommerce' | 'shopify' | 'custom'
  permissions: string[]
  expires_at?: string | null
  notes?: string | null
}

export type RevokeMerchantIntegrationTokenPayload = {
  notes?: string | null
}

export type DeleteMerchantIntegrationTokenResponse = {
  message: string
}

export type MerchantPortalUser = {
  id: number
  merchant_id: number
  user_id?: number | null
  name?: string | null
  email?: string | null
  role: string
  portal_role_label?: string | null
  status: string
  portal_status_label?: string | null
  created_at: string
}

export type MerchantPortalUsersResponse = {
  data: MerchantPortalUser[]
}

export type MerchantPortalUserResponse = {
  data: MerchantPortalUser
}

export type CreateMerchantPortalUserPayload = {
  user_id?: number | null
  name?: string
  email?: string
  password?: string
  password_confirmation?: string
  role: string
  status: string
}

export type UpdateMerchantPortalUserPayload = {
  role?: string
  status?: string
  name?: string
  email?: string
  password?: string
  password_confirmation?: string
}

export type DeleteMerchantPortalUserResponse = {
  message: string
}
