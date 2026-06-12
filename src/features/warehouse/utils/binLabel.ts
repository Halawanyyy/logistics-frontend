import type { TFunction } from 'i18next'
import type { AppLocale } from '../../../shared/i18n/locale'
import type { LabelDocument, LabelRequestOptions } from '../../../shared/types/labels.types'
import {
  buildEntityLabelHtml,
  createEntityLabelDocument,
  createLabelFullWidthRow,
  createLabelPairRow,
  formatLabelText,
  generateBarcodeMarkup,
  getFrontendPrintableLabelDocument,
  resolveBarcodeValue,
  resolveDisplayLabel,
  type LabelDimensions,
} from '../../../shared/utils/entityLabel'
import type { WarehouseBin } from '../types/warehouse.types'

function resolveBinBarcodeValue(bin: WarehouseBin) {
  return resolveBarcodeValue([
    bin.barcode,
    bin.code,
    bin.name,
  ])
}

function buildBinSubtitle(bin: WarehouseBin) {
  return [bin.warehouse_name, bin.zone_name, bin.shelf_name].filter(Boolean).join(' • ')
}

export function buildBinLabelHtml({
  barcodeDisplayValue,
  barcodeMarkup,
  bin,
  dimensions,
  t,
}: {
  barcodeDisplayValue: string
  barcodeMarkup: string | null
  bin: WarehouseBin
  dimensions?: LabelDimensions
  t: TFunction
}) {
  const status = resolveDisplayLabel(t, bin.status, bin.status_label)
  const details = [
    createLabelPairRow(
      t('Name', { defaultValue: 'Name' }),
      formatLabelText(bin.name),
      t('Bin Code', { defaultValue: 'Bin Code' }),
      formatLabelText(bin.code),
    ),
    createLabelPairRow(
      t('Warehouse', { defaultValue: 'Warehouse' }),
      formatLabelText(bin.warehouse_name),
      t('Status', { defaultValue: 'Status' }),
      formatLabelText(status),
    ),
    createLabelPairRow(
      t('Zone', { defaultValue: 'Zone' }),
      formatLabelText(bin.zone_name),
      t('Shelf', { defaultValue: 'Shelf' }),
      formatLabelText(bin.shelf_name),
    ),
    createLabelPairRow(
      t('Barcode', { defaultValue: 'Barcode' }),
      formatLabelText(bin.barcode),
      t('Created', { defaultValue: 'Created' }),
      formatLabelText(bin.created_at),
    ),
    createLabelFullWidthRow(
      t('Notes', { defaultValue: 'Notes' }),
      formatLabelText(bin.notes),
    ),
  ]

  return buildEntityLabelHtml({
    barcodeDisplayValue,
    barcodeLabel: t('Bin Code', { defaultValue: 'Bin Code' }),
    barcodeMarkup,
    codeText: bin.code,
    details,
    dimensions,
    eyebrow: t('Bin Label', { defaultValue: 'Bin Label' }),
    subtitle: buildBinSubtitle(bin),
    title: bin.name,
  })
}

export async function buildBinLabelDocument({
  bin,
  dimensions,
  fileName,
  locale,
  t,
}: {
  bin: WarehouseBin
  dimensions?: LabelDimensions
  fileName?: string
  locale: AppLocale
  t: TFunction
}) {
  const barcodeValue = resolveBinBarcodeValue(bin) || bin.code || bin.name
  const barcodeMarkup = await generateBarcodeMarkup(barcodeValue)
  const html = buildBinLabelHtml({
    barcodeDisplayValue: barcodeValue || t('Missing barcode value', { defaultValue: 'Missing barcode value' }),
    barcodeMarkup,
    bin,
    dimensions,
    t,
  })
  const title = t('Bin Label - {{name}}', {
    defaultValue: `Bin Label - ${bin.name}`,
    name: bin.name,
  })

  return createEntityLabelDocument({
    dimensions,
    fileName: fileName ?? `bin-label-${bin.code || bin.id}.html`,
    html,
    locale,
    title,
  })
}

export async function getBinPrintableLabelDocument({
  bin,
  fetchDocument,
  locale,
  options,
  t,
}: {
  bin: WarehouseBin
  fetchDocument: (options: LabelRequestOptions) => Promise<LabelDocument>
  locale: AppLocale
  options: LabelRequestOptions
  t: TFunction
}) {
  return getFrontendPrintableLabelDocument({
    buildDocument: (dimensions) => buildBinLabelDocument({
      bin,
      dimensions,
      fileName: `bin-label-${bin.code || bin.id}.html`,
      locale,
      t,
    }),
    fetchDocument,
    options,
  })
}
