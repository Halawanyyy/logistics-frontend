export type DashboardFilters = {
  date_from?: string
  date_to?: string
  merchant_id?: number | string
  assigned_driver_id?: number | string
}

export type DashboardSummary = {
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
  filters: DashboardFilters & {
    merchant_id?: number | null
    assigned_driver_id?: number | null
  }
}

export type DashboardSummaryResponse = {
  data: DashboardSummary
}

export type FinanceCompanyProfitSummary = {
  currency?: string | null
  total_shipping_fees: string
  total_warehouse_charges: string
  total_expenses: string
  net_company_profit: string
  total_cod_collected: string
  delivered_shipments_count: number
  filters: DashboardFilters
}

export type FinanceCompanyProfitSummaryResponse = {
  data: FinanceCompanyProfitSummary
}

export type FinanceReconciliationSummary = {
  currency?: string | null
  total_cod_expected: string
  total_driver_cash_verified: string
  cod_difference: string
  driver_manifests_closed: number
  driver_manifest_expected_cod: string
  driver_manifest_actual_received: string
  driver_manifest_discrepancy_total: string
  wallet_total_credits: string
  wallet_total_debits: string
  wallet_available_total: string
  payout_pending_total: string
  payout_approved_total: string
  payout_completed_total: string
  treasury_accounts_total: number
  treasury_current_balance_total: string
  total_merchant_payable: string
  total_merchant_paid_out: string
  merchant_balance_remaining: string
  filters: DashboardFilters
}

export type FinanceReconciliationSummaryResponse = {
  data: FinanceReconciliationSummary
}

export type FinanceOverview = {
  total_orders: number
  total_shipments: number
  delivered_shipments: number
  cod_expected: string
  cod_collected_verified: string
  shipping_fees: string
  warehouse_charges: string
  merchant_payables: string
  merchant_paid_out: string
  merchant_remaining_balance: string
  expenses: string
  company_net_profit: string
  filters: DashboardFilters & {
    merchant_id?: number | null
    driver_id?: number | null
    status?: string | null
  }
}

export type FinanceOverviewResponse = {
  data: FinanceOverview
}
