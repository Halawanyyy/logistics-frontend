import { useQueries, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { getDriver, getDriverCashExpected, getDriverManifest, listDriverShipments } from '../api/drivers.api'
import { getApiErrorMessage, isApiNotFound } from '../../../shared/api/api-error'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { Input } from '../../../shared/components/ui/Input'
import { Select } from '../../../shared/components/ui/Select'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { formatDate } from '../../../shared/utils/formatters'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { NotFoundState } from '../../../shared/components/states/NotFoundState'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'

export function DriverDetailsPage() {
  const { t } = useTranslation()
  const { driverId } = useParams()
  const [manifestFilters, setManifestFilters] = useState({ status: '', date: '' })
  const manifestParams = useMemo(
    () => ({
      ...(manifestFilters.status ? { status: manifestFilters.status } : {}),
      ...(manifestFilters.date ? { date: manifestFilters.date } : {}),
    }),
    [manifestFilters],
  )
  const driverQuery = useQuery({
    queryKey: ['drivers', driverId],
    queryFn: () => getDriver(driverId!),
    enabled: Boolean(driverId),
  })
  const [shipmentsQuery, manifestQuery, cashQuery] = useQueries({
    queries: [
      { queryKey: ['drivers', driverId, 'shipments'], queryFn: () => listDriverShipments(driverId!), enabled: Boolean(driverId) },
      { queryKey: ['drivers', driverId, 'manifest', manifestParams], queryFn: () => getDriverManifest(driverId!, manifestParams), enabled: Boolean(driverId) },
      { queryKey: ['drivers', driverId, 'cash-expected'], queryFn: () => getDriverCashExpected(driverId!), enabled: Boolean(driverId) },
    ],
  })

  if (driverQuery.isLoading) {
    return <LoadingState title={t('Loading driver', { defaultValue: 'Loading driver' })} />
  }

  if (driverQuery.isError && isApiNotFound(driverQuery.error)) {
    return (
      <NotFoundState
        title={t('Driver not found', { defaultValue: 'Driver not found' })}
        description={t('This driver record could not be found in the drivers API.', { defaultValue: 'This driver record could not be found in the drivers API.' })}
      />
    )
  }

  if (driverQuery.isError || !driverQuery.data) {
    return <ErrorState message={getApiErrorMessage(driverQuery.error)} onRetry={() => void driverQuery.refetch()} />
  }

  const driver = driverQuery.data.data

  return (
    <section className="page-section">
      <PageHeader
        title={driver.name}
        description={`${driver.vehicle_type} ${driver.vehicle_plate}`}
        actions={<div className="page-header__button-row"><Can permission={PERMISSIONS.DRIVERS_UPDATE}><Link className="ui-link-reset" to={`/drivers/${driver.id}/edit`}><Button variant="secondary">{t('Edit')}</Button></Link></Can><Link className="ui-link-reset" to="/drivers"><Button variant="secondary">{t('Back')}</Button></Link></div>}
      />
      <div className="details-grid">
        <Card>
          <CardHeader><CardTitle>{t('Overview')}</CardTitle></CardHeader>
          <CardContent>
            <dl className="detail-list">
              <div><dt>{t('Phone')}</dt><dd>{driver.phone}</dd></div>
              <div><dt>{t('National ID', { defaultValue: 'National ID' })}</dt><dd>{driver.national_id}</dd></div>
              <div><dt>{t('Status')}</dt><dd><StatusBadge value={driver.status} /></dd></div>
              <div><dt>{t('Created')}</dt><dd>{formatDate(driver.created_at)}</dd></div>
            </dl>
          </CardContent>
        </Card>
        <Card className="stat-card" data-accent="drivers">
          <CardHeader><CardTitle>{t('Expected Cash', { defaultValue: 'Expected Cash' })}</CardTitle></CardHeader>
          <CardContent>
            {cashQuery.isLoading ? <LoadingState title={t('Loading expected cash', { defaultValue: 'Loading expected cash' })} /> : null}
            {cashQuery.isError ? <ErrorState message={getApiErrorMessage(cashQuery.error)} /> : null}
            {cashQuery.data ? <strong className="stat-card__value"><MoneyDisplay value={cashQuery.data.data.expected_amount} /></strong> : null}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>{t('Assigned Shipments', { defaultValue: 'Assigned Shipments' })}</CardTitle><CardDescription>{t('Shipments currently assigned to this driver.', { defaultValue: 'Shipments currently assigned to this driver.' })}</CardDescription></CardHeader>
        <CardContent>
          <TableContainer><Table variant="compact"><thead><tr><TableHead>{t('Shipment')}</TableHead><TableHead>{t('Customer')}</TableHead><TableHead>{t('Status')}</TableHead><TableHead>{t('COD')}</TableHead></tr></thead><tbody>
            {(shipmentsQuery.data?.data ?? []).map((shipment) => (
              <tr key={shipment.id}><TableCell><Link className="table-link" to={`/shipments/${shipment.id}`}>{shipment.shipment_number}</Link></TableCell><TableCell>{shipment.customer_name}</TableCell><TableCell><StatusBadge value={shipment.status} /></TableCell><TableCell><MoneyDisplay value={shipment.cod_amount} /></TableCell></tr>
            ))}
          </tbody></Table></TableContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t('Manifest', { defaultValue: 'Manifest' })}</CardTitle><CardDescription>{t('Printable manifest data from the API.', { defaultValue: 'Printable manifest data from the API.' })}</CardDescription></CardHeader>
        <CardContent>
          <div className="api-filter-bar">
            <label className="field">
              <span>{t('Status')}</span>
              <Select
                value={manifestFilters.status}
                onChange={(event) => setManifestFilters((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="">{t('All')}</option>
                <option value="pending_pickup">pending_pickup</option>
                <option value="picked_up">picked_up</option>
                <option value="in_transit">in_transit</option>
                <option value="delivered">delivered</option>
                <option value="failed">failed</option>
                <option value="returned">returned</option>
              </Select>
            </label>
            <label className="field">
              <span>{t('Date', { defaultValue: 'Date' })}</span>
              <Input
                type="date"
                value={manifestFilters.date}
                onChange={(event) => setManifestFilters((current) => ({ ...current, date: event.target.value }))}
              />
            </label>
            <div className="api-filter-bar__actions">
              <Button type="button" variant="secondary" onClick={() => setManifestFilters({ status: '', date: '' })}>
                {t('Reset')}
              </Button>
            </div>
          </div>
          {manifestQuery.isLoading ? <LoadingState title={t('Loading manifest', { defaultValue: 'Loading manifest' })} /> : null}
          {manifestQuery.isError ? <ErrorState message={getApiErrorMessage(manifestQuery.error)} onRetry={() => void manifestQuery.refetch()} /> : null}
          {manifestQuery.data ? (
            <div className="insight-grid">
              <div className="insight-tile"><span className="eyebrow">{t('Shipments')}</span><strong>{manifestQuery.data.data.summary.total_shipments}</strong></div>
              <div className="insight-tile"><span className="eyebrow">{t('COD Shipments', { defaultValue: 'COD Shipments' })}</span><strong>{manifestQuery.data.data.summary.total_cod_shipments}</strong></div>
              <div className="insight-tile"><span className="eyebrow">{t('Total COD', { defaultValue: 'Total COD' })}</span><strong><MoneyDisplay value={manifestQuery.data.data.summary.total_cod_amount} /></strong></div>
              <div className="insight-tile"><span className="eyebrow">{t('Shipping Fees')}</span><strong><MoneyDisplay value={manifestQuery.data.data.summary.total_shipping_fee} /></strong></div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}
