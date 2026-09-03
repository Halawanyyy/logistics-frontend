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
import { Table, TableCell, TableContainer, TableHead } from '../../../../shared/components/ui/Table'
import { merchantPath } from '../../../../shared/routing/paths'
import { formatDate } from '../../../../shared/utils/formatters'
import {
  listMerchantPortalLowStock,
} from '../api/merchantPortalWarehouse.api'
import type { MerchantPortalInventoryStockFilters } from '../types/merchantPortalWarehouse.types'
import { DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '../../../../shared/components/ui/Dropdown'
import { Badge } from '../../../../shared/components/ui/Badge'

const initialFilters: MerchantPortalInventoryStockFilters = {
  search: '',
  warehouse_id: '',
}

export function MerchantLowStockPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const searchText = searchParams.get('search') ?? ''

  const [filters, setFilters] = useState<MerchantPortalInventoryStockFilters>(() => ({
    ...initialFilters,
    search: searchText,
  }))
  const [page, setPage] = useState(1)

  const params = useMemo(() => ({
    ...(filters.warehouse_id ? { warehouse_id: filters.warehouse_id } : {}),
    ...(filters.search ? { search: filters.search } : {}),
  }), [filters])

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['merchant-portal', 'inventory-low-stock', page, params],
    queryFn: () => listMerchantPortalLowStock(page, params),
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
      return <LoadingState title={t('Loading low stock items...')} />
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
            actionLabel={t('Clear filters')}
            onAction={handleClearFilters}
            description={t('No items match your current filters.')}
            title={t('No results found')}
          />
        )
      }

      return (
        <EmptyState
          description={t('All your inventory stocks are at healthy levels.')}
          title={t('No low stock items')}
        />
      )
    }

    return (
      <TableContainer>
        <Table>
          <thead>
            <tr>
              <TableHead>{t('Product')}</TableHead>
              <TableHead>{t('SKU')}</TableHead>
              <TableHead>{t('Warehouse')}</TableHead>
              <TableHead className="text-right">{t('Available')}</TableHead>
              <TableHead>{t('Status')}</TableHead>
              <TableHead>{t('Last Updated')}</TableHead>
              <TableHead className="text-right" />
            </tr>
          </thead>
          <tbody>
            {data.data.map((stock) => (
              <tr key={stock.id}>
                <TableCell>
                  {stock.product_summary?.id ? (
                    <Link
                      className="text-primary hover:underline font-medium"
                      to={merchantPath(`/warehouse/products/${stock.product_summary.id}`)}
                    >
                      {stock.product_summary.name || '-'}
                    </Link>
                  ) : (
                    <span className="font-medium">{stock.product_summary?.name || '-'}</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-mono text-sm">{stock.product_summary?.sku || '-'}</div>
                </TableCell>
                <TableCell>{stock.warehouse_summary?.name || '-'}</TableCell>
                <TableCell className="text-right font-semibold text-destructive">
                  {stock.available_quantity}
                </TableCell>
                <TableCell>
                  <Badge variant="danger">{t('Low Stock')}</Badge>
                </TableCell>
                <TableCell>{formatDate(stock.updated_at)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownTrigger>
                      <Button size="sm" variant="ghost">
                        {t('Actions')}
                      </Button>
                    </DropdownTrigger>
                    <DropdownContent>
                      <DropdownItem>
                        <Link to={merchantPath(`/warehouse/inventory/${stock.id}`)}>
                          {t('View Details')}
                        </Link>
                      </DropdownItem>
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
        description={t('Review items that have fallen below their minimum required stock quantity.')}
        title={t('Low Stock')}
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
                placeholder={t('Search products or SKUs...')}
                value={filters.search ?? ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            {/* Can add warehouse select here if merchant has multiple warehouses */}
            <div className="flex items-end lg:col-span-3">
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
    </>
  )
}
