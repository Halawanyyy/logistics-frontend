import { useId, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import { ChevronDown, Landmark, Package, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  getMerchant,
  getMerchantDashboardSummary,
  getMerchantFinanceSummary,
  getMerchantWarehouseCharges,
  getMerchantWarehouseInventory,
  getMerchantWarehouseMovements,
  getMerchantWalletSummary,
  listMerchantPortalUsers,
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
import { formatDate, formatMoney } from '../../../shared/utils/formatters'
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
  
  MerchantIntegrationTokensPanel,
  MerchantInvoicesPanel,
  MerchantOrdersPanel,
  MerchantShipmentsPanel,
  MerchantWalletPanel,
} from '../components/MerchantProfilePanels'
import { MerchantPortalUsersPanel } from '../components/MerchantPortalUsersPanel'
import { Attachments } from '../../../shared/components/attachments/Attachments'
import { listOrders } from '../../orders/api/orders.api'
import { listShipments } from '../../shipments/api/shipments.api'

type MerchantTabId =
  | 'overview'
  | 'operations'
  | 'finance'
  | 'settings'

type MerchantTab = {
  id: MerchantTabId
  label: string
  badge?: string | number
  badgeLoading?: boolean
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
    return 'operations'
  }

  if (pathname.endsWith('/finance')) {
    return 'finance'
  }

  if (pathname.endsWith('/dashboard')) {
    return 'overview'
  }

  return 'overview'
}

function normalizeRequestedTab(tab: string | null): MerchantTabId | null {
  if (tab === 'overview' || tab === 'operations' || tab === 'finance' || tab === 'settings') {
    return tab
  }

  if (tab === 'orders' || tab === 'shipments' || tab === 'warehouse') {
    return 'operations'
  }

  if (tab === 'wallet' || tab === 'invoices') {
    return 'finance'
  }

  if (tab === 'integration-tokens' || tab === 'portal-users' || tab === 'attachments') {
    return 'settings'
  }

  if (tab === 'shop-preview') {
    return 'overview'
  }

  return null
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
  const { t } = useTranslation()

  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          className={`tab-link${activeTab === tab.id ? ' tab-link--active' : ''}`}
          to={adminPath(`/merchants/${merchantId}?tab=${tab.id}`)}
        >
          {tab.label}
          {tab.badgeLoading || tab.badge !== undefined ? (
            <span className="merchant-tab__badge">
              {tab.badgeLoading ? <span className="ui-tabs__badge-spinner" aria-label={t('Loading count', { defaultValue: 'Loading count' })} /> : tab.badge}
            </span>
          ) : null}
        </Link>
      ))}
    </div>
  )
}

type MerchantSectionAccent = 'orders' | 'shipments' | 'inventory' | 'finance' | 'success' | 'warning' | 'drivers'

function MerchantSection({
  accent,
  children,
  description,
  title,
}: {
  accent: MerchantSectionAccent
  children: ReactNode
  description: string
  title: string
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const contentId = useId()

  return (
    <Card
      className={`merchant-section-card${isExpanded ? ' merchant-section-card--expanded' : ''}`}
      data-accent={accent}
    >
      <CardHeader className="merchant-section-card__header">
        <button
          aria-controls={contentId}
          aria-expanded={isExpanded}
          className="merchant-section-card__toggle"
          onClick={() => setIsExpanded((current) => !current)}
          type="button"
        >
          <span className="merchant-section-card__heading">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </span>
          <span className="merchant-section-card__toggle-icon" aria-hidden="true">
            <ChevronDown size={20} strokeWidth={2.25} />
          </span>
        </button>
      </CardHeader>
      <CardContent
        aria-hidden={!isExpanded}
        className="merchant-section-card__content"
        id={contentId}
        hidden={!isExpanded}
      >
        {children}
      </CardContent>
    </Card>
  )
}

function MerchantProfileCard({ merchant }: { merchant: Merchant }) {
  const { t } = useTranslation()

  return (
    <Card className="detail-card merchant-profile-card">
      <CardHeader>
        <CardTitle>{t('Merchant Profile', { defaultValue: 'Merchant Profile' })}</CardTitle>
        <CardDescription>{t('Contact details and operational summary.', { defaultValue: 'Contact details and operational summary.' })}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="detail-list">
          <div><dt>{t('Company', { defaultValue: 'Company' })}</dt><dd>{merchant.company_name}</dd></div>
          <div><dt>{t('Contact', { defaultValue: 'Contact' })}</dt><dd>{merchant.name}</dd></div>
          <div><dt>{t('Phone')}</dt><dd>{merchant.phone}</dd></div>
          <div><dt>{t('Email', { defaultValue: 'Email' })}</dt><dd>{merchant.email}</dd></div>
          <div><dt>{t('Address', { defaultValue: 'Address' })}</dt><dd>{merchant.address}</dd></div>
          <div><dt>{t('Pricing Plan', { defaultValue: 'Pricing Plan' })}</dt><dd>{merchant.pricing_plan_name ?? '-'}</dd></div>
          <div><dt>{t('Status')}</dt><dd><StatusBadge value={merchant.status} /></dd></div>
          <div><dt>{t('Created', { defaultValue: 'Created' })}</dt><dd>{formatDate(merchant.created_at)}</dd></div>
        </dl>
      </CardContent>
    </Card>
  )
}

function MerchantOverviewPanel({
  filters,
  setFilters,
  dashboardQuery,
  financeQuery,
}: {
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
          <StatCard accent="shipments" title={t('Shipments')} value={dashboard.shipments.total} tone="info" icon={<Package size={19} />} />
          <StatCard accent="success" title={t('Delivered', { defaultValue: 'Delivered' })} value={dashboard.shipments.delivered} tone="success" icon={<Package size={19} />} />
          <StatCard accent="success" title={t('Company Profit', { defaultValue: 'Company Profit' })} value={<MoneyDisplay value={dashboard.company_profit} />} tone="success" icon={<Landmark size={19} />} />
          <StatCard accent="warning" title={t('Merchant Payables', { defaultValue: 'Merchant Payables' })} value={<MoneyDisplay value={dashboard.merchants_payables} />} tone="warning" icon={<Wallet size={19} />} />
        </div>
      ) : null}

      {finance ? (
        <div className="stats-grid">
          <StatCard accent="finance" title={t('COD Collected', { defaultValue: 'COD Collected' })} value={<MoneyDisplay value={finance.cod_collected} />} tone="info" />
          <StatCard accent="success" title={t('Shipping Fees', { defaultValue: 'Shipping Fees' })} value={<MoneyDisplay value={finance.shipping_fees} />} tone="success" />
          <StatCard accent="finance" title={t('Warehouse Charges', { defaultValue: 'Warehouse Charges' })} value={<MoneyDisplay value={finance.warehouse_charges} />} tone="warning" />
          <StatCard accent="finance" title={t('Remaining Balance', { defaultValue: 'Remaining Balance' })} value={<MoneyDisplay value={finance.remaining_balance} />} tone="neutral" />
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
  const requestedTabValue = searchParams.get('tab')
  const requestedTab = normalizeRequestedTab(requestedTabValue)
  const legacyTab = getLegacyTabAlias(location.pathname)
  const canViewWallet = hasPermission(user, PERMISSIONS.MERCHANT_WALLET_VIEW)
  const canViewOrders = hasPermission(user, PERMISSIONS.ORDERS_VIEW)
  const canViewShipments = hasPermission(user, PERMISSIONS.SHIPMENTS_VIEW)
  const canViewInvoices = hasPermission(user, PERMISSIONS.FINANCE_INVOICES_VIEW)
  const canViewIntegrationTokens = hasPermission(user, PERMISSIONS.MERCHANT_INTEGRATIONS_VIEW)
  const canManagePortalUsers = hasPermission(user, PERMISSIONS.MERCHANT_PORTAL_USERS_MANAGE)
  const canViewAttachments = hasPermission(user, PERMISSIONS.ATTACHMENTS_VIEW)
  const canViewWarehouse = hasAnyPermission(user, [
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.WAREHOUSE_PRODUCTS_VIEW,
    PERMISSIONS.WAREHOUSE_CHARGES_VIEW,
    PERMISSIONS.WAREHOUSE_RETURNS_VIEW,
  ])
  const merchantQuery = useQuery({
    queryKey: ['merchants', merchantId],
    queryFn: () => getMerchant(merchantId!),
    enabled: Boolean(merchantId),
  })

  const ordersCountParams = useMemo(() => ({ merchant_id: merchantId! }), [merchantId])
  const shipmentsCountParams = useMemo(() => ({ merchant_id: merchantId! }), [merchantId])
  const ordersCountQuery = useQuery({
    queryKey: ['merchant-profile', merchantId, 'orders', ordersCountParams],
    queryFn: () => listOrders(ordersCountParams),
    enabled: Boolean(merchantId) && canViewOrders,
  })
  const shipmentsCountQuery = useQuery({
    queryKey: ['merchant-profile', merchantId, 'shipments', shipmentsCountParams],
    queryFn: () => listShipments(shipmentsCountParams),
    enabled: Boolean(merchantId) && canViewShipments,
  })
  const portalUsersCountQuery = useQuery({
    queryKey: ['merchant-profile', merchantId, 'portal-users'],
    queryFn: () => listMerchantPortalUsers(merchantId!),
    enabled: Boolean(merchantId) && canManagePortalUsers,
  })
  const walletHeaderSummaryQuery = useQuery({
    queryKey: ['merchant-profile', merchantId, 'wallet-summary'],
    queryFn: () => getMerchantWalletSummary(merchantId!),
    enabled: Boolean(merchantId) && canViewWallet,
  })

  const operationsCount = (ordersCountQuery.data?.data.length ?? 0) + (shipmentsCountQuery.data?.data.length ?? 0)
  const operationsCountLoading = (canViewOrders && ordersCountQuery.isLoading) || (canViewShipments && shipmentsCountQuery.isLoading)

  const allTabs: Array<MerchantTab & { allowed: boolean }> = [
    { id: 'overview', label: t('Overview', { defaultValue: 'Overview' }), allowed: hasPermission(user, PERMISSIONS.MERCHANTS_VIEW) },
    {
      id: 'operations',
      label: t('Operations', { defaultValue: 'Operations' }),
      allowed: canViewOrders || canViewShipments || canViewWarehouse,
      badge: operationsCount,
      badgeLoading: operationsCountLoading,
    },
    {
      id: 'finance',
      label: t('Finance'),
      allowed: canViewWallet || canViewInvoices || canViewAttachments,
      badge: walletHeaderSummaryQuery.data?.data
        ? formatMoney(walletHeaderSummaryQuery.data.data.available_balance)
        : undefined,
      badgeLoading: canViewWallet && walletHeaderSummaryQuery.isLoading,
    },
    {
      id: 'settings',
      label: t('Settings'),
      allowed: canViewIntegrationTokens || canManagePortalUsers || canViewAttachments,
      badge: canManagePortalUsers ? (portalUsersCountQuery.data?.data.length ?? 0) : undefined,
      badgeLoading: canManagePortalUsers && portalUsersCountQuery.isLoading,
    },
  ]

  const visibleTabs = allTabs.filter((tab) => tab.allowed)
  const currentTab = visibleTabs.find((tab) => tab.id === (requestedTab ?? legacyTab))?.id
    ?? visibleTabs[0]?.id
    ?? 'overview'

  if (import.meta.env.DEV) {
    const hiddenTabs = allTabs.filter((tab) => !tab.allowed).map((tab) => tab.id)
    if (hiddenTabs.length > 0) {
      console.debug('[Permissions Diagnostic] Merchant Profile Hidden Tabs:', hiddenTabs)
    }
  }

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
        enabled: Boolean(merchantId) && currentTab === 'operations' && canViewWarehouse,
      },
      {
        queryKey: ['merchants', merchantId, 'warehouse-movements'],
        queryFn: () => getMerchantWarehouseMovements(merchantId!),
        enabled: Boolean(merchantId) && currentTab === 'operations' && canViewWarehouse,
      },
      {
        queryKey: ['merchants', merchantId, 'warehouse-charges', dateFilters],
        queryFn: () => getMerchantWarehouseCharges(merchantId!, dateFilters),
        enabled: Boolean(merchantId) && currentTab === 'operations' && canViewWarehouse,
      },
    ],
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
  const merchantStatusAccent = merchant.status === 'active'
    ? 'success'
    : merchant.status === 'inactive'
      ? 'danger'
      : 'warning'
  const walletAvailableBalance = walletHeaderSummaryQuery.data?.data.available_balance
  const walletAccent = Number(walletAvailableBalance ?? 0) < 0 ? 'danger' : 'success'

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Admin Console"
        title={merchant.company_name}
        description={(
          <span className="merchant-header-meta">
            <StatusBadge value={merchant.status} />
            <span aria-hidden="true">•</span>
            <span>{merchant.name}</span>
            <span aria-hidden="true">•</span>
            <span>{merchant.phone}</span>
          </span>
        )}
        actions={
          <div className="page-header__button-row">
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
        <StatCard accent="finance" title={t('Pricing Plan', { defaultValue: 'Pricing Plan' })} value={merchant.pricing_plan_name ?? '-'} tone="neutral" />
        <StatCard accent={merchantStatusAccent} title={t('Status')} value={<StatusBadge value={merchant.status} />} tone="info" />
        {canViewWallet ? (
          <StatCard
            accent={walletAccent}
            title={t('Wallet Available Balance', { defaultValue: 'Wallet Available Balance' })}
            value={<MoneyDisplay value={walletAvailableBalance} />}
            tone={walletAccent === 'danger' ? 'danger' : 'success'}
          />
        ) : null}
      </div>

      <MerchantProfileTabs merchantId={merchantId} tabs={visibleTabs} activeTab={currentTab} />

      {currentTab === 'overview' ? (
        <>
          <MerchantProfileCard merchant={merchant} />
          <MerchantOverviewPanel
            filters={overviewFilters}
            setFilters={setOverviewFilters}
            dashboardQuery={dashboardQuery}
            financeQuery={financeQuery}
          />
        </>
      ) : null}

      {currentTab === 'operations' ? (
        <div className="merchant-sections">
          {canViewOrders ? (
            <MerchantSection
              accent="orders"
              title={t('Orders')}
              description={t('All orders for this merchant', { defaultValue: 'All orders for this merchant' })}
            >
              <MerchantOrdersPanel merchantId={merchantId} />
            </MerchantSection>
          ) : null}
          {canViewShipments ? (
            <MerchantSection
              accent="shipments"
              title={t('Shipments')}
              description={t('All shipments for this merchant', { defaultValue: 'All shipments for this merchant' })}
            >
              <MerchantShipmentsPanel merchantId={merchantId} />
            </MerchantSection>
          ) : null}
          {canViewWarehouse ? (
            <MerchantSection
              accent="inventory"
              title={t('Warehouse')}
              description={t('Inventory, movements, and charges', { defaultValue: 'Inventory, movements, and charges' })}
            >
              <MerchantWarehousePanel
                inventoryQuery={inventoryQuery}
                movementsQuery={movementsQuery}
                chargesQuery={chargesQuery}
              />
            </MerchantSection>
          ) : null}
        </div>
      ) : null}

      {currentTab === 'finance' ? (
        <div className="merchant-sections">
          {canViewWallet ? (
            <MerchantSection
              accent="success"
              title={t('Wallet')}
              description={t('Wallet balance and transaction history', { defaultValue: 'Wallet balance and transaction history' })}
            >
              <MerchantWalletPanel merchant={merchant} merchantId={merchantId} />
            </MerchantSection>
          ) : null}
          {canViewInvoices ? (
            <MerchantSection
              accent="finance"
              title={t('Invoices')}
              description={t('Merchant invoices and payment status', { defaultValue: 'Merchant invoices and payment status' })}
            >
              <MerchantInvoicesPanel merchantId={merchantId} />
            </MerchantSection>
          ) : null}
          {canViewAttachments ? (
            <MerchantSection
              accent="warning"
              title={t('Related Attachments', { defaultValue: 'Related Attachments' })}
              description={t('Finance-related merchant documents', { defaultValue: 'Finance-related merchant documents' })}
            >
              <Attachments attachableType="merchants" attachableId={merchantId} />
            </MerchantSection>
          ) : null}
        </div>
      ) : null}

      {currentTab === 'settings' ? (
        <div className="merchant-sections">
          {canManagePortalUsers ? (
            <MerchantSection
              accent="drivers"
              title={t('Portal Users', { defaultValue: 'Portal Users' })}
              description={t('Manage access to the merchant portal', { defaultValue: 'Manage access to the merchant portal' })}
            >
              <MerchantPortalUsersPanel merchantId={merchantId} />
            </MerchantSection>
          ) : null}
          {canViewIntegrationTokens ? (
            <MerchantSection
              accent="finance"
              title={t('Integration Tokens', { defaultValue: 'Integration Tokens' })}
              description={t('API credentials and integration access', { defaultValue: 'API credentials and integration access' })}
            >
              <MerchantIntegrationTokensPanel merchantId={merchantId} />
            </MerchantSection>
          ) : null}
          {canViewAttachments ? (
            <MerchantSection
              accent="warning"
              title={t('Attachments')}
              description={t('General merchant files and documents', { defaultValue: 'General merchant files and documents' })}
            >
              <Attachments attachableType="merchants" attachableId={merchantId} />
            </MerchantSection>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
