import type { TFunction } from 'i18next'
import type { AppLocale } from '../i18n/locale'
import { getNumberLocale, pickDisplayLabel } from '../i18n/locale'
import type { LabelDocument } from '../types/labels.types'
import type { LabelRequestOptions } from '../types/labels.types'
import { createHtmlLabelDocument, escapeHtml } from './printHtml'

type JsBarcodeRenderer = (
  element: SVGElement,
  value: string,
  options?: Record<string, unknown>,
) => void

export type LabelDimensions = {
  heightMm?: number
  widthMm?: number
}

type LabelDetailRow =
  | {
    fullWidth: true
    label: string
    value: string
  }
  | {
    fullWidth?: false
    label: string
    value: string
    secondaryLabel: string
    secondaryValue: string
  }

export function humanizeLabelValue(value: string) {
  return value
    .replaceAll(/[_-]+/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function resolveDisplayLabel(
  t: TFunction,
  rawValue: string | null | undefined,
  localizedLabel?: string | null,
) {
  const displayValue = pickDisplayLabel(rawValue, localizedLabel)
  if (displayValue === '-') {
    return ''
  }

  if (localizedLabel?.trim()) {
    return localizedLabel.trim()
  }

  return t(displayValue, { defaultValue: humanizeLabelValue(displayValue) })
}

export function formatLabelText(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? escapeHtml(trimmed).replaceAll('\n', '<br />') : '&mdash;'
}

export function formatLabelBoolean(value: boolean | null | undefined, t: TFunction) {
  if (value == null) {
    return '&mdash;'
  }

  return escapeHtml(value ? t('Yes', { defaultValue: 'Yes' }) : t('No', { defaultValue: 'No' }))
}

export function formatLabelMoney(value: string | number | null | undefined, locale: AppLocale) {
  if (value == null || value === '') {
    return '&mdash;'
  }

  const numericValue = Number(value)
  const formatted = new Intl.NumberFormat(getNumberLocale(locale), {
    currency: 'EGP',
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(Number.isNaN(numericValue) ? 0 : numericValue)

  return escapeHtml(formatted)
}

export function resolveBarcodeValue(values: Array<string | null | undefined>) {
  return values.find((value) => value?.trim())?.trim() ?? ''
}

export async function generateBarcodeMarkup(value: string, className = 'entity-label__generated-barcode') {
  if (!value || typeof document === 'undefined') {
    return null
  }

  try {
    const barcodeModule = await import('jsbarcode')
    const JsBarcode = ((barcodeModule as { default?: unknown }).default ?? barcodeModule) as JsBarcodeRenderer
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    svg.setAttribute('class', className)
    svg.setAttribute('role', 'img')
    svg.setAttribute('aria-label', value)

    JsBarcode(svg, value, {
      background: 'transparent',
      displayValue: false,
      format: 'CODE128',
      height: 96,
      lineColor: '#0f172a',
      margin: 0,
      width: 2,
    })

    return svg.outerHTML
  } catch {
    return null
  }
}

function buildPageSizeRule({ heightMm, widthMm }: LabelDimensions = {}) {
  if (!widthMm || !heightMm) {
    return ''
  }

  return `@page {
      size: ${widthMm}mm ${heightMm}mm;
      margin: 0;
    }`
}

export function buildEntityLabelStyles(dimensions: LabelDimensions = {}) {
  return `
  ${buildPageSizeRule(dimensions)}

  .entity-label-batch {
    display: grid;
    gap: 24px;
    justify-items: center;
  }

  .entity-label-batch__item {
    display: flex;
    justify-content: center;
    width: 100%;
    break-after: page;
    page-break-after: always;
  }

  .entity-label-batch__item:last-child {
    break-after: auto;
    page-break-after: auto;
  }

  .entity-label {
    width: min(100%, 920px);
    margin: 0 auto;
    border: 1px solid #cbd5e1;
    border-radius: 24px;
    overflow: hidden;
    background: #ffffff;
  }

  .entity-label__header {
    padding: 24px;
    background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
    border-bottom: 1px solid #dbe4f0;
  }

  .entity-label__eyebrow {
    margin: 0 0 8px;
    color: #1d4ed8;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .entity-label__title {
    margin: 0;
    font-size: 32px;
    font-weight: 800;
    line-height: 1.1;
    word-break: break-word;
  }

  .entity-label__subtitle {
    margin: 8px 0 0;
    color: #475569;
    font-size: 14px;
    overflow-wrap: anywhere;
  }

  .entity-label__barcode-card {
    margin-top: 20px;
    border: 1px solid #dbe4f0;
    border-radius: 20px;
    background: #ffffff;
    padding: 20px;
    display: grid;
    gap: 12px;
    justify-items: center;
    text-align: center;
  }

  .entity-label__barcode {
    width: 100%;
    min-height: 132px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    border: 1px dashed #94a3b8;
    border-radius: 16px;
    background: #ffffff;
    overflow: hidden;
  }

  .entity-label__barcode img,
  .entity-label__barcode svg {
    max-width: 100%;
    height: auto;
    margin: 0 auto;
  }

  .entity-label__generated-barcode {
    width: min(100%, 640px);
    min-height: 96px;
  }

  .entity-label__barcode-fallback {
    width: 100%;
    color: #0f172a;
    font-family: "Courier New", Courier, monospace;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 0.18em;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  .entity-label__barcode-label {
    color: #64748b;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .entity-label__code {
    font-size: 28px;
    font-weight: 800;
    line-height: 1.1;
    overflow-wrap: anywhere;
  }

  .entity-label__details {
    padding: 0 24px 24px;
  }

  .entity-label__table {
    border: 1px solid #dbe4f0;
    border-radius: 18px;
    overflow: hidden;
  }

  .entity-label__table th,
  .entity-label__table td {
    padding: 14px 16px;
    border: 1px solid #dbe4f0;
    vertical-align: top;
    font-size: 14px;
  }

  .entity-label__table th {
    width: 18%;
    background: #f8fafc;
    color: #334155;
    font-weight: 800;
  }

  .entity-label__table td {
    width: 32%;
    color: #0f172a;
    font-weight: 600;
    word-break: break-word;
  }

  @media (max-width: 720px) {
    .entity-label__header,
    .entity-label__details {
      padding-inline: 16px;
    }

    .entity-label__title {
      font-size: 26px;
    }

    .entity-label__code {
      font-size: 24px;
    }

    .entity-label__table,
    .entity-label__table tbody,
    .entity-label__table tr,
    .entity-label__table th,
    .entity-label__table td {
      display: block;
      width: 100%;
    }
  }

  @media print {
    body {
      padding: 0 !important;
    }

    .entity-label-batch {
      gap: 0;
    }

    .entity-label-batch__item {
      padding: 0;
    }

    .entity-label {
      width: 100%;
      border-color: #cbd5e1;
      box-shadow: none;
    }
  }
`
}

export function buildLabelDimensionStyle({ heightMm, widthMm }: LabelDimensions = {}) {
  const declarations: string[] = []

  if (widthMm) {
    declarations.push(`width:${widthMm}mm`)
    declarations.push('max-width:100%')
  }

  if (heightMm) {
    declarations.push(`min-height:${heightMm}mm`)
  }

  return declarations.length ? ` style="${declarations.join(';')}"` : ''
}

export function createLabelPairRow(label: string, value: string, secondaryLabel: string, secondaryValue: string): LabelDetailRow {
  return {
    label,
    secondaryLabel,
    secondaryValue,
    value,
  }
}

export function createLabelFullWidthRow(label: string, value: string): LabelDetailRow {
  return {
    fullWidth: true,
    label,
    value,
  }
}

function renderLabelDetailRow(row: LabelDetailRow) {
  if ('fullWidth' in row && row.fullWidth) {
    return `<tr>
      <th>${escapeHtml(row.label)}</th>
      <td colspan="3">${row.value}</td>
    </tr>`
  }

  return `<tr>
    <th>${escapeHtml(row.label)}</th>
    <td>${row.value}</td>
    <th>${escapeHtml(row.secondaryLabel)}</th>
    <td>${row.secondaryValue}</td>
  </tr>`
}

export function buildEntityLabelHtml({
  barcodeDisplayValue,
  barcodeLabel,
  barcodeMarkup,
  codeText,
  details,
  dimensions,
  eyebrow,
  subtitle,
  title,
}: {
  barcodeDisplayValue: string
  barcodeLabel: string
  barcodeMarkup: string | null
  codeText: string
  details: LabelDetailRow[]
  dimensions?: LabelDimensions
  eyebrow: string
  subtitle?: string | null
  title: string
}) {
  const labelDimensionStyle = buildLabelDimensionStyle(dimensions)
  const renderedBarcodeMarkup = barcodeMarkup ?? `<div class="entity-label__barcode-fallback">${escapeHtml(barcodeDisplayValue)}</div>`
  const renderedSubtitle = subtitle?.trim()

  return `
    <section class="entity-label"${labelDimensionStyle}>
      <header class="entity-label__header">
        <p class="entity-label__eyebrow">${escapeHtml(eyebrow)}</p>
        <h1 class="entity-label__title">${escapeHtml(title)}</h1>
        ${renderedSubtitle ? `<p class="entity-label__subtitle">${formatLabelText(renderedSubtitle)}</p>` : ''}
        <div class="entity-label__barcode-card">
          <div class="entity-label__barcode">
            ${renderedBarcodeMarkup}
          </div>
          <div class="entity-label__barcode-label">${escapeHtml(barcodeLabel)}</div>
          <div class="entity-label__code">${escapeHtml(codeText)}</div>
        </div>
      </header>
      <div class="entity-label__details">
        <table class="entity-label__table">
          <tbody>
            ${details.map(renderLabelDetailRow).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `
}

export function createEntityLabelDocument({
  dimensions,
  fileName,
  html,
  locale,
  title,
}: {
  dimensions?: LabelDimensions
  fileName: string
  html: string
  locale: AppLocale
  title: string
}) {
  return createHtmlLabelDocument({
    extraStyles: buildEntityLabelStyles(dimensions),
    fileName,
    html,
    locale,
    title,
  })
}

export function createBulkEntityLabelDocument({
  dimensions,
  fileName,
  labels,
  locale,
  title,
}: {
  dimensions?: LabelDimensions
  fileName: string
  labels: string[]
  locale: AppLocale
  title: string
}) {
  return createHtmlLabelDocument({
    extraStyles: buildEntityLabelStyles(dimensions),
    fileName,
    html: `<div class="entity-label-batch">${labels.map((label) => `<section class="entity-label-batch__item">${label}</section>`).join('')}</div>`,
    locale,
    title,
  })
}

export async function getFrontendPrintableLabelDocument({
  buildDocument,
  fetchDocument,
  options,
}: {
  buildDocument: (dimensions: LabelDimensions) => Promise<LabelDocument> | LabelDocument
  fetchDocument?: (options: LabelRequestOptions) => Promise<LabelDocument>
  options: LabelRequestOptions
}) {
  if ((options.format ?? 'html') === 'html' || (options.format ?? 'html') === 'pdf') {
    return buildDocument({
      heightMm: options.height_mm,
      widthMm: options.width_mm,
    })
  }

  if (!fetchDocument) {
    throw new Error('No backend label document fetcher was provided.')
  }

  return fetchDocument(options)
}
