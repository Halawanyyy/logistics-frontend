import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getWarehouseProductBulkLabels, getWarehouseProductLabel } from '../../../shared/api/labels.api'
import { listLowStockWarehouseProducts, listWarehouseProducts } from '../api/warehouse.api'
import type { WarehouseProduct } from '../types/warehouse.types'
import { ResourceListPage } from '../../../shared/components/data/ResourceListPage'
import { LabelDocumentDialog } from '../../../shared/components/labels/LabelDocumentDialog'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { pickDisplayLabel } from '../../../shared/i18n/locale'
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
  merchant_id: '',
  warehouse_id: '',
  sku: '',
  barcode: '',
  status: '',
  low_stock: '',
  search: '',
}

export function WarehouseProductsPage() {
  const [searchParams] = useSearchParams()
  const merchantIdParam = searchParams.get('merchant_id') ?? ''
  const warehouseIdParam = searchParams.get('warehouse_id') ?? ''
  const lowStockParam = searchParams.get('low_stock') === 'true' ? 'true' : ''
  const searchText = searchParams.get('search') ?? ''
  const [filters, setFilters] = useState(() => ({
    ...initialFilters,
    merchant_id: merchantIdParam,
    warehouse_id: warehouseIdParam,
    low_stock: lowStockParam,
    search: searchText,
  }))
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])
  const params = compactFilters(filters)
  const summaryParams = compactFilters({
    merchant_id: filters.merchant_id,
    warehouse_id: filters.warehouse_id,
    sku: filters.sku,
    barcode: filters.barcode,
    status: filters.status,
    search: filters.search,
  })
  const queryFn = filters.low_stock ? () => listLowStockWarehouseProducts(params) : () => listWarehouseProducts(params)
  const lowStockProductsQuery = useQuery({
    queryKey: ['warehouse-products', 'low-stock-summary', summaryParams],
    queryFn: () => listLowStockWarehouseProducts(summaryParams),
  })
  const inventoryLowStockSearch = new URLSearchParams({
    low_stock: 'true',
    ...(filters.merchant_id ? { merchant_id: filters.merchant_id } : {}),
    ...(filters.warehouse_id ? { warehouse_id: filters.warehouse_id } : {}),
  }).toString()

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      merchant_id: merchantIdParam,
      warehouse_id: warehouseIdParam,
      low_stock: lowStockParam,
      search: searchText,
    }))
  }, [lowStockParam, merchantIdParam, searchText, warehouseIdParam])

  return (
    <ResourceListPage<WarehouseProduct>
      title="Warehouse Products"
      description="Merchant products available for warehouse inventory."
      actions={(
        <div className="page-header__button-row">
          <Can permission={PERMISSIONS.INVENTORY_CREATE}>
            <Link className="ui-link-reset" to="/warehouse-products/create"><Button>Create Product</Button></Link>
          </Can>
          {selectedProductIds.length ? (
            <LabelDocumentDialog
              defaultFormat="pdf"
              fetchDocument={(options) => getWarehouseProductBulkLabels(selectedProductIds, options)}
              title={`Bulk Product Labels (${selectedProductIds.length})`}
              triggerLabel={`Bulk Labels (${selectedProductIds.length})`}
            />
          ) : null}
        </div>
      )}
      queryKey={['warehouse-products', params]}
      queryFn={queryFn}
      filters={
        <div className="page-stack">
          <div className="stats-grid">
            <LowStockQuickCard
              title="Low-Stock Products"
              description="Count is based on the current warehouse-product filters and the backend low-stock list."
              countLabel="Current low-stock matches"
              count={lowStockProductsQuery.data?.data.length ?? 0}
              loading={lowStockProductsQuery.isLoading}
              error={lowStockProductsQuery.isError ? getApiErrorMessage(lowStockProductsQuery.error) : null}
              actions={(
                <>
                  <Button type="button" variant="secondary" onClick={() => setFilters((current) => ({ ...current, low_stock: 'true' }))}>
                    Filter low stock
                  </Button>
                  {filters.low_stock ? (
                    <Button type="button" variant="secondary" onClick={() => setFilters((current) => ({ ...current, low_stock: '' }))}>
                      Clear filter
                    </Button>
                  ) : null}
                  <Link className="ui-link-reset" to={`${adminPath('/inventory-stocks')}?${inventoryLowStockSearch}`}>
                    <Button type="button" variant="secondary">View low-stock inventory</Button>
                  </Link>
                </>
              )}
            />
          </div>
          <ApiFilterBar
            filters={filters}
            fields={[
              { label: 'Merchant ID', name: 'merchant_id', type: 'number' },
              { label: 'Warehouse ID', name: 'warehouse_id', type: 'number' },
              { label: 'SKU', name: 'sku' },
              { label: 'Barcode', name: 'barcode' },
              { label: 'Status', name: 'status', type: 'select', options: [{ label: 'active', value: 'active' }, { label: 'inactive', value: 'inactive' }] },
              { label: 'Low Stock', name: 'low_stock', type: 'select', options: [{ label: 'true', value: 'true' }] },
              { label: 'Search', name: 'search' },
            ]}
            onChange={(name, value) => setFilters((current) => ({ ...current, [name]: value }))}
            onReset={() => {
              setFilters(initialFilters)
              setSelectedProductIds([])
            }}
          />
        </div>
      }
      columns={[
        {
          header: 'Select',
          render: (product) => (
            <input
              checked={selectedProductIds.includes(product.id)}
              type="checkbox"
              onChange={(event) => {
                setSelectedProductIds((current) => (
                  event.target.checked
                    ? [...current, product.id]
                    : current.filter((id) => id !== product.id)
                ))
              }}
            />
          ),
        },
        { header: 'Product', render: (product) => <Link className="table-link" to={`/warehouse-products/${product.id}`}>{product.name}</Link> },
        { header: 'SKU', render: (product) => product.sku },
        { header: 'Merchant', render: (product) => product.merchant_name },
        { header: 'Status', render: (product) => <StatusBadge value={product.status}>{pickDisplayLabel(product.status, product.status_label)}</StatusBadge> },
        {
          header: 'Labels',
          render: (product) => (
            <LabelDocumentDialog
              buttonVariant="ghost"
              defaultFormat="html"
              fetchDocument={(options) => getWarehouseProductLabel(product.id, options)}
              title={`Product Label - ${product.name}`}
              triggerLabel="Label"
            />
          ),
        },
        { header: 'Created', render: (product) => formatDate(product.created_at) },
      ]}
    />
  )
}
