export const COMPANY_CATALOG_ITEM_TYPES = [
  'packaging_product',
  'storage_service',
  'fulfillment_service',
  'other_service',
] as const

export const COMPANY_CATALOG_ITEM_STATUSES = ['active', 'inactive'] as const

export type CompanyCatalogItemType = (typeof COMPANY_CATALOG_ITEM_TYPES)[number]
export type CompanyCatalogItemStatus = (typeof COMPANY_CATALOG_ITEM_STATUSES)[number]

export type CompanyCatalogItem = {
  id: number
  type: CompanyCatalogItemType
  category: string | null
  name: string
  sku: string | null
  description: string | null
  unit_price: string
  currency: string | null
  size_label: string | null
  length: number | string | null
  width: number | string | null
  unit: string | null
  is_visible_to_merchants: boolean
  sort_order: number
  status: CompanyCatalogItemStatus | string
  status_label?: string | null
  created_at?: string
  updated_at?: string
}

export type CompanyCatalogItemFilters = {
  type?: CompanyCatalogItemType
  category?: string
  status?: string
  is_visible_to_merchants?: boolean | '0' | '1' | string
  search?: string
}

export type CompanyCatalogItemsListResponse = {
  data: CompanyCatalogItem[]
}

export type CompanyCatalogItemResponse = {
  data: CompanyCatalogItem
}

export type CreateCompanyCatalogItemRequest = {
  type: CompanyCatalogItemType
  category?: string | null
  name: string
  sku?: string | null
  description?: string | null
  unit_price: number
  currency?: string | null
  size_label?: string | null
  length?: number | null
  width?: number | null
  unit?: string | null
  is_visible_to_merchants: boolean
  sort_order?: number | null
  status: CompanyCatalogItemStatus | string
}

export type UpdateCompanyCatalogItemRequest = Partial<CreateCompanyCatalogItemRequest>

export type DeleteCompanyCatalogItemResponse = {
  message: string
}

export type OrderPackagingItem = {
  id: number
  company_catalog_item_id: number
  item_name: string
  item_sku: string | null
  category: string | null
  size_label: string | null
  unit_price: string
  quantity: number
  total_price: string
  notes: string | null
}

export type OrderPackagingItemRequest = {
  company_catalog_item_id: number
  quantity: number
  notes?: string
}
