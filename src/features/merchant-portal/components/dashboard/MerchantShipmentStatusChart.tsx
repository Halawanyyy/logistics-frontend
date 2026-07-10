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
  summary: NonNullable<MerchantPortalDashboardSummaryResponse['shipments']>
}

export function MerchantShipmentStatusChart({ summary }: Props) {
  const { t } = useTranslation()
  const rawData = [
    { key: 'pending_pickup', name: t('Pending pickup'), value: summary.pending_pickup_shipments, fill: '#ff6a13' },
    { key: 'in_transit', name: t('In Transit Shipments'), value: summary.in_transit_shipments, fill: '#325dff' },
    { key: 'delivered', name: t('Delivered Shipments'), value: summary.delivered_shipments, fill: '#0b3da8' },
    { key: 'failed', name: t('Failed', { defaultValue: 'Failed' }), value: summary.failed_shipments, fill: '#e62446' },
    { key: 'returned', name: t('Returned'), value: summary.returned_shipments, fill: '#808080' },
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
            content={ShipmentStatusTooltip}
            wrapperStyle={{ outline: 'none', zIndex: 10 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="chart-frame__center">
        <strong>{total.toLocaleString()}</strong>
        <span>{t('Total Shipments')}</span>
      </div>
    </div>
  )
}

function ShipmentStatusTooltip({ active, payload }: TooltipContentProps) {
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
