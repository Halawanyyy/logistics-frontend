import type { TFunction } from 'i18next'
import type { AppLocale } from '../../../shared/i18n/locale'
import type { LabelDocument } from '../../../shared/types/labels.types'
import { formatLabelMoney, formatLabelText, humanizeLabelValue } from '../../../shared/utils/entityLabel'
import { createHtmlLabelDocument, escapeHtml } from '../../../shared/utils/printHtml'
import type { DriverManifest, PrintableDriverManifest } from '../types/driver-manifest.types'

type BrandingSnapshot = {
  companyLogo?: string | null
  companyName?: string | null
}

export type DriverManifestPrintFiltersSummary = {
  dateFrom?: string
  dateTo?: string
  driverName?: string
  manifestDate?: string
  status?: string
}

function formatDateTimeValue(value: string, locale: AppLocale) {
  if (!value) {
    return '&mdash;'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return escapeHtml(value)
  }

  return escapeHtml(new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date))
}

function formatDateValue(value: string | undefined, locale: AppLocale) {
  if (!value) {
    return '&mdash;'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return escapeHtml(value)
  }

  return escapeHtml(new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    dateStyle: 'medium',
  }).format(date))
}

function resolveStatusLabel(t: TFunction, value: string | null | undefined) {
  if (!value?.trim()) {
    return ''
  }

  return t(value, { defaultValue: humanizeLabelValue(value) })
}

function buildManifestStyles() {
  return `
    @page {
      margin: 12mm;
    }

    .driver-manifest-report {
      color: #0f172a;
      display: grid;
      gap: 18px;
    }

    .driver-manifest-report__header {
      border: 1px solid #cbd5e1;
      border-radius: 18px;
      padding: 20px;
      display: grid;
      gap: 16px;
      background: #ffffff;
    }

    .driver-manifest-report__header-top {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
    }

    .driver-manifest-report__brand {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .driver-manifest-report__brand-logo {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      border: 1px solid #cbd5e1;
      object-fit: contain;
      padding: 6px;
      background: #ffffff;
    }

    .driver-manifest-report__brand-fallback {
      width: 56px;
      height: 56px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 14px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      font-size: 22px;
      font-weight: 800;
    }

    .driver-manifest-report__company {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
    }

    .driver-manifest-report__eyebrow {
      margin: 0 0 6px;
      color: #475569;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .driver-manifest-report__title {
      margin: 0;
      font-size: 30px;
      line-height: 1.1;
      font-weight: 800;
    }

    .driver-manifest-report__subtitle {
      margin: 8px 0 0;
      color: #475569;
      font-size: 14px;
    }

    .driver-manifest-report__meta {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px 16px;
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
    }

    .driver-manifest-report__meta-item {
      display: grid;
      gap: 4px;
    }

    .driver-manifest-report__meta-label {
      color: #64748b;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .driver-manifest-report__meta-value {
      font-size: 14px;
      font-weight: 600;
      overflow-wrap: anywhere;
    }

    .driver-manifest-report__status {
      display: inline-flex;
      align-items: center;
      border: 1px solid #0f172a;
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 700;
      background: #ffffff;
    }

    .driver-manifest-report__summary-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }

    .driver-manifest-report__summary-card {
      border: 1px solid #cbd5e1;
      border-radius: 16px;
      padding: 14px;
      background: #ffffff;
    }

    .driver-manifest-report__summary-card-label {
      margin: 0 0 8px;
      color: #64748b;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .driver-manifest-report__summary-card-value {
      margin: 0;
      font-size: 20px;
      font-weight: 800;
    }

    .driver-manifest-report__table-wrapper {
      border: 1px solid #cbd5e1;
      border-radius: 18px;
      overflow: hidden;
      background: #ffffff;
    }

    .driver-manifest-report__table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .driver-manifest-report__table th,
    .driver-manifest-report__table td {
      border: 1px solid #cbd5e1;
      padding: 10px 12px;
      text-align: start;
      vertical-align: top;
      font-size: 12px;
      overflow-wrap: anywhere;
    }

    .driver-manifest-report__table th {
      background: #f8fafc;
      font-weight: 800;
    }

    .driver-manifest-report__footer {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-end;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      color: #475569;
      font-size: 12px;
    }

    .driver-manifest-report__footer-note {
      margin: 0;
    }

    .driver-manifest-report__footer-totals {
      display: grid;
      gap: 6px;
      justify-items: end;
    }

    .driver-manifest-report__footer-total {
      font-weight: 700;
    }

    @media screen and (max-width: 840px) {
      .driver-manifest-report__header-top,
      .driver-manifest-report__footer {
        display: grid;
      }

      .driver-manifest-report__meta,
      .driver-manifest-report__summary-grid {
        grid-template-columns: 1fr;
      }
    }

    @media print {
      body {
        padding: 0 !important;
      }

      .driver-manifest-report {
        gap: 12px;
      }

      .driver-manifest-report__header,
      .driver-manifest-report__summary-card,
      .driver-manifest-report__table-wrapper {
        box-shadow: none;
      }

      thead {
        display: table-header-group;
      }

      tr,
      td,
      th {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }
  `
}

function createMetaItem(label: string, value: string) {
  return `<div class="driver-manifest-report__meta-item">
    <div class="driver-manifest-report__meta-label">${escapeHtml(label)}</div>
    <div class="driver-manifest-report__meta-value">${value}</div>
  </div>`
}

function createSummaryCard(label: string, value: string) {
  return `<section class="driver-manifest-report__summary-card">
    <p class="driver-manifest-report__summary-card-label">${escapeHtml(label)}</p>
    <p class="driver-manifest-report__summary-card-value">${value}</p>
  </section>`
}

export function buildDriverManifestPrintDocument({
  branding,
  filters,
  locale,
  manifest,
  printableManifest,
  t,
}: {
  branding?: BrandingSnapshot
  filters?: DriverManifestPrintFiltersSummary
  locale: AppLocale
  manifest: DriverManifest
  printableManifest: PrintableDriverManifest
  t: TFunction
}): LabelDocument {
  const generatedAt = new Date().toISOString()
  const manifestItems = Array.isArray(manifest.items) ? manifest.items : []
  const statusLabel = resolveStatusLabel(t, manifest.status)
  const filterStatusLabel = resolveStatusLabel(t, filters?.status)
  const companyName = branding?.companyName?.trim() || ''
  const companyLogo = branding?.companyLogo?.trim() || ''
  const shipmentStatusByNumber = new Map(
    manifestItems.map((item) => [
      item.shipment_number,
      resolveStatusLabel(t, item.final_status || item.shipment_status_at_loadout),
    ]),
  )

  const headerMeta = [
    createMetaItem(t('Manifest Number', { defaultValue: 'Manifest Number' }), formatLabelText(manifest.manifest_number)),
    createMetaItem(t('Driver', { defaultValue: 'Driver' }), formatLabelText(filters?.driverName || manifest.driver.name)),
    createMetaItem(t('Manifest Date', { defaultValue: 'Manifest Date' }), formatDateValue(filters?.manifestDate || manifest.manifest_date, locale)),
    createMetaItem(
      t('Status', { defaultValue: 'Status' }),
      statusLabel
        ? `<span class="driver-manifest-report__status">${escapeHtml(statusLabel)}</span>`
        : '&mdash;',
    ),
    createMetaItem(t('Date From', { defaultValue: 'Date From' }), formatDateValue(filters?.dateFrom, locale)),
    createMetaItem(t('Date To', { defaultValue: 'Date To' }), formatDateValue(filters?.dateTo, locale)),
    createMetaItem(
      t('Selected Status', { defaultValue: 'Selected Status' }),
      filterStatusLabel ? escapeHtml(filterStatusLabel) : '&mdash;',
    ),
    createMetaItem(t('Generated At', { defaultValue: 'Generated At' }), formatDateTimeValue(generatedAt, locale)),
  ].join('')

  const shipmentRows = printableManifest.shipments.map((item) => `
    <tr>
      <td>${formatLabelText(item.shipment_number)}</td>
      <td>${formatLabelText(item.order_number)}</td>
      <td>${formatLabelText(item.customer_name)}</td>
      <td>${formatLabelText(item.customer_phone)}</td>
      <td>${formatLabelText(item.delivery_address)}</td>
      <td>${formatLabelText(shipmentStatusByNumber.get(item.shipment_number))}</td>
      <td>${formatLabelText(item.merchant_name)}</td>
      <td>${formatLabelMoney(item.cod_amount, locale)}</td>
      <td>${formatLabelMoney(item.shipping_fee, locale)}</td>
      <td>${formatLabelText(item.notes)}</td>
    </tr>
  `).join('')

  const title = t('Driver Manifest', { defaultValue: 'Driver Manifest' })
  const subtitle = t('Driver Manifest report built from backend manifest data with a dedicated frontend print layout.', {
    defaultValue: 'Driver Manifest report built from backend manifest data with a dedicated frontend print layout.',
  })

  const selectedFilterSummary = [
    filters?.driverName || manifest.driver.name,
    statusLabel,
    filters?.dateFrom || filters?.dateTo
      ? `${filters?.dateFrom || '—'} -> ${filters?.dateTo || '—'}`
      : filters?.manifestDate || manifest.manifest_date,
  ].filter(Boolean).join(' • ')

  const html = `
    <section class="driver-manifest-report">
      <header class="driver-manifest-report__header">
        <div class="driver-manifest-report__header-top">
          <div class="driver-manifest-report__brand">
            ${companyLogo
              ? `<img class="driver-manifest-report__brand-logo" src="${escapeHtml(companyLogo)}" alt="${escapeHtml(companyName || title)}" />`
              : `<div class="driver-manifest-report__brand-fallback">${escapeHtml((companyName || title).slice(0, 2).toUpperCase())}</div>`}
            <div>
              ${companyName ? `<p class="driver-manifest-report__company">${escapeHtml(companyName)}</p>` : ''}
              <p class="driver-manifest-report__eyebrow">${escapeHtml(title)}</p>
              <h1 class="driver-manifest-report__title">${escapeHtml(manifest.manifest_number)}</h1>
              <p class="driver-manifest-report__subtitle">${escapeHtml(subtitle)}</p>
            </div>
          </div>
          <div>
            <p class="driver-manifest-report__eyebrow">${escapeHtml(t('Selected Filters', { defaultValue: 'Selected Filters' }))}</p>
            <p class="driver-manifest-report__subtitle">${escapeHtml(selectedFilterSummary || '—')}</p>
          </div>
        </div>
        <div class="driver-manifest-report__meta">
          ${headerMeta}
        </div>
      </header>

      <div class="driver-manifest-report__summary-grid">
        ${createSummaryCard(t('Total Shipments', { defaultValue: 'Total Shipments' }), escapeHtml(String(manifest.summary.total_shipments)))}
        ${createSummaryCard(t('Expected COD', { defaultValue: 'Expected COD' }), formatLabelMoney(manifest.summary.expected_cod_amount, locale))}
        ${createSummaryCard(t('Actual Received', { defaultValue: 'Actual Received' }), formatLabelMoney(manifest.summary.actual_received_amount, locale))}
        ${createSummaryCard(t('Difference', { defaultValue: 'Difference' }), formatLabelMoney(manifest.summary.difference_amount, locale))}
      </div>

      <section class="driver-manifest-report__table-wrapper">
        <table class="driver-manifest-report__table">
          <thead>
            <tr>
              <th>${escapeHtml(t('Shipment Number', { defaultValue: 'Shipment Number' }))}</th>
              <th>${escapeHtml(t('Order Number', { defaultValue: 'Order Number' }))}</th>
              <th>${escapeHtml(t('Customer Name', { defaultValue: 'Customer Name' }))}</th>
              <th>${escapeHtml(t('Customer Phone', { defaultValue: 'Customer Phone' }))}</th>
              <th>${escapeHtml(t('Address', { defaultValue: 'Address' }))}</th>
              <th>${escapeHtml(t('Status', { defaultValue: 'Status' }))}</th>
              <th>${escapeHtml(t('Merchant', { defaultValue: 'Merchant' }))}</th>
              <th>${escapeHtml(t('COD Expected', { defaultValue: 'COD Expected' }))}</th>
              <th>${escapeHtml(t('Shipping Fee', { defaultValue: 'Shipping Fee' }))}</th>
              <th>${escapeHtml(t('Notes', { defaultValue: 'Notes' }))}</th>
            </tr>
          </thead>
          <tbody>
            ${shipmentRows || '<tr><td colspan="10">&mdash;</td></tr>'}
          </tbody>
        </table>
      </section>

      <footer class="driver-manifest-report__footer">
        <p class="driver-manifest-report__footer-note">${escapeHtml(t('Generated by system', { defaultValue: 'Generated by system' }))}</p>
        <div class="driver-manifest-report__footer-totals">
          <div class="driver-manifest-report__footer-total">${escapeHtml(t('Delivered', { defaultValue: 'Delivered' }))}: ${escapeHtml(String(printableManifest.summary.delivered_shipments))}</div>
          <div class="driver-manifest-report__footer-total">${escapeHtml(t('Failed', { defaultValue: 'Failed' }))}: ${escapeHtml(String(printableManifest.summary.failed_shipments))}</div>
        </div>
      </footer>
    </section>
  `

  return createHtmlLabelDocument({
    extraStyles: buildManifestStyles(),
    fileName: `driver-manifest-${manifest.manifest_number}.html`,
    html,
    locale,
    title,
  })
}
