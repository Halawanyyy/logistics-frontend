import type {
  DashboardFilters,
  FinanceCompanyProfitSummary,
  FinanceOverview,
  FinanceReconciliationSummary,
} from '../../dashboard/types/dashboard.types'

export type FinanceFilters = DashboardFilters & {
  merchant_id?: number | string
  driver_id?: number | string
  treasury_account_id?: number | string
  status?: string
  payment_method?: string
  category?: string
  direction?: string
  source_type?: string
}

export type MerchantPayout = {
  id: number
  merchant_id: number
  merchant_name: string
  amount: string
  status: string
  status_label?: string | null
  payment_method: string
  payment_method_label?: string | null
  reference_number: string | null
  notes: string | null
  rejection_reason?: string | null
  treasury_account_id?: number | null
  treasury_account_name?: string | null
  approved_by_name?: string | null
  approved_at?: string | null
  rejected_by_name?: string | null
  rejected_at?: string | null
  completed_by_name?: string | null
  created_by: number
  created_by_name: string
  paid_at: string | null
  created_at: string
}

export type MerchantPayoutsListResponse = {
  data: MerchantPayout[]
}

export type MerchantPayoutResponse = {
  data: MerchantPayout
}

export type CreateMerchantPayoutRequest = {
  merchant_id: number
  amount: number
  status: string
  payment_method: string
  reference_number?: string | null
  notes?: string | null
}

export type UpdateMerchantPayoutRequest = Partial<CreateMerchantPayoutRequest>

export type RejectMerchantPayoutRequest = {
  rejection_reason: string
}

export type CompleteMerchantPayoutRequest = {
  treasury_account_id?: number | null
  payment_method: string
  reference_number?: string | null
  notes?: string | null
}

export type DriverCashClosure = {
  id: number
  driver_id: number
  driver_name: string
  expected_amount: string
  received_amount: string
  difference_amount: string
  status: string
  status_label?: string | null
  notes: string | null
  created_by: number
  created_by_name: string
  verified_by: number | null
  verified_by_name: string | null
  verified_at: string | null
  date?: string
  created_at: string
}

export type DriverCashClosuresListResponse = {
  data: DriverCashClosure[]
}

export type DriverCashClosureResponse = {
  data: DriverCashClosure
}

export type CreateDriverCashClosureRequest = {
  driver_id: number
  expected_amount: number
  received_amount: number
  status: string
  notes?: string | null
}

export type UpdateDriverCashClosureRequest = Partial<CreateDriverCashClosureRequest>

export type GenerateDriverCashClosureRequest = {
  date: string
  received_amount: number
  status: string
  notes?: string | null
}

export type Expense = {
  id: number
  category: string
  category_label?: string | null
  amount: string
  status?: string
  status_label?: string | null
  expense_date: string
  payment_method: string
  payment_method_label?: string | null
  reference_number: string | null
  notes: string | null
  rejection_reason?: string | null
  treasury_account_id?: number | null
  treasury_account_name?: string | null
  approved_by_name?: string | null
  approved_at?: string | null
  rejected_by_name?: string | null
  rejected_at?: string | null
  paid_by_name?: string | null
  paid_at?: string | null
  created_by: number
  created_by_name: string
  created_at: string
}

export type ExpensesListResponse = {
  data: Expense[]
}

export type ExpenseResponse = {
  data: Expense
}

export type CreateExpenseRequest = {
  category: string
  amount: number
  expense_date: string
  payment_method: string
  reference_number?: string | null
  notes?: string | null
}

export type UpdateExpenseRequest = Partial<CreateExpenseRequest>

export type RejectExpenseRequest = {
  rejection_reason: string
}

export type MarkExpensePaidRequest = {
  treasury_account_id?: number | null
  notes?: string | null
}

export type MerchantInvoice = {
  id: number
  merchant_id: number
  merchant_name: string
  invoice_number: string
  period_start: string
  period_end: string
  total_cod: string
  total_shipping_fees: string
  total_warehouse_charges: string
  total_payable: string
  status: string
  status_label?: string | null
  notes: string | null
  created_by: number
  created_by_name: string
  issued_at: string | null
  created_at: string
}

export type MerchantInvoicesListResponse = {
  data: MerchantInvoice[]
}

export type MerchantInvoiceResponse = {
  data: MerchantInvoice
}

export type CreateMerchantInvoiceRequest = {
  merchant_id: number
  period_start: string
  period_end: string
  status: string
  notes?: string | null
}

export type UpdateMerchantInvoiceRequest = Partial<CreateMerchantInvoiceRequest>

export type MerchantInvoicePreview = {
  merchant: {
    id: number
    name: string
    phone: string
  }
  invoice_id: number
  invoice_number: string
  status: string
  status_label?: string | null
  period: {
    start: string
    end: string
  }
  totals: {
    total_cod: string
    total_shipping_fees: string
    total_warehouse_charges: string
    total_payable: string
  }
  warehouse_charges: {
    id: number
    type: string
    description: string
    quantity: string
    unit_price: string
    amount: string
    status: string
    charge_date: string
    notes: string | null
  }[]
  shipments: {
    shipment_id: number
    shipment_number: string
    customer_name: string
    customer_phone: string
    payment_type: string
    cod_amount: string
    shipping_fee: string
    delivered_at: string
  }[]
}

export type MerchantInvoicePreviewResponse = {
  data: MerchantInvoicePreview
}

export type TreasuryAccount = {
  id: number
  name: string
  code: string
  type: string
  type_label?: string | null
  opening_balance: string
  current_balance?: string | null
  status: string
  status_label?: string | null
  notes?: string | null
  created_at: string
}

export type TreasuryAccountsListResponse = {
  data: TreasuryAccount[]
}

export type TreasuryAccountResponse = {
  data: TreasuryAccount
}

export type CreateTreasuryAccountRequest = {
  name: string
  code: string
  type: string
  opening_balance: number
  status: string
  notes?: string | null
}

export type UpdateTreasuryAccountRequest = Partial<CreateTreasuryAccountRequest>

export type TreasuryTransaction = {
  id: number
  treasury_account_id?: number | null
  treasury_account_name?: string | null
  direction?: string | null
  direction_label?: string | null
  source_type?: string | null
  source_type_label?: string | null
  source_id?: number | null
  amount?: string | null
  balance_after?: string | null
  reference_number?: string | null
  notes?: string | null
  created_by_name?: string | null
  created_at: string
}

export type TreasuryTransactionsListResponse = {
  data: TreasuryTransaction[]
}

export type FinanceReportFilters = {
  date_from?: string
  date_to?: string
  merchant_id?: number | string
  driver_id?: number | string
  treasury_account_id?: number | string
}

export type FinanceReportResponse<T = FinanceDynamicReport> = {
  data: T
}

export type FinanceDailyCashTreasuryAccount = {
  id: number
  name: string
  code: string
  type: string
  type_label?: string | null
  current_balance: string
}

export type FinanceDailyCashReport = {
  total_cash_in: string
  total_cash_out: string
  net_cash: string
  driver_cash_received: string
  merchant_payouts_paid: string
  expenses_paid: string
  treasury_accounts: FinanceDailyCashTreasuryAccount[]
  filters: FinanceReportFilters
}

export type FinanceMerchantLedgerItem = {
  id: number
  merchant_id: number
  merchant_name: string
  transaction_number: string
  transaction_type: string
  transaction_type_label?: string | null
  direction: string
  direction_label?: string | null
  amount: string
  balance_after: string
  status: string
  status_label?: string | null
  source_type: string | null
  source_type_label?: string | null
  source_id: number | null
  reference_number: string | null
  created_at: string
}

export type FinanceMerchantLedgerReport = {
  items: FinanceMerchantLedgerItem[]
  summary: {
    total_credits: string
    total_debits: string
    pending_transactions: number
  }
  filters: FinanceReportFilters
}

export type FinanceDriverDiscrepancyItem = {
  manifest_id: number
  manifest_number: string
  manifest_date: string
  driver_id: number
  driver_name: string
  expected_cod_amount: string
  actual_received_amount: string
  difference_amount: string
  total_shipments: number
}

export type FinanceDriverDiscrepanciesReport = {
  items: FinanceDriverDiscrepancyItem[]
  summary: {
    closed_manifests: number
    expected_cod_amount: string
    actual_received_amount: string
    difference_amount: string
  }
  filters: FinanceReportFilters
}

export type FinanceWarehouseRevenueByTypeItem = {
  transaction_type: string
  transaction_type_label?: string | null
  amount: string
}

export type FinanceWarehouseRevenueByMerchantItem = {
  merchant_id: number
  merchant_name: string
  amount: string
}

export type FinanceWarehouseRevenueReport = {
  total_revenue: string
  by_type: FinanceWarehouseRevenueByTypeItem[]
  by_merchant: FinanceWarehouseRevenueByMerchantItem[]
  filters: FinanceReportFilters
}

export type FinanceProfitLossReport = {
  shipping_revenue: string
  warehouse_revenue: string
  total_revenue: string
  paid_expenses: string
  net_profit: string
  treasury_cash_in: string
  treasury_cash_out: string
  treasury_net_cash: string
  filters: FinanceReportFilters
}

export type FinanceCompanyProfitSummaryResponse = {
  data: FinanceCompanyProfitSummary
}

export type FinanceReconciliationSummaryResponse = {
  data: FinanceReconciliationSummary
}

export type FinanceOverviewResponse = {
  data: FinanceOverview
}

export type FinanceDailyCashReportResponse = {
  data: FinanceDailyCashReport
}

export type FinanceMerchantLedgerReportResponse = {
  data: FinanceMerchantLedgerReport
}

export type FinanceDriverDiscrepanciesReportResponse = {
  data: FinanceDriverDiscrepanciesReport
}

export type FinanceWarehouseRevenueReportResponse = {
  data: FinanceWarehouseRevenueReport
}

export type FinanceProfitLossReportResponse = {
  data: FinanceProfitLossReport
}

export type MerchantFinanceReportResponse = {
  data: FinanceDynamicReport
}

export type DriverFinanceReportResponse = {
  data: {
    items: {
      driver_id: number
      driver_name: string
      shipments: number
      delivered: number
      expected_cod: string
      received_cod: string
      differences: string
    }[]
    filters: FinanceFilters
  }
}

export type FinanceExpensesReportResponse = {
  data: FinanceDynamicReport
}

export type FinancePayoutsReportResponse = {
  data: FinanceDynamicReport
}

export type DeleteFinanceResponse = {
  message: string
}

export type FinanceDynamicReport = Record<string, unknown>
