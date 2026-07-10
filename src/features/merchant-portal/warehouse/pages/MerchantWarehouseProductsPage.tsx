import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { EmptyState } from '../../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { Button } from '../../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/Card'
import { Input } from '../../../../shared/components/ui/Input'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { Select } from '../../../../shared/components/ui/Select'
import { Table, TableCell, TableContainer, TableHead } from '../../../../shared/components/ui/Table'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'
import { merchantPath } from '../../../../shared/routing/paths'
import { formatDate } from '../../../../shared/utils/formatters'
import { createHtmlLabelDocument } from '../../../../shared/utils/printHtml'
import type { AppLocale } from '../../../../shared/i18n/locale'
import { CanMerchant } from '../../components/CanMerchant'
import {
  listMerchantPortalWarehouseProducts,
  getMerchantPortalWarehouseProductLabel,
} from '../api/merchantPortalWarehouse.api'
import type { MerchantPortalWarehouseProductFilters } from '../types/merchantPortalWarehouse.types'
import { DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '../../../../shared/components/ui/Dropdown'
import { LabelDocumentDialog } from '../../../../shared/components/labels/LabelDocumentDialog'

const initialFilters: MerchantPortalWarehouseProductFilters = {
  search: '',
  status: '',
}

export function MerchantWarehouseProductsPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const searchText = searchParams.get('search') ?? ''

  const [filters, setFilters] = useState<MerchantPortalWarehouseProductFilters>(() => ({
    ...initialFilters,
    search: searchText,
  }))
  const [page, setPage] = useState(1)

  const [printState, setPrintState] = useState<{ productId: number; type: 'label' } | null>(null)

  const params = useMemo(() => ({
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.search ? { search: filters.search } : {}),
  }), [filters])

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['merchant-portal', 'warehouse-products', page, params],
    queryFn: () => listMerchantPortalWarehouseProducts(page, params),
  })

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
          message={getApiErrorMessage(error, t('Failed to load warehouse products.'))}
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
              <TableHead className="text-right">{t('Stock')}</TableHead>
              
              <TableHead>{t('Created At')}</TableHead>
              <TableHead className="text-right" />
            </tr>
          </thead>
          <tbody>
            {data.data.map((product) => (
              <tr key={product.id}>
                <TableCell>
                  <Link
                    className="text-primary hover:underline font-medium"
                    to={merchantPath(`/warehouse/products/${product.id}`)}
                  >
                    {product.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="font-mono text-sm">{product.sku}</div>
                </TableCell>
                <TableCell>
                  <div className="font-mono text-sm">{product.barcode || '-'}</div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {product.inventory_summary?.on_hand_quantity ?? '-'}
                </TableCell>
                
                <TableCell>
                  <StatusBadge value={product.status}>
                    {product.status_label || product.status}
                  </StatusBadge>
                </TableCell>
                <TableCell>{formatDate(product.created_at)}</TableCell>
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
                          {t('Print Label')}
                        </DropdownItem>
                      </CanMerchant>
                    </DropdownContent>
                  </DropdownMenu>
                </TableCell>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>
    )
  }

  return (
    <>
      <PageHeader
        description={t('Review the products stored and managed for your account.')}
        title={t('Warehouse Products')}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('Filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="search">
                {t('Search')}
              </label>
              <Input
                id="search"
                placeholder={t('Search products...')}
                value={filters.search ?? ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="status">
                {t('Status')}
              </label>
              <Select
                id="status"
                value={filters.status ?? ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">{t('All Statuses')}</option>
                <option value="active">{t('Active')}</option>
                <option value="inactive">{t('Inactive')}</option>
              </Select>
            </div>
            <div className="flex items-end lg:col-span-2">
              {hasActiveFilters && (
                <Button variant="ghost" onClick={handleClearFilters}>
                  {t('Clear Filters')}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {renderContent()}
        </CardContent>
      </Card>

      {/* Pagination controls can be added here once usePagination hook is integrated */}

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
          triggerLabel="Print" hideTrigger={true} onOpenChange={(open) => { if (!open) () => setPrintState(null); } }
        />
      )}
    </>
  )
}
