import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Landmark, Package, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  getMerchant,
  getMerchantDashboardSummary,
  getMerchantFinanceSummary,
  getMerchantWarehouseCharges,
  getMerchantWarehouseInventory,
  getMerchantWarehouseMovements,
  getMerchantWalletSummary,
} from '../api/merchants.api'
import { getApiErrorMessage, isApiNotFound } from '../../../shared/api/api-error'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { hasAnyPermission, hasPermission } from '../../../shared/auth/permissions'
import { formatDate } from '../../../shared/utils/formatters'
import { StatCard } from '../../dashboard/components/StatCard'
import type {
  Merchant,
  MerchantDashboardSummary,
  MerchantFinanceSummary,
  MerchantScopedFilters,
} from '../types/merchant.types'
import { DateRangeFilter } from '../../../shared/components/filters/DateRangeFilter'
import { DriverSelector } from '../../../shared/components/selectors/DriverSelector'
import { NotFoundState } from '../../../shared/components/states/NotFoundState'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import { adminPath } from '../../../shared/routing/paths'
import { useAuthStore } from '../../auth/store/auth.store'
import type {
  InventoryStock,
  StockMovement,
  WarehouseCharge,
} from '../../warehouse/types/warehouse.types'
import {
  MerchantActivityTimelinePanel,
  MerchantIntegrationTokensPanel,
  MerchantInvoicesPanel,
  MerchantOrdersPanel,
  MerchantShipmentsPanel,
  MerchantWalletPanel,
} from '../components/MerchantProfilePanels'
import { MerchantPortalUsersPanel } from '../components/MerchantPortalUsersPanel'
import { Attachments } from '../../../shared/components/attachments/Attachments'

type MerchantTabId =
  | 'overview'
  | 'orders'
  | 'shipments'
  | 'wallet'
  | 'invoices'
  | 'warehouse'
  | 'integration-tokens'
  | 'portal-users'
  | 'attachments'
  | 'activity-timeline'

type MerchantTab = {
  id: MerchantTabId
  label: string
}

type MerchantQueryState<T> = {
  data?: {
    data: T
  }
  isLoading: boolean
  isError: boolean
  error: unknown
  refetch: () => Promise<unknown>
}

function compactFilters(filters: MerchantScopedFilters) {
  return {
    ...(filters.date_from ? { date_from: filters.date_from } : {}),
    ...(filters.date_to ? { date_to: filters.date_to } : {}),
    ...(filters.assigned_driver_id ? { assigned_driver_id: filters.assigned_driver_id } : {}),
  }
}

function compactDateFilters(filters: MerchantScopedFilters) {
  return {
    ...(filters.date_from ? { date_from: filters.date_from } : {}),
    ...(filters.date_to ? { date_to: filters.date_to } : {}),
  }
}

function getLegacyTabAlias(pathname: string): MerchantTabId {
  if (pathname.endsWith('/warehouse')) {
    return 'warehouse'
  }

  if (pathname.endsWith('/finance')) {
    return 'wallet'
  }

  if (pathname.endsWith('/dashboard')) {
    return 'overview'
  }

  return 'overview'
}

function MerchantProfileTabs({
  merchantId,
  tabs,
  activeTab,
}: {
  merchantId: string
  tabs: MerchantTab[]
  activeTab: MerchantTabId
}) {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          className={`tab-link${activeTab === tab.id ? ' tab-link--active' : ''}`}
          to={adminPath(`/merchants/${merchantId}?tab=${tab.id}`)}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}

function MerchantOverviewPanel({
  merchant,
  filters,
  setFilters,
  dashboardQuery,
  financeQuery,
}: {
  merchant: Merchant
  filters: MerchantScopedFilters
  setFilters: Dispatch<SetStateAction<MerchantScopedFilters>>
  dashboardQuery: MerchantQueryState<MerchantDashboardSummary>
  financeQuery: MerchantQueryState<MerchantFinanceSummary>
}) {
  const { t } = useTranslation()
  const dashboard = dashboardQuery.data?.data
  const finance = financeQuery.data?.data

  return (
    <div className="page-stack">
      <Card variant="flat" className="dashboard-filter-card">
        <CardContent className="dashboard-filters">
          <DateRangeFilter
            dateFrom={filters.date_from ?? ''}
            dateTo={filters.date_to ?? ''}
            onChange={({ date_from, date_to }) =>
              setFilters((current) => ({ ...current, date_from, date_to }))
            }
          />
          <label className="dashboard-filter">
            <span className="eyebrow">{t('Assigned Driver')}</span>
            <DriverSelector
              value={String(filters.assigned_driver_id ?? '')}
              onChange={(assigned_driver_id) =>
                setFilters((current) => ({ ...current, assigned_driver_id }))
              }
              includeAllOption
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Merchant Profile', { defaultValue: 'Merchant Profile' })}</CardTitle>
          <CardDescription>{t('Contact details and operational summary.', { defaultValue: 'Contact details and operational summary.' })}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="detail-list">
            <div><dt>{t('Company', { defaultValue: 'Company' })}</dt><dd>{merchant.company_name}</dd></div>
            <div><dt>{t('Phone')}</dt><dd>{merchant.phone}</dd></div>
            <div><dt>{t('Email', { defaultValue: 'Email' })}</dt><dd>{merchant.email}</dd></div>
            <div><dt>{t('Address', { defaultValue: 'Address' })}</dt><dd>{merchant.address}</dd></div>
            <div><dt>{t('Pricing Plan', { defaultValue: 'Pricing Plan' })}</dt><dd>{merchant.pricing_plan_name ?? '-'}</dd></div>
            <div><dt>{t('Status')}</dt><dd><StatusBadge value={merchant.status} /></dd></div>
            <div><dt>{t('Created', { defaultValue: 'Created' })}</dt><dd>{formatDate(merchant.created_at)}</dd></div>
          </dl>
        </CardContent>
      </Card>

      {dashboardQuery.isLoading || financeQuery.isLoading ? <LoadingState title={t('Loading merchant summaries', { defaultValue: 'Loading merchant summaries' })} /> : null}
      {dashboardQuery.isError ? (
        <ErrorState
          title={t('Unable to load dashboard summary', { defaultValue: 'Unable to load dashboard summary' })}
          message={getApiErrorMessage(dashboardQuery.error)}
          onRetry={() => void dashboardQuery.refetch()}
        />
      ) : null}
      {financeQuery.isError ? (
        <ErrorState
          title={t('Unable to load finance summary', { defaultValue: 'Unable to load finance summary' })}
          message={getApiErrorMessage(financeQuery.error)}
          onRetry={() => void financeQuery.refetch()}
        />
      ) : null}

      {dashboard ? (
        <div className="stats-grid">
          <StatCard title={t('Shipments')} value={dashboard.shipments.total} tone="info" icon={<Package size={19} />} />
          <StatCard title={t('Delivered', { defaultValue: 'Delivered' })} value={dashboard.shipments.delivered} tone="success" icon={<Package size={19} />} />
          <StatCard title={t('Company Profit', { defaultValue: 'Company Profit' })} value={<MoneyDisplay value={dashboard.company_profit} />} tone="success" icon={<Landmark size={19} />} />
          <StatCard title={t('Merchant Payables', { defaultValue: 'Merchant Payables' })} value={<MoneyDisplay value={dashboard.merchants_payables} />} tone="warning" icon={<Wallet size={19} />} />
        </div>
      ) : null}

      {finance ? (
        <div className="stats-grid">
          <StatCard title={t('COD Collected', { defaultValue: 'COD Collected' })} value={<MoneyDisplay value={finance.cod_collected} />} tone="info" />
          <StatCard title={t('Shipping Fees', { defaultValue: 'Shipping Fees' })} value={<MoneyDisplay value={finance.shipping_fees} />} tone="success" />
          <StatCard title={t('Warehouse Charges', { defaultValue: 'Warehouse Charges' })} value={<MoneyDisplay value={finance.warehouse_charges} />} tone="warning" />
          <StatCard title={t('Remaining Balance', { defaultValue: 'Remaining Balance' })} value={<MoneyDisplay value={finance.remaining_balance} />} tone="neutral" />
        </div>
      ) : null}

      {!dashboardQuery.isLoading && !dashboardQuery.isError && !financeQuery.isLoading && !financeQuery.isError && !dashboard && !finance ? (
        <EmptyState
          title={t('No merchant summary data', { defaultValue: 'No merchant summary data' })}
          description={t('The API returned no overview metrics for this merchant.', { defaultValue: 'The API returned no overview metrics for this merchant.' })}
        />
      ) : null}
    </div>
  )
}

function MerchantWarehousePanel({
  inventoryQuery,
  movementsQuery,
  chargesQuery,
}: {
  inventoryQuery: MerchantQueryState<InventoryStock[]>
  movementsQuery: MerchantQueryState<StockMovement[]>
  chargesQuery: MerchantQueryState<WarehouseCharge[]>
}) {
  const { t } = useTranslation()
  const inventory = inventoryQuery.data?.data ?? []
  const movements = movementsQuery.data?.data ?? []
  const charges = chargesQuery.data?.data ?? []

  return (
    <div className="dashboard-panels">
      <Card>
        <CardHeader>
          <CardTitle>{t('Warehouse Inventory', { defaultValue: 'Warehouse Inventory' })}</CardTitle>
          <CardDescription>{t('Current inventory rows for this merchant.', {
            defaultValue: 'Current inventory rows for this merchant.',
          })}</CardDescription>
        </CardHeader>
        <CardContent>
          {inventoryQuery.isLoading ? <LoadingState title={t('Loading inventory', { defaultValue: 'Loading inventory' })} /> : null}
          {inventoryQuery.isError ? <ErrorState message={getApiErrorMessage(inventoryQuery.error)} onRetry={() => void inventoryQuery.refetch()} /> : null}
          {!inventoryQuery.isLoading && !inventoryQuery.isError && !inventory.length ? (
            <EmptyState
              title={t('No inventory', { defaultValue: 'No inventory' })}
              description={t('No warehouse inventory was returned.', {
                defaultValue: 'No warehouse inventory was returned.',
              })}
            />
          ) : null}
          {inventory.length ? (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>{t('Product')}</TableHead>
                    <TableHead>{t('Warehouse')}</TableHead>
                    <TableHead>{t('Available', { defaultValue: 'Available' })}</TableHead>
                    <TableHead>{t('Reserved', { defaultValue: 'Reserved' })}</TableHead>
                    <TableHead>{t('Damaged', { defaultValue: 'Damaged' })}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item.id}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>{item.warehouse_name}</TableCell>
                      <TableCell>{item.quantity_available}</TableCell>
                      <TableCell>{item.quantity_reserved}</TableCell>
                      <TableCell>{item.quantity_damaged}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Warehouse Movements', { defaultValue: 'Warehouse Movements' })}</CardTitle>
          <CardDescription>{t('Recent stock movement history.', {
            defaultValue: 'Recent stock movement history.',
          })}</CardDescription>
        </CardHeader>
        <CardContent>
          {movementsQuery.isLoading ? <LoadingState title={t('Loading movements', { defaultValue: 'Loading movements' })} /> : null}
          {movementsQuery.isError ? <ErrorState message={getApiErrorMessage(movementsQuery.error)} onRetry={() => void movementsQuery.refetch()} /> : null}
          {!movementsQuery.isLoading && !movementsQuery.isError && !movements.length ? (
            <EmptyState
              title={t('No movements', { defaultValue: 'No movements' })}
              description={t('No stock movements were returned.', {
                defaultValue: 'No stock movements were returned.',
              })}
            />
          ) : null}
          {movements.length ? (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>{t('Product')}</TableHead>
                    <TableHead>{t('Type')}</TableHead>
                    <TableHead>{t('Quantity')}</TableHead>
                    <TableHead>{t('Created', { defaultValue: 'Created' })}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((item) => (
                    <tr key={item.id}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell><StatusBadge value={item.type} /></TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatDate(item.created_at)}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Warehouse Charges', { defaultValue: 'Warehouse Charges' })}</CardTitle>
          <CardDescription>{t('Merchant warehouse charges for the selected filters.', {
            defaultValue: 'Merchant warehouse charges for the selected filters.',
          })}</CardDescription>
        </CardHeader>
        <CardContent>
          {chargesQuery.isLoading ? <LoadingState title={t('Loading charges', { defaultValue: 'Loading charges' })} /> : null}
          {chargesQuery.isError ? <ErrorState message={getApiErrorMessage(chargesQuery.error)} onRetry={() => void chargesQuery.refetch()} /> : null}
          {!chargesQuery.isLoading && !chargesQuery.isError && !charges.length ? (
            <EmptyState
              title={t('No charges', { defaultValue: 'No charges' })}
              description={t('No warehouse charges were returned.', {
                defaultValue: 'No warehouse charges were returned.',
              })}
            />
          ) : null}
          {charges.length ? (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>{t('Description')}</TableHead>
                    <TableHead>{t('Type')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Amount', { defaultValue: 'Amount' })}</TableHead>
                    <TableHead>{t('Date', { defaultValue: 'Date' })}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {charges.map((charge) => (
                    <tr key={charge.id}>
                      <TableCell>{charge.description}</TableCell>
                      <TableCell><StatusBadge value={charge.type}>{charge.type}</StatusBadge></TableCell>
                      <TableCell><StatusBadge value={charge.status} /></TableCell>
                      <TableCell><MoneyDisplay value={charge.amount} /></TableCell>
                      <TableCell>{formatDate(charge.charge_date)}</TableCell>
                      <TableCell>
                        <Link className="table-link" to={adminPath(`/warehouse-charges/${charge.id}`)}>
                          {t('View')}
                        </Link>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

export function MerchantDetailsPage() {
  const { t } = useTranslation()
  const { merchantId } = useParams()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const user = useAuthStore((state) => state.user)
  const [overviewFilters, setOverviewFilters] = useState<MerchantScopedFilters>({
    date_from: '',
    date_to: '',
    assigned_driver_id: '',
  })
  const queryFilters = useMemo(() => compactFilters(overviewFilters), [overviewFilters])
  const dateFilters = useMemo(() => compactDateFilters(overviewFilters), [overviewFilters])
  const requestedTab = searchParams.get('tab') as MerchantTabId | null
  const legacyTab = getLegacyTabAlias(location.pathname)
  const canViewWallet = hasAnyPermission(user, [PERMISSIONS.MERCHANT_WALLET_VIEW, PERMISSIONS.FINANCE_VIEW])

  const merchantQuery = useQuery({
    queryKey: ['merchants', merchantId],
    queryFn: () => getMerchant(merchantId!),
    enabled: Boolean(merchantId),
  })

  const allTabs: Array<MerchantTab & { allowed: boolean }> = [
    { id: 'overview', label: t('Overview', { defaultValue: 'Overview' }), allowed: hasPermission(user, PERMISSIONS.MERCHANTS_VIEW) },
    { id: 'orders', label: t('Orders'), allowed: hasPermission(user, PERMISSIONS.ORDERS_VIEW) },
    { id: 'shipments', label: t('Shipments'), allowed: hasPermission(user, PERMISSIONS.SHIPMENTS_VIEW) },
    {
      id: 'wallet',
      label: t('Wallet'),
      allowed: canViewWallet,
    },
    { id: 'invoices', label: t('Invoices'), allowed: hasPermission(user, PERMISSIONS.INVOICES_VIEW) },
    {
      id: 'warehouse',
      label: t('Warehouse'),
      allowed: hasAnyPermission(user, [PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.WAREHOUSE_CHARGES_VIEW]),
    },
    {
      id: 'integration-tokens',
      label: t('Integration Tokens', { defaultValue: 'Integration Tokens' }),
      allowed: hasPermission(user, PERMISSIONS.MERCHANT_INTEGRATIONS_VIEW),
    },
    {
      id: 'portal-users',
      label: t('Portal Users', { defaultValue: 'Portal Users' }),
      allowed: hasPermission(user, PERMISSIONS.MERCHANT_PORTAL_USERS_MANAGE),
    },
    {
      id: 'attachments',
      label: t('Attachments'),
      allowed: hasPermission(user, PERMISSIONS.ATTACHMENTS_VIEW),
    },
    {
      id: 'activity-timeline',
      label: t('Activity Timeline', { defaultValue: 'Activity Timeline' }),
      allowed: hasPermission(user, PERMISSIONS.AUDIT_LOGS_TIMELINE),
    },
  ]

  const visibleTabs = allTabs.filter((tab) => tab.allowed)
  const currentTab = visibleTabs.find((tab) => tab.id === (requestedTab ?? legacyTab))?.id
    ?? visibleTabs[0]?.id
    ?? 'overview'

  const [dashboardQuery, financeQuery, inventoryQuery, movementsQuery, chargesQuery] = useQueries({
    queries: [
      {
        queryKey: ['merchants', merchantId, 'dashboard-summary', queryFilters],
        queryFn: () => getMerchantDashboardSummary(merchantId!, queryFilters),
        enabled: Boolean(merchantId) && currentTab === 'overview',
      },
      {
        queryKey: ['merchants', merchantId, 'finance-summary', dateFilters],
        queryFn: () => getMerchantFinanceSummary(merchantId!, dateFilters),
        enabled: Boolean(merchantId) && currentTab === 'overview',
      },
      {
        queryKey: ['merchants', merchantId, 'warehouse-inventory'],
        queryFn: () => getMerchantWarehouseInventory(merchantId!),
        enabled: Boolean(merchantId) && currentTab === 'warehouse',
      },
      {
        queryKey: ['merchants', merchantId, 'warehouse-movements'],
        queryFn: () => getMerchantWarehouseMovements(merchantId!),
        enabled: Boolean(merchantId) && currentTab === 'warehouse',
      },
      {
        queryKey: ['merchants', merchantId, 'warehouse-charges', dateFilters],
        queryFn: () => getMerchantWarehouseCharges(merchantId!, dateFilters),
        enabled: Boolean(merchantId) && currentTab === 'warehouse',
      },
    ],
  })

  const walletHeaderSummaryQuery = useQuery({
    queryKey: ['merchant-profile', merchantId, 'wallet-summary', 'header'],
    queryFn: () => getMerchantWalletSummary(merchantId!),
    enabled: Boolean(merchantId) && canViewWallet,
  })

  if (merchantQuery.isLoading) {
    return <LoadingState title={t('Loading merchant', { defaultValue: 'Loading merchant' })} />
  }

  if (merchantQuery.isError && isApiNotFound(merchantQuery.error)) {
    return (
      <NotFoundState
        title={t('Merchant not found', { defaultValue: 'Merchant not found' })}
        description={t('This merchant record could not be found in the merchants API.', { defaultValue: 'This merchant record could not be found in the merchants API.' })}
      />
    )
  }

  if (merchantQuery.isError || !merchantQuery.data || !merchantId) {
    return <ErrorState message={getApiErrorMessage(merchantQuery.error)} onRetry={() => void merchantQuery.refetch()} />
  }

  const merchant = merchantQuery.data.data

  return (
    <section className="page-section">
      <PageHeader
        title={merchant.name}
        description={merchant.company_name}
        actions={
          <div className="page-header__button-row">
            <div className="table-meta">{merchant.phone}</div>
            <div className="table-meta">{merchant.email}</div>
            <StatusBadge value={merchant.status} />
            {hasPermission(user, PERMISSIONS.MERCHANTS_UPDATE) ? (
              <Link className="ui-link-reset" to={adminPath(`/merchants/${merchant.id}/edit`)}>
                <Button variant="secondary">{t('Edit')}</Button>
              </Link>
            ) : null}
            <Link className="ui-link-reset" to={adminPath('/merchants')}>
              <Button variant="secondary">{t('Back', { defaultValue: 'Back' })}</Button>
            </Link>
          </div>
        }
      />

      <div className="stats-grid">
        <StatCard title={t('Pricing Plan', { defaultValue: 'Pricing Plan' })} value={merchant.pricing_plan_name ?? '-'} tone="neutral" />
        <StatCard title={t('Status')} value={<StatusBadge value={merchant.status} />} tone="info" />
        {walletHeaderSummaryQuery.data?.data ? (
          <StatCard
            title={t('Wallet Available Balance', { defaultValue: 'Wallet Available Balance' })}
            value={<MoneyDisplay value={walletHeaderSummaryQuery.data.data.available_balance} />}
            tone="success"
          />
        ) : null}
      </div>

      <MerchantProfileTabs merchantId={merchantId} tabs={visibleTabs} activeTab={currentTab} />

      {currentTab === 'overview' ? (
        <MerchantOverviewPanel
          merchant={merchant}
          filters={overviewFilters}
          setFilters={setOverviewFilters}
          dashboardQuery={dashboardQuery}
          financeQuery={financeQuery}
        />
      ) : null}

      {currentTab === 'orders' ? <MerchantOrdersPanel merchantId={merchantId} /> : null}
      {currentTab === 'shipments' ? <MerchantShipmentsPanel merchantId={merchantId} /> : null}
      {currentTab === 'wallet' ? <MerchantWalletPanel merchant={merchant} merchantId={merchantId} /> : null}
      {currentTab === 'invoices' ? <MerchantInvoicesPanel merchantId={merchantId} /> : null}
      {currentTab === 'warehouse' ? (
        <MerchantWarehousePanel
          inventoryQuery={inventoryQuery}
          movementsQuery={movementsQuery}
          chargesQuery={chargesQuery}
        />
      ) : null}
      {currentTab === 'integration-tokens' ? <MerchantIntegrationTokensPanel merchantId={merchantId} /> : null}
      {currentTab === 'portal-users' ? <MerchantPortalUsersPanel merchantId={merchantId} /> : null}
      {currentTab === 'attachments' ? (
        <Attachments attachableType="merchants" attachableId={merchantId} />
      ) : null}
      {currentTab === 'activity-timeline' ? <MerchantActivityTimelinePanel merchantId={merchantId} /> : null}
    </section>
  )
}
