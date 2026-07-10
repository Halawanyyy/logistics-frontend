import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { MoneyDisplay } from '../../../../shared/components/display/MoneyDisplay'
import { EmptyState } from '../../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { Button } from '../../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/Card'
import { DateRangeFilter } from '../../../../shared/components/filters/DateRangeFilter'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { Table, TableCell, TableContainer, TableHead } from '../../../../shared/components/ui/Table'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'
import { Select } from '../../../../shared/components/ui/Select'
import { merchantPath } from '../../../../shared/routing/paths'
import { formatDate } from '../../../../shared/utils/formatters'
import { listMerchantPortalWarehouseCharges } from '../api/merchantPortalWarehouse.api'
import type { MerchantPortalWarehouseChargeFilters } from '../types/merchantPortalWarehouse.types'

const initialFilters: MerchantPortalWarehouseChargeFilters = {
  date_from: '',
  date_to: '',
  type: '',
}

export function MerchantWarehouseChargesPage() {
  const { t } = useTranslation()

  const [filters, setFilters] = useState<MerchantPortalWarehouseChargeFilters>(initialFilters)
  const [page, setPage] = useState(1)

  const params = useMemo(() => ({
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.date_from ? { date_from: filters.date_from } : {}),
    ...(filters.date_to ? { date_to: filters.date_to } : {}),
  }), [filters])

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['merchant-portal', 'warehouse-charges', page, params],
    queryFn: () => listMerchantPortalWarehouseCharges(page, params),
  })

    function handleClearFilters() {
    setFilters({ ...initialFilters })
    setPage(1)
  }

  const hasActiveFilters = Object.values(filters).some((value) => Boolean(value))

  function renderContent() {
    if (isLoading) {
      return <LoadingState title={t('Loading warehouse charges...')} />
    }

    if (isError) {
      return (
        <ErrorState
          message={getApiErrorMessage(error, t('Failed to load warehouse charges.'))}
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
            description={t('No charges match your current filters.')}
            title={t('No results found')}
          />
        )
      }

      return (
        <EmptyState
          description={t('You have no warehouse charges logged.')}
          title={t('No warehouse charges')}
        />
      )
    }

    return (
      <TableContainer>
        <Table>
          <thead>
            <tr>
              <TableHead>{t('Date')}</TableHead>
              <TableHead>{t('Charge Type')}</TableHead>
              <TableHead className="text-right">{t('Amount')}</TableHead>
              <TableHead>{t('Status')}</TableHead>
              <TableHead>{t('Related Item')}</TableHead>
              <TableHead>{t('Description')}</TableHead>
            </tr>
          </thead>
          <tbody>
            {data.data.map((charge) => (
              <tr key={charge.id}>
                <TableCell>{formatDate(charge.charge_date || charge.created_at)}</TableCell>
                <TableCell>
                  <span className="font-medium text-foreground">{charge.charge_type}</span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold text-foreground">
                    {charge.amount}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge value={charge.status} />
                </TableCell>
                <TableCell>
                  {charge.related_order?.order_number && (
                    <Link
                      className="text-primary hover:underline block"
                      to={merchantPath(`/orders/${charge.related_order.id}`)}
                    >
                      {charge.related_order.order_number}
                    </Link>
                  )}
                  {charge.related_product?.name && (
                    <Link
                      className="text-primary hover:underline block mt-1"
                      to={merchantPath(`/warehouse/products/${charge.related_product.id}`)}
                    >
                      {charge.related_product.name}
                    </Link>
                  )}
                  {!charge.related_order?.order_number && !charge.related_product?.name && (
                    <span className="text-muted text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted">{charge.description || '-'}</span>
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
        description={t('View and track your storage and fulfillment fees.')}
        title={t('Warehouse Charges')}
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
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="type">
                {t('Charge Type')}
              </label>
              <Select
                id="type"
                value={filters.type ?? ''}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="">{t('All Types')}</option>
                <option value="storage">{t('Storage')}</option>
                <option value="fulfillment">{t('Fulfillment')}</option>
                <option value="inbound">{t('Inbound Processing')}</option>
              </Select>
            </div>
            <div className="flex items-end">
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
