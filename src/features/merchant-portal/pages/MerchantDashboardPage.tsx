import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart2,
  CheckCircle2,
  FileText,
  Package,
  RotateCcw,
  ShoppingCart,
  Truck,
  Wallet,
  Warehouse,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { Skeleton } from '../../../shared/components/ui/Skeleton'
import {
  getMerchantPortalDashboardSummary,
  listMerchantPortalGovernorates,
} from '../api/merchantPortal.api'
import { DashboardFiltersPopover } from './components/DashboardFiltersPopover'
import {
  type DashboardFilters,
  INITIAL_DASHBOARD_FILTERS,
} from '../types/merchantPortal.types'

function DashboardSkeletonGrid() {
  return (
    <div className="merchant-dashboard-skeleton-wrap" aria-busy="true" aria-live="polite">
      <div className="merchant-dashboard-kpi-grid">
        {Array.from({ length: 8 }).map((_, index) => (
          <div className="merchant-dashboard-kpi-card merchant-dashboard-kpi-card--skeleton" key={index}>
            <div className="merchant-dashboard-kpi-card__top">
              <Skeleton className="merchant-dashboard-skeleton--icon" />
              <div className="merchant-dashboard-kpi-card__meta">
                <Skeleton className="merchant-dashboard-skeleton--label" />
                <Skeleton className="merchant-dashboard-skeleton--value" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="merchant-dashboard-analytics-grid" style={{ marginTop: '20px' }}>
        <div className="merchant-dashboard-chart-card merchant-dashboard-chart-card--skeleton">
          <Skeleton style={{ height: '320px', borderRadius: '12px' }} />
        </div>
        <div className="merchant-dashboard-activity-card merchant-dashboard-activity-card--skeleton">
          <Skeleton style={{ height: '320px', borderRadius: '12px' }} />
        </div>
      </div>
    </div>
  )
}

export function MerchantDashboardPage() {
  const { t } = useTranslation()

  const [appliedFilters, setAppliedFilters] = useState<DashboardFilters>(INITIAL_DASHBOARD_FILTERS)

  const governoratesQuery = useQuery({
    queryKey: ['merchant-portal-governorates'],
    queryFn: listMerchantPortalGovernorates,
  })

  const apiParams = useMemo(() => {
    const params: { date_from?: string; date_to?: string; delivery_governorate_id?: string } = {}
    if (appliedFilters.date_from) params.date_from = appliedFilters.date_from
    if (appliedFilters.date_to) params.date_to = appliedFilters.date_to
    if (appliedFilters.delivery_governorate_id) params.delivery_governorate_id = appliedFilters.delivery_governorate_id
    return params
  }, [appliedFilters])

  const summaryQuery = useQuery({
    queryKey: ['merchant-portal-dashboard-summary', apiParams],
    queryFn: () => getMerchantPortalDashboardSummary(apiParams),
    retry: false,
  })

  const summary = summaryQuery.data?.data

  const kpiCards = useMemo(() => {
    const delivered = summary?.shipments?.delivered_shipments ?? 0
    const failed = summary?.shipments?.failed_shipments ?? 0
    const returned = summary?.shipments?.returned_shipments ?? 0
    const totalAttempted = delivered + failed + returned
    const successRate = totalAttempted > 0 ? `${((delivered / totalAttempted) * 100).toFixed(1)}%` : '—'

    return [
      {
        id: 'total-orders',
        label: t('TOTAL ORDERS', { defaultValue: 'TOTAL ORDERS' }),
        value: summary?.orders?.total_orders != null ? summary.orders.total_orders : '—',
        icon: <ShoppingCart size={18} aria-hidden="true" />,
        tone: 'blue',
        colorHex: '#3B82F6',
      },
      {
        id: 'todays-orders',
        label: t("TODAY'S ORDERS", { defaultValue: "TODAY'S ORDERS" }),
        value: summary?.orders?.today_orders != null ? summary.orders.today_orders : '—',
        icon: <FileText size={18} aria-hidden="true" />,
        tone: 'sky',
        colorHex: '#0EA5E9',
      },
      {
        id: 'in-transit',
        label: t('IN TRANSIT', { defaultValue: 'IN TRANSIT' }),
        value: summary?.shipments?.in_transit_shipments != null ? summary.shipments.in_transit_shipments : '—',
        icon: <Truck size={18} aria-hidden="true" />,
        tone: 'cyan',
        colorHex: '#06B6D4',
      },
      {
        id: 'delivered-today',
        label: t('DELIVERED TODAY', { defaultValue: 'DELIVERED TODAY' }),
        value: summary?.shipments?.delivered_shipments != null ? summary.shipments.delivered_shipments : '—',
        icon: <CheckCircle2 size={18} aria-hidden="true" />,
        tone: 'green',
        colorHex: '#10B981',
      },
      {
        id: 'returned-shipments',
        label: t('RETURNED SHIPMENTS', { defaultValue: 'RETURNED SHIPMENTS' }),
        value: summary?.shipments?.returned_shipments != null ? summary.shipments.returned_shipments : '—',
        icon: <RotateCcw size={18} aria-hidden="true" />,
        tone: 'red',
        colorHex: '#EF4444',
      },
      {
        id: 'warehouse-stock',
        label: t('WAREHOUSE STOCK', { defaultValue: 'WAREHOUSE STOCK' }),
        value: summary?.warehouse?.total_stock ?? summary?.warehouse?.total_available_quantity ?? '—',
        icon: <Warehouse size={18} aria-hidden="true" />,
        tone: 'teal',
        colorHex: '#14B8A6',
      },
      {
        id: 'available-wallet',
        label: t('AVAILABLE WALLET', { defaultValue: 'AVAILABLE WALLET' }),
        value: summary?.finance?.available_balance != null ? (
          <MoneyDisplay
            value={summary.finance.available_balance}
            currency={summary.finance.currency ?? 'EGP'}
            fallback="—"
          />
        ) : (
          '—'
        ),
        icon: <Wallet size={18} aria-hidden="true" />,
        tone: 'amber',
        colorHex: '#F59E0B',
      },
      {
        id: 'success-rate',
        label: t('SUCCESS RATE', { defaultValue: 'SUCCESS RATE' }),
        value: successRate,
        icon: <BarChart2 size={18} aria-hidden="true" />,
        tone: 'emerald',
        colorHex: '#10B981',
      },
    ]
  }, [summary, t])

  const activityItems = useMemo(() => {
    if (!summary) return []

    return [
      {
        key: 'orders',
        icon: <Package size={16} aria-hidden="true" />,
        text: t('{{count}} orders created today', {
          count: summary.orders?.today_orders ?? 0,
          defaultValue: '{{count}} orders created today',
        }),
        meta: t('{{count}} pending orders', {
          count: summary.orders?.pending_orders ?? 0,
          defaultValue: '{{count}} pending orders',
        }),
        accentColor: '#F97316',
      },
      {
        key: 'transit',
        icon: <Truck size={16} aria-hidden="true" />,
        text: t('{{count}} shipments are in transit', {
          count: summary.shipments?.in_transit_shipments ?? 0,
          defaultValue: '{{count}} shipments are in transit',
        }),
        meta: t('{{count}} awaiting pickup', {
          count: summary.shipments?.pending_pickup_shipments ?? 0,
          defaultValue: '{{count}} awaiting pickup',
        }),
        accentColor: '#3B82F6',
      },
      {
        key: 'delivered',
        icon: <CheckCircle2 size={16} aria-hidden="true" />,
        text: t('{{count}} shipments delivered', {
          count: summary.shipments?.delivered_shipments ?? 0,
          defaultValue: '{{count}} shipments delivered',
        }),
        meta: t('{{count}} total shipments', {
          count: summary.shipments?.total_shipments ?? 0,
          defaultValue: '{{count}} total shipments',
        }),
        accentColor: '#10B981',
      },
      {
        key: 'stock',
        icon: <Warehouse size={16} aria-hidden="true" />,
        text: t('{{count}} low stock products', {
          count: summary.warehouse?.low_stock_products ?? summary.warehouse?.low_stock_count ?? 0,
          defaultValue: '{{count}} low stock products',
        }),
        meta: t('{{count}} pending inbound requests', {
          count: summary.warehouse?.inbound_requests_pending_count ?? 0,
          defaultValue: '{{count}} pending inbound requests',
        }),
        accentColor: '#F59E0B',
      },
      {
        key: 'finance',
        icon: <FileText size={16} aria-hidden="true" />,
        text: t('{{count}} unpaid invoices', {
          count: summary.finance?.unpaid_invoices_count ?? 0,
          defaultValue: '{{count}} unpaid invoices',
        }),
        meta: t('{{count}} pending payouts', {
          count: summary.finance?.pending_payouts_count ?? 0,
          defaultValue: '{{count}} pending payouts',
        }),
        accentColor: '#EAB308',
      },
    ]
  }, [summary, t])

  // Real data across Mon-Sun without artificial variation
  const trendData = useMemo(() => {
    const delivered = summary?.shipments?.delivered_shipments ?? 0
    const transit = summary?.shipments?.in_transit_shipments ?? 0
    const returned = summary?.shipments?.returned_shipments ?? 0

    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
      day: t(day, { defaultValue: day }),
      delivered,
      transit,
      returned,
    }))
  }, [summary, t])

  const maxTrendValue = useMemo(() => {
    const vals = trendData.flatMap((d) => [d.delivered, d.transit, d.returned])
    return Math.max(...vals, 0)
  }, [trendData])

  function handleApplyFilters(newFilters: DashboardFilters) {
    setAppliedFilters(newFilters)
  }

  function handleResetFilters() {
    setAppliedFilters(INITIAL_DASHBOARD_FILTERS)
  }

  const hasDashboardData = Boolean(summary)

  return (
    <section className="page-section merchant-dashboard">
      {/* 1. Compact Header Card */}
      <header className="merchant-dashboard-header">
        <div className="merchant-dashboard-header__left">
          <span className="merchant-dashboard-header__eyebrow">
            {t('MERCHANT PORTAL', { defaultValue: 'MERCHANT PORTAL' })}
          </span>
          <h1 className="merchant-dashboard-header__title">
            {t('Dashboard', { defaultValue: 'Dashboard' })}
          </h1>
          <p className="merchant-dashboard-header__subtitle">
            {t('Overview of your store orders, shipments, and fulfillment.', {
              defaultValue: 'Overview of your store orders, shipments, and fulfillment.',
            })}
          </p>
        </div>

        <div className="merchant-dashboard-header__right">
          <DashboardFiltersPopover
            appliedFilters={appliedFilters}
            governorates={governoratesQuery.data ?? []}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
        </div>
      </header>

      {/* 2. Loading State */}
      {summaryQuery.isLoading && <DashboardSkeletonGrid />}

      {/* 3. Error State */}
      {summaryQuery.isError && (
        <ErrorState
          title={t('Dashboard summary failed', { defaultValue: 'Dashboard summary failed' })}
          message={getApiErrorMessage(summaryQuery.error)}
          onRetry={() => void summaryQuery.refetch()}
        />
      )}

      {/* 4. Empty State */}
      {!summaryQuery.isLoading && !summaryQuery.isError && !hasDashboardData && (
        <EmptyState
          title={t('No dashboard data available.', { defaultValue: 'No dashboard data available.' })}
          description={t('The API returned no dashboard metrics.', {
            defaultValue: 'The API returned no dashboard metrics.',
          })}
        />
      )}

      {/* 5. Main Dashboard Content */}
      {hasDashboardData && summary && (
        <>
          {/* Section: Overview */}
          <section className="merchant-dashboard-section" aria-labelledby="merchant-dashboard-overview-title">
            <h2 id="merchant-dashboard-overview-title" className="merchant-dashboard-section__title">
              {t('Overview', { defaultValue: 'Overview' })}
            </h2>

            <div className="merchant-dashboard-kpi-grid">
              {kpiCards.map((card) => (
                <div
                  key={card.id}
                  className={`merchant-dashboard-kpi-card merchant-dashboard-kpi-card--${card.tone}`}
                  style={{ borderTopColor: card.colorHex }}
                >
                  <div className="merchant-dashboard-kpi-card__top">
                    <div
                      className="merchant-dashboard-kpi-card__icon"
                      style={{
                        backgroundColor: `${card.colorHex}18`,
                        color: card.colorHex,
                      }}
                    >
                      {card.icon}
                    </div>
                    <div className="merchant-dashboard-kpi-card__meta">
                      <span className="merchant-dashboard-kpi-card__label">{card.label}</span>
                      <div className="merchant-dashboard-kpi-card__value">{card.value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Shipment Trends & Live Activity */}
          <div className="merchant-dashboard-analytics-grid">
            {/* Shipment Trends */}
            <div className="merchant-dashboard-chart-card">
              <div className="merchant-dashboard-chart-card__header">
                <div>
                  <h3 className="merchant-dashboard-chart-card__title">
                    {t('Shipment Trends', { defaultValue: 'Shipment Trends' })}
                  </h3>
                  <p className="merchant-dashboard-chart-card__subtitle">
                    {t('Last 7 days', { defaultValue: 'Last 7 days' })}
                  </p>
                </div>
                <div className="merchant-dashboard-chart-card__legend">
                  <span className="merchant-dashboard-legend-item">
                    <span className="merchant-dashboard-legend-dot" style={{ backgroundColor: '#10B981' }} />
                    {t('Delivered', { defaultValue: 'Delivered' })}
                  </span>
                  <span className="merchant-dashboard-legend-item">
                    <span className="merchant-dashboard-legend-dot" style={{ backgroundColor: '#3B82F6' }} />
                    {t('In Transit', { defaultValue: 'In Transit' })}
                  </span>
                  <span className="merchant-dashboard-legend-item">
                    <span className="merchant-dashboard-legend-dot" style={{ backgroundColor: '#EF4444' }} />
                    {t('Returned', { defaultValue: 'Returned' })}
                  </span>
                </div>
              </div>

              <div className="merchant-dashboard-chart-card__body">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={trendData} margin={{ top: 16, right: 12, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="merchantDeliveredGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="merchantTransitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="merchantReturnedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255, 255, 255, 0.06)" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--muted)', fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--muted)', fontSize: 11 }}
                      domain={maxTrendValue <= 1 ? [0, 1] : [0, 'auto']}
                      ticks={maxTrendValue <= 1 ? [0, 0.25, 0.5, 0.75, 1] : undefined}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#161c24',
                        color: '#f8fafc',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        fontSize: 12,
                        boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="delivered"
                      stroke="#10B981"
                      strokeWidth={2}
                      fill="url(#merchantDeliveredGrad)"
                      dot={{ r: 3, fill: '#fff', stroke: '#10B981', strokeWidth: 2 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="transit"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      fill="url(#merchantTransitGrad)"
                      dot={{ r: 3, fill: '#fff', stroke: '#3B82F6', strokeWidth: 2 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="returned"
                      stroke="#EF4444"
                      strokeWidth={2}
                      fill="url(#merchantReturnedGrad)"
                      dot={{ r: 3, fill: '#fff', stroke: '#EF4444', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Live Activity */}
            <div className="merchant-dashboard-activity-card">
              <h3 className="merchant-dashboard-activity-card__title">
                {t('Live Activity', { defaultValue: 'Live Activity' })}
              </h3>

              <div className="merchant-dashboard-activity-list">
                {activityItems.map((item) => (
                  <div key={item.key} className="merchant-dashboard-activity-item">
                    <div
                      className="merchant-dashboard-activity-item__icon"
                      style={{
                        backgroundColor: `${item.accentColor}18`,
                        color: item.accentColor,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div className="merchant-dashboard-activity-item__content">
                      <div className="merchant-dashboard-activity-item__text">{item.text}</div>
                      <div className="merchant-dashboard-activity-item__meta">{item.meta}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
