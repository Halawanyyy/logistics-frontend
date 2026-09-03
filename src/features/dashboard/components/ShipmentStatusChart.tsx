import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import type { DashboardSummary } from '../types/dashboard.types'

type ShipmentStatusChartDatum = {
  key: string
  name: string
  value: number
  fill: string
  percentage: number
}

type ShipmentStatusChartProps = {
  summary: DashboardSummary
}

export function ShipmentStatusChart({ summary }: ShipmentStatusChartProps) {
  const { t } = useTranslation()
  const rawData = [
    { key: 'delivered', name: t('Delivered'), value: summary.shipments.delivered, fill: 'var(--success)' },
    { key: 'assigned', name: t('Assigned'), value: summary.shipments.assigned, fill: 'rgb(var(--brand-primary))' },
    { key: 'pending_pickup', name: t('Pending pickup'), value: summary.shipments.pending_pickup, fill: 'var(--warning)' },
    { key: 'unassigned', name: t('Unassigned'), value: summary.shipments.unassigned, fill: 'var(--muted)' },
  ].filter((item) => item.value > 0)

  const total = rawData.reduce((sum, item) => sum + item.value, 0)
  const data: ShipmentStatusChartDatum[] = rawData.map((item) => ({
    ...item,
    percentage: total ? Math.round((item.value / total) * 100) : 0,
  }))

  return (
    <div className="chart-frame chart-frame--donut">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            animationDuration={450}
            cx="50%"
            cy="50%"
            data={data}
            dataKey="value"
            innerRadius={72}
            outerRadius={98}
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
        <span>{t('Total Shipments', { defaultValue: 'Total Shipments' })}</span>
      </div>
    </div>
  )
}

function ShipmentStatusTooltip({ active, payload }: TooltipContentProps) {
  const { t } = useTranslation()
  const datum = payload?.[0]?.payload as ShipmentStatusChartDatum | undefined

  if (!active || !datum) {
    return null
  }

  return (
    <div className="chart-tooltip" dir="auto">
      <strong>{datum.name}</strong>
      <span>
        {t('Count', { defaultValue: 'Count' })}: {datum.value.toLocaleString()}
      </span>
      <span>
        {datum.percentage}% {t('of total', { defaultValue: 'of total' })}
      </span>
    </div>
  )
}
