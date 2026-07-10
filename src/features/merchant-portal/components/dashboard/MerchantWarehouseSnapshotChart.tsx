import { useMemo } from 'react'
import { Boxes } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { MerchantPortalDashboardSummaryResponse } from '../../types/merchantPortal.types'

type Props = {
  summary: NonNullable<MerchantPortalDashboardSummaryResponse['warehouse']>
}

function toNumber(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export function MerchantWarehouseSnapshotChart({ summary }: Props) {
  const { t } = useTranslation()

  const metrics = useMemo(() => {
    const rows = [
      {
        key: 'warehouse_products',
        label: t('Inventory Products'),
        value: summary.warehouse_products_count,
        numericValue: toNumber(summary.warehouse_products_count),
        tone: 'info',
      },
      {
        key: 'low_stock',
        label: t('Low Stock Items'),
        value: summary.low_stock_count,
        numericValue: toNumber(summary.low_stock_count),
        tone: 'danger',
      },
      {
        key: 'inbound_requests',
        label: t('Inbound Requests', { defaultValue: 'Inbound Requests' }),
        value: summary.inbound_requests_pending_count,
        numericValue: toNumber(summary.inbound_requests_pending_count),
        tone: 'warning',
      },
    ]

    const maxValue = Math.max(...rows.map((row) => row.numericValue), 1)

    return rows.map((row) => ({
      ...row,
      width: `${Math.max((row.numericValue / maxValue) * 100, row.numericValue > 0 ? 12 : 0)}%`,
    }))
  }, [summary, t])

  return (
    <div className="finance-snapshot">
      <div className="finance-snapshot__hero" style={{ gridTemplateColumns: '1fr' }}>
        <div className="finance-snapshot__hero-card finance-snapshot__hero-card--info">
          <div className="finance-snapshot__hero-icon">
            <Boxes size={18} />
          </div>
          <div>
            <span>{t('Available Quantity', { defaultValue: 'Available Quantity' })}</span>
            <strong>{summary.total_available_quantity.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      <div className="finance-snapshot__list">
        {metrics.map((metric) => (
          <div key={metric.key} className="finance-snapshot__metric">
            <div className="finance-snapshot__metric-head">
              <span>{metric.label}</span>
              <strong>{metric.value.toLocaleString()}</strong>
            </div>
            <div className="finance-snapshot__meter">
              <div
                className={`finance-snapshot__meter-fill finance-snapshot__meter-fill--${metric.tone}`}
                style={{ width: metric.width }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
