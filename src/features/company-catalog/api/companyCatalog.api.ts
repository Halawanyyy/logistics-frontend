import { apiClient } from '../../../shared/api/axios'
import type {
  CompanyCatalogItemFilters,
  CompanyCatalogItemResponse,
  CompanyCatalogItemsListResponse,
  CreateCompanyCatalogItemRequest,
  DeleteCompanyCatalogItemResponse,
  UpdateCompanyCatalogItemRequest,
} from '../types/companyCatalog.types'

export async function listCompanyCatalogItems(params?: CompanyCatalogItemFilters) {
  const response = await apiClient.get<CompanyCatalogItemsListResponse>('/company-catalog-items', { params })
  return response.data
}

export async function getCompanyCatalogItem(companyCatalogItemId: string | number) {
  const response = await apiClient.get<CompanyCatalogItemResponse>(`/company-catalog-items/${companyCatalogItemId}`)
  return response.data
}

export async function createCompanyCatalogItem(payload: CreateCompanyCatalogItemRequest) {
  const response = await apiClient.post<CompanyCatalogItemResponse>('/company-catalog-items', payload)
  return response.data
}

export async function updateCompanyCatalogItem(
  companyCatalogItemId: string | number,
  payload: UpdateCompanyCatalogItemRequest,
) {
  const response = await apiClient.put<CompanyCatalogItemResponse>(`/company-catalog-items/${companyCatalogItemId}`, payload)
  return response.data
}

export async function deleteCompanyCatalogItem(companyCatalogItemId: string | number) {
  const response = await apiClient.delete<DeleteCompanyCatalogItemResponse>(`/company-catalog-items/${companyCatalogItemId}`)
  return response.data
}
