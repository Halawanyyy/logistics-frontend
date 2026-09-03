import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { listInventoryStocks, listLowStockInventoryStocks } from '../api/warehouse.api'
import type { InventoryStock } from '../types/warehouse.types'
import { ResourceListPage } from '../../../shared/components/data/ResourceListPage'
import { formatDate } from '../../../shared/utils/formatters'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../../../shared/components/ui/Button'
import { ApiFilterBar, compactFilters } from '../../../shared/components/data/ApiFilterBar'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { adminPath } from '../../../shared/routing/paths'
import { LowStockQuickCard } from '../components/LowStockQuickCard'
import { getApiErrorMessage } from '../../../shared/api/api-error'

const initialFilters = {
  warehouse_id: '',
  merchant_id: '',
  sku: '',
  barcode: '',
  low_stock: '',
  has_reserved: '',
  available_only: '',
}

export function InventoryStocksPanel({
  embedded = false,
  onCountChange,
}: {
  embedded?: boolean
  onCountChange?: (count: number) => void
}) {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState(() => ({
    ...initialFilters,
    merchant_id: searchParams.get('merchant_id') ?? '',
    warehouse_id: searchParams.get('warehouse_id') ?? '',
    low_stock: searchParams.get('low_stock') === 'true' ? 'true' : '',
  }))
  const params = compactFilters(filters)
  const summaryParams = compactFilters({
    warehouse_id: filters.warehouse_id,
    merchant_id: filters.merchant_id,
    sku: filters.sku,
    barcode: filters.barcode,
    has_reserved: filters.has_reserved,
    available_only: filters.available_only,
  })
  const queryFn = filters.low_stock ? () => listLowStockInventoryStocks(params) : () => listInventoryStocks(params)
  const lowStockInventoryQuery = useQuery({
    queryKey: ['inventory-stocks', 'low-stock-summary', summaryParams],
    queryFn: () => listLowStockInventoryStocks(summaryParams),
  })
  const productLowStockSearch = new URLSearchParams({
    low_stock: 'true',
    ...(filters.merchant_id ? { merchant_id: filters.merchant_id } : {}),
    ...(filters.warehouse_id ? { warehouse_id: filters.warehouse_id } : {}),
  }).toString()
  return (
    <ResourceListPage<InventoryStock>
      hideHeader={embedded}
      onCountChange={onCountChange}
      title={t('Inventory Stocks')}
      description={t('Available, reserved, and damaged stock by warehouse product.', { defaultValue: 'Available, reserved, and damaged stock by warehouse product.' })}
      actions={<Can permission={PERMISSIONS.STOCK_ADJUST}><Link className="ui-link-reset" to="/inventory-stocks/adjust"><Button>{t('Adjust Stock', { defaultValue: 'Adjust Stock' })}</Button></Link></Can>}
      queryKey={['inventory-stocks', params]}
      queryFn={queryFn}
      filters={
        <div className="page-stack">
          <div className="stats-grid">
            <LowStockQuickCard
              title={t('Low-Stock Inventory', { defaultValue: 'Low-Stock Inventory' })}
              description={t('Count is based on the current inventory filters and the backend low-stock inventory list.', { defaultValue: 'Count is based on the current inventory filters and the backend low-stock inventory list.' })}
              countLabel={t('Current low-stock matches', { defaultValue: 'Current low-stock matches' })}
              count={lowStockInventoryQuery.data?.data.length ?? 0}
              loading={lowStockInventoryQuery.isLoading}
              error={lowStockInventoryQuery.isError ? getApiErrorMessage(lowStockInventoryQuery.error) : null}
              actions={(
                <>
                  <Button type="button" variant="secondary" onClick={() => setFilters((current) => ({ ...current, low_stock: 'true' }))}>
                    {t('Filter low stock', { defaultValue: 'Filter low stock' })}
                  </Button>
                  {filters.low_stock ? (
                    <Button type="button" variant="secondary" onClick={() => setFilters((current) => ({ ...current, low_stock: '' }))}>
                      {t('Clear filter', { defaultValue: 'Clear filter' })}
                    </Button>
                  ) : null}
                  <Link className="ui-link-reset" to={`${adminPath('/warehouse-products')}?${productLowStockSearch}`}>
                    <Button type="button" variant="secondary">{t('View low-stock products', { defaultValue: 'View low-stock products' })}</Button>
                  </Link>
                </>
              )}
            />
          </div>
          <ApiFilterBar
            filters={filters}
            fields={[
              { label: 'Warehouse', name: 'warehouse_id', type: 'warehouse' },
              { label: 'Merchant', name: 'merchant_id', type: 'merchant' },
              { label: 'SKU', name: 'sku' },
              { label: 'Barcode', name: 'barcode' },
              { label: 'Low Stock', name: 'low_stock', type: 'select', options: [{ label: 'true', value: 'true' }] },
              { label: 'Has Reserved', name: 'has_reserved', type: 'select', options: [{ label: 'true', value: 'true' }] },
              { label: 'Available Only', name: 'available_only', type: 'select', options: [{ label: 'true', value: 'true' }] },
            ]}
            onChange={(name, value) => setFilters((current) => ({ ...current, [name]: value }))}
            onReset={() => setFilters(initialFilters)}
          />
        </div>
      }
      columns={[
        { header: 'Product', render: (stock) => <Link className="table-link" to={`/inventory-stocks/${stock.id}`}>{stock.product_name}</Link> },
        { header: 'Warehouse', render: (stock) => stock.warehouse_name },
        { header: 'Available', render: (stock) => stock.quantity_available },
        { header: 'Reserved', render: (stock) => stock.quantity_reserved },
        { header: 'Damaged', render: (stock) => stock.quantity_damaged },
        { header: 'Updated', render: (stock) => formatDate(stock.updated_at) },
      ]}
    />
  )
}

export function InventoryStocksPage() {
  return <InventoryStocksPanel />
}
