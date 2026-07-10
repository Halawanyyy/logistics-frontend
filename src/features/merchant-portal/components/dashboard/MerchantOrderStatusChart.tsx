import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import type { MerchantPortalDashboardSummaryResponse } from '../../types/merchantPortal.types'

type ChartDatum = {
  key: string
  name: string
  value: number
  fill: string
  percentage: number
}

type Props = {
  summary: NonNullable<MerchantPortalDashboardSummaryResponse['orders']>
}

export function MerchantOrderStatusChart({ summary }: Props) {
  const { t } = useTranslation()
  const rawData = [
    { key: 'pending', name: t('Pending Orders'), value: summary.pending_orders, fill: '#ffb020' },
    { key: 'confirmed', name: t('Confirmed Orders'), value: summary.confirmed_orders, fill: '#325dff' },
    { key: 'delivered', name: t('Delivered Orders'), value: summary.delivered_orders, fill: '#0b3da8' },
    { key: 'returned', name: t('Returned'), value: summary.returned_orders, fill: '#e62446' },
    { key: 'cancelled', name: t('Cancelled'), value: summary.cancelled_orders, fill: '#e2e8f0' },
  ].filter((item) => item.value > 0)

  const total = rawData.reduce((sum, item) => sum + item.value, 0)
  
  if (total === 0) {
    return null
  }

  const data: ChartDatum[] = rawData.map((item) => ({
    ...item,
    percentage: total ? Math.round((item.value / total) * 100) : 0,
  }))

  return (
    <div className="chart-frame chart-frame--donut">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            animationDuration={450}
            cx="50%"
            cy="50%"
            data={data}
            dataKey="value"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={3}
            stroke="transparent"
          >
            {data.map((item) => (
              <Cell
                key={item.key}
                aria-label={`${item.name}: ${item.value}`}
                fill={item.fill}
                role="img"
              />
            ))}
          </Pie>
          <Tooltip
            content={OrderStatusTooltip}
            wrapperStyle={{ outline: 'none', zIndex: 10 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="chart-frame__center">
        <strong>{total.toLocaleString()}</strong>
        <span>{t('Orders')}</span>
      </div>
    </div>
  )
}

function OrderStatusTooltip({ active, payload }: TooltipContentProps) {
  const { t } = useTranslation()
  const datum = payload?.[0]?.payload as ChartDatum | undefined

  if (!active || !datum) {
    return null
  }

  return (
    <div className="chart-tooltip" dir="auto">
      <strong>{datum.name}</strong>
      <span>
        {t('Count')}: {datum.value.toLocaleString()}
      </span>
      <span>
        {datum.percentage}% {t('of total')}
      </span>
    </div>
  )
}
