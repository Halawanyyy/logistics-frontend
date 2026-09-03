import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { Landmark } from 'lucide-react'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { EmptyState } from '../../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/Card'
import { Input } from '../../../../shared/components/ui/Input'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { Select } from '../../../../shared/components/ui/Select'
import { Table, TableCell, TableContainer, TableHead } from '../../../../shared/components/ui/Table'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'
import { Button } from '../../../../shared/components/ui/Button'
import { merchantPath } from '../../../../shared/routing/paths'
import { formatDate } from '../../../../shared/utils/formatters'
import { listMerchantPortalPayouts } from '../api/merchantPortalFinance.api'
import type { MerchantPayoutFilters } from '../types/merchantPortalFinance.types'
import { MoneyDisplay } from '../../../../shared/components/display/MoneyDisplay'
import { CanMerchant } from '../../components/CanMerchant'

const initialFilters: MerchantPayoutFilters = {
  search: '',
  payout_number: '',
  status: '',
  date_from: '',
  date_to: '',
}

export function MerchantPayoutsPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const searchText = searchParams.get('search') ?? ''

  const [filters, setFilters] = useState<MerchantPayoutFilters>(() => ({
    ...initialFilters,
    search: searchText,
  }))
  const [page, setPage] = useState(1)

  const params = useMemo(() => ({
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.payout_number ? { payout_number: filters.payout_number } : {}),
    ...(filters.date_from ? { date_from: filters.date_from } : {}),
    ...(filters.date_to ? { date_to: filters.date_to } : {}),
    ...(filters.search ? { search: filters.search } : {}),
  }), [filters])

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['merchant-portal', 'payouts', page, params],
    queryFn: () => listMerchantPortalPayouts(page, params),
  })

  function handleClearFilters() {
    setFilters({ ...initialFilters })
    setPage(1)
  }

  const hasActiveFilters = Object.values(filters).some((value) => Boolean(value))

  function renderContent() {
    if (isLoading) {
      return <LoadingState title={t('Loading payouts...')} />
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
            description={t('No payouts match your current filters.')}
            title={t('No results found')}
            actionLabel={t('Clear filters')}
            onAction={handleClearFilters}
          />
        )
      }

      return (
        <EmptyState
          description={t('You have no payouts.')}
          title={t('No payouts')}
        />
      )
    }

    return (
      <TableContainer>
        <Table>
          <thead>
            <tr>
              <TableHead>{t('Payout Number')}</TableHead>
              <TableHead>{t('Reference')}</TableHead>
              <TableHead>{t('Requested At')}</TableHead>
              <TableHead className="text-right">{t('Amount')}</TableHead>
              <TableHead>{t('Status')}</TableHead>
              <TableHead className="text-right">{t('Actions')}</TableHead>
            </tr>
          </thead>
          <tbody>
            {data.data.map((payout) => (
              <tr key={payout.id}>
                <TableCell className="whitespace-nowrap font-medium">{payout.payout_number}</TableCell>
                <TableCell>{payout.reference || '-'}</TableCell>
                <TableCell>{formatDate(payout.requested_at)}</TableCell>
                <TableCell className="text-right font-medium">
                  <MoneyDisplay value={payout.amount} currency={payout.currency} />
                </TableCell>
                <TableCell>
                  <StatusBadge value={payout.status} />
                </TableCell>
                <TableCell className="text-right">
                  <CanMerchant capability="payouts.view">
                    <Button variant="secondary" size="sm">
                      <Link to={merchantPath(`/finance/payouts/${payout.id}`)}>
                        {t('View')}
                      </Link>
                    </Button>
                  </CanMerchant>
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
        description={t('View and track your payouts.')}
        title={t('Payouts')}
        actions={
          <CanMerchant capability="payouts.request">
            <Button>
              <Link to={merchantPath('/finance/payouts/request')}>
                <Landmark className="mr-2 h-4 w-4" />
                {t('Request Payout')}
              </Link>
            </Button>
          </CanMerchant>
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">{t('Filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="form-group">
              <label className="form-label" htmlFor="search">
                {t('Search')}
              </label>
              <Input
                id="search"
                placeholder={t('Search reference...')}
                value={filters.search}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                  setPage(1)
                }}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="payout_number">
                {t('Payout Number')}
              </label>
              <Input
                id="payout_number"
                placeholder={t('PAY-0001')}
                value={filters.payout_number}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, payout_number: e.target.value }))
                  setPage(1)
                }}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="status">
                {t('Status')}
              </label>
              <Select
                id="status"
                value={filters.status}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                  setPage(1)
                }}
              >
                <option value="">{t('All Statuses')}</option>
                <option value="pending">{t('Pending')}</option>
                <option value="processing">{t('Processing')}</option>
                <option value="paid">{t('Paid')}</option>
                <option value="failed">{t('Failed')}</option>
                <option value="cancelled">{t('Cancelled')}</option>
              </Select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="date_from">
                {t('Date From')}
              </label>
              <Input
                id="date_from"
                type="date"
                value={filters.date_from}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, date_from: e.target.value }))
                  setPage(1)
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {renderContent()}
    </>
  )
}
