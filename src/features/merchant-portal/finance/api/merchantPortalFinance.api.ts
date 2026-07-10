import { apiClient } from '../../../../shared/api/axios'
import { guardMerchantId } from '../../api/merchantPortal.api'
import type { LabelDocument, LabelRequestOptions } from '../../../../shared/components/labels/types'
import type {
  MerchantFinanceSummary,
  MerchantWalletSummary,
  MerchantWalletTransaction,
  MerchantWalletTransactionFilters,
  MerchantWalletTransactionListResponse,
  MerchantInvoice,
  MerchantInvoiceFilters,
  MerchantInvoiceListResponse,
  MerchantPayout,
  MerchantPayoutFilters,
  MerchantPayoutListResponse,
  MerchantPayoutRequestPayload,
} from '../types/merchantPortalFinance.types'

export async function getMerchantPortalFinanceSummary() {
  const response = await apiClient.get<{ data: MerchantFinanceSummary }>('/merchant-portal/finance/summary')
  return response.data
}

export async function getMerchantPortalWalletSummary() {
  const response = await apiClient.get<{ data: MerchantWalletSummary }>('/merchant-portal/finance/wallet/summary')
  return response.data
}

export async function listMerchantPortalWalletTransactions(page = 1, params?: MerchantWalletTransactionFilters) {
  guardMerchantId(params)
  const response = await apiClient.get<MerchantWalletTransactionListResponse>('/merchant-portal/finance/wallet/transactions', {
    params: { ...params, page },
  })
  return response.data
}

export async function getMerchantPortalWalletTransaction(transactionId: string | number) {
  const response = await apiClient.get<{ data: MerchantWalletTransaction }>(`/merchant-portal/finance/wallet/transactions/${transactionId}`)
  return response.data
}

export async function listMerchantPortalInvoices(page = 1, params?: MerchantInvoiceFilters) {
  guardMerchantId(params)
  const response = await apiClient.get<MerchantInvoiceListResponse>('/merchant-portal/finance/invoices', {
    params: { ...params, page },
  })
  return response.data
}

export async function getMerchantPortalInvoice(invoiceId: string | number) {
  const response = await apiClient.get<{ data: MerchantInvoice }>(`/merchant-portal/finance/invoices/${invoiceId}`)
  return response.data
}

export async function previewMerchantPortalInvoice({ referenceId }: LabelRequestOptions): Promise<LabelDocument> {
  const response = await apiClient.get<{ data: string }>(`/merchant-portal/finance/invoices/${referenceId}/preview`)
  return {
    content: response.data.data,
    contentType: 'text/html',
  }
}

export async function downloadMerchantPortalInvoice(invoiceId: string | number) {
  const response = await apiClient.get(`/merchant-portal/finance/invoices/${invoiceId}/download`, {
    responseType: 'blob',
  })
  return response.data
}

export async function listMerchantPortalPayouts(page = 1, params?: MerchantPayoutFilters) {
  guardMerchantId(params)
  const response = await apiClient.get<MerchantPayoutListResponse>('/merchant-portal/finance/payouts', {
    params: { ...params, page },
  })
  return response.data
}

export async function getMerchantPortalPayout(payoutId: string | number) {
  const response = await apiClient.get<{ data: MerchantPayout }>(`/merchant-portal/finance/payouts/${payoutId}`)
  return response.data
}

export async function requestMerchantPortalPayout(payload: MerchantPayoutRequestPayload) {
  guardMerchantId(payload)
  const response = await apiClient.post<{ data: MerchantPayout }>('/merchant-portal/finance/payouts/request', payload)
  return response.data
}
