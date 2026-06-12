import { useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getWarehouseKpis, listLowStockInventoryStocks, listLowStockWarehouseProducts } from '../api/warehouse.api'
import type { WarehouseFilters } from '../types/warehouse.types'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { DateRangeFilter } from '../../../shared/components/filters/DateRangeFilter'
import { MerchantSelector } from '../../../shared/components/selectors/MerchantSelector'
import { WarehouseSelector } from '../../../shared/components/selectors/WarehouseSelector'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { Button } from '../../../shared/components/ui/Button'
import { adminPath } from '../../../shared/routing/paths'
import { LowStockQuickCard } from '../components/LowStockQuickCard'
import { useTranslation } from 'react-i18next'

type KpiFiltersState = {
  warehouse_id: string
  merchant_id: string
  date_from: string
  date_to: string
}

const initialFilters: KpiFiltersState = {
  warehouse_id: '',
  merchant_id: '',
  date_from: '',
  date_to: '',
}

export function WarehouseKpisPage() {
  const { t } = useTranslation()
  const [filters, setFilters] = useState<KpiFiltersState>(initialFilters)
  const params: WarehouseFilters = useMemo(
    () => ({
      ...(filters.warehouse_id ? { warehouse_id: filters.warehouse_id } : {}),
      ...(filters.merchant_id ? { merchant_id: filters.merchant_id } : {}),
      ...(filters.date_from ? { date_from: filters.date_from } : {}),
      ...(filters.date_to ? { date_to: filters.date_to } : {}),
    }),
    [filters],
  )
  const lowStockParams: WarehouseFilters = useMemo(
    () => ({
      ...(filters.warehouse_id ? { warehouse_id: filters.warehouse_id } : {}),
      ...(filters.merchant_id ? { merchant_id: filters.merchant_id } : {}),
    }),
    [filters.merchant_id, filters.warehouse_id],
  )
  const kpisQuery = useQuery({
    queryKey: ['warehouse-kpis', params],
    queryFn: () => getWarehouseKpis(params),
  })
  const lowStockInventoryQuery = useQuery({
    queryKey: ['inventory-stocks', 'kpis-low-stock', lowStockParams],
    queryFn: () => listLowStockInventoryStocks(lowStockParams),
  })
  const lowStockProductsQuery = useQuery({
    queryKey: ['warehouse-products', 'kpis-low-stock', lowStockParams],
    queryFn: () => listLowStockWarehouseProducts(lowStockParams),
  })
  const lowStockSearch = new URLSearchParams({
    low_stock: 'true',
    ...(filters.warehouse_id ? { warehouse_id: filters.warehouse_id } : {}),
    ...(filters.merchant_id ? { merchant_id: filters.merchant_id } : {}),
  }).toString()

  return (
    <section className="page-section">
      <PageHeader
        title={t('Warehouse KPIs')}
        description={t('Inventory, operations, returns, and warehouse billing summaries.')}
      />

      <Card variant="flat" className="dashboard-filter-card">
        <CardContent className="dashboard-filters">
          <label className="field">
            <span>{t('Warehouse')}</span>
            <WarehouseSelector
              value={filters.warehouse_id}
              includeAllOption
              onChange={(warehouse_id) => setFilters((current) => ({ ...current, warehouse_id }))}
            />
          </label>
          <label className="field">
            <span>{t('Merchant')}</span>
            <MerchantSelector
              value={filters.merchant_id}
              includeAllOption
              onChange={(merchant_id) => setFilters((current) => ({ ...current, merchant_id }))}
            />
          </label>
          <DateRangeFilter
            dateFrom={filters.date_from}
            dateTo={filters.date_to}
            onChange={({ date_from, date_to }) => setFilters((current) => ({ ...current, date_from, date_to }))}
          />
        </CardContent>
      </Card>

      <div className="stats-grid">
        <LowStockQuickCard
          title={t('Low-Stock Inventory')}
          description={t('Count returned from the backend low-stock inventory endpoint for the selected merchant and warehouse.')}
          countLabel={t('Inventory records')}
          count={lowStockInventoryQuery.data?.data.length ?? 0}
          loading={lowStockInventoryQuery.isLoading}
          error={lowStockInventoryQuery.isError ? getApiErrorMessage(lowStockInventoryQuery.error) : null}
          actions={(
            <Link className="ui-link-reset" to={`${adminPath('/inventory-stocks')}?${lowStockSearch}`}>
              <Button type="button" variant="secondary">{t('View low-stock inventory')}</Button>
            </Link>
          )}
        />
        <LowStockQuickCard
          title={t('Low-Stock Products')}
          description={t('Count returned from the backend low-stock products endpoint for the selected merchant and warehouse.')}
          countLabel={t('Product records')}
          count={lowStockProductsQuery.data?.data.length ?? 0}
          loading={lowStockProductsQuery.isLoading}
          error={lowStockProductsQuery.isError ? getApiErrorMessage(lowStockProductsQuery.error) : null}
          actions={(
            <Link className="ui-link-reset" to={`${adminPath('/warehouse-products')}?${lowStockSearch}`}>
              <Button type="button" variant="secondary">{t('View low-stock products')}</Button>
            </Link>
          )}
        />
      </div>

      {kpisQuery.isLoading ? <LoadingState title={t('Loading warehouse KPIs')} /> : null}
      {kpisQuery.isError ? (
        <ErrorState
          title={t('Unable to load warehouse KPIs')}
          message={getApiErrorMessage(kpisQuery.error)}
          onRetry={() => void kpisQuery.refetch()}
        />
      ) : null}
      {kpisQuery.data ? (
        <div className="page-stack">
          <SectionCards
            title={t('Inventory')}
            items={[
              [t('Total Available'), kpisQuery.data.data.inventory.total_available],
              [t('Total Reserved'), kpisQuery.data.data.inventory.total_reserved],
              [t('Total Damaged'), kpisQuery.data.data.inventory.total_damaged],
              [t('Total SKUs'), kpisQuery.data.data.inventory.total_skus],
            ]}
          />
          <SectionCards
            title={t('Operations')}
            items={[
              [t('Picking Lists Total'), kpisQuery.data.data.operations.picking_lists_total],
              [t('Picking Lists Completed'), kpisQuery.data.data.operations.picking_lists_completed],
              [t('Packing Tasks Total'), kpisQuery.data.data.operations.packing_tasks_total],
              [t('Packing Tasks Packed'), kpisQuery.data.data.operations.packing_tasks_packed],
            ]}
          />
          <SectionCards
            title={t('Returns')}
            items={[
              [t('Total Returns'), kpisQuery.data.data.returns.total_returns],
              [t('Sellable Returns'), kpisQuery.data.data.returns.sellable_returns],
              [t('Damaged Returns'), kpisQuery.data.data.returns.damaged_returns],
              [t('Disposed Returns'), kpisQuery.data.data.returns.disposed_returns],
            ]}
          />
          <SectionCards
            title={t('Billing')}
            items={[
              [t('Storage Charges'), <MoneyDisplay value={kpisQuery.data.data.billing.storage_charges} />],
              [t('Packaging Charges'), <MoneyDisplay value={kpisQuery.data.data.billing.packaging_charges} />],
              [t('Fulfillment Charges'), <MoneyDisplay value={kpisQuery.data.data.billing.fulfillment_charges} />],
            ]}
          />
        </div>
      ) : null}
    </section>
  )
}

function SectionCards({
  title,
  items,
}: {
  title: string
  items: Array<[string, ReactNode]>
}) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{t('{{title}} values returned directly from warehouse KPIs.', { title })}</CardDescription>
      </CardHeader>
      <CardContent className="stats-grid">
        {items.map(([label, value]) => (
          <Card variant="stat" className="stat-card stat-card--neutral" key={label}>
            <CardHeader className="stat-card__header">
              <span className="eyebrow">{label}</span>
            </CardHeader>
            <CardContent className="stat-card__content">
              <CardTitle className="stat-card__value">{value}</CardTitle>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  )
}
