import { useState, type ReactNode } from 'react'
import { inferStatAccent, type StatAccent } from '../../../shared/utils/statAccent'
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

function getManifestStatusAccent(status: string): StatAccent {
  if (status === 'closed') {
    return 'success'
  }
  if (status === 'cancelled') {
    return 'danger'
  }
  if (status === 'open' || status === 'dispatched') {
    return 'warning'
  }
  return 'drivers'
}

function getLoadoutRowClass(status: string) {
  if (status === 'loaded' || status === 'out_for_delivery') {
    return 'manifest-shipment-row manifest-shipment-row--loaded'
  }
  if (status === 'pending' || status === 'ready_for_dispatch') {
    return 'manifest-shipment-row manifest-shipment-row--pending'
  }
  return 'manifest-shipment-row'
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
        {formError ? <div className="form-error" role="alert">{formError}</div> : null}
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
  const isOpenForClosure = manifest.status === 'open' || manifest.status === 'dispatched'
  const undeliveredShipments = manifest.items.filter((item) => item.current_status !== 'delivered')
  const canCloseManifest = isOpenForClosure && manifest.items.length > 0 && undeliveredShipments.length === 0
  const hasCashDifference = Number(manifest.summary.difference_amount ?? 0) !== 0
  const totalCod = manifest.items.reduce((total, item) => total + Number(item.cod_amount || 0), 0)
  const totalDeliveredCod = manifest.items.reduce(
    (total, item) => total + Number(item.delivered_cod_amount || 0),
    0,
  )

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
              {canCloseManifest ? (
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

      {closeMutation.error ? <div className="form-error" role="alert">{getApiErrorMessage(closeMutation.error)}</div> : null}

      <div className="stats-grid">
        <StatTile accent={getManifestStatusAccent(manifest.status)} label={t('Status')} value={<StatusBadge value={manifest.status} />} />
        <StatTile accent="shipments" label={t('Total Shipments', { defaultValue: 'Total Shipments' })} value={manifest.summary.total_shipments} />
        <StatTile accent="finance" label={t('Expected COD', { defaultValue: 'Expected COD' })} value={<MoneyDisplay value={manifest.summary.expected_cod_amount} />} />
        <StatTile accent="success" label={t('Actual Received', { defaultValue: 'Actual Received' })} value={<MoneyDisplay value={manifest.summary.actual_received_amount} />} />
        <StatTile accent={hasCashDifference ? 'danger' : 'success'} label={t('Difference', { defaultValue: 'Difference' })} value={<MoneyDisplay value={manifest.summary.difference_amount} />} />
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

        <Card className={`detail-card manifest-cash-closure${canCloseManifest ? ' manifest-cash-closure--required' : ''}`}>
          <CardHeader>
            <CardTitle>
              {canCloseManifest
                ? t('Cash Closure Required', { defaultValue: 'Cash Closure Required' })
                : isOpenForClosure
                  ? t('Delivery Completion Required', { defaultValue: 'Delivery Completion Required' })
                  : t('Cash Closure', { defaultValue: 'Cash Closure' })}
            </CardTitle>
            <CardDescription>
              {canCloseManifest
                ? t('Enter the actual received amount to close this manifest.', {
                    defaultValue: 'Enter the actual received amount to close this manifest.',
                  })
                : isOpenForClosure
                  ? t('Every shipment must be delivered before cash closure becomes available.', {
                      defaultValue: 'Every shipment must be delivered before cash closure becomes available.',
                    })
                  : t('COD expectation and discrepancy snapshot returned by backend.', {
                      defaultValue: 'COD expectation and discrepancy snapshot returned by backend.',
                    })}
            </CardDescription>
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
            ) : canCloseManifest ? (
              <div className="manifest-cash-closure__action">
                <p>{t('Cash collection is still pending verification for this driver manifest.', {
                  defaultValue: 'Cash collection is still pending verification for this driver manifest.',
                })}</p>
                <Can permission={PERMISSIONS.DRIVER_MANIFESTS_CLOSE}>
                  <Button type="button" onClick={() => setCloseOpen(true)}>
                    {t('Enter Received Amount', { defaultValue: 'Enter Received Amount' })}
                  </Button>
                </Can>
              </div>
            ) : (
              <EmptyState
                title={isOpenForClosure
                  ? t('Deliver all shipments first', { defaultValue: 'Deliver all shipments first' })
                  : t('Manifest closed', { defaultValue: 'Manifest closed' })}
                description={isOpenForClosure
                  ? t('{{count}} shipment(s) are not delivered yet. Complete their delivery before closing the manifest.', {
                      count: undeliveredShipments.length,
                      defaultValue: `${undeliveredShipments.length} shipment(s) are not delivered yet. Complete their delivery before closing the manifest.`,
                    })
                  : t('Cash closure details are not available for this manifest.', {
                      defaultValue: 'Cash closure details are not available for this manifest.',
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
                {manifest.items.map((item) => {
                  const loadoutStatus = item.loadout_status ?? item.shipment_status_at_loadout

                  return (
                    <tr className={getLoadoutRowClass(loadoutStatus)} key={item.id}>
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
                      <TableCell><StatusBadge value={loadoutStatus} /></TableCell>
                      <TableCell>{item.final_status ? <StatusBadge value={item.final_status} /> : '-'}</TableCell>
                      <TableCell><MoneyDisplay value={item.cod_amount} /></TableCell>
                      <TableCell><MoneyDisplay value={item.delivered_cod_amount} /></TableCell>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="manifest-shipments-total-row">
                  <td className="ui-table__cell manifest-shipments-total-row__label" colSpan={7}>
                    {t('Total', { defaultValue: 'Total' })}
                  </td>
                  <TableCell><MoneyDisplay value={totalCod} /></TableCell>
                  <TableCell><MoneyDisplay value={totalDeliveredCod} /></TableCell>
                </tr>
              </tfoot>
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

function StatTile({ accent, label, value }: { accent?: StatAccent; label: string; value: string | number | ReactNode }) {
  return (
    <Card variant="stat" className="stat-card stat-card--neutral" data-accent={accent ?? inferStatAccent(label, 'drivers')}>
      <CardHeader className="stat-card__header">
        <span className="eyebrow">{label}</span>
      </CardHeader>
      <CardContent className="stat-card__content">
        <CardTitle className="stat-card__value">{value}</CardTitle>
      </CardContent>
    </Card>
  )
}
