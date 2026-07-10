export type MerchantFinanceSummary = {
  available_balance: number
  pending_balance: number
  total_cod: number
  total_shipping_fees: number
  total_invoices: number
  paid_invoices: number
  unpaid_invoices: number
  pending_payouts: number
  paid_payouts: number
  currency: string
  invoice_breakdown?: { status: string; count: number }[]
  payout_breakdown?: { status: string; count: number }[]
}

export type MerchantWalletSummary = {
  wallet_balance: number
  available_balance: number
  pending_balance: number
  currency: string
  last_transaction_date?: string | null
  recent_transactions?: MerchantWalletTransaction[]
}

export type MerchantWalletTransaction = {
  id: string | number
  type: string
  amount: number
  currency: string
  description?: string | null
  reference?: string | null
  reference_type?: string | null
  reference_id?: string | number | null
  status: string
  balance_after?: number | null
  created_at: string
}

export type MerchantWalletTransactionFilters = {
  date_from?: string
  date_to?: string
  type?: string
  search?: string
  status?: string
}

export type MerchantWalletTransactionListResponse = {
  data: MerchantWalletTransaction[]
  meta?: {
    current_page: number
    last_page: number
    total: number
  }
}

export type MerchantInvoiceItem = {
  id: string | number
  description: string
  amount: number
  quantity: number
  total: number
}

export type MerchantInvoice = {
  id: string | number
  invoice_number: string
  number?: string
  status: string
  total_amount: number
  paid_amount?: number
  remaining_amount?: number
  currency: string
  issue_date: string
  due_date: string
  created_at: string
  items?: MerchantInvoiceItem[]
}

export type MerchantInvoiceFilters = {
  date_from?: string
  date_to?: string
  status?: string
  invoice_number?: string
  search?: string
}

export type MerchantInvoiceListResponse = {
  data: MerchantInvoice[]
  meta?: {
    current_page: number
    last_page: number
    total: number
  }
}

export type MerchantPayout = {
  id: string | number
  payout_number: string
  reference?: string | null
  amount: number
  currency: string
  status: string
  requested_at: string
  paid_at?: string | null
  method?: string | null
  account?: string | null
  notes?: string | null
  created_at: string
}

export type MerchantPayoutFilters = {
  date_from?: string
  date_to?: string
  status?: string
  payout_number?: string
  search?: string
}

export type MerchantPayoutListResponse = {
  data: MerchantPayout[]
  meta?: {
    current_page: number
    last_page: number
    total: number
  }
}

export type MerchantPayoutRequestPayload = {
  amount: number
  method?: string
  account?: string
  notes?: string
}
