import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  Boxes,
  ClipboardList,
  Landmark,
  Package,
  Truck,
} from 'lucide-react'
import {
  FilterButton,
  FilterPopover,
  FilterField,
  AppliedFilterChips,
  DateRangeFilter,
  type AppliedChip,
} from '../../../shared/components/filters'
import { DriverSelector } from '../../../shared/components/selectors/DriverSelector'
import { MerchantSelector } from '../../../shared/components/selectors/MerchantSelector'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../shared/components/ui/Card'
import { Skeleton } from '../../../shared/components/ui/Skeleton'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { Button } from '../../../shared/components/ui/Button'
import { Select } from '../../../shared/components/ui/Select'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { pickDisplayLabel } from '../../../shared/i18n/locale'
import { adminPath } from '../../../shared/routing/paths'
import { formatDate } from '../../../shared/utils/formatters'
import { listOrders } from '../../orders/api/orders.api'
import { listShipments } from '../../shipments/api/shipments.api'
import { getDashboardSummary, getFinanceOverview } from '../api/dashboard.api'
import { FinanceOverviewChart } from '../components/FinanceOverviewChart'
import { ShipmentStatusChart } from '../components/ShipmentStatusChart'
import { StatCard } from '../components/StatCard'
import type { DashboardFilters } from '../types/dashboard.types'

function buildFilters(filters: DashboardFilters) {
  return {
    ...(filters.date_from ? { date_from: filters.date_from } : {}),
    ...(filters.date_to ? { date_to: filters.date_to } : {}),
    ...(filters.merchant_id ? { merchant_id: filters.merchant_id } : {}),
    ...(filters.assigned_driver_id ? { assigned_driver_id: filters.assigned_driver_id } : {}),
  }
}

function StatSkeletonGrid() {
  return (
    <div className="stats-grid">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} variant="stat" className="stat-card" data-accent={(['orders', 'shipments', 'success', 'success'] as const)[index]}>
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

function ChartSkeleton() {
  return <Skeleton className="dashboard-skeleton dashboard-skeleton--chart" />
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

type DashboardDatePreset = 'all' | 'today' | 'this_week' | 'this_month' | 'last_month' | 'custom'

function toInputDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getPresetRange(preset: Exclude<DashboardDatePreset, 'all' | 'custom'>) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(start)

  if (preset === 'this_week') {
    const day = start.getDay() || 7
    start.setDate(start.getDate() - day + 1)
  } else if (preset === 'this_month') {
    start.setDate(1)
  } else if (preset === 'last_month') {
    start.setMonth(start.getMonth() - 1, 1)
    end.setDate(0)
  }

  return { date_from: toInputDate(start), date_to: toInputDate(end) }
}

export function DashboardPage() {
  const { t } = useTranslation()
  const [appliedFilters, setAppliedFilters] = useState<DashboardFilters>({
    date_from: '',
    date_to: '',
    merchant_id: '',
    assigned_driver_id: '',
  })
  const [draftFilters, setDraftFilters] = useState<DashboardFilters>({
    date_from: '',
    date_to: '',
    merchant_id: '',
    assigned_driver_id: '',
  })
  const [appliedDatePreset, setAppliedDatePreset] = useState<DashboardDatePreset>('all')
  const [draftDatePreset, setDraftDatePreset] = useState<DashboardDatePreset>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterError, setFilterError] = useState('')

  const queryFilters = useMemo(() => buildFilters(appliedFilters), [appliedFilters])

  const dashboardSummaryQuery = useQuery({
    queryKey: ['dashboard-summary', queryFilters],
    queryFn: () => getDashboardSummary(queryFilters),
  })

  const financeOverviewQuery = useQuery({
    queryKey: ['finance-overview', queryFilters],
    queryFn: () => getFinanceOverview(queryFilters),
  })

  const ordersQuery = useQuery({
    queryKey: ['orders', 'dashboard-recent', queryFilters],
    queryFn: () => listOrders(queryFilters),
  })

  const shipmentsQuery = useQuery({
    queryKey: ['shipments', 'dashboard-recent', queryFilters],
    queryFn: () => listShipments(queryFilters),
  })

  const summary = dashboardSummaryQuery.data?.data
  const overview = financeOverviewQuery.data?.data
  const recentOrders = (ordersQuery.data?.data ?? []).slice(0, 5)
  const recentShipments = (shipmentsQuery.data?.data ?? []).slice(0, 5)
  const shipmentTotal = summary?.shipments.total ?? overview?.total_shipments ?? 0
  const assignmentCoverage = shipmentTotal ? ((summary?.shipments.assigned ?? 0) / shipmentTotal) * 100 : 0
  const deliveryCompletion = shipmentTotal ? ((summary?.shipments.delivered ?? overview?.delivered_shipments ?? 0) / shipmentTotal) * 100 : 0
  const pendingPickupShare = shipmentTotal ? ((summary?.shipments.pending_pickup ?? 0) / shipmentTotal) * 100 : 0

  const statCards = useMemo(
    () => [
      {
        title: t('Total Orders', { defaultValue: 'Total Orders' }),
        value: overview?.total_orders ?? '--',
        description: t('{{count}} recent orders shown below', { count: recentOrders.length, defaultValue: `${recentOrders.length} recent orders shown below` }),
        icon: <ClipboardList size={20} />,
        accent: 'orders' as const,
        tone: 'info' as const,
      },
      {
        title: t('Total Shipments', { defaultValue: 'Total Shipments' }),
        value: summary?.shipments.total ?? overview?.total_shipments ?? '--',
        description: t('{{coverage}} assigned in this period', { coverage: formatPercent(assignmentCoverage), defaultValue: `${formatPercent(assignmentCoverage)} assigned in this period` }),
        icon: <Truck size={20} />,
        accent: 'shipments' as const,
        tone: 'info' as const,
      },
      {
        title: t('Delivered Shipments', { defaultValue: 'Delivered Shipments' }),
        value: summary?.shipments.delivered ?? overview?.delivered_shipments ?? '--',
        description: t('{{completion}} delivery completion', { completion: formatPercent(deliveryCompletion), defaultValue: `${formatPercent(deliveryCompletion)} delivery completion` }),
        icon: <Package size={20} />,
        accent: 'success' as const,
        tone: 'success' as const,
      },
      {
        title: t('Net Company Profit', { defaultValue: 'Net Company Profit' }),
        value: overview?.company_net_profit ? <MoneyDisplay value={overview.company_net_profit} /> : summary?.company_profit ? <MoneyDisplay value={summary.company_profit} /> : '--',
        description: t('Net result for the selected period', { defaultValue: 'Net result for the selected period' }),
        icon: <Landmark size={20} />,
        accent: 'success' as const,
        tone: 'warning' as const,
      },
    ],
    [assignmentCoverage, deliveryCompletion, overview, recentOrders.length, summary, t],
  )

  const shipmentBreakdown = useMemo(
    () => [
      {
        key: 'delivered',
        label: t('Delivered'),
        value: summary?.shipments.delivered ?? 0,
        share: formatPercent(deliveryCompletion),
      },
      {
        key: 'assigned',
        label: t('Assigned'),
        value: summary?.shipments.assigned ?? 0,
        share: formatPercent(assignmentCoverage),
      },
      {
        key: 'pending',
        label: t('Pending pickup'),
        value: summary?.shipments.pending_pickup ?? 0,
        share: formatPercent(pendingPickupShare),
      },
      {
        key: 'unassigned',
        label: t('Unassigned'),
        value: summary?.shipments.unassigned ?? 0,
        share: shipmentTotal ? formatPercent(((summary?.shipments.unassigned ?? 0) / shipmentTotal) * 100) : '0%',
      },
    ],
    [assignmentCoverage, deliveryCompletion, pendingPickupShare, shipmentTotal, summary, t],
  )

  const hasDashboardData = Boolean(summary || overview)

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (appliedDatePreset !== 'all') count += 1
    if (appliedFilters.merchant_id) count += 1
    if (appliedFilters.assigned_driver_id) count += 1
    return count
  }, [appliedDatePreset, appliedFilters])

  const handleOpenChange = (open: boolean) => {
    setFiltersOpen(open)
    if (open) {
      setDraftFilters(appliedFilters)
      setDraftDatePreset(appliedDatePreset)
      setFilterError('')
    }
  }

  const updateDraftDatePreset = (preset: DashboardDatePreset) => {
    setDraftDatePreset(preset)
    if (preset === 'all') {
      setDraftFilters((current) => ({ ...current, date_from: '', date_to: '' }))
    } else if (preset !== 'custom') {
      setDraftFilters((current) => ({ ...current, ...getPresetRange(preset) }))
    }
  }

  const handleApply = () => {
    if (draftFilters.date_from && draftFilters.date_to && draftFilters.date_from > draftFilters.date_to) {
      setFilterError(t('Date From must not be later than Date To.', { defaultValue: 'Date From must not be later than Date To.' }))
      return
    }
    setFilterError('')
    setAppliedFilters(draftFilters)
    setAppliedDatePreset(draftDatePreset)
    setFiltersOpen(false)
  }

  const handleReset = () => {
    const defaultFilters: DashboardFilters = {
      date_from: '',
      date_to: '',
      merchant_id: '',
      assigned_driver_id: '',
    }
    setDraftFilters(defaultFilters)
    setAppliedFilters(defaultFilters)
    setDraftDatePreset('all')
    setAppliedDatePreset('all')
    setFilterError('')
    setFiltersOpen(false)
  }

  const appliedChips = useMemo<AppliedChip[]>(() => {
    const chips: AppliedChip[] = []
    if (appliedDatePreset !== 'all') {
      chips.push({
        id: 'date_preset',
        label: t('Date Range', { defaultValue: 'Date Range' }),
        value: appliedDatePreset === 'custom'
          ? `${appliedFilters.date_from || ''} → ${appliedFilters.date_to || ''}`
          : appliedDatePreset,
      })
    }
    if (appliedFilters.merchant_id) {
      chips.push({
        id: 'merchant_id',
        label: t('Merchant'),
        value: String(appliedFilters.merchant_id),
      })
    }
    if (appliedFilters.assigned_driver_id) {
      chips.push({
        id: 'assigned_driver_id',
        label: t('Assigned Driver', { defaultValue: 'Assigned Driver' }),
        value: String(appliedFilters.assigned_driver_id),
      })
    }
    return chips
  }, [appliedDatePreset, appliedFilters, t])

  const handleRemoveChip = (chipId: string) => {
    if (chipId === 'date_preset') {
      setAppliedDatePreset('all')
      setAppliedFilters((c) => ({ ...c, date_from: '', date_to: '' }))
    } else {
      setAppliedFilters((c) => ({ ...c, [chipId]: '' }))
    }
  }

  const handleClearAllChips = () => {
    handleReset()
  }

  return (
    <section className="page-section dashboard-page">
      <PageHeader
        title={t('Dashboard')}
        description={t("Welcome back! Here's what's happening across logistics operations today.", {
          defaultValue: "Welcome back! Here's what's happening across logistics operations today.",
        })}
        actions={(
          <FilterPopover
            title={t('Dashboard filters', { defaultValue: 'Dashboard filters' })}
            activeCount={activeFilterCount}
            open={filtersOpen}
            onOpenChange={handleOpenChange}
            onApply={handleApply}
            onReset={handleReset}
            trigger={<FilterButton activeCount={activeFilterCount} />}
          >
            <FilterField label={t('Date Range', { defaultValue: 'Date Range' })}>
              <Select value={draftDatePreset} onChange={(event) => updateDraftDatePreset(event.target.value as DashboardDatePreset)}>
                <option value="all">{t('All Time', { defaultValue: 'All Time' })}</option>
                <option value="today">{t('Today', { defaultValue: 'Today' })}</option>
                <option value="this_week">{t('This Week', { defaultValue: 'This Week' })}</option>
                <option value="this_month">{t('This Month', { defaultValue: 'This Month' })}</option>
                <option value="last_month">{t('Last Month', { defaultValue: 'Last Month' })}</option>
                <option value="custom">{t('Custom Range', { defaultValue: 'Custom Range' })}</option>
              </Select>
            </FilterField>
            <DateRangeFilter
              dateFrom={draftFilters.date_from}
              dateTo={draftFilters.date_to}
              onChange={({ date_from, date_to }) => {
                setDraftDatePreset('custom')
                setDraftFilters((current) => ({ ...current, date_from, date_to }))
              }}
              error={filterError}
            />
            <FilterField label={t('Merchant')}>
              <MerchantSelector
                includeAllOption
                value={String(draftFilters.merchant_id ?? '')}
                onChange={(merchant_id) => setDraftFilters((current) => ({ ...current, merchant_id }))}
              />
            </FilterField>
            <FilterField label={t('Assigned Driver', { defaultValue: 'Assigned Driver' })}>
              <DriverSelector
                includeAllOption
                value={String(draftFilters.assigned_driver_id ?? '')}
                onChange={(assigned_driver_id) => setDraftFilters((current) => ({ ...current, assigned_driver_id }))}
              />
            </FilterField>
          </FilterPopover>
        )}
      />

      <AppliedFilterChips
        chips={appliedChips}
        onRemove={handleRemoveChip}
        onClearAll={handleClearAllChips}
      />

      {dashboardSummaryQuery.isLoading || financeOverviewQuery.isLoading ? <StatSkeletonGrid /> : null}

      {dashboardSummaryQuery.isError ? (
        <ErrorState
          title={t('Dashboard summary failed', { defaultValue: 'Dashboard summary failed' })}
          message={getApiErrorMessage(dashboardSummaryQuery.error)}
          onRetry={() => void dashboardSummaryQuery.refetch()}
        />
      ) : null}

      {financeOverviewQuery.isError ? (
        <ErrorState
          title={t('Finance overview failed', { defaultValue: 'Finance overview failed' })}
          message={getApiErrorMessage(financeOverviewQuery.error)}
          onRetry={() => void financeOverviewQuery.refetch()}
        />
      ) : null}

      {!dashboardSummaryQuery.isLoading &&
        !financeOverviewQuery.isLoading &&
        !dashboardSummaryQuery.isError &&
        !financeOverviewQuery.isError &&
        !hasDashboardData ? (
        <EmptyState title={t('No dashboard data', { defaultValue: 'No dashboard data' })} description={t('The API returned no dashboard metrics.', { defaultValue: 'The API returned no dashboard metrics.' })} />
      ) : null}

      {hasDashboardData ? (
        <div className="stats-grid dashboard-stat-grid">
          {statCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>
      ) : null}

      <div className="dashboard-grid dashboard-layout">
        <Card className="dashboard-panel-card dashboard-grid__orders">
          <CardHeader className="dashboard-panel-card__header">
            <div>
              <CardTitle>{t('Recent Orders', { defaultValue: 'Recent Orders' })}</CardTitle>
              <CardDescription>
                {t('Recent orders from the live orders API, shown without fake placeholders.', {
                  defaultValue: 'Recent orders from the live orders API, shown without fake placeholders.',
                })}
              </CardDescription>
            </div>
            <Link className="dashboard-panel-link" to={adminPath('/orders')}>
              {t('View all orders', { defaultValue: 'View all orders' })} <ArrowRight size={14} />
            </Link>
          </CardHeader>
          <CardContent>
            {ordersQuery.isLoading ? <ChartSkeleton /> : null}
            {ordersQuery.isError ? (
              <ErrorState
                title={t('Recent orders failed', { defaultValue: 'Recent orders failed' })}
                message={getApiErrorMessage(ordersQuery.error)}
                onRetry={() => void ordersQuery.refetch()}
              />
            ) : null}
            {!ordersQuery.isLoading && !ordersQuery.isError && recentOrders.length === 0 ? (
              <EmptyState
                title={t('No recent orders', { defaultValue: 'No recent orders' })}
                description={t('The backend returned no recent orders for the selected filters.', {
                  defaultValue: 'The backend returned no recent orders for the selected filters.',
                })}
                action={(
                  <Link className="ui-link-reset" to={adminPath('/orders')}>
                    <Button variant="secondary">{t('Open Orders', { defaultValue: 'Open Orders' })}</Button>
                  </Link>
                )}
              />
            ) : null}
            {recentOrders.length > 0 ? (
              <TableContainer>
                <Table variant="compact">
                  <thead>
                    <tr>
                      <TableHead>{t('Order')}</TableHead>
                      <TableHead>{t('Customer')}</TableHead>
                      <TableHead>{t('Status')}</TableHead>
                      <TableHead>{t('Amount')}</TableHead>
                      <TableHead>{t('Date', { defaultValue: 'Date' })}</TableHead>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id}>
                        <TableCell>
                          <Link className="table-link" to={adminPath(`/orders/${order.id}`)}>
                            {order.order_number}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {order.customer_name}
                          <p className="table-meta">{order.merchant_name}</p>
                        </TableCell>
                        <TableCell>
                          <StatusBadge value={order.status}>
                            {pickDisplayLabel(order.status, order.status_label)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell><MoneyDisplay value={order.cod_amount} /></TableCell>
                        <TableCell>{formatDate(order.created_at)}</TableCell>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableContainer>
            ) : null}
          </CardContent>
        </Card>

        <Card className="dashboard-panel-card dashboard-grid__performance">
          <CardHeader>
            <CardTitle>{t('Performance Overview', { defaultValue: 'Performance Overview' })}</CardTitle>
            <CardDescription>
              {t('Live shipment distribution from the dashboard summary endpoint.', {
                defaultValue: 'Live shipment distribution from the dashboard summary endpoint.',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="page-stack">
            {dashboardSummaryQuery.isLoading ? <ChartSkeleton /> : null}
            {dashboardSummaryQuery.isError ? (
              <ErrorState
                title={t('Shipment chart failed', { defaultValue: 'Shipment chart failed' })}
                message={getApiErrorMessage(dashboardSummaryQuery.error)}
                onRetry={() => void dashboardSummaryQuery.refetch()}
              />
            ) : null}
            {summary ? <ShipmentStatusChart summary={summary} /> : null}
            {!dashboardSummaryQuery.isLoading && !dashboardSummaryQuery.isError && !summary ? (
              <EmptyState
                title={t('No shipment metrics', { defaultValue: 'No shipment metrics' })}
                description={t('The API returned no shipment summary.', { defaultValue: 'The API returned no shipment summary.' })}
              />
            ) : null}
            {summary ? (
              <div className="dashboard-breakdown-list">
                {shipmentBreakdown.map((item) => (
                  <div key={item.key} className={`dashboard-breakdown-item dashboard-breakdown-item--${item.key}`}>
                    <div>
                      <strong><span className="dashboard-breakdown-item__dot" aria-hidden="true" />{item.label}</strong>
                      <p>{item.value}</p>
                    </div>
                    <span>{item.share}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="dashboard-panel-card dashboard-grid__finance">
          <CardHeader>
            <CardTitle>{t('Finance Snapshot', { defaultValue: 'Finance Snapshot' })}</CardTitle>
            <CardDescription>
              {t('Revenue-related finance metrics from the documented overview endpoint.', {
                defaultValue: 'Revenue-related finance metrics from the documented overview endpoint.',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="page-stack">
            {financeOverviewQuery.isLoading ? <ChartSkeleton /> : null}
            {financeOverviewQuery.isError ? (
              <ErrorState
                title={t('Finance chart failed', { defaultValue: 'Finance chart failed' })}
                message={getApiErrorMessage(financeOverviewQuery.error)}
                onRetry={() => void financeOverviewQuery.refetch()}
              />
            ) : null}
            {overview ? <FinanceOverviewChart overview={overview} /> : null}
            {!financeOverviewQuery.isLoading && !financeOverviewQuery.isError && !overview ? (
              <EmptyState
                title={t('No finance metrics', { defaultValue: 'No finance metrics' })}
                description={t('The API returned no finance overview.', { defaultValue: 'The API returned no finance overview.' })}
              />
            ) : null}
          </CardContent>
        </Card>

        <Card className="dashboard-panel-card dashboard-grid__shipments">
          <CardHeader className="dashboard-panel-card__header">
            <div>
              <CardTitle>{t('Recent Shipments', { defaultValue: 'Recent Shipments' })}</CardTitle>
              <CardDescription>
                {t('Fresh operational updates from the shipments API.', {
                  defaultValue: 'Fresh operational updates from the shipments API.',
                })}
              </CardDescription>
            </div>
            <Link className="dashboard-panel-link" to={adminPath('/shipments')}>
              {t('View all shipments', { defaultValue: 'View all shipments' })} <ArrowRight size={14} />
            </Link>
          </CardHeader>
          <CardContent className="page-stack">
            {shipmentsQuery.isLoading ? <ChartSkeleton /> : null}
            {shipmentsQuery.isError ? (
              <ErrorState
                title={t('Recent shipments failed', { defaultValue: 'Recent shipments failed' })}
                message={getApiErrorMessage(shipmentsQuery.error)}
                onRetry={() => void shipmentsQuery.refetch()}
              />
            ) : null}
            {!shipmentsQuery.isLoading && !shipmentsQuery.isError && recentShipments.length === 0 ? (
              <EmptyState
                title={t('No recent shipments', { defaultValue: 'No recent shipments' })}
                description={t('The backend returned no recent shipments for the selected filters.', {
                  defaultValue: 'The backend returned no recent shipments for the selected filters.',
                })}
              />
            ) : null}
            {recentShipments.length ? (
              <TableContainer>
                <Table variant="compact">
                  <thead><tr><TableHead>{t('Shipment')}</TableHead><TableHead>{t('Driver', { defaultValue: 'Driver' })}</TableHead><TableHead>{t('Status')}</TableHead><TableHead>{t('Area', { defaultValue: 'Area' })}</TableHead><TableHead>{t('Date', { defaultValue: 'Date' })}</TableHead></tr></thead>
                  <tbody>
                    {recentShipments.map((shipment) => (
                      <tr key={shipment.id}>
                        <TableCell><Link className="table-link" to={adminPath(`/shipments/${shipment.id}`)}>{shipment.shipment_number}</Link></TableCell>
                        <TableCell>{shipment.assigned_driver_name ?? t('Unassigned')}</TableCell>
                        <TableCell><StatusBadge value={shipment.status}>{pickDisplayLabel(shipment.status, shipment.status_label)}</StatusBadge></TableCell>
                        <TableCell>{shipment.delivery_area_name ?? shipment.delivery_governorate_name}</TableCell>
                        <TableCell>{formatDate(shipment.created_at)}</TableCell>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableContainer>
            ) : null}
          </CardContent>
        </Card>

        <Card className="dashboard-coverage-card dashboard-grid__coverage">
          <CardContent className="dashboard-coverage-card__content">
            <div className="dashboard-coverage-card__copy">
              <span className="eyebrow">{t('Fulfillment Coverage', { defaultValue: 'Fulfillment Coverage' })}</span>
              <h3>{t('Keep orders, inventory, and dispatch aligned nationwide.', {
                defaultValue: 'Keep orders, inventory, and dispatch aligned nationwide.',
              })}</h3>
              <p>{t('Use Warehouses, Shipments, and Orders to coordinate the full logistics workflow from one place.', {
                defaultValue: 'Use Warehouses, Shipments, and Orders to coordinate the full logistics workflow from one place.',
              })}</p>
            </div>
            <div className="dashboard-coverage-card__actions">
              <Link className="ui-link-reset" to={adminPath('/warehouses')}>
                <Button variant="secondary">
                  <Boxes size={16} />
                  {t('Open Warehouses', { defaultValue: 'Open Warehouses' })}
                </Button>
              </Link>
              <Link className="ui-link-reset" to={adminPath('/shipments')}>
                <Button>
                  {t('See Shipments', { defaultValue: 'See Shipments' })}
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
