export type MerchantShopPackagingProduct = {
  id: number
  type: string
  name: string
  sku?: string | null
  unit_price: string | number
  currency: string
  status: string
}

export type MerchantShopStorageFeeRule = {
  id: number
  name: string
  calculation_type: string
  free_units: number
  unit_price: string | number
  status: string
}

export type MerchantShopPickPackFeeRule = {
  id: number
  name: string
  pick_fee_first_item: string | number
  pick_fee_additional_item: string | number
  packing_fee_base: string | number
  fragile_extra_fee: string | number
  status: string
}

export type MerchantShopService = {
  id: number
  type: string
  name: string
  unit_price: string | number
  currency: string
  status: string
}

export type MerchantShopPreviewData = {
  packaging_products?: MerchantShopPackagingProduct[]
  storage_fees?: MerchantShopStorageFeeRule[]
  pick_pack_fees?: MerchantShopPickPackFeeRule[]
  services?: MerchantShopService[]
}

export type MerchantShopPreviewResponse = {
  data: MerchantShopPreviewData
}
