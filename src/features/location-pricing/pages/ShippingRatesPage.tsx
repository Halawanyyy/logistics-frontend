import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { deleteShippingRate, listShippingRates } from '../api/location-pricing.api'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { EmptyState } from '../../../shared/components/feedback/EmptyState'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { formatDate, formatMoney } from '../../../shared/utils/formatters'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Input } from '../../../shared/components/ui/Input'
import { Select } from '../../../shared/components/ui/Select'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { Button } from '../../../shared/components/ui/Button'
import { Dropdown, DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '../../../shared/components/ui/Dropdown'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'

export function ShippingRatesPage() {
  const { t } = useTranslation()
  const [queryText, setQueryText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['shipping-rates'],
    queryFn: listShippingRates,
  })
  const deleteMutation = useMutation({
    mutationFn: deleteShippingRate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shipping-rates'] }),
  })

  if (query.isLoading) {
    return <LoadingState />
  }

  if (query.isError) {
    return <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
  }

  if (!query.data) {
    return (
      <ErrorState
        message={t('Shipping rates response is empty.', { defaultValue: 'Shipping rates response is empty.' })}
        onRetry={() => void query.refetch()}
      />
    )
  }

  if (!query.data.data.length) {
    return (
      <section className="page-section">
        <PageHeader title={t('Shipping Rates')} description={t('Location pricing returned by the API.', { defaultValue: 'Location pricing returned by the API.' })} actions={<div className="page-header__button-row"><Link className="ui-link-reset" to="/admin/shipping-rates/calculator"><Button variant="secondary">{t('Calculator', { defaultValue: 'Calculator' })}</Button></Link><Can permission={PERMISSIONS.SHIPPING_RATES_CREATE}><Link className="ui-link-reset" to="/admin/shipping-rates/create"><Button>{t('Create Rate', { defaultValue: 'Create Rate' })}</Button></Link></Can></div>} />
        <EmptyState title={t('No shipping rates found', { defaultValue: 'No shipping rates found' })} description={t('The API returned an empty shipping rates list.', { defaultValue: 'The API returned an empty shipping rates list.' })} />
      </section>
    )
  }

  const shippingRates = query.data.data.filter((rate) => {
    const matchesSearch =
      !queryText ||
      [rate.governorate_name, rate.area_name ?? '', rate.delivery_fee, rate.swap_fee, rate.return_fee].join(' ').toLowerCase().includes(queryText.toLowerCase())
    const statusValue = rate.is_active ? 'active' : 'inactive'
    const matchesStatus = statusFilter === 'all' || statusValue === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <section className="page-section">
      <PageHeader
        title={t('Shipping Rates')}
        description={t('Governorate-level and area-level shipping fees from `/api/shipping-rates`.', { defaultValue: 'Governorate-level and area-level shipping fees from `/api/shipping-rates`.' })}
        actions={<div className="page-header__button-row"><Link className="ui-link-reset" to="/admin/shipping-rates/calculator"><Button variant="secondary">{t('Calculator', { defaultValue: 'Calculator' })}</Button></Link><Can permission={PERMISSIONS.SHIPPING_RATES_CREATE}><Link className="ui-link-reset" to="/admin/shipping-rates/create"><Button>{t('Create Rate', { defaultValue: 'Create Rate' })}</Button></Link></Can></div>}
      />
      <Card className="table-card">
        <CardHeader className="table-card__header">
          <CardTitle>{t('Shipping Rate Matrix', { defaultValue: 'Shipping Rate Matrix' })}</CardTitle>
          <CardDescription>{t('Real pricing rows for governorate-wide and area-specific fees.', { defaultValue: 'Real pricing rows for governorate-wide and area-specific fees.' })}</CardDescription>
        </CardHeader>
        <CardContent>
          {deleteMutation.error ? <div className="form-error">{getApiErrorMessage(deleteMutation.error)}</div> : null}
          <div className="filters-bar">
            <Input placeholder={t('Search rates', { defaultValue: 'Search rates' })} value={queryText} onChange={(event) => setQueryText(event.target.value)} />
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">{t('All statuses', { defaultValue: 'All statuses' })}</option>
              <option value="active">{t('Active')}</option>
              <option value="inactive">{t('Inactive')}</option>
            </Select>
          </div>
        <TableContainer>
        <Table variant="compact">
          <thead>
            <tr>
              <TableHead>{t('Governorate')}</TableHead>
              <TableHead>{t('Area')}</TableHead>
              <TableHead>{t('Delivery Fee')}</TableHead>
              <TableHead>{t('Swap Fee')}</TableHead>
              <TableHead>{t('Return Fee')}</TableHead>
              <TableHead>{t('Status')}</TableHead>
              <TableHead>{t('Created At')}</TableHead>
              <TableHead>{t('Actions')}</TableHead>
            </tr>
          </thead>
          <tbody>
            {shippingRates.map((rate) => (
              <tr key={rate.id}>
                <TableCell>
                  <Link className="table-link" to={`/admin/shipping-rates/${rate.id}`}>
                    {rate.governorate_name}
                  </Link>
                </TableCell>
                <TableCell>{rate.area_name ?? t('All governorate areas', { defaultValue: 'All governorate areas' })}</TableCell>
                <TableCell>{formatMoney(rate.delivery_fee)}</TableCell>
                <TableCell>{formatMoney(rate.swap_fee)}</TableCell>
                <TableCell>{formatMoney(rate.return_fee)}</TableCell>
                <TableCell>
                  <StatusBadge value={rate.is_active} />
                </TableCell>
                <TableCell>{formatDate(rate.created_at)}</TableCell>
                <TableCell>
                  <Dropdown>
                    <DropdownMenu>
                      <DropdownTrigger>...</DropdownTrigger>
                      <DropdownContent>
                        <Can permission={PERMISSIONS.SHIPPING_RATES_UPDATE}>
                          <DropdownItem><Link className="table-link" to={`/admin/shipping-rates/${rate.id}/edit`}>{t('Edit')}</Link></DropdownItem>
                        </Can>
                        <Can permission={PERMISSIONS.SHIPPING_RATES_DELETE}>
                          <DropdownItem destructive onClick={() => {
                            if (window.confirm(t('Delete this shipping rate?', { defaultValue: 'Delete this shipping rate?' }))) {
                              deleteMutation.mutate(rate.id)
                            }
                          }}>{t('Delete')}</DropdownItem>
                        </Can>
                      </DropdownContent>
                    </DropdownMenu>
                  </Dropdown>
                </TableCell>
              </tr>
            ))}
          </tbody>
        </Table>
        </TableContainer>
        </CardContent>
      </Card>
    </section>
  )
}
