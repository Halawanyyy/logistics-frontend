import { apiClient } from '../../../shared/api/axios'
import type {
  DashboardFilters,
  DashboardSummaryResponse,
  FinanceCompanyProfitSummaryResponse,
  FinanceOverviewResponse,
  FinanceReconciliationSummaryResponse,
} from '../types/dashboard.types'

function buildDashboardParams(params?: DashboardFilters) {
  return {
    ...(params?.date_from ? { date_from: params.date_from } : {}),
    ...(params?.date_to ? { date_to: params.date_to } : {}),
    ...(params?.merchant_id ? { merchant_id: params.merchant_id } : {}),
    ...(params?.assigned_driver_id ? { assigned_driver_id: params.assigned_driver_id } : {}),
  }
}

function buildDateParams(params?: DashboardFilters) {
  return {
    ...(params?.date_from ? { date_from: params.date_from } : {}),
    ...(params?.date_to ? { date_to: params.date_to } : {}),
  }
}

function buildFinanceOverviewParams(params?: DashboardFilters) {
  return {
    ...buildDateParams(params),
    ...(params?.merchant_id ? { merchant_id: params.merchant_id } : {}),
    ...(params?.assigned_driver_id ? { driver_id: params.assigned_driver_id } : {}),
  }
}

export async function getDashboardSummary(params?: DashboardFilters) {
  const response = await apiClient.get<DashboardSummaryResponse>('/dashboard/summary', {
    params: buildDashboardParams(params),
  })
  return response.data
}

export async function getFinanceCompanyProfitSummary(params?: DashboardFilters) {
  const response = await apiClient.get<FinanceCompanyProfitSummaryResponse>(
    '/finance/company-profit-summary',
    {
      params: buildDateParams(params),
    },
  )
  return response.data
}

export async function getFinanceReconciliationSummary(params?: DashboardFilters) {
  const response = await apiClient.get<FinanceReconciliationSummaryResponse>(
    '/finance/reconciliation-summary',
    {
      params: buildDateParams(params),
    },
  )
  return response.data
}

export async function getFinanceOverview(params?: DashboardFilters) {
  const response = await apiClient.get<FinanceOverviewResponse>('/finance/reports/overview', {
    params: buildFinanceOverviewParams(params),
  })
  return response.data
}
