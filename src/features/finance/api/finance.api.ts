import { apiClient } from '../../../shared/api/axios'
import type {
  CompleteMerchantPayoutRequest,
  CreateTreasuryAccountRequest,
  CreateDriverCashClosureRequest,
  CreateExpenseRequest,
  CreateMerchantInvoiceRequest,
  CreateMerchantPayoutRequest,
  DeleteFinanceResponse,
  DriverCashClosureResponse,
  DriverCashClosuresListResponse,
  DriverFinanceReportResponse,
  ExpenseResponse,
  ExpensesListResponse,
  FinanceCompanyProfitSummaryResponse,
  FinanceDailyCashReportResponse,
  FinanceDriverDiscrepanciesReportResponse,
  FinanceExpensesReportResponse,
  FinanceFilters,
  FinanceOverviewResponse,
  FinancePayoutsReportResponse,
  FinanceProfitLossReportResponse,
  FinanceReportFilters,
  FinanceReconciliationSummaryResponse,
  FinanceMerchantLedgerReportResponse,
  FinanceWarehouseRevenueReportResponse,
  MarkExpensePaidRequest,
  MerchantFinanceReportResponse,
  MerchantInvoicePreviewResponse,
  MerchantInvoiceResponse,
  MerchantInvoicesListResponse,
  MerchantPayoutResponse,
  MerchantPayoutsListResponse,
  RejectExpenseRequest,
  RejectMerchantPayoutRequest,
  TreasuryAccountResponse,
  TreasuryAccountsListResponse,
  TreasuryTransactionsListResponse,
  UpdateDriverCashClosureRequest,
  UpdateExpenseRequest,
  UpdateMerchantInvoiceRequest,
  UpdateMerchantPayoutRequest,
  UpdateTreasuryAccountRequest,
} from '../types/finance.types'
import type {
  MerchantWalletTransactionResponse,
  RejectMerchantWalletTransactionPayload,
} from '../../merchants/types/merchant.types'

function dateOnlyParams(params?: FinanceFilters) {
  return {
    ...(params?.date_from ? { date_from: params.date_from } : {}),
    ...(params?.date_to ? { date_to: params.date_to } : {}),
  }
}

function driverReportParams(params?: FinanceFilters) {
  return {
    ...dateOnlyParams(params),
    ...(params?.driver_id ? { driver_id: params.driver_id } : {}),
    ...(params?.status ? { status: params.status } : {}),
  }
}

export async function listMerchantPayouts(params?: FinanceFilters) {
  const response = await apiClient.get<MerchantPayoutsListResponse>('/merchant-payouts', { params })
  return response.data
}

export async function createMerchantPayout(payload: CreateMerchantPayoutRequest) {
  const response = await apiClient.post<MerchantPayoutResponse>('/merchant-payouts', payload)
  return response.data
}

export async function getMerchantPayout(merchantPayoutId: string | number) {
  const response = await apiClient.get<MerchantPayoutResponse>(
    `/merchant-payouts/${merchantPayoutId}`,
  )
  return response.data
}

export async function updateMerchantPayout(
  merchantPayoutId: string | number,
  payload: UpdateMerchantPayoutRequest,
) {
  const response = await apiClient.put<MerchantPayoutResponse>(
    `/merchant-payouts/${merchantPayoutId}`,
    payload,
  )
  return response.data
}

export async function deleteMerchantPayout(merchantPayoutId: string | number) {
  const response = await apiClient.delete<DeleteFinanceResponse>(
    `/merchant-payouts/${merchantPayoutId}`,
  )
  return response.data
}

export async function approveMerchantPayout(merchantPayoutId: string | number) {
  const response = await apiClient.post<MerchantPayoutResponse>(
    `/merchant-payouts/${merchantPayoutId}/approve`,
  )
  return response.data
}

export async function rejectMerchantPayout(
  merchantPayoutId: string | number,
  payload: RejectMerchantPayoutRequest,
) {
  const response = await apiClient.post<MerchantPayoutResponse>(
    `/merchant-payouts/${merchantPayoutId}/reject`,
    payload,
  )
  return response.data
}

export async function completeMerchantPayout(
  merchantPayoutId: string | number,
  payload: CompleteMerchantPayoutRequest,
) {
  const response = await apiClient.post<MerchantPayoutResponse>(
    `/merchant-payouts/${merchantPayoutId}/complete`,
    payload,
  )
  return response.data
}

export async function listDriverCashClosures(params?: FinanceFilters) {
  const response = await apiClient.get<DriverCashClosuresListResponse>('/driver-cash-closures', {
    params,
  })
  return response.data
}

export async function createDriverCashClosure(payload: CreateDriverCashClosureRequest) {
  const response = await apiClient.post<DriverCashClosureResponse>(
    '/driver-cash-closures',
    payload,
  )
  return response.data
}

export async function getDriverCashClosure(driverCashClosureId: string | number) {
  const response = await apiClient.get<DriverCashClosureResponse>(
    `/driver-cash-closures/${driverCashClosureId}`,
  )
  return response.data
}

export async function updateDriverCashClosure(
  driverCashClosureId: string | number,
  payload: UpdateDriverCashClosureRequest,
) {
  const response = await apiClient.put<DriverCashClosureResponse>(
    `/driver-cash-closures/${driverCashClosureId}`,
    payload,
  )
  return response.data
}

export async function deleteDriverCashClosure(driverCashClosureId: string | number) {
  const response = await apiClient.delete<DeleteFinanceResponse>(
    `/driver-cash-closures/${driverCashClosureId}`,
  )
  return response.data
}

export async function listExpenses(params?: FinanceFilters) {
  const response = await apiClient.get<ExpensesListResponse>('/expenses', { params })
  return response.data
}

export async function createExpense(payload: CreateExpenseRequest) {
  const response = await apiClient.post<ExpenseResponse>('/expenses', payload)
  return response.data
}

export async function getExpense(expenseId: string | number) {
  const response = await apiClient.get<ExpenseResponse>(`/expenses/${expenseId}`)
  return response.data
}

export async function updateExpense(expenseId: string | number, payload: UpdateExpenseRequest) {
  const response = await apiClient.put<ExpenseResponse>(`/expenses/${expenseId}`, payload)
  return response.data
}

export async function deleteExpense(expenseId: string | number) {
  const response = await apiClient.delete<DeleteFinanceResponse>(`/expenses/${expenseId}`)
  return response.data
}

export async function approveExpense(expenseId: string | number) {
  const response = await apiClient.post<ExpenseResponse>(`/expenses/${expenseId}/approve`)
  return response.data
}

export async function rejectExpense(
  expenseId: string | number,
  payload: RejectExpenseRequest,
) {
  const response = await apiClient.post<ExpenseResponse>(`/expenses/${expenseId}/reject`, payload)
  return response.data
}

export async function markExpensePaid(
  expenseId: string | number,
  payload: MarkExpensePaidRequest,
) {
  const response = await apiClient.post<ExpenseResponse>(`/expenses/${expenseId}/mark-paid`, payload)
  return response.data
}

export async function getFinanceCompanyProfitSummary(params?: FinanceFilters) {
  const response = await apiClient.get<FinanceCompanyProfitSummaryResponse>(
    '/finance/company-profit-summary',
    { params: dateOnlyParams(params) },
  )
  return response.data
}

export async function getFinanceReconciliationSummary(params?: FinanceFilters) {
  const response = await apiClient.get<FinanceReconciliationSummaryResponse>(
    '/finance/reconciliation-summary',
    { params: dateOnlyParams(params) },
  )
  return response.data
}

export async function getFinanceDailyCashReport(params?: FinanceReportFilters) {
  const response = await apiClient.get<FinanceDailyCashReportResponse>('/finance/reports/daily-cash', {
    params,
  })
  return response.data
}

export async function getFinanceMerchantLedgerReport(params?: FinanceReportFilters) {
  const response = await apiClient.get<FinanceMerchantLedgerReportResponse>(
    '/finance/reports/merchant-ledger',
    { params },
  )
  return response.data
}

export async function getFinanceDriverDiscrepanciesReport(params?: FinanceReportFilters) {
  const response = await apiClient.get<FinanceDriverDiscrepanciesReportResponse>(
    '/finance/reports/driver-discrepancies',
    { params },
  )
  return response.data
}

export async function getFinanceWarehouseRevenueReport(params?: FinanceReportFilters) {
  const response = await apiClient.get<FinanceWarehouseRevenueReportResponse>(
    '/finance/reports/warehouse-revenue',
    { params },
  )
  return response.data
}

export async function getFinanceProfitLossReport(params?: FinanceReportFilters) {
  const response = await apiClient.get<FinanceProfitLossReportResponse>('/finance/reports/profit-loss', {
    params,
  })
  return response.data
}

export async function getFinanceOverview(params?: FinanceFilters) {
  const response = await apiClient.get<FinanceOverviewResponse>('/finance/reports/overview', {
    params,
  })
  return response.data
}

export async function getMerchantFinanceReport(merchantId: string | number, params?: FinanceFilters) {
  const response = await apiClient.get<MerchantFinanceReportResponse>(
    `/finance/reports/merchant/${merchantId}`,
    { params },
  )
  return response.data
}

export async function getDriverFinanceReport(params?: FinanceFilters) {
  const response = await apiClient.get<DriverFinanceReportResponse>('/finance/reports/drivers', {
    params: driverReportParams(params),
  })
  return response.data
}

export async function getFinanceExpensesReport(params?: FinanceFilters) {
  const response = await apiClient.get<FinanceExpensesReportResponse>('/finance/reports/expenses', {
    params,
  })
  return response.data
}

export async function getFinancePayoutsReport(params?: FinanceFilters) {
  const response = await apiClient.get<FinancePayoutsReportResponse>('/finance/reports/payouts', {
    params,
  })
  return response.data
}

export async function getMerchantWalletTransaction(transactionId: string | number) {
  const response = await apiClient.get<MerchantWalletTransactionResponse>(
    `/merchant-wallet-transactions/${transactionId}`,
  )
  return response.data
}

export async function approveMerchantWalletTransaction(transactionId: string | number) {
  const response = await apiClient.post<MerchantWalletTransactionResponse>(
    `/merchant-wallet-transactions/${transactionId}/approve`,
  )
  return response.data
}

export async function rejectMerchantWalletTransaction(
  transactionId: string | number,
  payload: RejectMerchantWalletTransactionPayload,
) {
  const response = await apiClient.post<MerchantWalletTransactionResponse>(
    `/merchant-wallet-transactions/${transactionId}/reject`,
    payload,
  )
  return response.data
}

export async function listMerchantInvoices(params?: FinanceFilters) {
  const response = await apiClient.get<MerchantInvoicesListResponse>('/merchant-invoices', {
    params,
  })
  return response.data
}

export async function createMerchantInvoice(payload: CreateMerchantInvoiceRequest) {
  const response = await apiClient.post<MerchantInvoiceResponse>('/merchant-invoices', payload)
  return response.data
}

export async function getMerchantInvoice(merchantInvoiceId: string | number) {
  const response = await apiClient.get<MerchantInvoiceResponse>(
    `/merchant-invoices/${merchantInvoiceId}`,
  )
  return response.data
}

export async function updateMerchantInvoice(
  merchantInvoiceId: string | number,
  payload: UpdateMerchantInvoiceRequest,
) {
  const response = await apiClient.put<MerchantInvoiceResponse>(
    `/merchant-invoices/${merchantInvoiceId}`,
    payload,
  )
  return response.data
}

export async function deleteMerchantInvoice(merchantInvoiceId: string | number) {
  const response = await apiClient.delete<DeleteFinanceResponse>(
    `/merchant-invoices/${merchantInvoiceId}`,
  )
  return response.data
}

export async function getMerchantInvoicePreview(merchantInvoiceId: string | number) {
  const response = await apiClient.get<MerchantInvoicePreviewResponse>(
    `/merchant-invoices/${merchantInvoiceId}/preview`,
  )
  return response.data
}

export async function downloadMerchantInvoice(merchantInvoiceId: string | number) {
  const response = await apiClient.get<Blob>(`/merchant-invoices/${merchantInvoiceId}/download`, {
    responseType: 'blob',
  })
  return response.data
}

export async function listTreasuryAccounts() {
  const response = await apiClient.get<TreasuryAccountsListResponse>('/treasury-accounts')
  return response.data
}

export async function createTreasuryAccount(payload: CreateTreasuryAccountRequest) {
  const response = await apiClient.post<TreasuryAccountResponse>('/treasury-accounts', payload)
  return response.data
}

export async function getTreasuryAccount(treasuryAccountId: string | number) {
  const response = await apiClient.get<TreasuryAccountResponse>(
    `/treasury-accounts/${treasuryAccountId}`,
  )
  return response.data
}

export async function updateTreasuryAccount(
  treasuryAccountId: string | number,
  payload: UpdateTreasuryAccountRequest,
) {
  const response = await apiClient.put<TreasuryAccountResponse>(
    `/treasury-accounts/${treasuryAccountId}`,
    payload,
  )
  return response.data
}

export async function deleteTreasuryAccount(treasuryAccountId: string | number) {
  const response = await apiClient.delete<DeleteFinanceResponse>(
    `/treasury-accounts/${treasuryAccountId}`,
  )
  return response.data
}

export async function listTreasuryTransactions(params?: FinanceFilters) {
  const response = await apiClient.get<TreasuryTransactionsListResponse>(
    '/treasury-transactions',
    { params },
  )
  return response.data
}
