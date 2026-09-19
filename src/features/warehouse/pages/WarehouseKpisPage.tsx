import { useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowRight, Boxes, ClipboardList, PackageCheck, RotateCcw, ScanLine } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  getWarehouseKpis,
  listLowStockInventoryStocks,
  listLowStockWarehouseProducts,
  listMerchantInboundStockRequests,
  listPickingLists,
  listWarehouseReceipts,
  listWarehouseReturns,
} from '../api/warehouse.api'
import type { WarehouseFilters } from '../types/warehouse.types'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { DateRangeFilter } from '../../../shared/components/filters/DateRangeFilter'
import { FilterPopover } from '../../../shared/components/filters/FilterPopover'
import { FilterButton } from '../../../shared/components/filters/FilterButton'
import { FilterField } from '../../../shared/components/filters/FilterField'
import { AppliedFilterChips, type AppliedFilterChip } from '../../../shared/components/filters/AppliedFilterChips'
import { MerchantSelector } from '../../../shared/components/selectors/MerchantSelector'
import { WarehouseSelector } from '../../../shared/components/selectors/WarehouseSelector'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { Button } from '../../../shared/components/ui/Button'
import { BarcodeScannerInput } from '../../../shared/components/barcode/BarcodeScannerInput'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { hasAnyPermission, hasPermission } from '../../../shared/auth/permissions'
import { useAuthStore } from '../../auth/store/auth.store'
import { lookupBarcode } from '../../barcodes/api/barcodes.api'
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
  const user = useAuthStore((state) => state.user)
  const [filters, setFilters] = useState<KpiFiltersState>(initialFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState<KpiFiltersState>(initialFilters)

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.warehouse_id) count++
    if (filters.merchant_id) count++
    if (filters.date_from || filters.date_to) count++
    return count
  }, [filters])

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraftFilters(filters)
    }
    setFiltersOpen(nextOpen)
  }

  const handleApply = () => {
    setFilters(draftFilters)
    setFiltersOpen(false)
  }

  const handleReset = () => {
    setDraftFilters(initialFilters)
    setFilters(initialFilters)
    setFiltersOpen(false)
  }

  const appliedChips: AppliedFilterChip[] = useMemo(() => {
    const chips: AppliedFilterChip[] = []
    if (filters.warehouse_id) {
      chips.push({ key: 'warehouse_id', label: t('Warehouse'), value: filters.warehouse_id })
    }
    if (filters.merchant_id) {
      chips.push({ key: 'merchant_id', label: t('Merchant'), value: filters.merchant_id })
    }
    if (filters.date_from || filters.date_to) {
      chips.push({
        key: 'date_range',
        label: t('Date Range', { defaultValue: 'Date Range' }),
        value: `${filters.date_from || '...'} -> ${filters.date_to || '...'}`,
      })
    }
    return chips
  }, [filters, t])

  const handleRemoveChip = (key: string) => {
    if (key === 'warehouse_id') setFilters((c) => ({ ...c, warehouse_id: '' }))
    if (key === 'merchant_id') setFilters((c) => ({ ...c, merchant_id: '' }))
    if (key === 'date_range') setFilters((c) => ({ ...c, date_from: '', date_to: '' }))
  }
  const [barcode, setBarcode] = useState('')
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
  const canViewInbound = hasAnyPermission(user, [
    PERMISSIONS.MERCHANT_INBOUND_REQUESTS_VIEW,
    PERMISSIONS.MERCHANT_INBOUND_REQUESTS_MANAGE,
  ])
  const canViewInventory = hasPermission(user, PERMISSIONS.INVENTORY_VIEW)
  const canViewPicking = hasPermission(user, PERMISSIONS.PICKING_LISTS_VIEW)
  const canViewReturns = hasPermission(user, PERMISSIONS.WAREHOUSE_RETURNS_VIEW)
  const inboundQuery = useQuery({
    queryKey: ['merchant-inbound-stock-requests', 'warehouse-hub', 'pending'],
    queryFn: () => listMerchantInboundStockRequests({ status: 'pending' }),
    enabled: canViewInbound,
  })
  const receiptsQuery = useQuery({
    queryKey: ['warehouse-receipts', 'warehouse-hub', 'draft'],
    queryFn: () => listWarehouseReceipts({ status: 'draft' }),
    enabled: canViewInventory,
  })
  const pickingQuery = useQuery({
    queryKey: ['picking-lists', 'warehouse-hub'],
    queryFn: () => listPickingLists(),
    enabled: canViewPicking,
  })
  const returnsQuery = useQuery({
    queryKey: ['warehouse-returns', 'warehouse-hub', 'awaiting-inspection'],
    queryFn: () => listWarehouseReturns(),
    enabled: canViewReturns,
  })
  const barcodeLookup = useMutation({ mutationFn: (value: string) => lookupBarcode({ barcode: value }) })
  const lowStockSearch = new URLSearchParams({
    low_stock: 'true',
    ...(filters.warehouse_id ? { warehouse_id: filters.warehouse_id } : {}),
    ...(filters.merchant_id ? { merchant_id: filters.merchant_id } : {}),
  }).toString()
  const pendingInbound = inboundQuery.data?.data ?? []
  const pendingReceipts = receiptsQuery.data?.data ?? []
  const readyPickingLists = (pickingQuery.data?.data ?? []).filter((item) =>
    !['completed', 'cancelled', 'packed'].includes(item.status ?? 'pending'),
  )
  const overduePickingLists = readyPickingLists.filter((item) =>
    ['overdue', 'delayed'].includes(item.status ?? '')
      || (pickingQuery.dataUpdatedAt > 0
        && new Date(item.created_at).getTime() < pickingQuery.dataUpdatedAt - 24 * 60 * 60 * 1000),
  )
  const returnsAwaitingInspection = (returnsQuery.data?.data ?? []).filter((item) =>
    ['pending', 'received'].includes(item.status ?? ''),
  )
  const barcodeResult = barcodeLookup.data?.data
  const barcodeResultPath = barcodeResult?.type === 'order'
    ? adminPath(`/orders/${barcodeResult.id}`)
    : barcodeResult?.type === 'shipment'
      ? adminPath(`/shipments/${barcodeResult.id}`)
      : barcodeResult?.type === 'warehouse_product'
        ? adminPath(`/warehouse-products/${barcodeResult.id}`)
        : barcodeResult?.type === 'bin'
          ? adminPath(`/warehouse/bins/${barcodeResult.id}`)
          : null

  return (
    <section className="page-section warehouse-hub">
      <PageHeader
        title={t('Warehouse Hub', { defaultValue: 'Warehouse Hub' })}
        description={t('A single operational view for inbound work, inventory, fulfillment, returns, and warehouse billing.', {
          defaultValue: 'A single operational view for inbound work, inventory, fulfillment, returns, and warehouse billing.',
        })}
      />

      <Can anyOf={[PERMISSIONS.BARCODES_LOOKUP, PERMISSIONS.BARCODES_SCAN]}>
        <Card className="warehouse-hub__barcode">
          <CardContent>
            <div className="warehouse-hub__barcode-copy">
              <span className="form-section__icon" aria-hidden="true"><ScanLine size={20} /></span>
              <div>
                <CardTitle>{t('Scan or search a barcode', { defaultValue: 'Scan or search a barcode' })}</CardTitle>
                <CardDescription>{t('Find an order, shipment, warehouse product, or bin without leaving the hub.', {
                  defaultValue: 'Find an order, shipment, warehouse product, or bin without leaving the hub.',
                })}</CardDescription>
              </div>
            </div>
            <div className="warehouse-hub__barcode-form barcode-search">
              <BarcodeScannerInput
                className="barcode-search__input"
                value={barcode}
                clearOnScan={false}
                disabled={barcodeLookup.isPending}
                placeholder={t('Scan or enter barcode', { defaultValue: 'Scan or enter barcode' })}
                onChange={setBarcode}
                onScan={(value) => barcodeLookup.mutate(value)}
              />
              <Button
                className="barcode-search__btn"
                disabled={!barcode.trim()}
                loading={barcodeLookup.isPending}
                type="button"
                variant="primary"
                onClick={() => barcodeLookup.mutate(barcode.trim())}
              >
                {t('Lookup', { defaultValue: 'Lookup' })}
              </Button>
            </div>
            {barcodeLookup.error ? <div className="form-error">{getApiErrorMessage(barcodeLookup.error)}</div> : null}
            {barcodeResult ? (
              <div className="warehouse-hub__barcode-result">
                <span><strong>{barcodeResult.barcode}</strong> · {barcodeResult.type}</span>
                {barcodeResultPath ? (
                  <Link className="table-link" to={barcodeResultPath}>{t('Open record', { defaultValue: 'Open record' })} <ArrowRight size={15} /></Link>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </Can>

      <div className="warehouse-hub__quick-actions" aria-label={t('Warehouse quick actions', { defaultValue: 'Warehouse quick actions' })}>
        <Can permission={PERMISSIONS.INVENTORY_CREATE}>
          <Link className="ui-link-reset" to={`${adminPath('/warehouse/inbound')}?tab=receipts`}>
            <Button type="button"><PackageCheck size={17} />{t('Receive Goods', { defaultValue: 'Receive Goods' })}</Button>
          </Link>
        </Can>
        <Can permission={PERMISSIONS.PICKING_LISTS_CREATE}>
          <Link className="ui-link-reset" to={`${adminPath('/warehouse/fulfillment')}?tab=picking`}>
            <Button type="button" variant="secondary"><ClipboardList size={17} />{t('Start Pick', { defaultValue: 'Start Pick' })}</Button>
          </Link>
        </Can>
        <Can permission={PERMISSIONS.WAREHOUSE_RETURNS_CREATE}>
          <Link className="ui-link-reset" to={`${adminPath('/warehouse/config')}?tab=returns`}>
            <Button type="button" variant="secondary"><RotateCcw size={17} />{t('Process Return', { defaultValue: 'Process Return' })}</Button>
          </Link>
        </Can>
      </div>

      <div className="page-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
        <AppliedFilterChips
          chips={appliedChips}
          onRemove={handleRemoveChip}
          onClearAll={handleReset}
        />
        <div style={{ marginInlineStart: 'auto' }}>
          <FilterPopover
            title={t('Filter Warehouse Hub', { defaultValue: 'Filter Warehouse Hub' })}
            open={filtersOpen}
            onOpenChange={handleOpenChange}
            onApply={handleApply}
            onReset={handleReset}
            activeCount={activeFilterCount}
            trigger={
              <FilterButton
                activeCount={activeFilterCount}
                open={filtersOpen}
                onClick={() => handleOpenChange(!filtersOpen)}
              />
            }
          >
            <div className="space-y-4">
              <FilterField label={t('Warehouse')}>
                <WarehouseSelector
                  value={draftFilters.warehouse_id}
                  includeAllOption
                  onChange={(warehouse_id) => setDraftFilters((current) => ({ ...current, warehouse_id }))}
                />
              </FilterField>
              <FilterField label={t('Merchant')}>
                <MerchantSelector
                  value={draftFilters.merchant_id}
                  includeAllOption
                  onChange={(merchant_id) => setDraftFilters((current) => ({ ...current, merchant_id }))}
                />
              </FilterField>
              <FilterField label={t('Date Range', { defaultValue: 'Date Range' })}>
                <DateRangeFilter
                  dateFrom={draftFilters.date_from}
                  dateTo={draftFilters.date_to}
                  onChange={({ date_from, date_to }) => setDraftFilters((current) => ({ ...current, date_from, date_to }))}
                />
              </FilterField>
            </div>
          </FilterPopover>
        </div>
      </div>

      <div className="stat-card-grid warehouse-hub__stats">
        <HubStatCard
          accent="orders"
          icon={<PackageCheck size={20} />}
          label={t('Inbound Pending', { defaultValue: 'Inbound Pending' })}
          value={canViewInbound ? pendingInbound.length : '-'}
          to={`${adminPath('/warehouse/inbound')}?tab=requests`}
        />
        <HubStatCard
          accent="inventory"
          icon={<Boxes size={20} />}
          label={t('Inventory Units', { defaultValue: 'Inventory Units' })}
          value={kpisQuery.data?.data.inventory.total_available ?? '-'}
          to={`${adminPath('/warehouse/inventory')}?tab=stocks`}
        />
        <HubStatCard
          accent="shipments"
          icon={<ClipboardList size={20} />}
          label={t('Ready to Pick', { defaultValue: 'Ready to Pick' })}
          value={canViewPicking ? readyPickingLists.length : '-'}
          to={`${adminPath('/warehouse/fulfillment')}?tab=picking`}
        />
        <HubStatCard
          accent="danger"
          icon={<RotateCcw size={20} />}
          label={t('Returns to Inspect', { defaultValue: 'Returns to Inspect' })}
          value={canViewReturns ? returnsAwaitingInspection.length : '-'}
          to={`${adminPath('/warehouse/config')}?tab=returns`}
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
        <div className="page-stack warehouse-hub__compact-overview">
          <div className="details-grid">
            <CompactStatsCard
              accent="shipments"
              title={t('Operations')}
              items={[
                { label: t('Picking Total', { defaultValue: 'Picking Total' }), value: kpisQuery.data.data.operations.picking_lists_total },
                { label: t('Picking Done', { defaultValue: 'Picking Done' }), value: kpisQuery.data.data.operations.picking_lists_completed },
                { label: t('Packing Total', { defaultValue: 'Packing Total' }), value: kpisQuery.data.data.operations.packing_tasks_total },
                { label: t('Packing Done', { defaultValue: 'Packing Done' }), value: kpisQuery.data.data.operations.packing_tasks_packed },
              ]}
            />
            <CompactStatsCard
              accent="danger"
              title={t('Returns')}
              items={[
                { label: t('Total'), value: kpisQuery.data.data.returns.total_returns },
                { label: t('Sellable'), value: kpisQuery.data.data.returns.sellable_returns, tone: 'success' },
                { label: t('Damaged'), value: kpisQuery.data.data.returns.damaged_returns, tone: 'warning' },
                { label: t('Disposed'), value: kpisQuery.data.data.returns.disposed_returns, tone: 'danger' },
              ]}
            />
          </div>
          <CompactStatsCard
            accent="finance"
            title={t('Billing')}
            items={[
              { label: t('Storage Charges'), value: <MoneyDisplay value={kpisQuery.data.data.billing.storage_charges} /> },
              { label: t('Packaging Charges'), value: <MoneyDisplay value={kpisQuery.data.data.billing.packaging_charges} /> },
              { label: t('Fulfillment Charges'), value: <MoneyDisplay value={kpisQuery.data.data.billing.fulfillment_charges} /> },
            ]}
          />
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t('Urgent Tasks', { defaultValue: 'Urgent Tasks' })}</CardTitle>
          <CardDescription>{t('Open warehouse work that needs operational attention.', {
            defaultValue: 'Open warehouse work that needs operational attention.',
          })}</CardDescription>
        </CardHeader>
        <CardContent className="warehouse-urgent-list urgent-tasks">
          <Can permission={PERMISSIONS.INVENTORY_VIEW}>
            <Link className="warehouse-urgent-list__item warehouse-urgent-list__item--pending urgent-task" to={`${adminPath('/warehouse/inbound')}?tab=receipts`}>
              <span className="warehouse-urgent-list__indicator urgent-task__indicator urgent-task__indicator--warning" aria-hidden="true" />
              <span>{t('Pending warehouse receipts', { defaultValue: 'Pending warehouse receipts' })}</span>
              <strong className="urgent-task__count">{pendingReceipts.length}</strong>
            </Link>
          </Can>
          <Can permission={PERMISSIONS.PICKING_LISTS_VIEW}>
            <Link className="warehouse-urgent-list__item warehouse-urgent-list__item--overdue urgent-task" to={`${adminPath('/warehouse/fulfillment')}?tab=picking`}>
              <span className="warehouse-urgent-list__indicator urgent-task__indicator urgent-task__indicator--critical" aria-hidden="true" />
              <span>{t('Overdue picking lists', { defaultValue: 'Overdue picking lists' })}</span>
              <strong className="urgent-task__count">{overduePickingLists.length}</strong>
            </Link>
          </Can>
          <Can permission={PERMISSIONS.WAREHOUSE_RETURNS_VIEW}>
            <Link className="warehouse-urgent-list__item warehouse-urgent-list__item--pending urgent-task" to={`${adminPath('/warehouse/config')}?tab=returns`}>
              <span className="warehouse-urgent-list__indicator urgent-task__indicator urgent-task__indicator--info" aria-hidden="true" />
              <span>{t('Returns awaiting inspection', { defaultValue: 'Returns awaiting inspection' })}</span>
              <strong className="urgent-task__count">{returnsAwaitingInspection.length}</strong>
            </Link>
          </Can>
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
        </div>
      ) : null}
    </section>
  )
}

function HubStatCard({ accent, icon, label, to, value }: { accent: 'orders' | 'shipments' | 'inventory' | 'danger'; icon: ReactNode; label: string; to: string; value: ReactNode }) {
  return (
    <Link className="ui-link-reset warehouse-hub__stat-link" to={to}>
      <Card className="warehouse-hub__stat stat-card" variant="stat" data-accent={accent}>
        <CardHeader className="stat-card__header">
          <span className="warehouse-hub__stat-icon" aria-hidden="true">{icon}</span>
          <span className="warehouse-hub__stat-arrow" aria-hidden="true">
            <ArrowRight size={17} />
          </span>
        </CardHeader>
        <CardContent className="stat-card__content">
          <CardTitle className="stat-card__value">{value}</CardTitle>
          <CardDescription className="stat-card__label">{label}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  )
}

function CompactStatsCard({
  accent,
  items,
  title,
}: {
  accent: 'shipments' | 'danger' | 'finance'
  items: Array<{
    label: string
    tone?: 'success' | 'warning' | 'danger'
    value: ReactNode
  }>
  title: string
}) {
  return (
    <Card className="detail-card stat-tile" data-accent={accent}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="compact-stats-row">
          {items.map((item) => (
            <div className="compact-stat" key={item.label}>
              <span className="compact-stat__label">{item.label}</span>
              <span className={`compact-stat__value${item.tone ? ` text-${item.tone}` : ''}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
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
          <Card variant="stat" className="stat-card stat-card--neutral" data-accent="inventory" key={label}>
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
