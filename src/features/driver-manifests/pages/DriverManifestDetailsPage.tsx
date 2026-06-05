import { useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { getDriverManifestPrintDocument } from '../../../shared/api/labels.api'
import { listAuditTimeline } from '../../../shared/api/audit.api'
import type { AuditLogItem } from '../../../shared/types/audit.types'
import {
  closeDriverManifest,
  getDriverManifest,
  getDriverManifestPrint,
} from '../api/driver-manifests.api'
import type { DriverManifest, PrintableDriverManifest } from '../types/driver-manifest.types'
import { getApiErrorMessage, isApiNotFound } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { Attachments } from '../../../shared/components/attachments/Attachments'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { LabelDocumentDialog } from '../../../shared/components/labels/LabelDocumentDialog'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { NotFoundState } from '../../../shared/components/states/NotFoundState'
import { PrintView } from '../../../shared/components/print/PrintView'
import { Timeline } from '../../../shared/components/timeline/Timeline'
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
    <Dialog open={open} onClose={onClose} title={<CardTitle>Close Manifest</CardTitle>} variant="small">
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>Actual Received Amount</span>
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
          <span>Notes</span>
          <Input {...register('notes')} />
          <FieldError error={errors.notes?.message ?? getFieldError('notes')} />
        </label>
        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Close Manifest
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function ManifestPrintCard({ data }: { data: PrintableDriverManifest }) {
  return (
    <PrintView title="Driver Manifest">
      <Card>
        <CardHeader>
          <CardTitle>{data.manifest.manifest_number}</CardTitle>
          <CardDescription>
            {data.manifest.driver_name} - {data.manifest.date}
          </CardDescription>
        </CardHeader>
        <CardContent className="page-stack">
          <div className="stats-grid">
            <StatTile label="Total Shipments" value={data.summary.total_shipments} />
            <StatTile label="Total COD" value={<MoneyDisplay value={data.summary.total_cod} />} />
            <StatTile label="Delivered" value={data.summary.delivered_shipments} />
            <StatTile label="Failed" value={data.summary.failed_shipments} />
          </div>
          <TableContainer>
            <Table variant="compact">
              <thead>
                <tr>
                  <TableHead>Shipment</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>COD</TableHead>
                  <TableHead>Shipping Fee</TableHead>
                  <TableHead>Merchant</TableHead>
                </tr>
              </thead>
              <tbody>
                {data.shipments.map((item) => (
                  <tr key={item.shipment_number}>
                    <TableCell>{item.shipment_number}</TableCell>
                    <TableCell>{item.order_number}</TableCell>
                    <TableCell>
                      {item.customer_name}
                      <p className="table-meta">{item.customer_phone}</p>
                    </TableCell>
                    <TableCell>{item.delivery_address}</TableCell>
                    <TableCell><MoneyDisplay value={item.cod_amount} /></TableCell>
                    <TableCell><MoneyDisplay value={item.shipping_fee} /></TableCell>
                    <TableCell>{item.merchant_name}</TableCell>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </PrintView>
  )
}

export function DriverManifestDetailsPage() {
  const { manifestId } = useParams()
  const queryClient = useQueryClient()
  const [closeOpen, setCloseOpen] = useState(false)
  const query = useQuery({
    queryKey: ['driver-manifests', manifestId],
    queryFn: () => getDriverManifest(manifestId!),
    enabled: Boolean(manifestId),
  })
  const printQuery = useQuery({
    queryKey: ['driver-manifests', manifestId, 'print'],
    queryFn: () => getDriverManifestPrint(manifestId!),
    enabled: Boolean(manifestId),
  })
  const timelineQuery = useQuery({
    queryKey: ['driver-manifests', manifestId, 'timeline'],
    queryFn: () => listAuditTimeline({ auditable_type: 'driver_manifest', auditable_id: manifestId! }),
    enabled: Boolean(manifestId),
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
    return <LoadingState title="Loading driver manifest" />
  }

  if (query.isError && isApiNotFound(query.error)) {
    return (
      <NotFoundState
        title="Driver manifest not found"
        description="This driver manifest could not be found in the manifests API."
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
        description={`Daily manifest for ${manifest.driver.name} on ${manifest.manifest_date}.`}
        actions={(
          <div className="page-header__button-row">
            <Can permission={PERMISSIONS.DRIVER_MANIFESTS_PRINT}>
              <Button type="button" variant="secondary" onClick={() => void printQuery.refetch()}>
                Refresh Print View
              </Button>
            </Can>
            <Can permission={PERMISSIONS.DRIVER_MANIFESTS_PRINT}>
              <LabelDocumentDialog
                defaultFormat="html"
                fetchDocument={(options) => getDriverManifestPrintDocument(manifest.id, {
                  ...options,
                  format: options.format === 'pdf' || options.format === 'json' ? options.format : 'html',
                })}
                formats={['html', 'pdf', 'json']}
                title={`Driver Manifest Print - ${manifest.manifest_number}`}
                triggerLabel="Formatted Print"
              />
            </Can>
            <Can permission={PERMISSIONS.DRIVER_MANIFESTS_CLOSE}>
              {manifest.status === 'open' ? (
                <Button type="button" variant="secondary" onClick={() => setCloseOpen(true)}>
                  Close Manifest
                </Button>
              ) : null}
            </Can>
            <Link className="ui-link-reset" to={adminPath('/driver-manifests')}>
              <Button variant="secondary">Back to manifests</Button>
            </Link>
          </div>
        )}
      />

      {closeMutation.error ? <div className="form-error">{getApiErrorMessage(closeMutation.error)}</div> : null}

      <div className="stats-grid">
        <StatTile label="Status" value={<StatusBadge value={manifest.status} />} />
        <StatTile label="Total Shipments" value={manifest.summary.total_shipments} />
        <StatTile label="Expected COD" value={<MoneyDisplay value={manifest.summary.expected_cod_amount} />} />
        <StatTile label="Actual Received" value={<MoneyDisplay value={manifest.summary.actual_received_amount} />} />
        <StatTile label="Difference" value={<MoneyDisplay value={manifest.summary.difference_amount} />} />
      </div>

      <div className="details-grid">
        <Card className="detail-card">
          <CardHeader>
            <CardTitle>Manifest Overview</CardTitle>
            <CardDescription>Driver and daily loadout summary.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="detail-list">
              <div><dt>Driver</dt><dd>{manifest.driver.name}</dd></div>
              <div><dt>Phone</dt><dd>{manifest.driver.phone}</dd></div>
              <div><dt>Vehicle</dt><dd>{manifest.driver.vehicle_type}</dd></div>
              <div><dt>Plate</dt><dd>{manifest.driver.vehicle_plate}</dd></div>
              <div><dt>Date</dt><dd>{manifest.manifest_date}</dd></div>
              <div><dt>Status</dt><dd><StatusBadge value={manifest.status} /></dd></div>
              <div><dt>Notes</dt><dd>{manifest.notes ?? '-'}</dd></div>
              <div><dt>Created By</dt><dd>{manifest.created_by_name ?? '-'}</dd></div>
              <div><dt>Created</dt><dd>{formatDate(manifest.created_at)}</dd></div>
            </dl>
          </CardContent>
        </Card>

        <Card className="detail-card">
          <CardHeader>
            <CardTitle>Cash Closure</CardTitle>
            <CardDescription>COD expectation and discrepancy snapshot returned by backend.</CardDescription>
          </CardHeader>
          <CardContent>
            {manifest.cash_closure ? (
              <dl className="detail-list">
                <div><dt>Closure Status</dt><dd><StatusBadge value={manifest.cash_closure.status} /></dd></div>
                <div><dt>Expected Amount</dt><dd><MoneyDisplay value={manifest.cash_closure.expected_amount} /></dd></div>
                <div><dt>Received Amount</dt><dd><MoneyDisplay value={manifest.cash_closure.received_amount} /></dd></div>
                <div><dt>Difference</dt><dd><MoneyDisplay value={manifest.cash_closure.difference_amount} /></dd></div>
                <div><dt>Closed By</dt><dd>{manifest.closed_by_name ?? '-'}</dd></div>
                <div><dt>Closed At</dt><dd>{manifest.closed_at ? formatDate(manifest.closed_at) : '-'}</dd></div>
              </dl>
            ) : (
              <EmptyState
                title="Manifest still open"
                description="Cash closure details will appear after the manifest is closed."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="table-card">
        <CardHeader>
          <CardTitle>Shipment Snapshot</CardTitle>
          <CardDescription>Shipment data frozen into the manifest when it was generated.</CardDescription>
        </CardHeader>
        <CardContent>
          <TableContainer>
            <Table variant="compact">
              <thead>
                <tr>
                  <TableHead>Shipment</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Loadout Status</TableHead>
                  <TableHead>Final Status</TableHead>
                  <TableHead>COD</TableHead>
                  <TableHead>Delivered COD</TableHead>
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

      {printQuery.isLoading ? <LoadingState title="Loading print view" /> : null}
      {printQuery.isError ? (
        <ErrorState
          title="Unable to load print view"
          message={getApiErrorMessage(printQuery.error)}
          onRetry={() => void printQuery.refetch()}
        />
      ) : null}
      {printQuery.data ? <ManifestPrintCard data={printQuery.data.data} /> : null}

      <Attachments attachableType="driver_manifests" attachableId={manifest.id} />

      <Can permission={PERMISSIONS.AUDIT_LOGS_TIMELINE}>
        {timelineQuery.isLoading ? <LoadingState title="Loading activity timeline" /> : null}
        {timelineQuery.isError ? (
          <ErrorState
            title="Unable to load activity timeline"
            message={getApiErrorMessage(timelineQuery.error)}
            onRetry={() => void timelineQuery.refetch()}
          />
        ) : null}
        {!timelineQuery.isLoading && !timelineQuery.isError ? (
          <Timeline
            title="Activity Timeline"
            items={(timelineQuery.data?.data ?? []).map((item: AuditLogItem) => ({
              id: item.id,
              title: `${item.event_type} - ${item.action}`,
              subtitle: item.user?.name ?? 'System',
              description: item.notes ?? 'No notes were recorded for this event.',
              timestamp: item.created_at,
            }))}
            emptyDescription="No driver manifest activity timeline entries were returned."
          />
        ) : null}
      </Can>

      <CloseManifestDialog
        error={closeMutation.error}
        isSubmitting={closeMutation.isPending}
        manifest={manifest}
        onClose={() => setCloseOpen(false)}
        onSubmit={(values) => closeMutation.mutate(values)}
        open={closeOpen}
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
