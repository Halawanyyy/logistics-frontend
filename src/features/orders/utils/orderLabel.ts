import type { TFunction } from 'i18next'
import type { AppLocale } from '../../../shared/i18n/locale'
import type { LabelDocument, LabelRequestOptions } from '../../../shared/types/labels.types'
import {
  buildEntityLabelHtml,
  createEntityLabelDocument,
  createLabelFullWidthRow,
  createLabelPairRow,
  formatLabelMoney,
  formatLabelText,
  generateBarcodeMarkup,
  getFrontendPrintableLabelDocument,
  resolveBarcodeValue,
  resolveDisplayLabel,
  type LabelDimensions,
} from '../../../shared/utils/entityLabel'
import type { Order } from '../types/order.types'

function resolveOrderBarcodeValue(order: Order) {
  return resolveBarcodeValue([
    order.external_order_number,
    order.external_order_id,
    order.shipment?.shipment_number,
    order.shipment_number,
    order.order_number,
  ])
}

function buildOrderSubtitle(order: Order) {
  return [order.customer_name, order.customer_phone, order.merchant_name].filter(Boolean).join(' • ')
}

export function buildOrderLabelHtml({
  barcodeDisplayValue,
  barcodeMarkup,
  dimensions,
  locale,
  order,
  t,
}: {
  barcodeDisplayValue: string
  barcodeMarkup: string | null
  dimensions?: LabelDimensions
  locale: AppLocale
  order: Order
  t: TFunction
}) {
  const paymentType = resolveDisplayLabel(t, order.payment_type, order.payment_type_label)
  const fulfillmentType = resolveDisplayLabel(t, order.fulfillment_type, order.fulfillment_type_label)
  const orderType = resolveDisplayLabel(t, order.order_type, null)
  const orderStatus = resolveDisplayLabel(t, order.status, order.status_label)
  const warehouseFlow = resolveDisplayLabel(t, order.warehouse_fulfillment_status, order.warehouse_fulfillment_status_label)

  const details = [
    createLabelPairRow(
      t('Order Number', { defaultValue: 'Order Number' }),
      formatLabelText(order.order_number),
      t('Shipment Number', { defaultValue: 'Shipment Number' }),
      formatLabelText(order.shipment?.shipment_number ?? order.shipment_number ?? ''),
    ),
    createLabelPairRow(
      t('Merchant', { defaultValue: 'Merchant' }),
      formatLabelText(order.merchant_name),
      t('Status', { defaultValue: 'Status' }),
      formatLabelText(orderStatus),
    ),
    createLabelPairRow(
      t('Customer Name', { defaultValue: 'Customer Name' }),
      formatLabelText(order.customer_name),
      t('Customer Phone', { defaultValue: 'Customer Phone' }),
      formatLabelText(order.customer_phone),
    ),
    createLabelPairRow(
      t('Payment Type', { defaultValue: 'Payment Type' }),
      formatLabelText(paymentType),
      t('Fulfillment Type', { defaultValue: 'Fulfillment Type' }),
      formatLabelText(fulfillmentType),
    ),
    createLabelPairRow(
      t('Order Type', { defaultValue: 'Order Type' }),
      formatLabelText(orderType),
      t('Warehouse Flow', { defaultValue: 'Warehouse Flow' }),
      formatLabelText(warehouseFlow),
    ),
    createLabelPairRow(
      t('COD Amount', { defaultValue: 'COD Amount' }),
      formatLabelMoney(order.cod_amount, locale),
      t('Shipping Fee', { defaultValue: 'Shipping Fee' }),
      formatLabelMoney(order.shipping_fee, locale),
    ),
    createLabelPairRow(
      t('Governorate / Area', { defaultValue: 'Governorate / Area' }),
      formatLabelText([order.delivery_governorate_name, order.delivery_area_name].filter(Boolean).join(' / ')),
      t('Items', { defaultValue: 'Items' }),
      formatLabelText(String(order.items.length)),
    ),
    createLabelFullWidthRow(
      t('Barcode', { defaultValue: 'Barcode' }),
      formatLabelText(barcodeDisplayValue),
    ),
    createLabelFullWidthRow(
      t('Address', { defaultValue: 'Address' }),
      formatLabelText(order.delivery_address),
    ),
  ]

  return buildEntityLabelHtml({
    barcodeDisplayValue,
    barcodeLabel: t('Order Number', { defaultValue: 'Order Number' }),
    barcodeMarkup,
    codeText: order.order_number,
    details,
    dimensions,
    eyebrow: t('Order Label', { defaultValue: 'Order Label' }),
    subtitle: buildOrderSubtitle(order),
    title: order.order_number,
  })
}

export async function buildOrderLabelDocument({
  dimensions,
  fileName,
  locale,
  order,
  t,
}: {
  dimensions?: LabelDimensions
  fileName?: string
  locale: AppLocale
  order: Order
  t: TFunction
}) {
  const barcodeValue = resolveOrderBarcodeValue(order) || order.order_number
  const barcodeMarkup = await generateBarcodeMarkup(barcodeValue)
  const html = buildOrderLabelHtml({
    barcodeDisplayValue: barcodeValue || t('Missing barcode value', { defaultValue: 'Missing barcode value' }),
    barcodeMarkup,
    dimensions,
    locale,
    order,
    t,
  })
  const title = t('Order Label - {{orderNumber}}', {
    defaultValue: `Order Label - ${order.order_number}`,
    orderNumber: order.order_number,
  })

  return createEntityLabelDocument({
    dimensions,
    fileName: fileName ?? `order-label-${order.order_number}.html`,
    html,
    locale,
    title,
  })
}

export async function getOrderPrintableLabelDocument({
  fetchDocument,
  locale,
  options,
  order,
  t,
}: {
  fetchDocument: (options: LabelRequestOptions) => Promise<LabelDocument>
  locale: AppLocale
  options: LabelRequestOptions
  order: Order
  t: TFunction
}) {
  return getFrontendPrintableLabelDocument({
    buildDocument: (dimensions) => buildOrderLabelDocument({
      dimensions,
      fileName: `order-label-${order.order_number}.html`,
      locale,
      order,
      t,
    }),
    fetchDocument,
    options,
  })
}
