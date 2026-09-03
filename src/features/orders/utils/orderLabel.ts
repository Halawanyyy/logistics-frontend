import type { TFunction } from 'i18next'
import type { AppLocale } from '../../../shared/i18n/locale'
import type { LabelDocument, LabelRequestOptions } from '../../../shared/types/labels.types'
import {
  buildEntityLabelHtml,
  createBulkEntityLabelDocument,
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


function getOrderCustomerName(order: any) {
  return order.customer_name ?? order.customer?.name ?? order.customer?.customer_name ?? '-'
}

function getOrderCustomerPhone(order: any) {
  return order.customer_phone ?? order.customer?.phone ?? order.customer?.customer_phone ?? '-'
}

function getOrderMerchantName(order: any) {
  return order.merchant_name ?? order.merchant?.name ?? '-'
}

function getOrderCodAmount(order: any) {
  return order.cod_amount ?? order.payment_summary?.cod_amount ?? order.payment?.cod_amount ?? order.amounts?.cod_amount ?? null
}

function getOrderShippingFee(order: any) {
  return order.shipping_fee ?? order.delivery_fee ?? order.payment_summary?.shipping_fee ?? order.amounts?.shipping_fee ?? order.amounts?.delivery_fee ?? null
}

function getOrderDeliveryGov(order: any) {
  return order.delivery_governorate_name ?? order.delivery?.governorate_name ?? order.governorate_name ?? order.delivery_governorate?.name ?? order.delivery_governorate?.name_ar ?? order.delivery_governorate_id ?? '-'
}

function getOrderDeliveryArea(order: any) {
  return order.delivery_area_name ?? order.delivery?.area_name ?? order.area_name ?? order.delivery_area?.name ?? order.delivery_area?.name_ar ?? order.delivery_area_id ?? '-'
}

function getOrderDeliveryAddress(order: any) {
  return order.delivery_address ?? order.delivery?.address ?? order.address ?? '-'
}

function getOrderItemsCount(order: any) {
  return order.items?.length ?? order.items_count ?? order.order_items?.length ?? 0
}

function getOrderPaymentTypeLabel(order: any, t: TFunction) {
  const value = order.payment_type ?? order.payment_summary?.payment_type ?? order.payment?.type ?? null
  const label = order.payment_type_label ?? order.payment_summary?.payment_type_label ?? order.payment?.type_label ?? null
  return resolveDisplayLabel(t, value, label)
}

function buildOrderSubtitle(order: Order) {
  return [getOrderCustomerName(order), getOrderCustomerPhone(order), getOrderMerchantName(order)].filter(Boolean).join(' • ')
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
  const paymentType = getOrderPaymentTypeLabel(order, t)
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
      formatLabelText(getOrderMerchantName(order)),
      t('Status', { defaultValue: 'Status' }),
      formatLabelText(orderStatus),
    ),
    createLabelPairRow(
      t('Customer Name', { defaultValue: 'Customer Name' }),
      formatLabelText(getOrderCustomerName(order)),
      t('Customer Phone', { defaultValue: 'Customer Phone' }),
      formatLabelText(getOrderCustomerPhone(order)),
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
      formatLabelMoney(getOrderCodAmount(order), locale),
      t('Shipping Fee', { defaultValue: 'Shipping Fee' }),
      formatLabelMoney(getOrderShippingFee(order), locale),
    ),
    createLabelPairRow(
      t('Governorate / Area', { defaultValue: 'Governorate / Area' }),
      formatLabelText([getOrderDeliveryGov(order), getOrderDeliveryArea(order)].filter(Boolean).join(' / ')),
      t('Items', { defaultValue: 'Items' }),
      formatLabelText(String(getOrderItemsCount(order))),
    ),
    createLabelFullWidthRow(
      t('Barcode', { defaultValue: 'Barcode' }),
      formatLabelText(barcodeDisplayValue),
    ),
    createLabelFullWidthRow(
      t('Address', { defaultValue: 'Address' }),
      formatLabelText(getOrderDeliveryAddress(order)),
    ),
  ]

  return buildEntityLabelHtml({
    barcodeDisplayValue,
    barcodeLabel: t('Order Number', { defaultValue: 'Order Number' }),
    barcodeMarkup,
    codeText: order.order_number,
    details,
    dimensions,
    eyebrow: t('Order Waybill', { defaultValue: 'Order Waybill' }),
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

export async function buildBulkOrderLabelDocument({
  dimensions,
  locale,
  orders,
  t,
}: {
  dimensions?: LabelDimensions
  locale: AppLocale
  orders: Order[]
  t: TFunction
}) {
  const labels = await Promise.all(orders.map(async (order) => {
    const barcodeValue = resolveOrderBarcodeValue(order) || order.order_number
    const barcodeMarkup = await generateBarcodeMarkup(barcodeValue)

    return buildOrderLabelHtml({
      barcodeDisplayValue: barcodeValue || t('Missing barcode value', { defaultValue: 'Missing barcode value' }),
      barcodeMarkup,
      dimensions,
      locale,
      order,
      t,
    })
  }))

  return createBulkEntityLabelDocument({
    dimensions,
    fileName: `bulk-order-labels-${orders.length}.html`,
    labels,
    locale,
    title: t('Bulk Order Labels ({{count}})', {
      count: orders.length,
      defaultValue: `Bulk Order Labels (${orders.length})`,
    }),
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
