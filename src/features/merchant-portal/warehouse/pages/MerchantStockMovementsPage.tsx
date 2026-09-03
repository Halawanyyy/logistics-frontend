import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { EmptyState } from '../../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { Button } from '../../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/Card'
import { DateRangeFilter } from '../../../../shared/components/filters/DateRangeFilter'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { Table, TableCell, TableContainer, TableHead } from '../../../../shared/components/ui/Table'
import { merchantPath } from '../../../../shared/routing/paths'
import { formatDate } from '../../../../shared/utils/formatters'
import { listMerchantPortalStockMovements } from '../api/merchantPortalWarehouse.api'
import type { MerchantPortalStockMovementFilters } from '../types/merchantPortalWarehouse.types'
import { Badge } from '../../../../shared/components/ui/Badge'

const initialFilters: MerchantPortalStockMovementFilters = {
  date_from: '',
  date_to: '',
  warehouse_product_id: '',
}

export function MerchantStockMovementsPage() {
  const { t } = useTranslation()

  const [filters, setFilters] = useState<MerchantPortalStockMovementFilters>(initialFilters)
  const [page, setPage] = useState(1)

  const params = useMemo(() => ({
    ...(filters.warehouse_product_id ? { warehouse_product_id: filters.warehouse_product_id } : {}),
    ...(filters.date_from ? { date_from: filters.date_from } : {}),
    ...(filters.date_to ? { date_to: filters.date_to } : {}),
  }), [filters])

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['merchant-portal', 'stock-movements', page, params],
    queryFn: () => listMerchantPortalStockMovements(page, params),
  })

    function handleClearFilters() {
    setFilters({ ...initialFilters })
    setPage(1)
  }

  const hasActiveFilters = Object.values(filters).some((value) => Boolean(value))

  function renderContent() {
    if (isLoading) {
      return <LoadingState title={t('Loading stock movements...')} />
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
            description={t('No stock movements match your current filters.')}
            title={t('No results found')}
          />
        )
      }

      return (
        <EmptyState
          description={t('No stock movements have been recorded yet.')}
          title={t('No stock movements')}
        />
      )
    }

    return (
      <TableContainer>
        <Table>
          <thead>
            <tr>
              <TableHead>{t('Date')}</TableHead>
              <TableHead>{t('Type')}</TableHead>
              <TableHead>{t('Product')}</TableHead>
              <TableHead className="text-right">{t('Quantity')}</TableHead>
              <TableHead>{t('Reference')}</TableHead>
              <TableHead>{t('Notes')}</TableHead>
            </tr>
          </thead>
          <tbody>
            {data.data.map((movement) => {
              const isPositive = movement.quantity > 0
              return (
                <tr key={movement.id}>
                  <TableCell>{formatDate(movement.created_at)}</TableCell>
                  <TableCell>
                    <Badge variant="neutral">
                      {movement.movement_type_label || movement.movement_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {movement.product_summary?.id ? (
                      <Link
                        className="text-primary hover:underline font-medium"
                        to={merchantPath(`/warehouse/products/${movement.product_summary.id}`)}
                      >
                        {movement.product_summary.name || '-'}
                      </Link>
                    ) : (
                      <span className="font-medium">{movement.product_summary?.name || '-'}</span>
                    )}
                    <div className="font-mono text-xs text-muted">{movement.product_summary?.sku}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`inline-flex items-center font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
                      {isPositive ? <ArrowDownLeft className="mr-1 h-3 w-3" /> : <ArrowUpRight className="mr-1 h-3 w-3" />}
                      {Math.abs(movement.quantity)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {movement.reference_summary?.order_number && (
                      <Link
                        className="text-primary hover:underline"
                        to={merchantPath(`/orders/${movement.reference_summary.order_id}`)}
                      >
                        {movement.reference_summary.order_number}
                      </Link>
                    )}
                    {!movement.reference_summary?.order_number && movement.reference_summary?.shipment_number && (
                      <Link
                        className="text-primary hover:underline"
                        to={merchantPath(`/shipments/${movement.reference_summary.shipment_id}`)}
                      >
                        {movement.reference_summary.shipment_number}
                      </Link>
                    )}
                    {!movement.reference_summary?.order_number && !movement.reference_summary?.shipment_number && (
                      <span className="text-muted text-sm">
                        {movement.reference_summary?.reference_type ? `${movement.reference_summary.reference_type} #${movement.reference_summary.reference_id}` : '-'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted">{movement.notes || '-'}</span>
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
        description={t('View the historical log of all inventory changes for your products.')}
        title={t('Stock Movements')}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('Filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <DateRangeFilter
              dateFrom={filters.date_from ?? ''}
              dateTo={filters.date_to ?? ''}
              onChange={(range) => {
                const from = range?.date_from || "";
                const to = range?.date_to || "";
                setFilters((current) => ({
                  ...current,
                  date_from: from,
                  date_to: to,
                }))
                setPage(1)
              }}
            />
            {/* Can add product select here if desired */}
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
    </>
  )
}
