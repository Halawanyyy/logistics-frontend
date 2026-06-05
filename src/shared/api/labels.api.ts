import { apiClient } from './axios'
import type {
  LabelDocument,
  LabelFormat,
  LabelPreviewPayload,
  LabelRequestOptions,
  LabelSettingsResponse,
  LabelTemplatesResponse,
  LabelTestPayload,
} from '../types/labels.types'

type LabelRequestConfig = {
  data?: unknown
  method?: 'get' | 'post'
  path: string
} & LabelRequestOptions

function getMimeType(responseTypeHeader: string, fallbackFormat?: LabelFormat) {
  if (responseTypeHeader) {
    return responseTypeHeader
  }

  if (fallbackFormat === 'pdf') {
    return 'application/pdf'
  }

  if (fallbackFormat === 'html') {
    return 'text/html'
  }

  if (fallbackFormat === 'json') {
    return 'application/json'
  }

  return 'text/plain'
}

function inferFormat(mimeType: string, fallbackFormat?: LabelFormat): LabelFormat {
  if (fallbackFormat) {
    return fallbackFormat
  }

  if (mimeType.includes('pdf')) {
    return 'pdf'
  }

  if (mimeType.includes('html')) {
    return 'html'
  }

  if (mimeType.includes('json')) {
    return 'json'
  }

  return 'zpl'
}

function parseFileName(disposition: string | undefined, fallback: string) {
  if (!disposition) {
    return fallback
  }

  const matches = disposition.match(/filename="?([^"]+)"?/)
  return matches?.[1] ?? fallback
}

async function buildLabelDocument(
  arrayBuffer: ArrayBuffer,
  mimeType: string,
  format: LabelFormat,
  fileName: string,
) {
  const blob = new Blob([arrayBuffer], { type: mimeType })
  const objectUrl = URL.createObjectURL(blob)
  const result: LabelDocument = {
    blob,
    fileName,
    format,
    mimeType,
    objectUrl,
  }

  if (format === 'html' || format === 'zpl' || format === 'tspl') {
    result.text = new TextDecoder().decode(arrayBuffer)
  }

  if (format === 'json') {
    const text = new TextDecoder().decode(arrayBuffer)
    result.text = text
    try {
      result.json = JSON.parse(text)
    } catch {
      result.json = { raw: text }
    }
  }

  return result
}

export async function requestLabelDocument(config: LabelRequestConfig) {
  const response = await apiClient.request<ArrayBuffer>({
    data: config.data,
    method: config.method ?? 'get',
    params: {
      ...(config.format ? { format: config.format } : {}),
      ...(config.width_mm ? { width_mm: config.width_mm } : {}),
      ...(config.height_mm ? { height_mm: config.height_mm } : {}),
      ...(config.download ? { download: 1 } : {}),
    },
    responseType: 'arraybuffer',
    transformResponse: [(value) => value],
    url: config.path,
  })

  const mimeType = getMimeType(String(response.headers['content-type'] ?? ''), config.format)
  const format = inferFormat(mimeType, config.format)
  const extension = format === 'html'
    ? 'html'
    : format === 'pdf'
      ? 'pdf'
      : format === 'json'
        ? 'json'
        : 'txt'
  const fallbackFileName = `label.${extension}`
  const fileName = parseFileName(response.headers['content-disposition'], fallbackFileName)

  return buildLabelDocument(response.data, mimeType, format, fileName)
}

export async function listLabelTemplates() {
  const response = await apiClient.get<LabelTemplatesResponse>('/labels/templates')
  return response.data
}

export async function getLabelSettings() {
  const response = await apiClient.get<LabelSettingsResponse>('/labels/settings')
  return response.data
}

export async function previewLabelDocument(payload: LabelPreviewPayload) {
  return requestLabelDocument({
    data: payload,
    format: payload.format,
    height_mm: payload.height_mm,
    method: 'post',
    path: '/labels/preview',
    width_mm: payload.width_mm,
  })
}

export async function testLabelDocument(payload: LabelTestPayload) {
  return requestLabelDocument({
    data: payload,
    format: payload.format,
    height_mm: payload.height_mm,
    method: 'post',
    path: '/labels/test',
    width_mm: payload.width_mm,
  })
}

export async function getWarehouseProductLabel(
  warehouseProductId: string | number,
  options: LabelRequestOptions,
) {
  return requestLabelDocument({
    ...options,
    path: `/warehouse-products/${warehouseProductId}/label`,
  })
}

export async function getWarehouseBinLabel(
  warehouseBinId: string | number,
  options: LabelRequestOptions,
) {
  return requestLabelDocument({
    ...options,
    path: `/warehouse-bins/${warehouseBinId}/label`,
  })
}

export async function getShipmentLabel(shipmentId: string | number, options: LabelRequestOptions) {
  return requestLabelDocument({
    ...options,
    path: `/shipments/${shipmentId}/label`,
  })
}

export async function getShipmentWaybill(shipmentId: string | number, options: LabelRequestOptions) {
  return requestLabelDocument({
    ...options,
    path: `/shipments/${shipmentId}/waybill`,
  })
}

export async function getOrderLabel(orderId: string | number, options: LabelRequestOptions) {
  return requestLabelDocument({
    ...options,
    path: `/orders/${orderId}/label`,
  })
}

export async function getDriverManifestPrintDocument(
  manifestId: string | number,
  options: Omit<LabelRequestOptions, 'format'> & { format?: Extract<LabelFormat, 'html' | 'pdf' | 'json'> },
) {
  return requestLabelDocument({
    ...options,
    path: `/driver-manifests/${manifestId}/print`,
  })
}

export async function getShipmentBulkLabels(
  shipmentIds: Array<string | number>,
  options: LabelRequestOptions,
) {
  return requestLabelDocument({
    data: {
      format: options.format,
      shipment_ids: shipmentIds,
    },
    format: options.format,
    height_mm: options.height_mm,
    method: 'post',
    path: '/shipments/labels/bulk',
    width_mm: options.width_mm,
  })
}

export async function getWarehouseProductBulkLabels(
  warehouseProductIds: Array<string | number>,
  options: LabelRequestOptions,
) {
  return requestLabelDocument({
    data: {
      format: options.format,
      items: warehouseProductIds.map((warehouse_product_id) => ({
        quantity: 1,
        warehouse_product_id,
      })),
    },
    format: options.format,
    height_mm: options.height_mm,
    method: 'post',
    path: '/warehouse-products/labels/bulk',
    width_mm: options.width_mm,
  })
}
