import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { Package, AlertTriangle, CheckCircle, BarChart2 } from 'lucide-react'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { EmptyState } from '../../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { Button } from '../../../../shared/components/ui/Button'
import { Card, CardContent } from '../../../../shared/components/ui/Card'
import { Input } from '../../../../shared/components/ui/Input'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { Select } from '../../../../shared/components/ui/Select'
import { Table, TableCell, TableContainer, TableHead } from '../../../../shared/components/ui/Table'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'
import { ActionToolbar } from '../../../../shared/components/ui/ActionToolbar'
import { merchantPath } from '../../../../shared/routing/paths'
import { formatDate } from '../../../../shared/utils/formatters'
import { createHtmlLabelDocument } from '../../../../shared/utils/printHtml'
import type { AppLocale } from '../../../../shared/i18n/locale'
import { CanMerchant } from '../../components/CanMerchant'
import {
  listMerchantPortalWarehouseProducts,
  getMerchantPortalWarehouseProductLabel,
} from '../api/merchantPortalWarehouse.api'
import { getMerchantPortalDashboardSummary } from '../../api/merchantPortal.api'
import type { MerchantPortalDashboardSummaryResponse } from '../../types/merchantPortal.types'
import type { MerchantPortalWarehouseProductFilters } from '../types/merchantPortalWarehouse.types'
import { DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '../../../../shared/components/ui/Dropdown'
import { LabelDocumentDialog } from '../../../../shared/components/labels/LabelDocumentDialog'
import { BulkBarcodeLabelsDialog } from '../components/BulkBarcodeLabelsDialog'

const initialFilters: MerchantPortalWarehouseProductFilters = {
  search: '',
  status: '',
}

export function MerchantWarehouseProductsPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const stockStatusParam = searchParams.get('stock_status') ?? ''
  const searchText = searchParams.get('search') ?? ''

  const [filters, setFilters] = useState<MerchantPortalWarehouseProductFilters>(() => ({
    ...initialFilters,
    search: searchText,
  }))
  const [page, setPage] = useState(1)

  const [printState, setPrintState] = useState<{ productId: number; type: 'label' } | null>(null)
  const [isBulkPrintOpen, setIsBulkPrintOpen] = useState(false)

  const params = useMemo(() => ({
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.search ? { search: filters.search } : {}),
  }), [filters])

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['merchant-portal', 'warehouse-products', page, params],
    queryFn: () => listMerchantPortalWarehouseProducts(page, params),
  })

  const dashboardQuery = useQuery<{ data: MerchantPortalDashboardSummaryResponse }>({
    queryKey: ['merchant-portal', 'dashboard-summary'],
    queryFn: () => getMerchantPortalDashboardSummary(),
  })

    function handleFilterChange(key: string, value: any) {
    setFilters((prev: any) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  function handleClearFilters() {
    setFilters({ ...initialFilters })
    setPage(1)
  }

  const hasActiveFilters = Object.values(filters).some((value) => Boolean(value))

  function renderContent() {
    if (isLoading) {
      return <LoadingState title={t('Loading products...')} />
    }

    if (isError) {
      return (
        <ErrorState
          message={getApiErrorMessage(error)}
          onRetry={refetch}
        />
      )
    }

    if (!data?.data || data.data.length === 0) {
      if (hasActiveFilters) {
        return (
          <EmptyState
            description={t('No products match your current filters.')}
            title={t('No results found')}
            actionLabel={t('Clear filters')}
            onAction={handleClearFilters}
          />
        )
      }

      return (
        <EmptyState
          description={t('You have no products stored in the warehouse.')}
          title={t('No warehouse products')}
        />
      )
    }

    return (
      <TableContainer>
        <Table>
          <thead>
            <tr>
              <TableHead>{t('Product Name')}</TableHead>
              <TableHead>{t('SKU')}</TableHead>
              <TableHead>{t('Barcode')}</TableHead>
              <TableHead>{t('Warehouses')}</TableHead>
              <TableHead className="text-right">{t('Total Stock')}</TableHead>
              <TableHead className="text-right">{t('Available')}</TableHead>
              <TableHead className="text-right">{t('Reserved')}</TableHead>
              <TableHead>{t('Status')}</TableHead>
              <TableHead>{t('Created At')}</TableHead>
              <TableHead className="text-right">{t('Actions')}</TableHead>
            </tr>
          </thead>
          <tbody>
            {data.data.map((product) => {
              const summary = product.inventory_summary
              const available = summary?.available_quantity ?? 0
              const isLowStock = product.low_stock

              return (
                <tr key={product.id}>
                  <TableCell>
                    <Link
                      className="text-primary hover:underline font-bold"
                      to={merchantPath(`/warehouse/products/${product.id}`)}
                    >
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs bg-slate-800 px-2 py-1 rounded text-slate-200">{product.sku}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-muted">{product.barcode || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{summary?.warehouses_count ?? 1} {t('loc')}</span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {summary?.on_hand_quantity ?? 0}
                  </TableCell>
                  <TableCell className="text-right font-bold text-success">
                    {available}
                  </TableCell>
                  <TableCell className="text-right font-medium text-warning">
                    {summary?.reserved_quantity ?? 0}
                  </TableCell>
                  <TableCell>
                    {isLowStock ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                        <AlertTriangle className="h-3 w-3" />
                        {t('Low Stock')}
                      </span>
                    ) : (
                      <StatusBadge value={product.status}>
                        {product.status_label || product.status}
                      </StatusBadge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted">{formatDate(product.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownTrigger>
                        <Button size="sm" variant="ghost">
                          {t('Actions')}
                        </Button>
                      </DropdownTrigger>
                      <DropdownContent>
                        <DropdownItem>
                          <Link to={merchantPath(`/warehouse/products/${product.id}`)}>
                            {t('View Details')}
                          </Link>
                        </DropdownItem>
                        <CanMerchant capability="labels.print">
                          <DropdownItem
                            onClick={() => setPrintState({ productId: product.id, type: 'label' })}
                          >
                            {t('Print Barcode Label')}
                          </DropdownItem>
                        </CanMerchant>
                      </DropdownContent>
                    </DropdownMenu>
                  </TableCell>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </TableContainer>
    )
  }

  return (
    <>
      <PageHeader
        className="products-page__header"
        description={t('Unified catalog workspace for managing your products, stock balances, and low stock items.')}
        eyebrow={t('Warehouse Management')}
        title={t('Products & Inventory')}
      />

      {/* Global KPI Cards Sourced from Summary API */}
      <div className="products-kpi-grid">
        <Card className="products-kpi products-kpi--violet">
          <div className="products-kpi__header">
            <span className="products-kpi__label">{t('Total Products')}</span>
            <span className="products-kpi__icon"><Package /></span>
          </div>
          <div className="products-kpi__value">
            {dashboardQuery.data?.data?.warehouse?.total_products ?? dashboardQuery.data?.data?.warehouse?.warehouse_products_count ?? 0}
          </div>
        </Card>
        <Card className="products-kpi products-kpi--blue">
          <div className="products-kpi__header">
            <span className="products-kpi__label">{t('Total Stock')}</span>
            <span className="products-kpi__icon"><BarChart2 /></span>
          </div>
          <div className="products-kpi__value">
            {dashboardQuery.data?.data?.warehouse?.total_stock ?? dashboardQuery.data?.data?.warehouse?.total_available_quantity ?? 0}
          </div>
        </Card>
        <Card className="products-kpi products-kpi--amber">
          <div className="products-kpi__header">
            <span className="products-kpi__label">{t('Low Stock Alerts')}</span>
            <span className="products-kpi__icon"><AlertTriangle /></span>
          </div>
          <div className="products-kpi__value">
            {dashboardQuery.data?.data?.warehouse?.low_stock_products ?? dashboardQuery.data?.data?.warehouse?.low_stock_count ?? 0}
          </div>
        </Card>
        <Card className="products-kpi products-kpi--green">
          <div className="products-kpi__header">
            <span className="products-kpi__label">{t('Inbound Requests')}</span>
            <span className="products-kpi__icon"><CheckCircle /></span>
          </div>
          <div className="products-kpi__value">
            {dashboardQuery.data?.data?.warehouse?.total_inbound_requests ?? dashboardQuery.data?.data?.warehouse?.inbound_requests_pending_count ?? 0}
          </div>
        </Card>
      </div>

      {/* Action Toolbar */}
      <ActionToolbar
        className="products-toolbar"
        title={t('Product Workspace')}
        searchComponent={
          <Input
            id="search"
            placeholder={t('Search by product name, SKU, or barcode...')}
            value={filters.search ?? ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        }
        filterComponents={
          <>
            <Button
              variant={stockStatusParam === '' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => {
                setSearchParams({})
                handleFilterChange('status', '')
              }}
            >
              {t('All Products')}
            </Button>
            <Button
              variant={stockStatusParam === 'low_stock' ? 'primary' : 'ghost'}
              size="sm"
              className="text-amber-400 hover:text-amber-300"
              onClick={() => {
                setSearchParams({ stock_status: 'low_stock' })
                handleFilterChange('status', 'active')
              }}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              {t('Low Stock')}
            </Button>
            <Select
              id="status"
              className="w-36"
              value={filters.status ?? ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">{t('All Statuses')}</option>
              <option value="active">{t('Active')}</option>
              <option value="inactive">{t('Inactive')}</option>
            </Select>

            <CanMerchant capability="labels.print">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsBulkPrintOpen(true)}
              >
                {t('Print Bulk Labels')}
              </Button>
            </CanMerchant>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                {t('Clear Filters')}
              </Button>
            )}
          </>
        }
      />

      <Card>
        <CardContent className="p-0">
          {renderContent()}
        </CardContent>
      </Card>

      {printState && (
        <LabelDocumentDialog
          fetchDocument={async () => {
            const res = await getMerchantPortalWarehouseProductLabel(printState.productId)
            return createHtmlLabelDocument({
              html: res.data.html || '',
              fileName: `product-label-${printState.productId}.html`,
              locale: (document.documentElement.lang || 'en') as AppLocale,
              title: t('Product Label')
            })
          }}
          open={true}
          title={t('Product Label')}
          triggerLabel="Print"
          hideTrigger={true}
          onOpenChange={(open) => {
            if (!open) setPrintState(null)
          }}
        />
      )}

      <BulkBarcodeLabelsDialog
        products={data?.data || []}
        open={isBulkPrintOpen}
        onClose={() => setIsBulkPrintOpen(false)}
      />
    </>
  )
}
