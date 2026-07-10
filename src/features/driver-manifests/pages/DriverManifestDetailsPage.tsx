import { useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { closeDriverManifest, getDriverManifest } from '../api/driver-manifests.api'
import type { DriverManifest } from '../types/driver-manifest.types'
import { getApiErrorMessage, isApiNotFound } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { Attachments } from '../../../shared/components/attachments/Attachments'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { NotFoundState } from '../../../shared/components/states/NotFoundState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Dialog } from '../../../shared/components/ui/Dialog'
import { Input } from '../../../shared/components/ui/Input'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { useFormApiErrors } from '../../../shared/hooks/useFormApiErrors'
import { adminPath } from '../../../shared/routing/paths'
import { formatDate } from '../../../shared/utils/formatters'
import { DriverManifestPrintDialog } from '../components/DriverManifestPrintDialog'
type CloseManifestFormValues = {
  actual_received_amount: number
  notes: string
}

function CloseManifestDialog({
  error,
  isSubmitting,
  manifest,
  onClose,
  onSubmit,
  open,
}: {
  error?: unknown
  isSubmitting: boolean
  manifest: DriverManifest
  onClose: () => void
  onSubmit: (values: CloseManifestFormValues) => void
  open: boolean
}) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CloseManifestFormValues>({
    defaultValues: {
      actual_received_amount: Number(manifest.summary.actual_received_amount ?? manifest.summary.expected_cod_amount ?? 0),
      notes: manifest.notes ?? '',
    },
  })
  const { formError, getFieldError } = useFormApiErrors(error)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={<CardTitle>{t('Close Manifest', { defaultValue: 'Close Manifest' })}</CardTitle>}
      variant="small"
    >
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>{t('Actual Received Amount', { defaultValue: 'Actual Received Amount' })}</span>
          <Input
            type="number"
            step="0.01"
            {...register('actual_received_amount', {
              valueAsNumber: true,
              required: 'Actual received amount is required.',
            })}
          />
          <FieldError error={errors.actual_received_amount?.message ?? getFieldError('actual_received_amount')} />
        </label>
        <label className="field">
          <span>{t('Notes')}</span>
          <Input {...register('notes')} />
          <FieldError error={errors.notes?.message ?? getFieldError('notes')} />
        </label>
        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {t('Close Manifest', { defaultValue: 'Close Manifest' })}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function DriverManifestDetailsPage() {
  const { t } = useTranslation()
  const { manifestId } = useParams()
  const queryClient = useQueryClient()
  const [closeOpen, setCloseOpen] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const query = useQuery({
    queryKey: ['driver-manifests', manifestId],
    queryFn: () => getDriverManifest(manifestId!)
  })
  const closeMutation = useMutation({
    mutationFn: (values: CloseManifestFormValues) => closeDriverManifest(manifestId!, {
      actual_received_amount: values.actual_received_amount,
      notes: values.notes || undefined,
    }),
    onSuccess: async () => {
      setCloseOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['driver-manifests'] })
      await query.refetch()
    },
  })

  if (query.isLoading) {
    return <LoadingState title={t('Loading driver manifest', { defaultValue: 'Loading driver manifest' })} />
  }

  if (query.isError && isApiNotFound(query.error)) {
    return (
      <NotFoundState
        title={t('Driver manifest not found', { defaultValue: 'Driver manifest not found' })}
        description={t('This driver manifest could not be found in the manifests API.', {
          defaultValue: 'This driver manifest could not be found in the manifests API.',
        })}
      />
    )
  }

  if (query.isError || !query.data) {
    return <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
  }

  const manifest = query.data.data

  return (
    <section className="page-section">
      <PageHeader
        title={manifest.manifest_number}
        description={t('Daily manifest for {{name}} on {{date}}.', {
          name: manifest.driver.name,
          date: manifest.manifest_date,
          defaultValue: `Daily manifest for ${manifest.driver.name} on ${manifest.manifest_date}.`,
        })}
        actions={(
          <div className="page-header__button-row">
            <Can permission={PERMISSIONS.DRIVER_MANIFESTS_PRINT}>
              <Button type="button" variant="secondary" onClick={() => setPrintOpen(true)}>
                {t('Print')}
              </Button>
            </Can>
            <Can permission={PERMISSIONS.DRIVER_MANIFESTS_CLOSE}>
              {manifest.status === 'open' ? (
                <Button type="button" variant="secondary" onClick={() => setCloseOpen(true)}>
                  {t('Close Manifest', { defaultValue: 'Close Manifest' })}
                </Button>
              ) : null}
            </Can>
            <Link className="ui-link-reset" to={adminPath('/driver-manifests')}>
              <Button variant="secondary">{t('Back to manifests', { defaultValue: 'Back to manifests' })}</Button>
            </Link>
          </div>
        )}
      />

      {closeMutation.error ? <div className="form-error">{getApiErrorMessage(closeMutation.error)}</div> : null}

      <div className="stats-grid">
        <StatTile label={t('Status')} value={<StatusBadge value={manifest.status} />} />
        <StatTile label={t('Total Shipments', { defaultValue: 'Total Shipments' })} value={manifest.summary.total_shipments} />
        <StatTile label={t('Expected COD', { defaultValue: 'Expected COD' })} value={<MoneyDisplay value={manifest.summary.expected_cod_amount} />} />
        <StatTile label={t('Actual Received', { defaultValue: 'Actual Received' })} value={<MoneyDisplay value={manifest.summary.actual_received_amount} />} />
        <StatTile label={t('Difference', { defaultValue: 'Difference' })} value={<MoneyDisplay value={manifest.summary.difference_amount} />} />
      </div>

      <div className="details-grid">
        <Card className="detail-card">
          <CardHeader>
            <CardTitle>{t('Manifest Overview', { defaultValue: 'Manifest Overview' })}</CardTitle>
            <CardDescription>{t('Driver and daily loadout summary.', {
              defaultValue: 'Driver and daily loadout summary.',
            })}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="detail-list">
              <div><dt>{t('Driver', { defaultValue: 'Driver' })}</dt><dd>{manifest.driver.name}</dd></div>
              <div><dt>{t('Phone')}</dt><dd>{manifest.driver.phone}</dd></div>
              <div><dt>{t('Vehicle', { defaultValue: 'Vehicle' })}</dt><dd>{manifest.driver.vehicle_type}</dd></div>
              <div><dt>{t('Plate', { defaultValue: 'Plate' })}</dt><dd>{manifest.driver.vehicle_plate}</dd></div>
              <div><dt>{t('Date')}</dt><dd>{manifest.manifest_date}</dd></div>
              <div><dt>{t('Status')}</dt><dd><StatusBadge value={manifest.status} /></dd></div>
              <div><dt>{t('Notes')}</dt><dd>{manifest.notes ?? '-'}</dd></div>
              <div><dt>{t('Created By')}</dt><dd>{manifest.created_by_name ?? '-'}</dd></div>
              <div><dt>{t('Created')}</dt><dd>{formatDate(manifest.created_at)}</dd></div>
            </dl>
          </CardContent>
        </Card>

        <Card className="detail-card">
          <CardHeader>
            <CardTitle>{t('Cash Closure', { defaultValue: 'Cash Closure' })}</CardTitle>
            <CardDescription>{t('COD expectation and discrepancy snapshot returned by backend.', {
              defaultValue: 'COD expectation and discrepancy snapshot returned by backend.',
            })}</CardDescription>
          </CardHeader>
          <CardContent>
            {manifest.cash_closure ? (
              <dl className="detail-list">
                <div><dt>{t('Closure Status', { defaultValue: 'Closure Status' })}</dt><dd><StatusBadge value={manifest.cash_closure.status} /></dd></div>
                <div><dt>{t('Expected Amount', { defaultValue: 'Expected Amount' })}</dt><dd><MoneyDisplay value={manifest.cash_closure.expected_amount} /></dd></div>
                <div><dt>{t('Received Amount', { defaultValue: 'Received Amount' })}</dt><dd><MoneyDisplay value={manifest.cash_closure.received_amount} /></dd></div>
                <div><dt>{t('Difference', { defaultValue: 'Difference' })}</dt><dd><MoneyDisplay value={manifest.cash_closure.difference_amount} /></dd></div>
                <div><dt>{t('Closed By', { defaultValue: 'Closed By' })}</dt><dd>{manifest.closed_by_name ?? '-'}</dd></div>
                <div><dt>{t('Closed At', { defaultValue: 'Closed At' })}</dt><dd>{manifest.closed_at ? formatDate(manifest.closed_at) : '-'}</dd></div>
              </dl>
            ) : (
              <EmptyState
                title={t('Manifest still open', { defaultValue: 'Manifest still open' })}
                description={t('Cash closure details will appear after the manifest is closed.', {
                  defaultValue: 'Cash closure details will appear after the manifest is closed.',
                })}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="table-card">
        <CardHeader>
          <CardTitle>{t('Shipment Snapshot', { defaultValue: 'Shipment Snapshot' })}</CardTitle>
          <CardDescription>{t('Shipment data frozen into the manifest when it was generated.', {
            defaultValue: 'Shipment data frozen into the manifest when it was generated.',
          })}</CardDescription>
        </CardHeader>
        <CardContent>
          <TableContainer>
            <Table variant="compact">
              <thead>
                <tr>
                  <TableHead>{t('Shipment', { defaultValue: 'Shipment' })}</TableHead>
                  <TableHead>{t('Order', { defaultValue: 'Order' })}</TableHead>
                  <TableHead>{t('Merchant')}</TableHead>
                  <TableHead>{t('Customer')}</TableHead>
                  <TableHead>{t('Address')}</TableHead>
                  <TableHead>{t('Loadout Status', { defaultValue: 'Loadout Status' })}</TableHead>
                  <TableHead>{t('Final Status', { defaultValue: 'Final Status' })}</TableHead>
                  <TableHead>{t('COD')}</TableHead>
                  <TableHead>{t('Delivered COD', { defaultValue: 'Delivered COD' })}</TableHead>
                </tr>
              </thead>
              <tbody>
                {manifest.items.map((item) => (
                  <tr key={item.id}>
                    <TableCell>
                      <Link className="table-link" to={adminPath(`/shipments/${item.shipment_id}`)}>
                        {item.shipment_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link className="table-link" to={adminPath(`/orders/${item.order_id}`)}>
                        {item.order_number}
                      </Link>
                    </TableCell>
                    <TableCell>{item.merchant_name}</TableCell>
                    <TableCell>
                      {item.customer_name}
                      <p className="table-meta">{item.customer_phone}</p>
                    </TableCell>
                    <TableCell>{item.delivery_address}</TableCell>
                    <TableCell><StatusBadge value={item.shipment_status_at_loadout} /></TableCell>
                    <TableCell>{item.final_status ? <StatusBadge value={item.final_status} /> : '-'}</TableCell>
                    <TableCell><MoneyDisplay value={item.cod_amount} /></TableCell>
                    <TableCell><MoneyDisplay value={item.delivered_cod_amount} /></TableCell>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Attachments attachableType="driver_manifests" attachableId={manifest.id} />

      

      <CloseManifestDialog
        error={closeMutation.error}
        isSubmitting={closeMutation.isPending}
        manifest={manifest}
        onClose={() => setCloseOpen(false)}
        onSubmit={(values) => closeMutation.mutate(values)}
        open={closeOpen}
      />
      <DriverManifestPrintDialog
        filters={{
          driverName: manifest.driver.name,
          manifestDate: manifest.manifest_date,
          status: manifest.status,
        }}
        manifest={manifest}
        onOpenChange={setPrintOpen}
        open={printOpen}
      />
    </section>
  )
}

function StatTile({ label, value }: { label: string; value: string | number | ReactNode }) {
  return (
    <Card variant="stat" className="stat-card stat-card--neutral">
      <CardHeader className="stat-card__header">
        <span className="eyebrow">{label}</span>
      </CardHeader>
      <CardContent className="stat-card__content">
        <CardTitle className="stat-card__value">{value}</CardTitle>
      </CardContent>
    </Card>
  )
}
