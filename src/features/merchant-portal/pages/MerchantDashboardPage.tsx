import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Boxes, ClipboardList, Package, Truck, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { Button } from '../../../shared/components/ui/Button'
import { Skeleton } from '../../../shared/components/ui/Skeleton'
import { merchantPath } from '../../../shared/routing/paths'
import { StatCard } from '../../dashboard/components/StatCard'
import { getMerchantPortalDashboardSummary } from '../api/merchantPortal.api'
import { useMerchantPortalContext } from '../context/merchantPortal.context'
import { MerchantOrderStatusChart } from '../components/dashboard/MerchantOrderStatusChart'
import { MerchantShipmentStatusChart } from '../components/dashboard/MerchantShipmentStatusChart'
import { MerchantFinanceSnapshotChart } from '../components/dashboard/MerchantFinanceSnapshotChart'
import { MerchantWarehouseSnapshotChart } from '../components/dashboard/MerchantWarehouseSnapshotChart'

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

export function MerchantDashboardPage() {
  const { t } = useTranslation()
  const { hasMerchantCapability } = useMerchantPortalContext()

  const summaryQuery = useQuery({
    queryKey: ['merchant-portal-dashboard-summary'],
    queryFn: getMerchantPortalDashboardSummary,
    retry: false,
  })

  const summary = summaryQuery.data?.data

  const statCards = useMemo(() => ([
    {
      title: t('Total Orders'),
      value: summary?.orders?.total_orders ?? '--',
      description: t('All merchant orders returned by the merchant dashboard summary.', {
        defaultValue: 'All merchant orders returned by the merchant dashboard summary.',
      }),
      icon: <ClipboardList size={20} />,
      tone: 'info' as const,
    },
    {
      title: t('Pending Orders'),
      value: summary?.orders?.pending_orders ?? '--',
      description: t('Orders still waiting for confirmation or operational progress.', {
        defaultValue: 'Orders still waiting for confirmation or operational progress.',
      }),
      icon: <Package size={20} />,
      tone: 'warning' as const,
    },
    {
      title: t('Total Shipments'),
      value: summary?.shipments?.total_shipments ?? '--',
      description: t('Shipment activity visible to this merchant from merchant-scoped APIs.', {
        defaultValue: 'Shipment activity visible to this merchant from merchant-scoped APIs.',
      }),
      icon: <Truck size={20} />,
      tone: 'info' as const,
    },
    {
      title: t('Available Balance', { defaultValue: 'Available Balance' }),
      value: summary?.finance?.available_balance != null
        ? <MoneyDisplay value={summary.finance.available_balance} />
        : '--',
      description: t('Live wallet balance returned by the merchant finance summary.', {
        defaultValue: 'Live wallet balance returned by the merchant finance summary.',
      }),
      icon: <Wallet size={20} />,
      tone: 'success' as const,
    },
  ]), [summary, t])

  const hasDashboardData = Boolean(summary)

  return (
    <section className="page-section dashboard-page">
      <PageHeader
        eyebrow={t('Merchant Portal', { defaultValue: 'Merchant Portal' })}
        title={t('Merchant Dashboard', { defaultValue: 'Merchant Dashboard' })}
        description={t('Overview of your orders, shipments, inventory, and financial activity.', {
          defaultValue: 'Overview of your orders, shipments, inventory, and financial activity.',
        })}
        actions={(
          <div className="page-header__button-row">
            {hasMerchantCapability('orders.create') ? (
              <Link className="ui-link-reset" to={merchantPath('/orders/create')}>
                <Button>{t('Create Order', { defaultValue: 'Create Order' })}</Button>
              </Link>
            ) : null}
            {hasMerchantCapability('profile.view') ? (
              <Link className="ui-link-reset" to={merchantPath('/profile')}>
                <Button variant="secondary">{t('Profile', { defaultValue: 'Profile' })}</Button>
              </Link>
            ) : null}
          </div>
        )}
      />

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
          <div className="stats-grid">
            {statCards.map((card) => (
              <StatCard key={card.title} {...card} />
            ))}
          </div>

          <div className="dashboard-grid">
            <Card className="dashboard-panel-card dashboard-grid__quarter">
              <CardHeader className="dashboard-panel-card__header">
                <div>
                  <CardTitle>{t('Orders Status Breakdown')}</CardTitle>
                  <CardDescription>
                    {t('Live order distribution from the dashboard summary endpoint.', {
                      defaultValue: 'Live order distribution from the dashboard summary endpoint.',
                    })}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="page-stack">
                {summary.orders && summary.orders.total_orders > 0 ? (
                  <MerchantOrderStatusChart summary={summary.orders} />
                ) : (
                  <EmptyState
                    title={t('No chart data available yet.')}
                    description={t('No orders found to generate a chart.', { defaultValue: 'No orders found to generate a chart.' })}
                  />
                )}
              </CardContent>
            </Card>

            <Card className="dashboard-panel-card dashboard-grid__quarter">
              <CardHeader className="dashboard-panel-card__header">
                <div>
                  <CardTitle>{t('Shipments Status Breakdown')}</CardTitle>
                  <CardDescription>
                    {t('Live shipment distribution from the dashboard summary endpoint.', {
                      defaultValue: 'Live shipment distribution from the dashboard summary endpoint.',
                    })}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="page-stack">
                {summary.shipments && summary.shipments.total_shipments > 0 ? (
                  <MerchantShipmentStatusChart summary={summary.shipments} />
                ) : (
                  <EmptyState
                    title={t('No chart data available yet.')}
                    description={t('No shipments found to generate a chart.', { defaultValue: 'No shipments found to generate a chart.' })}
                  />
                )}
              </CardContent>
            </Card>

            <Card className="dashboard-panel-card dashboard-grid__quarter">
              <CardHeader className="dashboard-panel-card__header">
                <div>
                  <CardTitle>{t('Finance Snapshot')}</CardTitle>
                  <CardDescription>
                    {t('Merchant wallet metrics returned directly from the merchant finance summary.', {
                      defaultValue: 'Merchant wallet metrics returned directly from the merchant finance summary.',
                    })}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="page-stack">
                {summary.finance ? (
                  <MerchantFinanceSnapshotChart summary={summary.finance} />
                ) : (
                  <EmptyState
                    title={t('No chart data available yet.')}
                    description={t('Finance metrics are currently unavailable.', { defaultValue: 'Finance metrics are currently unavailable.' })}
                  />
                )}
              </CardContent>
            </Card>

            <Card className="dashboard-panel-card dashboard-grid__quarter">
              <CardHeader className="dashboard-panel-card__header">
                <div>
                  <CardTitle>{t('Warehouse Snapshot')}</CardTitle>
                  <CardDescription>
                    {t('Warehouse product metrics returned directly from the merchant dashboard summary.', {
                      defaultValue: 'Warehouse product metrics returned directly from the merchant dashboard summary.',
                    })}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="page-stack">
                {summary.warehouse ? (
                  <MerchantWarehouseSnapshotChart summary={summary.warehouse} />
                ) : (
                  <EmptyState
                    title={t('No chart data available yet.')}
                    description={t('Warehouse metrics are currently unavailable.', { defaultValue: 'Warehouse metrics are currently unavailable.' })}
                  />
                )}
              </CardContent>
            </Card>

            <Card className="dashboard-coverage-card dashboard-grid__coverage">
              <CardContent className="dashboard-coverage-card__content">
                <div className="dashboard-coverage-card__copy">
                  <span className="eyebrow">{t('Merchant Operations', { defaultValue: 'Merchant Operations' })}</span>
                  <h3>{t('Keep orders, inventory, and finances aligned.', {
                    defaultValue: 'Keep orders, inventory, and finances aligned.',
                  })}</h3>
                  <p>{t('Use the side navigation to coordinate your full logistics workflow from one place.', {
                    defaultValue: 'Use the side navigation to coordinate your full logistics workflow from one place.',
                  })}</p>
                </div>
                <div className="dashboard-coverage-card__actions">
                  {hasMerchantCapability('orders.view') ? (
                    <Link className="ui-link-reset" to={merchantPath('/orders')}>
                      <Button variant="secondary">
                        <Boxes size={16} />
                        {t('Open Orders')}
                      </Button>
                    </Link>
                  ) : null}
                  {hasMerchantCapability('settings.view') ? (
                    <Link className="ui-link-reset" to={merchantPath('/settings')}>
                      <Button>
                        {t('See Settings', { defaultValue: 'See Settings' })}
                        <ArrowRight size={16} />
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </section>
  )
}
