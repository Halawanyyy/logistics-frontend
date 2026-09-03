import { useMemo } from 'react'
import { Landmark, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import type { FinanceOverview } from '../types/dashboard.types'

type FinanceOverviewChartProps = {
  overview: FinanceOverview
}

function toNumber(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export function FinanceOverviewChart({ overview }: FinanceOverviewChartProps) {
  const { t } = useTranslation()

  const metrics = useMemo(() => {
    const rows = [
      {
        key: 'cod_expected',
        label: t('COD Expected', { defaultValue: 'COD Expected' }),
        value: overview.cod_expected,
        numericValue: toNumber(overview.cod_expected),
        tone: 'info',
        accent: 'finance',
      },
      {
        key: 'cod_verified',
        label: t('COD verified'),
        value: overview.cod_collected_verified,
        numericValue: toNumber(overview.cod_collected_verified),
        tone: 'success',
        accent: 'finance',
      },
      {
        key: 'shipping_fees',
        label: t('Shipping Fees', { defaultValue: 'Shipping Fees' }),
        value: overview.shipping_fees,
        numericValue: toNumber(overview.shipping_fees),
        tone: 'accent',
        accent: 'success',
      },
      {
        key: 'expenses',
        label: t('Expenses', { defaultValue: 'Expenses' }),
        value: overview.expenses,
        numericValue: toNumber(overview.expenses),
        tone: 'danger',
        accent: 'warning',
      },
    ]

    return rows
  }, [overview, t])

  const profit = toNumber(overview.company_net_profit)
  const profitTone = profit >= 0 ? 'success' : 'danger'
  const codGap = Math.max(toNumber(overview.cod_expected) - toNumber(overview.cod_collected_verified), 0)

  return (
    <div className="finance-snapshot">
      <div className="finance-snapshot__hero">
        <div className={`finance-snapshot__hero-card finance-snapshot__hero-card--${profitTone}`}>
          <div className="finance-snapshot__hero-icon">
            {profit >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          </div>
          <div>
            <span>{t('Net Company Profit', { defaultValue: 'Net Company Profit' })}</span>
            <strong><MoneyDisplay value={overview.company_net_profit} /></strong>
            <small>{t('Unverified COD Gap', { defaultValue: 'Unverified COD Gap' })}: <MoneyDisplay value={String(codGap)} /></small>
          </div>
        </div>
      </div>

      <div className="compact-stats-row finance-snapshot__compact-stats">
        {metrics.map((metric) => (
          <div key={metric.key} className={`compact-stat finance-snapshot__compact-stat finance-snapshot__compact-stat--${metric.tone}`} data-accent={metric.accent}>
            <span className="compact-stat__label">{metric.label}</span>
            <strong className="compact-stat__value"><MoneyDisplay value={metric.value} /></strong>
          </div>
        ))}
      </div>

      <div className="finance-snapshot__footer">
        <div className="finance-snapshot__footer-item">
          <Landmark size={16} />
          <div>
            <span>{t('Merchant Payables', { defaultValue: 'Merchant Payables' })}</span>
            <strong><MoneyDisplay value={overview.merchant_payables} /></strong>
          </div>
        </div>
        <div className="finance-snapshot__footer-item">
          <Wallet size={16} />
          <div>
            <span>{t('Merchant Paid Out', { defaultValue: 'Merchant Paid Out' })}</span>
            <strong><MoneyDisplay value={overview.merchant_paid_out} /></strong>
          </div>
        </div>
      </div>
    </div>
  )
}
