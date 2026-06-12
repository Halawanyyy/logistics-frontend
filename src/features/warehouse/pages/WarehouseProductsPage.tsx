import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getWarehouseProductBulkLabels, getWarehouseProductLabel } from '../../../shared/api/labels.api'
import { listLowStockWarehouseProducts, listWarehouseProducts } from '../api/warehouse.api'
import type { WarehouseProduct } from '../types/warehouse.types'
import { ResourceListPage } from '../../../shared/components/data/ResourceListPage'
import { LabelDocumentDialog } from '../../../shared/components/labels/LabelDocumentDialog'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { pickDisplayLabel } from '../../../shared/i18n/locale'
import { useLocale } from '../../../shared/i18n/useLocale'
import { formatDate } from '../../../shared/utils/formatters'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../../../shared/components/ui/Button'
import { ApiFilterBar, compactFilters } from '../../../shared/components/data/ApiFilterBar'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { adminPath } from '../../../shared/routing/paths'
import { LowStockQuickCard } from '../components/LowStockQuickCard'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { buildBulkProductLabelDocument, getProductPrintableLabelDocument } from '../utils/productLabel'

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
  const { t } = useTranslation()
  const { locale } = useLocale()
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
  const productsQuery = useQuery({
    queryKey: ['warehouse-products', params],
    queryFn,
  })
  const lowStockProductsQuery = useQuery({
    queryKey: ['warehouse-products', 'low-stock-summary', summaryParams],
    queryFn: () => listLowStockWarehouseProducts(summaryParams),
  })
  const inventoryLowStockSearch = new URLSearchParams({
    low_stock: 'true',
    ...(filters.merchant_id ? { merchant_id: filters.merchant_id } : {}),
    ...(filters.warehouse_id ? { warehouse_id: filters.warehouse_id } : {}),
  }).toString()
  const selectedProducts = useMemo(
    () => (productsQuery.data?.data ?? []).filter((product) => selectedProductIds.includes(product.id)),
    [productsQuery.data?.data, selectedProductIds],
  )

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
      title={t('Warehouse Products', { defaultValue: 'Warehouse Products' })}
      description={t('Merchant products available for warehouse inventory.', {
        defaultValue: 'Merchant products available for warehouse inventory.',
      })}
      actions={(
        <div className="page-header__button-row">
          <Can permission={PERMISSIONS.INVENTORY_CREATE}>
            <Link className="ui-link-reset" to="/warehouse-products/create"><Button>{t('Create Product', { defaultValue: 'Create Product' })}</Button></Link>
          </Can>
          {selectedProductIds.length ? (
            <LabelDocumentDialog
              defaultFormat="html"
              fetchDocument={(options) => {
                if (selectedProducts.length === selectedProductIds.length) {
                  return buildBulkProductLabelDocument({
                    dimensions: {
                      heightMm: options.height_mm,
                      widthMm: options.width_mm,
                    },
                    locale,
                    products: selectedProducts,
                    t,
                  })
                }

                return getWarehouseProductBulkLabels(selectedProductIds, options)
              }}
              formats={['html', 'pdf']}
              title={t('Bulk Product Labels ({{count}})', {
                count: selectedProductIds.length,
                defaultValue: `Bulk Product Labels (${selectedProductIds.length})`,
              })}
              triggerLabel={t('Bulk Labels ({{count}})', {
                count: selectedProductIds.length,
                defaultValue: `Bulk Labels (${selectedProductIds.length})`,
              })}
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
              title={t('Low-Stock Products', { defaultValue: 'Low-Stock Products' })}
              description={t('Count is based on the current warehouse-product filters and the backend low-stock list.', {
                defaultValue: 'Count is based on the current warehouse-product filters and the backend low-stock list.',
              })}
              countLabel={t('Current low-stock matches', { defaultValue: 'Current low-stock matches' })}
              count={lowStockProductsQuery.data?.data.length ?? 0}
              loading={lowStockProductsQuery.isLoading}
              error={lowStockProductsQuery.isError ? getApiErrorMessage(lowStockProductsQuery.error) : null}
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
                  <Link className="ui-link-reset" to={`${adminPath('/inventory-stocks')}?${inventoryLowStockSearch}`}>
                    <Button type="button" variant="secondary">{t('View low-stock inventory', { defaultValue: 'View low-stock inventory' })}</Button>
                  </Link>
                </>
              )}
            />
          </div>
          <ApiFilterBar
            filters={filters}
            fields={[
              { label: t('Merchant ID', { defaultValue: 'Merchant ID' }), name: 'merchant_id', type: 'number' },
              { label: t('Warehouse ID', { defaultValue: 'Warehouse ID' }), name: 'warehouse_id', type: 'number' },
              { label: t('SKU', { defaultValue: 'SKU' }), name: 'sku' },
              { label: t('Barcode'), name: 'barcode' },
              {
                label: t('Status'),
                name: 'status',
                type: 'select',
                options: [
                  { label: t('active', { defaultValue: 'active' }), value: 'active' },
                  { label: t('inactive', { defaultValue: 'inactive' }), value: 'inactive' },
                ],
              },
              { label: t('Low Stock', { defaultValue: 'Low Stock' }), name: 'low_stock', type: 'select', options: [{ label: 'true', value: 'true' }] },
              { label: t('Search'), name: 'search' },
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
          header: t('Select', { defaultValue: 'Select' }),
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
        { header: t('Product'), render: (product) => <Link className="table-link" to={`/warehouse-products/${product.id}`}>{product.name}</Link> },
        { header: t('SKU', { defaultValue: 'SKU' }), render: (product) => product.sku },
        { header: t('Merchant'), render: (product) => product.merchant_name },
        { header: t('Status'), render: (product) => <StatusBadge value={product.status}>{pickDisplayLabel(product.status, product.status_label)}</StatusBadge> },
        {
          header: t('Labels', { defaultValue: 'Labels' }),
          render: (product) => (
            <LabelDocumentDialog
              buttonVariant="ghost"
              defaultFormat="html"
              fetchDocument={(options) => getProductPrintableLabelDocument({
                fetchDocument: (requestOptions) => getWarehouseProductLabel(product.id, requestOptions),
                locale,
                options,
                product,
                t,
              })}
              formats={['html', 'pdf']}
              title={t('Product Label - {{name}}', {
                name: product.name,
                defaultValue: `Product Label - ${product.name}`,
              })}
              triggerLabel={t('Label', { defaultValue: 'Label' })}
            />
          ),
        },
        { header: t('Created'), render: (product) => formatDate(product.created_at) },
      ]}
    />
  )
}
