import type { TFunction } from 'i18next'
import { type AppLocale } from '../../../shared/i18n/locale'
import type { LabelDocument, LabelRequestOptions } from '../../../shared/types/labels.types'
import {
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
  buildEntityLabelHtml,
} from '../../../shared/utils/entityLabel'
import type { Shipment } from '../types/shipment.types'

type ShipmentOrderLike = {
  number?: string | null
  order_number?: string | null
  payment?: {
    type?: string | null
    type_label?: string | null
  } | null
  payment_type?: string | null
  payment_type_label?: string | null
}

type ShipmentLabelBarcodeFields = Shipment & Partial<Record<
  'awb' | 'awb_number' | 'barcode' | 'barcode_value' | 'tracking_code' | 'tracking_number',
  string | null
>> & {
  order?: ShipmentOrderLike | null
  order_payment_type?: string | null
  payment?: {
    type?: string | null
    type_label?: string | null
  } | null
  payment_method?: string | null
  payment_method_label?: string | null
}

function logShipmentLabel(message: string, details?: Record<string, unknown>) {
  if (!import.meta.env.DEV || typeof console === 'undefined') {
    return
  }

  console.info('[shipment-label]', message, details ?? {})
}

function resolveOrderNumber(shipment: ShipmentLabelBarcodeFields) {
  return shipment.order?.order_number?.trim()
    || shipment.order_number?.trim()
    || shipment.order?.number?.trim()
    || (shipment.order_id ? String(shipment.order_id) : '')
}

function resolvePaymentType(shipment: ShipmentLabelBarcodeFields, t: TFunction) {
  const labeledValue = shipment.payment_type_label?.trim()
    || shipment.payment_type?.trim()
    || shipment.order?.payment_type_label?.trim()
    || shipment.order?.payment_type?.trim()
    || shipment.order?.payment?.type_label?.trim()
    || shipment.order?.payment?.type?.trim()
    || shipment.payment?.type_label?.trim()
    || shipment.payment?.type?.trim()
    || shipment.order_payment_type?.trim()
    || shipment.payment_method_label?.trim()
    || shipment.payment_method?.trim()

  if (labeledValue) {
    return resolveDisplayLabel(t, labeledValue, shipment.payment_type_label ?? shipment.order?.payment_type_label ?? shipment.order?.payment?.type_label ?? shipment.payment?.type_label ?? shipment.payment_method_label)
  }

  const codAmount = Number(shipment.cod_amount)
  if (!Number.isNaN(codAmount) && codAmount > 0) {
    return t('cod', { defaultValue: 'COD' })
  }

  if (import.meta.env.DEV) {
    logShipmentLabel('payment type missing after inspected fields', {
      order: shipment.order,
      order_payment_type: shipment.order_payment_type,
      payment: shipment.payment,
      payment_method: shipment.payment_method,
      payment_method_label: shipment.payment_method_label,
      payment_type: shipment.payment_type,
      payment_type_label: shipment.payment_type_label,
      shipmentId: shipment.id,
    })
  }

  return ''
}

function getBarcodeValue(shipment: ShipmentLabelBarcodeFields) {
  return resolveBarcodeValue([
    shipment.barcode,
    shipment.barcode_value,
    shipment.awb,
    shipment.awb_number,
    shipment.tracking_number,
    shipment.tracking_code,
    shipment.shipment_number,
  ])
}

export function buildShipmentLabelHtml({
  barcodeDisplayValue,
  barcodeMarkup,
  dimensions,
  locale,
  shipment,
  t,
}: {
  barcodeDisplayValue: string
  barcodeMarkup: string | null
  dimensions?: LabelDimensions
  locale: AppLocale
  shipment: Shipment
  t: TFunction
}) {
  const shipmentRecord = shipment as ShipmentLabelBarcodeFields
  const resolvedOrderNumber = resolveOrderNumber(shipmentRecord)
  const resolvedPaymentType = resolvePaymentType(shipmentRecord, t)
  const shipmentStatus = resolveDisplayLabel(t, shipment.status, shipment.status_label)
  const orderType = resolveDisplayLabel(t, shipment.order_type, null)
  const fulfillmentType = resolveDisplayLabel(t, shipment.fulfillment_type, null)
  const details = [
    createLabelPairRow(
      t('Shipment Number', { defaultValue: 'Shipment Number' }),
      formatLabelText(shipment.shipment_number),
      t('Order Number', { defaultValue: 'Order Number' }),
      formatLabelText(resolvedOrderNumber),
    ),
    createLabelPairRow(
      t('Merchant', { defaultValue: 'Merchant' }),
      formatLabelText(shipment.merchant_name),
      t('Status', { defaultValue: 'Status' }),
      formatLabelText(shipmentStatus),
    ),
    createLabelPairRow(
      t('Customer Name', { defaultValue: 'Customer Name' }),
      formatLabelText(shipment.customer_name),
      t('Customer Phone', { defaultValue: 'Customer Phone' }),
      formatLabelText(shipment.customer_phone),
    ),
    createLabelPairRow(
      t('Payment Type', { defaultValue: 'Payment Type' }),
      formatLabelText(resolvedPaymentType),
      t('COD Amount', { defaultValue: 'COD Amount' }),
      formatLabelMoney(shipment.cod_amount, locale),
    ),
    createLabelPairRow(
      t('Order Type', { defaultValue: 'Order Type' }),
      formatLabelText(orderType),
      t('Fulfillment Type', { defaultValue: 'Fulfillment Type' }),
      formatLabelText(fulfillmentType),
    ),
    createLabelPairRow(
      t('Governorate / Area', { defaultValue: 'Governorate / Area' }),
      formatLabelText([shipment.delivery_governorate_name, shipment.delivery_area_name].filter(Boolean).join(' / ')),
      t('Shipping Fee', { defaultValue: 'Shipping Fee' }),
      formatLabelMoney(shipment.shipping_fee, locale),
    ),
    createLabelFullWidthRow(
      t('Barcode', { defaultValue: 'Barcode' }),
      formatLabelText(barcodeDisplayValue),
    ),
    createLabelFullWidthRow(
      t('Address', { defaultValue: 'Address' }),
      formatLabelText(shipment.delivery_address),
    ),
  ]

  return buildEntityLabelHtml({
    barcodeDisplayValue,
    barcodeLabel: t('Shipment Number', { defaultValue: 'Shipment Number' }),
    barcodeMarkup,
    codeText: shipment.shipment_number,
    details,
    dimensions,
    eyebrow: t('Shipment Waybill', { defaultValue: 'Shipment Waybill' }),
    subtitle: [shipment.customer_name, shipment.customer_phone].filter(Boolean).join(' • '),
    title: shipment.shipment_number,
  })
}

export async function buildShipmentLabelDocument({
  dimensions,
  fileName,
  locale,
  shipment,
  t,
}: {
  dimensions?: LabelDimensions
  fileName?: string
  locale: AppLocale
  shipment: Shipment
  t: TFunction
}) {
  const shipmentWithBarcode = shipment as ShipmentLabelBarcodeFields
  const barcodeValue = getBarcodeValue(shipmentWithBarcode) || shipment.shipment_number
  const barcodeMarkup = await generateBarcodeMarkup(barcodeValue)
  const html = buildShipmentLabelHtml({
    barcodeDisplayValue: barcodeValue || t('Missing barcode value', { defaultValue: 'Missing barcode value' }),
    barcodeMarkup,
    dimensions,
    locale,
    shipment,
    t,
  })
  const title = t('Shipment Label - {{shipmentNumber}}', {
    defaultValue: `Shipment Label - ${shipment.shipment_number}`,
    shipmentNumber: shipment.shipment_number,
  })

  return createEntityLabelDocument({
    dimensions,
    fileName: fileName ?? `shipment-label-${shipment.shipment_number}.html`,
    html,
    locale,
    title,
  })
}

export async function buildBulkShipmentLabelDocument({
  dimensions,
  locale,
  shipments,
  t,
}: {
  dimensions?: LabelDimensions
  locale: AppLocale
  shipments: Shipment[]
  t: TFunction
}) {
  const labels = await Promise.all(shipments.map(async (shipment) => {
    const shipmentRecord = shipment as ShipmentLabelBarcodeFields
    const barcodeValue = getBarcodeValue(shipmentRecord) || shipment.shipment_number
    const barcodeMarkup = await generateBarcodeMarkup(barcodeValue)

    return buildShipmentLabelHtml({
      barcodeDisplayValue: barcodeValue || t('Missing barcode value', { defaultValue: 'Missing barcode value' }),
      barcodeMarkup,
      dimensions,
      locale,
      shipment,
      t,
    })
  }))

  return createBulkEntityLabelDocument({
    dimensions,
    fileName: `bulk-shipment-labels-${shipments.length}.html`,
    labels,
    locale,
    title: t('Bulk Shipment Labels ({{count}})', {
      count: shipments.length,
      defaultValue: `Bulk Shipment Labels (${shipments.length})`,
    }),
  })
}

export async function getShipmentPrintableLabelDocument({
  fetchDocument,
  locale,
  options,
  shipment,
  t,
}: {
  fetchDocument: (options: LabelRequestOptions) => Promise<LabelDocument>
  locale: AppLocale
  options: LabelRequestOptions
  shipment: Shipment
  t: TFunction
}) {
  logShipmentLabel('getShipmentPrintableLabelDocument() running', {
    format: options.format ?? 'html',
    shipmentId: shipment.id,
    shipmentNumber: shipment.shipment_number,
  })

  return getFrontendPrintableLabelDocument({
    buildDocument: (dimensions) => buildShipmentLabelDocument({
      dimensions,
      fileName: `shipment-label-${shipment.shipment_number}.html`,
      locale,
      shipment,
      t,
    }),
    fetchDocument,
    options,
  })
}
