import { useMemo } from 'react'
import { Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MoneyDisplay } from '../../../../shared/components/display/MoneyDisplay'
import type { MerchantPortalDashboardSummaryResponse } from '../../types/merchantPortal.types'

type Props = {
  summary: NonNullable<MerchantPortalDashboardSummaryResponse['finance']>
}

function toNumber(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export function MerchantFinanceSnapshotChart({ summary }: Props) {
  const { t } = useTranslation()

  const metrics = useMemo(() => {
    const rows = [
      {
        key: 'cod_collected',
        label: t('Total COD'),
        value: summary.total_cod_collected,
        numericValue: toNumber(summary.total_cod_collected),
        tone: 'success',
      },
      {
        key: 'shipping_fees',
        label: t('Shipping Fees'),
        value: summary.total_shipping_fees,
        numericValue: toNumber(summary.total_shipping_fees),
        tone: 'info',
      },
      {
        key: 'pending_payouts',
        label: t('Pending Payouts'),
        value: summary.total_payouts_pending,
        numericValue: toNumber(summary.total_payouts_pending),
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
        <div className="finance-snapshot__hero-card finance-snapshot__hero-card--success">
          <div className="finance-snapshot__hero-icon">
            <Wallet size={18} />
          </div>
          <div>
            <span>{t('Wallet Balance')}</span>
            <strong><MoneyDisplay value={summary.available_balance} /></strong>
          </div>
        </div>
      </div>

      <div className="finance-snapshot__list">
        {metrics.map((metric) => (
          <div key={metric.key} className="finance-snapshot__metric">
            <div className="finance-snapshot__metric-head">
              <span>{metric.label}</span>
              <strong><MoneyDisplay value={metric.value} /></strong>
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
