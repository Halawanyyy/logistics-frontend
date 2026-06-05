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
import { DateRangeFilter } from '../../../shared/components/filters/DateRangeFilter'
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
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { pickDisplayLabel } from '../../../shared/i18n/locale'
import { adminPath } from '../../../shared/routing/paths'
import { formatDate } from '../../../shared/utils/formatters'
import { listOrders } from '../../orders/api/orders.api'
import { getShipment, listShipments } from '../../shipments/api/shipments.api'
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
        <Card key={index} variant="stat" className="stat-card">
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

function getTrackingTone(status: string) {
  if (/deliver/i.test(status)) {
    return 'success'
  }

  if (/transit|dispatch|assign|pickup|ship/i.test(status)) {
    return 'info'
  }

  if (/pending|attempt/i.test(status)) {
    return 'warning'
  }

  if (/failed|return|cancel/i.test(status)) {
    return 'danger'
  }

  return 'neutral'
}

export function DashboardPage() {
  const { t } = useTranslation()
  const [filters, setFilters] = useState<DashboardFilters>({
    date_from: '',
    date_to: '',
    merchant_id: '',
    assigned_driver_id: '',
  })

  const queryFilters = useMemo(() => buildFilters(filters), [filters])

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
  const trackingShipmentId = recentShipments[0]?.id

  const trackingShipmentQuery = useQuery({
    queryKey: ['shipments', trackingShipmentId, 'dashboard-tracking'],
    queryFn: () => getShipment(trackingShipmentId!),
    enabled: Boolean(trackingShipmentId),
  })

  const trackingShipment = trackingShipmentQuery.data?.data ?? recentShipments[0]
  const shipmentTotal = summary?.shipments.total ?? overview?.total_shipments ?? 0
  const assignmentCoverage = shipmentTotal ? ((summary?.shipments.assigned ?? 0) / shipmentTotal) * 100 : 0
  const deliveryCompletion = shipmentTotal ? ((summary?.shipments.delivered ?? overview?.delivered_shipments ?? 0) / shipmentTotal) * 100 : 0
  const pendingPickupShare = shipmentTotal ? ((summary?.shipments.pending_pickup ?? 0) / shipmentTotal) * 100 : 0

  const statCards = useMemo(
    () => [
      {
        title: t('Total Orders', { defaultValue: 'Total Orders' }),
        value: overview?.total_orders ?? '--',
        description: t('Live count from the finance overview endpoint.', {
          defaultValue: 'Live count from the finance overview endpoint.',
        }),
        icon: <ClipboardList size={20} />,
        tone: 'info' as const,
      },
      {
        title: t('Total Shipments', { defaultValue: 'Total Shipments' }),
        value: summary?.shipments.total ?? overview?.total_shipments ?? '--',
        description: t('Current shipment load across the dashboard summary.', {
          defaultValue: 'Current shipment load across the dashboard summary.',
        }),
        icon: <Truck size={20} />,
        tone: 'info' as const,
      },
      {
        title: t('Delivered Shipments', { defaultValue: 'Delivered Shipments' }),
        value: summary?.shipments.delivered ?? overview?.delivered_shipments ?? '--',
        description: t('Completed deliveries reflected by the live backend summary.', {
          defaultValue: 'Completed deliveries reflected by the live backend summary.',
        }),
        icon: <Package size={20} />,
        tone: 'success' as const,
      },
      {
        title: t('Net Company Profit', { defaultValue: 'Net Company Profit' }),
        value: overview?.company_net_profit ? <MoneyDisplay value={overview.company_net_profit} /> : summary?.company_profit ? <MoneyDisplay value={summary.company_profit} /> : '--',
        description: t('Operational profit using the documented finance summary.', {
          defaultValue: 'Operational profit using the documented finance summary.',
        }),
        icon: <Landmark size={20} />,
        tone: 'warning' as const,
      },
    ],
    [overview, summary, t],
  )

  const shipmentBreakdown = useMemo(
    () => [
      {
        label: t('Delivered'),
        value: summary?.shipments.delivered ?? 0,
        share: formatPercent(deliveryCompletion),
      },
      {
        label: t('Assigned'),
        value: summary?.shipments.assigned ?? 0,
        share: formatPercent(assignmentCoverage),
      },
      {
        label: t('Pending pickup'),
        value: summary?.shipments.pending_pickup ?? 0,
        share: formatPercent(pendingPickupShare),
      },
      {
        label: t('Unassigned'),
        value: summary?.shipments.unassigned ?? 0,
        share: shipmentTotal ? formatPercent(((summary?.shipments.unassigned ?? 0) / shipmentTotal) * 100) : '0%',
      },
    ],
    [assignmentCoverage, deliveryCompletion, pendingPickupShare, shipmentTotal, summary, t],
  )

  const trackingSteps = useMemo(() => {
    const histories = trackingShipment?.histories ?? []

    if (!histories.length && trackingShipment) {
      return [
        {
          id: trackingShipment.id,
          label: pickDisplayLabel(trackingShipment.status, trackingShipment.status_label),
          timestamp: trackingShipment.created_at,
          tone: getTrackingTone(trackingShipment.status),
        },
      ]
    }

    return histories
      .slice(-4)
      .map((history) => ({
        id: history.id,
        label: pickDisplayLabel(history.status, null),
        timestamp: history.created_at,
        tone: getTrackingTone(history.status),
      }))
  }, [trackingShipment])

  const hasDashboardData = Boolean(summary || overview)

  return (
    <section className="page-section dashboard-page">
      <PageHeader
        title={t('Dashboard')}
        description={t("Welcome back! Here's what's happening across logistics operations today.", {
          defaultValue: "Welcome back! Here's what's happening across logistics operations today.",
        })}
      />

      <Card className="dashboard-filter-card dashboard-filter-card--framed">
        <CardContent className="dashboard-filters">
          <DateRangeFilter
            dateFrom={filters.date_from}
            dateTo={filters.date_to}
            onChange={({ date_from, date_to }) =>
              setFilters((current) => ({ ...current, date_from, date_to }))
            }
          />
          <label className="dashboard-filter">
            <span className="eyebrow">{t('Merchant')}</span>
            <MerchantSelector
              includeAllOption
              value={String(filters.merchant_id ?? '')}
              onChange={(merchant_id) => setFilters((current) => ({ ...current, merchant_id }))}
            />
          </label>
          <label className="dashboard-filter">
            <span className="eyebrow">{t('Assigned Driver')}</span>
            <DriverSelector
              includeAllOption
              value={String(filters.assigned_driver_id ?? '')}
              onChange={(assigned_driver_id) =>
                setFilters((current) => ({ ...current, assigned_driver_id }))
              }
            />
          </label>
        </CardContent>
      </Card>

      {dashboardSummaryQuery.isLoading || financeOverviewQuery.isLoading ? <StatSkeletonGrid /> : null}

      {dashboardSummaryQuery.isError ? (
        <ErrorState
          title="Dashboard summary failed"
          message={getApiErrorMessage(dashboardSummaryQuery.error)}
          onRetry={() => void dashboardSummaryQuery.refetch()}
        />
      ) : null}

      {financeOverviewQuery.isError ? (
        <ErrorState
          title="Finance overview failed"
          message={getApiErrorMessage(financeOverviewQuery.error)}
          onRetry={() => void financeOverviewQuery.refetch()}
        />
      ) : null}

      {!dashboardSummaryQuery.isLoading &&
      !financeOverviewQuery.isLoading &&
      !dashboardSummaryQuery.isError &&
      !financeOverviewQuery.isError &&
      !hasDashboardData ? (
        <EmptyState title="No dashboard data" description="The API returned no dashboard metrics." />
      ) : null}

      {hasDashboardData ? (
        <div className="stats-grid">
          {statCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>
      ) : null}

      <div className="dashboard-grid">
        <Card className="dashboard-panel-card dashboard-grid__orders">
            <CardHeader className="dashboard-panel-card__header">
              <div>
                <CardTitle>{t('Live Orders', { defaultValue: 'Live Orders' })}</CardTitle>
                <CardDescription>
                  {t('Recent orders from the live orders API, shown without fake placeholders.', {
                    defaultValue: 'Recent orders from the live orders API, shown without fake placeholders.',
                  })}
                </CardDescription>
              </div>
              <Link className="dashboard-panel-link" to={adminPath('/orders')}>
                {t('View all orders', { defaultValue: 'View all orders' })}
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
                        <TableHead>{t('Area', { defaultValue: 'Area' })}</TableHead>
                        <TableHead>{t('Status')}</TableHead>
                        <TableHead>{t('COD')}</TableHead>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id}>
                          <TableCell>
                            <Link className="table-link" to={adminPath(`/orders/${order.id}`)}>
                              {order.order_number}
                            </Link>
                            <p className="table-meta">{formatDate(order.created_at)}</p>
                          </TableCell>
                          <TableCell>
                            {order.customer_name}
                            <p className="table-meta">{order.merchant_name}</p>
                          </TableCell>
                          <TableCell>
                            {order.delivery_governorate_name}
                            <p className="table-meta">{order.delivery_area_name ?? t('No area')}</p>
                          </TableCell>
                          <TableCell>
                            <StatusBadge value={order.status}>
                              {pickDisplayLabel(order.status, order.status_label)}
                            </StatusBadge>
                          </TableCell>
                          <TableCell><MoneyDisplay value={order.cod_amount} /></TableCell>
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
                  <div key={item.label} className="dashboard-breakdown-item">
                    <div>
                      <strong>{item.label}</strong>
                      <p>{item.value}</p>
                    </div>
                    <span>{item.share}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="dashboard-panel-card dashboard-grid__tracking">
            <CardHeader className="dashboard-panel-card__header">
              <div>
                <CardTitle>{t('Order Tracking', { defaultValue: 'Order Tracking' })}</CardTitle>
                <CardDescription>
                  {trackingShipment
                    ? t('Latest shipment progress based on real shipment history records.', {
                      defaultValue: 'Latest shipment progress based on real shipment history records.',
                    })
                    : t('Tracking will appear here when a recent shipment is available.', {
                      defaultValue: 'Tracking will appear here when a recent shipment is available.',
                    })}
                </CardDescription>
              </div>
              <Link className="dashboard-panel-link" to={adminPath('/shipments')}>
                {t('Track another shipment', { defaultValue: 'Track another shipment' })}
              </Link>
            </CardHeader>
            <CardContent className="page-stack">
              {trackingShipmentQuery.isLoading ? <ChartSkeleton /> : null}
              {trackingShipmentQuery.isError ? (
                <ErrorState
                  title={t('Shipment tracking failed', { defaultValue: 'Shipment tracking failed' })}
                  message={getApiErrorMessage(trackingShipmentQuery.error)}
                  onRetry={() => void trackingShipmentQuery.refetch()}
                />
              ) : null}
              {!trackingShipment && !trackingShipmentQuery.isLoading && !trackingShipmentQuery.isError ? (
                <EmptyState
                  title={t('No tracking data', { defaultValue: 'No tracking data' })}
                  description={t('Open Shipments to review tracking history once records are available.', {
                    defaultValue: 'Open Shipments to review tracking history once records are available.',
                  })}
                  action={(
                    <Link className="ui-link-reset" to={adminPath('/shipments')}>
                      <Button variant="secondary">{t('Open Shipments', { defaultValue: 'Open Shipments' })}</Button>
                    </Link>
                  )}
                />
              ) : null}
              {trackingShipment ? (
                <>
                  <div className="tracking-steps">
                    {trackingSteps.map((step, index) => (
                      <div key={step.id} className="tracking-step">
                        <div className={`tracking-step__dot tracking-step__dot--${step.tone}`} />
                        <div className="tracking-step__body">
                          <strong>{step.label}</strong>
                          <p>{formatDate(step.timestamp)}</p>
                        </div>
                        {index < trackingSteps.length - 1 ? <div className="tracking-step__line" /> : null}
                      </div>
                    ))}
                  </div>

                  <div className="tracking-summary">
                    <div>
                      <span>{t('Shipment')}</span>
                      <strong>{trackingShipment.shipment_number}</strong>
                    </div>
                    <div>
                      <span>{t('Customer')}</span>
                      <strong>{trackingShipment.customer_name}</strong>
                    </div>
                    <div>
                      <span>{t('Courier', { defaultValue: 'Courier' })}</span>
                      <strong>{trackingShipment.assigned_driver_name ?? t('Unassigned')}</strong>
                    </div>
                    <div>
                      <span>{t('COD')}</span>
                      <strong><MoneyDisplay value={trackingShipment.cod_amount} /></strong>
                    </div>
                  </div>
                </>
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
                {t('View all', { defaultValue: 'View all' })}
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
                <div className="activity-list">
                  {recentShipments.map((shipment) => (
                    <Link key={shipment.id} className="activity-row" to={adminPath(`/shipments/${shipment.id}`)}>
                      <div>
                        <p className="activity-row__title">{shipment.shipment_number}</p>
                        <p className="activity-row__meta">{shipment.customer_name}</p>
                      </div>
                      <div className="activity-row__side">
                        <StatusBadge value={shipment.status}>
                          {pickDisplayLabel(shipment.status, shipment.status_label)}
                        </StatusBadge>
                        <p className="activity-row__meta">{formatDate(shipment.created_at)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
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
