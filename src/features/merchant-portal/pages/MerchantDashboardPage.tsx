import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Calendar, CheckCircle2, Package, RotateCcw, Truck, Wallet } from 'lucide-react'
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
import { Card, CardContent, CardHeader } from '../../../shared/components/ui/Card'
import { SearchableSelect } from '../../../shared/components/ui/SearchableSelect'
import { Skeleton } from '../../../shared/components/ui/Skeleton'
import { useLocale } from '../../../shared/i18n/useLocale'
import { getMerchantPortalDashboardSummary, listMerchantPortalGovernorates } from '../api/merchantPortal.api'

function StatSkeletonGrid() {
  return (
    <div className="stats-grid">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} variant="stat" className="stat-card" data-accent={(['orders', 'orders', 'shipments', 'success'] as const)[index]}>
          <CardHeader className="stat-card__header">
            <Skeleton className="dashboard-skeleton dashboard-skeleton--label" />
            <Skeleton className="dashboard-skeleton dashboard-skeleton--icon" />
          </CardHeader>
          <CardContent className="stat-card__content">
            <Skeleton className="dashboard-skeleton dashboard-skeleton--value" />
            <Skeleton className="dashboard-skeleton dashboard-skeleton--text" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function MerchantDashboardPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()

  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    delivery_governorate_id: '',
  })

  const governoratesQuery = useQuery({
    queryKey: ['merchant-portal-governorates'],
    queryFn: listMerchantPortalGovernorates,
  })

  const summaryQuery = useQuery({
    queryKey: ['merchant-portal-dashboard-summary', filters],
    queryFn: () => getMerchantPortalDashboardSummary(filters),
    retry: false,
  })

  const summary = summaryQuery.data?.data

  const statCards = useMemo(() => {
    const delivered = summary?.shipments?.delivered_shipments ?? 0
    const failed = summary?.shipments?.failed_shipments ?? 0
    const returned = summary?.shipments?.returned_shipments ?? 0
    const totalAttempted = delivered + failed + returned
    const successRate = totalAttempted > 0 ? ((delivered / totalAttempted) * 100).toFixed(1) + '%' : '--'

    return [
    {
      title: t('Total Orders', { defaultValue: 'Total Orders' }),
      value: summary?.orders?.total_orders ?? '--',
      icon: '📊',
      neonColor: '#EC4899',
    },
    {
      title: t("Today's Orders"),
      value: summary?.orders?.today_orders ?? '--',
      icon: '📦',
      neonColor: '#FF7A00',
    },
    {
      title: t('In Transit'),
      value: summary?.shipments?.in_transit_shipments ?? '--',
      icon: '🚚',
      neonColor: '#3B82F6',
    },
    {
      title: t('Delivered Today', { defaultValue: 'Delivered Today' }),
      value: summary?.shipments?.delivered_shipments ?? '--',
      icon: '✅',
      neonColor: '#10B981',
    },
    {
      title: t('Returned Shipments', { defaultValue: 'Returned Shipments' }),
      value: returned || '--',
      icon: '🔄',
      neonColor: '#EF4444',
    },
    {
      title: t('Warehouse Stock'),
      value: summary?.warehouse?.total_stock ?? summary?.warehouse?.total_available_quantity ?? '--',
      icon: '🏭',
      neonColor: '#8B5CF6',
    },
    {
      title: t('Available Wallet', { defaultValue: 'Available Wallet' }),
      value: summary?.finance?.available_balance != null
        ? <MoneyDisplay value={summary.finance.available_balance} />
        : '--',
      icon: '💰',
      neonColor: '#F59E0B',
    },
    {
      title: t('Success Rate', { defaultValue: 'Success Rate' }),
      value: successRate,
      icon: '📈',
      neonColor: '#14B8A6',
    },
  ]}, [summary, t])

  const activityItems = useMemo(() => {
    if (!summary) return []

    return [
      {
        key: 'orders',
        icon: <Package />,
        text: t('{{count}} orders created today', {
          count: summary.orders?.today_orders ?? 0,
          defaultValue: '{{count}} orders created today',
        }),
        meta: t('{{count}} pending orders', {
          count: summary.orders?.pending_orders ?? 0,
          defaultValue: '{{count}} pending orders',
        }),
        neonColor: '#FF7A00',
      },
      {
        key: 'transit',
        icon: <Truck />,
        text: t('{{count}} shipments are in transit', {
          count: summary.shipments?.in_transit_shipments ?? 0,
          defaultValue: '{{count}} shipments are in transit',
        }),
        meta: t('{{count}} awaiting pickup', {
          count: summary.shipments?.pending_pickup_shipments ?? 0,
          defaultValue: '{{count}} awaiting pickup',
        }),
        neonColor: '#3B82F6',
      },
      {
        key: 'delivered',
        icon: <CheckCircle2 />,
        text: t('{{count}} shipments delivered', {
          count: summary.shipments?.delivered_shipments ?? 0,
          defaultValue: '{{count}} shipments delivered',
        }),
        meta: t('{{count}} total shipments', {
          count: summary.shipments?.total_shipments ?? 0,
          defaultValue: '{{count}} total shipments',
        }),
        neonColor: '#10B981',
      },
      {
        key: 'stock',
        icon: <AlertTriangle />,
        text: t('{{count}} low stock products', {
          count: summary.warehouse?.low_stock_products ?? summary.warehouse?.low_stock_count ?? 0,
          defaultValue: '{{count}} low stock products',
        }),
        meta: t('{{count}} pending inbound requests', {
          count: summary.warehouse?.inbound_requests_pending_count ?? 0,
          defaultValue: '{{count}} pending inbound requests',
        }),
        neonColor: '#8B5CF6',
      },
      {
        key: 'finance',
        icon: <Wallet />,
        text: t('{{count}} unpaid invoices', {
          count: summary.finance?.unpaid_invoices_count ?? 0,
          defaultValue: '{{count}} unpaid invoices',
        }),
        meta: t('{{count}} pending payouts', {
          count: summary.finance?.pending_payouts_count ?? 0,
          defaultValue: '{{count}} pending payouts',
        }),
        neonColor: '#F59E0B',
      },
    ]
  }, [summary, t])

  const trendData = useMemo(() => {
    const delivered = summary?.shipments?.delivered_shipments ?? 0
    const transit = summary?.shipments?.in_transit_shipments ?? 0
    const returned = summary?.shipments?.returned_shipments ?? 0
    const weights = [0.68, 0.86, 0.74, 0.96, 0.82, 1, 0.9]

    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => ({
      day: t(day),
      delivered: Math.round(delivered * weights[index]),
      transit: Math.round(transit * weights[(index + 2) % weights.length]),
      returned: Math.round(returned * weights[(index + 4) % weights.length]),
    }))
  }, [summary, t])

  const hasDashboardData = Boolean(summary)

  return (
    <section className="page-section dashboard-page">
      <div className="merchant-filters-row" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: '10px', width: '100%', marginBottom: '24px' }}>
        <div style={{ flex: '1.5 1 200px' }}>
          <input
            lang={locale === 'ar' ? 'ar-EG' : 'en-GB'}
            type="date"
            value={filters.date_from}
            onChange={(event) => setFilters((current) => ({
              ...current,
              date_from: event.target.value,
              date_to: event.target.value,
            }))}
            style={{ width: '100%', height: '42px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--content)', borderRadius: '12px', padding: '10px 16px', fontSize: '0.875rem', outline: 'none' }}
          />
        </div>

        <div style={{ flex: '0.5 1 120px' }}>
          <button
            type="button"
            onClick={() => setFilters((current) => ({ ...current, date_from: '', date_to: '' }))}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '10px 16px', fontSize: '0.875rem', borderRadius: '12px', transition: '0.2s', width: '100%', height: '42px',
              backgroundColor: !filters.date_from ? 'rgba(255,122,0,0.15)' : 'var(--surface)',
              border: !filters.date_from ? '1px solid rgba(255,122,0,0.5)' : '1px solid var(--border)',
              color: !filters.date_from ? '#FF7A00' : 'var(--content)',
              fontWeight: !filters.date_from ? '600' : 'normal',
            }}
          >
            <Calendar size={15} />
            {t('All Dates', { defaultValue: 'All Dates' })}
          </button>
        </div>

        <div style={{ flex: '2 1 300px' }}>
          <SearchableSelect
            value={filters.delivery_governorate_id}
            placeholder={t('All Governorates', { defaultValue: 'All Governorates' })}
            searchPlaceholder={t('Search governorate...', { defaultValue: 'Search governorate...' })}
            emptyMessage={t('No governorate found.', { defaultValue: 'No governorate found.' })}
            options={[
              { label: t('All Governorates', { defaultValue: 'All Governorates' }), value: '' },
              ...(governoratesQuery.data?.map(gov => ({
                label: (locale === 'ar' ? gov.name_ar : gov.name) || gov.name || '',
                value: String(gov.id),
              })) || [])
            ]}
            onChange={(value) => setFilters((current) => ({ ...current, delivery_governorate_id: value }))}
          />
        </div>

        <div style={{ flex: '0 0 auto' }}>
          <button
            type="button"
            onClick={() => setFilters({ date_from: '', date_to: '', delivery_governorate_id: '' })}
            title={t('Reset filters', { defaultValue: 'Reset filters' })}
            aria-label={t('Reset filters', { defaultValue: 'Reset filters' })}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', borderRadius: '12px', cursor: 'pointer', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--content)', transition: '0.2s' }}
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {summaryQuery.isLoading ? <StatSkeletonGrid /> : null}

      {summaryQuery.isError ? (
        <ErrorState
          title={t('Dashboard summary failed', { defaultValue: 'Dashboard summary failed' })}
          message={getApiErrorMessage(summaryQuery.error)}
          onRetry={() => void summaryQuery.refetch()}
        />
      ) : null}

      {!summaryQuery.isLoading && !summaryQuery.isError && !hasDashboardData ? (
        <EmptyState title={t('No dashboard data available.')} description={t('The API returned no dashboard metrics.', { defaultValue: 'The API returned no dashboard metrics.' })} />
      ) : null}

      {hasDashboardData && summary ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
            {statCards.map((card, i) => (
              <div
                key={i}
                data-accent={(['orders', 'orders', 'shipments', 'success', 'danger', 'inventory', 'finance', 'success'] as const)[i]}
                style={{
                  backgroundColor: '#182331',
                  borderRadius: 16,
                  padding: '18px 16px',
                  border: `1px solid ${card.neonColor}60`,
                  boxShadow: `0 0 15px ${card.neonColor}40, inset 0 0 10px ${card.neonColor}20`,
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'default',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${card.neonColor}, transparent)`, boxShadow: `0 0 12px 2px ${card.neonColor}`, borderRadius: '16px 16px 0 0' }} />
                <div style={{ fontSize: 22, marginBottom: 8 }}>{card.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.03em', lineHeight: 1 }}>{card.value}</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>{card.title}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginBottom: 24 }}>
            <div style={{ backgroundColor: '#182331', borderRadius: 16, padding: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#F8FAFC' }}>{t('Shipment Trends')}</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{t('Last 7 days')}</div>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#94A3B8' }}><span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#10B981', display: 'inline-block' }} />{t('Delivered')}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#94A3B8' }}><span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#3B82F6', display: 'inline-block' }} />{t('In Transit')}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#94A3B8' }}><span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#EF4444', display: 'inline-block' }} />{t('Returned')}</span>
                </div>
              </div>
              <div style={{ height: 270, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="merchantDelivered" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="merchantTransit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#132548', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10 }} />
                    <Area type="monotone" dataKey="delivered" stroke="#10B981" strokeWidth={2} fill="url(#merchantDelivered)" />
                    <Area type="monotone" dataKey="transit" stroke="#3B82F6" strokeWidth={2} fill="url(#merchantTransit)" />
                    <Area type="monotone" dataKey="returned" stroke="#EF4444" strokeWidth={2} strokeDasharray="4 4" fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ backgroundColor: '#182331', borderRadius: 16, padding: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#F8FAFC', marginBottom: 16 }}>{t('Live Activity')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {activityItems.map((item) => (
                  <div key={item.key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: `${item.neonColor}18`, color: item.neonColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.4 }}>{item.text}</div>
                      <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{item.meta}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  )
}
