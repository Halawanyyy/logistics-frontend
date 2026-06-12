import type { TFunction } from 'i18next'
import type { AppLocale } from '../../../shared/i18n/locale'
import type { LabelDocument, LabelRequestOptions } from '../../../shared/types/labels.types'
import {
  buildEntityLabelHtml,
  createBulkEntityLabelDocument,
  createEntityLabelDocument,
  createLabelFullWidthRow,
  createLabelPairRow,
  formatLabelBoolean,
  formatLabelText,
  generateBarcodeMarkup,
  getFrontendPrintableLabelDocument,
  resolveBarcodeValue,
  resolveDisplayLabel,
  type LabelDimensions,
} from '../../../shared/utils/entityLabel'
import type { WarehouseProduct } from '../types/warehouse.types'

function resolveProductBarcodeValue(product: WarehouseProduct) {
  return resolveBarcodeValue([
    product.barcode,
    product.sku,
    String(product.id),
  ])
}

function buildProductSubtitle(product: WarehouseProduct) {
  return [product.merchant_name, product.sku].filter(Boolean).join(' • ')
}

export function buildProductLabelHtml({
  barcodeDisplayValue,
  barcodeMarkup,
  dimensions,
  product,
  t,
}: {
  barcodeDisplayValue: string
  barcodeMarkup: string | null
  dimensions?: LabelDimensions
  product: WarehouseProduct
  t: TFunction
}) {
  const status = resolveDisplayLabel(t, product.status, product.status_label)
  const barcodeType = resolveDisplayLabel(t, product.barcode_type, null)
  const details = [
    createLabelPairRow(
      t('Product', { defaultValue: 'Product' }),
      formatLabelText(product.name),
      t('SKU', { defaultValue: 'SKU' }),
      formatLabelText(product.sku),
    ),
    createLabelPairRow(
      t('Merchant', { defaultValue: 'Merchant' }),
      formatLabelText(product.merchant_name),
      t('Status', { defaultValue: 'Status' }),
      formatLabelText(status),
    ),
    createLabelPairRow(
      t('Barcode', { defaultValue: 'Barcode' }),
      formatLabelText(product.barcode),
      t('Barcode Type', { defaultValue: 'Barcode Type' }),
      formatLabelText(barcodeType),
    ),
    createLabelPairRow(
      t('Weight', { defaultValue: 'Weight' }),
      formatLabelText(product.unit_weight),
      t('Fragile', { defaultValue: 'Fragile' }),
      formatLabelBoolean(product.is_fragile, t),
    ),
    createLabelPairRow(
      t('Requires Packaging', { defaultValue: 'Requires Packaging' }),
      formatLabelBoolean(product.requires_packaging, t),
      t('Created', { defaultValue: 'Created' }),
      formatLabelText(product.created_at),
    ),
    createLabelPairRow(
      t('Length', { defaultValue: 'Length' }),
      formatLabelText(product.unit_length),
      t('Width', { defaultValue: 'Width' }),
      formatLabelText(product.unit_width),
    ),
    createLabelPairRow(
      t('Height', { defaultValue: 'Height' }),
      formatLabelText(product.unit_height),
      t('Minimum Stock', { defaultValue: 'Minimum Stock' }),
      formatLabelText(product.minimum_stock_quantity == null ? '' : String(product.minimum_stock_quantity)),
    ),
    createLabelFullWidthRow(
      t('Description', { defaultValue: 'Description' }),
      formatLabelText(product.description),
    ),
    createLabelFullWidthRow(
      t('Notes', { defaultValue: 'Notes' }),
      formatLabelText(product.notes),
    ),
  ]

  return buildEntityLabelHtml({
    barcodeDisplayValue,
    barcodeLabel: t('SKU', { defaultValue: 'SKU' }),
    barcodeMarkup,
    codeText: product.sku,
    details,
    dimensions,
    eyebrow: t('Product Label', { defaultValue: 'Product Label' }),
    subtitle: buildProductSubtitle(product),
    title: product.name,
  })
}

export async function buildProductLabelDocument({
  dimensions,
  fileName,
  locale,
  product,
  t,
}: {
  dimensions?: LabelDimensions
  fileName?: string
  locale: AppLocale
  product: WarehouseProduct
  t: TFunction
}) {
  const barcodeValue = resolveProductBarcodeValue(product) || product.sku || product.name
  const barcodeMarkup = await generateBarcodeMarkup(barcodeValue)
  const html = buildProductLabelHtml({
    barcodeDisplayValue: barcodeValue || t('Missing barcode value', { defaultValue: 'Missing barcode value' }),
    barcodeMarkup,
    dimensions,
    product,
    t,
  })
  const title = t('Product Label - {{name}}', {
    defaultValue: `Product Label - ${product.name}`,
    name: product.name,
  })

  return createEntityLabelDocument({
    dimensions,
    fileName: fileName ?? `product-label-${product.sku || product.id}.html`,
    html,
    locale,
    title,
  })
}

export async function buildBulkProductLabelDocument({
  dimensions,
  locale,
  products,
  t,
}: {
  dimensions?: LabelDimensions
  locale: AppLocale
  products: WarehouseProduct[]
  t: TFunction
}) {
  const labels = await Promise.all(products.map(async (product) => {
    const barcodeValue = resolveProductBarcodeValue(product) || product.sku || product.name
    const barcodeMarkup = await generateBarcodeMarkup(barcodeValue)

    return buildProductLabelHtml({
      barcodeDisplayValue: barcodeValue || t('Missing barcode value', { defaultValue: 'Missing barcode value' }),
      barcodeMarkup,
      dimensions,
      product,
      t,
    })
  }))

  return createBulkEntityLabelDocument({
    dimensions,
    fileName: `bulk-product-labels-${products.length}.html`,
    labels,
    locale,
    title: t('Bulk Product Labels ({{count}})', {
      count: products.length,
      defaultValue: `Bulk Product Labels (${products.length})`,
    }),
  })
}

export async function getProductPrintableLabelDocument({
  fetchDocument,
  locale,
  options,
  product,
  t,
}: {
  fetchDocument: (options: LabelRequestOptions) => Promise<LabelDocument>
  locale: AppLocale
  options: LabelRequestOptions
  product: WarehouseProduct
  t: TFunction
}) {
  return getFrontendPrintableLabelDocument({
    buildDocument: (dimensions) => buildProductLabelDocument({
      dimensions,
      fileName: `product-label-${product.sku || product.id}.html`,
      locale,
      product,
      t,
    }),
    fetchDocument,
    options,
  })
}
