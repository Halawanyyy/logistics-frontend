import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { EmptyState } from '../../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { Button } from '../../../../shared/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/Card'
import { DateRangeFilter } from '../../../../shared/components/filters/DateRangeFilter'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { Select } from '../../../../shared/components/ui/Select'
import { Table, TableCell, TableContainer, TableHead } from '../../../../shared/components/ui/Table'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'
import { merchantPath } from '../../../../shared/routing/paths'
import { formatDate } from '../../../../shared/utils/formatters'
import { CanMerchant } from '../../components/CanMerchant'
import { listMerchantPortalInboundRequests } from '../api/merchantPortalWarehouse.api'
import type { MerchantPortalInboundStockRequestFilters } from '../types/merchantPortalWarehouse.types'
import { DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '../../../../shared/components/ui/Dropdown'

const initialFilters: MerchantPortalInboundStockRequestFilters = {
  status: '',
  date_from: '',
  date_to: '',
}

export function MerchantInboundRequestsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [filters, setFilters] = useState<MerchantPortalInboundStockRequestFilters>(initialFilters)
  const [page, setPage] = useState(1)

  const params = useMemo(() => ({
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.date_from ? { date_from: filters.date_from } : {}),
    ...(filters.date_to ? { date_to: filters.date_to } : {}),
  }), [filters])

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['merchant-portal', 'inbound-requests', page, params],
    queryFn: () => listMerchantPortalInboundRequests(page, params),
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
      return <LoadingState title={t('Loading inbound requests...')} />
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
            description={t('No inbound requests match your current filters.')}
            title={t('No results found')}
          />
        )
      }

      return (
        <EmptyState
          actionLabel={t('Create Request')}
            onAction={() => navigate(merchantPath('/warehouse/inbound-requests/create'))}
          description={t('You haven\'t created any inbound stock requests yet.')}
          title={t('No inbound requests')}
        />
      )
    }

    return (
      <TableContainer>
        <Table>
          <thead>
            <tr>
              <TableHead>{t('Request Number')}</TableHead>
              <TableHead>{t('Status')}</TableHead>
              <TableHead>{t('Warehouse')}</TableHead>
              <TableHead className="text-right">{t('Total Items')}</TableHead>
              <TableHead className="text-right">{t('Expected Arrival')}</TableHead>
              <TableHead>{t('Submitted At')}</TableHead>
              <TableHead className="text-right" />
            </tr>
          </thead>
          <tbody>
            {data.data.map((request) => (
              <tr key={request.id}>
                <TableCell>
                  <Link
                    className="text-primary hover:underline font-medium"
                    to={merchantPath(`/warehouse/inbound-requests/${request.id}`)}
                  >
                    {request.request_number}
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge value={request.status}>
                    {request.status_label || request.status}
                  </StatusBadge>
                </TableCell>
                <TableCell>{request.warehouse_summary?.name || '-'}</TableCell>
                <TableCell className="text-right">{request.total_requested_quantity}</TableCell>
                <TableCell className="text-right">{formatDate(request.expected_arrival_date)}</TableCell>
                <TableCell>{formatDate(request.submitted_at || request.created_at)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownTrigger>
                      <Button size="sm" variant="ghost">
                        {t('Actions')}
                      </Button>
                    </DropdownTrigger>
                    <DropdownContent>
                      <DropdownItem>
                        <Link to={merchantPath(`/warehouse/inbound-requests/${request.id}`)}>
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
        actions={
          <CanMerchant capability="warehouse.inbound_requests.create">
            <Button onClick={() => navigate(merchantPath('/warehouse/inbound-requests/create'))}>
              <Plus className="mr-2 h-4 w-4" />
              {t('Create Inbound Request')}
            </Button>
          </CanMerchant>
        }
        description={t('Manage your requests to send new inventory into the warehouse.')}
        title={t('Inbound Requests')}
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
              <label className="text-sm font-medium" htmlFor="status">
                {t('Status')}
              </label>
              <Select
                id="status"
                value={filters.status ?? ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">{t('All Statuses')}</option>
                <option value="draft">{t('Draft')}</option>
                <option value="submitted">{t('Submitted')}</option>
                <option value="processing">{t('Processing')}</option>
                <option value="received">{t('Received')}</option>
                <option value="cancelled">{t('Cancelled')}</option>
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
