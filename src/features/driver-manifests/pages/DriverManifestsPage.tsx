import { useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { listShipments } from '../../shipments/api/shipments.api'
import type { Shipment } from '../../shipments/types/shipment.types'
import {
  closeDriverManifest,
  generateDriverManifest,
  getDriverManifestPrint,
  listDriverManifests,
} from '../api/driver-manifests.api'
import type {
  DriverManifest,
  DriverManifestFilters,
  GenerateDriverManifestPayload,
  PrintableDriverManifest,
} from '../types/driver-manifest.types'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { DriverSelector } from '../../../shared/components/selectors/DriverSelector'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import { DateRangeFilter } from '../../../shared/components/filters/DateRangeFilter'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { PrintView } from '../../../shared/components/print/PrintView'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Dialog } from '../../../shared/components/ui/Dialog'
import { Input } from '../../../shared/components/ui/Input'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { Select } from '../../../shared/components/ui/Select'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { useFormApiErrors } from '../../../shared/hooks/useFormApiErrors'
import { adminPath } from '../../../shared/routing/paths'

type ManifestFiltersState = {
  driver_id: string
  manifest_date: string
  status: string
  date_from: string
  date_to: string
}

type GenerateManifestFormValues = {
  driver_id: number
  manifest_date: string
  notes: string
  shipment_ids: number[]
}

type CloseManifestFormValues = {
  actual_received_amount: number
  notes: string
}

const initialFilters: ManifestFiltersState = {
  driver_id: '',
  manifest_date: '',
  status: '',
  date_from: '',
  date_to: '',
}

function uniqueShipments(queries: Array<{ data?: { data: Shipment[] } }>) {
  const map = new Map<number, Shipment>()
  queries.forEach((query) => {
    ;(query.data?.data ?? []).forEach((shipment) => {
      map.set(shipment.id, shipment)
    })
  })
  return Array.from(map.values())
}

function GenerateManifestDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
}: {
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: GenerateManifestFormValues) => void
  open: boolean
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GenerateManifestFormValues>({
    defaultValues: {
      driver_id: 0,
      manifest_date: '',
      notes: '',
      shipment_ids: [],
    },
  })
  const { formError, getFieldError } = useFormApiErrors(error)
  const selectedShipments = watch('shipment_ids') ?? []
  const [readyForDispatchQuery, outForDeliveryQuery] = useQueries({
    queries: [
      {
        queryKey: ['shipments', 'manifest-candidates', 'ready_for_dispatch'],
        queryFn: () => listShipments({ status: 'ready_for_dispatch' }),
        enabled: open,
      },
      {
        queryKey: ['shipments', 'manifest-candidates', 'out_for_delivery'],
        queryFn: () => listShipments({ status: 'out_for_delivery' }),
        enabled: open,
      },
    ],
  })
  const availableShipments = useMemo(
    () => uniqueShipments([readyForDispatchQuery, outForDeliveryQuery]),
    [readyForDispatchQuery, outForDeliveryQuery],
  )

  function toggleShipment(shipmentId: number) {
    const nextValue = selectedShipments.includes(shipmentId)
      ? selectedShipments.filter((id) => id !== shipmentId)
      : [...selectedShipments, shipmentId]
    setValue('shipment_ids', nextValue, { shouldValidate: true })
  }

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>Generate Driver Manifest</CardTitle>}>
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>Driver</span>
          <DriverSelector
            value={watch('driver_id') ? String(watch('driver_id')) : ''}
            onChange={(driverId) => setValue('driver_id', driverId ? Number(driverId) : 0, { shouldValidate: true })}
          />
          <FieldError error={errors.driver_id?.message ?? getFieldError('driver_id')} />
        </label>
        <label className="field">
          <span>Manifest Date</span>
          <Input
            type="date"
            {...register('manifest_date', { required: 'Manifest date is required.' })}
          />
          <FieldError error={errors.manifest_date?.message ?? getFieldError('manifest_date')} />
        </label>
        <label className="field">
          <span>Notes</span>
          <Input {...register('notes')} />
          <FieldError error={errors.notes?.message ?? getFieldError('notes')} />
        </label>
        <div className="field">
          <span>Shipments</span>
          {readyForDispatchQuery.isLoading || outForDeliveryQuery.isLoading ? (
            <LoadingState title="Loading shipment candidates" />
          ) : null}
          {readyForDispatchQuery.isError || outForDeliveryQuery.isError ? (
            <ErrorState
              title="Unable to load shipment candidates"
              message={getApiErrorMessage(readyForDispatchQuery.error ?? outForDeliveryQuery.error)}
              onRetry={() => {
                void readyForDispatchQuery.refetch()
                void outForDeliveryQuery.refetch()
              }}
            />
          ) : null}
          {!readyForDispatchQuery.isLoading && !outForDeliveryQuery.isLoading && !availableShipments.length ? (
            <EmptyState
              title="No manifest-ready shipments"
              description="No shipments in ready_for_dispatch or out_for_delivery were returned."
            />
          ) : null}
          {availableShipments.length ? (
            <div className="page-stack">
              <p className="table-meta">{selectedShipments.length} shipment(s) selected.</p>
              <TableContainer>
                <Table variant="compact">
                  <thead>
                    <tr>
                      <TableHead>Select</TableHead>
                      <TableHead>Shipment</TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>COD</TableHead>
                    </tr>
                  </thead>
                  <tbody>
                    {availableShipments.map((shipment) => (
                      <tr key={shipment.id}>
                        <TableCell>
                          <input
                            checked={selectedShipments.includes(shipment.id)}
                            type="checkbox"
                            onChange={() => toggleShipment(shipment.id)}
                          />
                        </TableCell>
                        <TableCell>{shipment.shipment_number}</TableCell>
                        <TableCell>{shipment.merchant_name}</TableCell>
                        <TableCell>{shipment.customer_name}</TableCell>
                        <TableCell><StatusBadge value={shipment.status} /></TableCell>
                        <TableCell><MoneyDisplay value={shipment.cod_amount} /></TableCell>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableContainer>
            </div>
          ) : null}
          <FieldError error={errors.shipment_ids?.message ?? getFieldError('shipment_ids')} />
        </div>
        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!selectedShipments.length}
          >
            Generate Manifest
          </Button>
        </div>
      </form>
    </Dialog>
  )
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
  manifest: DriverManifest | null
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
      actual_received_amount: Number(manifest?.summary.actual_received_amount ?? manifest?.summary.expected_cod_amount ?? 0),
      notes: manifest?.notes ?? '',
    },
  })
  const { formError, getFieldError } = useFormApiErrors(error)

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>Close Manifest</CardTitle>} variant="small">
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <p>
          Close {manifest?.manifest_number}? The backend will validate unresolved shipments and calculate
          the discrepancy automatically.
        </p>
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

function ManifestPrintContent({ data }: { data: PrintableDriverManifest }) {
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

export function DriverManifestsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<ManifestFiltersState>(initialFilters)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [manifestPendingClose, setManifestPendingClose] = useState<DriverManifest | null>(null)
  const [manifestPendingPrint, setManifestPendingPrint] = useState<DriverManifest | null>(null)
  const params: DriverManifestFilters = useMemo(
    () => ({
      ...(filters.driver_id ? { driver_id: filters.driver_id } : {}),
      ...(filters.manifest_date ? { manifest_date: filters.manifest_date } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.date_from ? { date_from: filters.date_from } : {}),
      ...(filters.date_to ? { date_to: filters.date_to } : {}),
    }),
    [filters],
  )
  const manifestsQuery = useQuery({
    queryKey: ['driver-manifests', params],
    queryFn: () => listDriverManifests(params),
  })
  const printQuery = useQuery({
    queryKey: ['driver-manifests', manifestPendingPrint?.id, 'print'],
    queryFn: () => getDriverManifestPrint(manifestPendingPrint!.id),
    enabled: Boolean(manifestPendingPrint),
  })
  const generateMutation = useMutation({
    mutationFn: (values: GenerateManifestFormValues) => {
      const payload: GenerateDriverManifestPayload = {
        driver_id: values.driver_id,
        manifest_date: values.manifest_date,
        shipment_ids: values.shipment_ids,
        notes: values.notes || undefined,
      }
      return generateDriverManifest(payload)
    },
    onSuccess: async (response) => {
      setGenerateOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['driver-manifests'] })
      await queryClient.invalidateQueries({ queryKey: ['shipments'] })
      navigate(adminPath(`/driver-manifests/${response.data.id}`))
    },
  })
  const closeMutation = useMutation({
    mutationFn: ({
      manifestId,
      values,
    }: {
      manifestId: number
      values: CloseManifestFormValues
    }) =>
      closeDriverManifest(manifestId, {
        actual_received_amount: values.actual_received_amount,
        notes: values.notes || undefined,
      }),
    onSuccess: async () => {
      setManifestPendingClose(null)
      await queryClient.invalidateQueries({ queryKey: ['driver-manifests'] })
    },
  })

  const manifests = manifestsQuery.data?.data ?? []

  return (
    <section className="page-section">
      <PageHeader
        title="Driver Manifests"
        description="Generate, close, and print daily driver manifests from the documented API flow."
        actions={(
          <Can permission={PERMISSIONS.DRIVER_MANIFESTS_CREATE}>
            <Button type="button" onClick={() => setGenerateOpen(true)}>
              Generate Manifest
            </Button>
          </Can>
        )}
      />

      <Card variant="flat" className="dashboard-filter-card">
        <CardContent className="dashboard-filters">
          <label className="field">
            <span>Driver</span>
            <DriverSelector
              value={filters.driver_id}
              includeAllOption
              onChange={(driver_id) => setFilters((current) => ({ ...current, driver_id }))}
            />
          </label>
          <label className="field">
            <span>Manifest Date</span>
            <Input
              type="date"
              value={filters.manifest_date}
              onChange={(event) => setFilters((current) => ({ ...current, manifest_date: event.target.value }))}
            />
          </label>
          <DateRangeFilter
            dateFrom={filters.date_from}
            dateTo={filters.date_to}
            onChange={({ date_from, date_to }) => setFilters((current) => ({ ...current, date_from, date_to }))}
          />
          <label className="field">
            <span>Status</span>
            <Select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="">All statuses</option>
              <option value="open">open</option>
              <option value="closed">closed</option>
            </Select>
          </label>
        </CardContent>
        <CardContent>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setFilters(initialFilters)}>
              Reset filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="table-card">
        <CardHeader>
          <CardTitle>Daily Manifests</CardTitle>
          <CardDescription>Open and closed driver manifests with COD closure values.</CardDescription>
        </CardHeader>
        <CardContent>
          {manifestsQuery.isLoading ? <LoadingState title="Loading driver manifests" /> : null}
          {manifestsQuery.isError ? (
            <ErrorState
              title="Unable to load driver manifests"
              message={getApiErrorMessage(manifestsQuery.error)}
              onRetry={() => void manifestsQuery.refetch()}
            />
          ) : null}
          {!manifestsQuery.isLoading && !manifestsQuery.isError && !manifests.length ? (
            <EmptyState
              title="No manifests found"
              description="No driver manifests matched the selected filters."
            />
          ) : null}
          {manifests.length ? (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>Manifest</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Shipments</TableHead>
                    <TableHead>Expected COD</TableHead>
                    <TableHead>Actual Received</TableHead>
                    <TableHead>Difference</TableHead>
                    <TableHead>Actions</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {manifests.map((manifest) => (
                    <tr key={manifest.id}>
                      <TableCell>
                        <Link className="table-link" to={adminPath(`/driver-manifests/${manifest.id}`)}>
                          {manifest.manifest_number}
                        </Link>
                      </TableCell>
                      <TableCell>{manifest.manifest_date}</TableCell>
                      <TableCell>
                        {manifest.driver.name}
                        <p className="table-meta">{manifest.driver.phone}</p>
                      </TableCell>
                      <TableCell><StatusBadge value={manifest.status} /></TableCell>
                      <TableCell>{manifest.summary.total_shipments}</TableCell>
                      <TableCell><MoneyDisplay value={manifest.summary.expected_cod_amount} /></TableCell>
                      <TableCell><MoneyDisplay value={manifest.summary.actual_received_amount} /></TableCell>
                      <TableCell><MoneyDisplay value={manifest.summary.difference_amount} /></TableCell>
                      <TableCell>
                        <div className="page-header__button-row">
                          <Link className="table-link" to={adminPath(`/driver-manifests/${manifest.id}`)}>
                            View
                          </Link>
                          <Can permission={PERMISSIONS.DRIVER_MANIFESTS_PRINT}>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => setManifestPendingPrint(manifest)}
                            >
                              Print
                            </Button>
                          </Can>
                          <Can permission={PERMISSIONS.DRIVER_MANIFESTS_CLOSE}>
                            {manifest.status === 'open' ? (
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setManifestPendingClose(manifest)}
                              >
                                Close
                              </Button>
                            ) : null}
                          </Can>
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          ) : null}
        </CardContent>
      </Card>

      <GenerateManifestDialog
        error={generateMutation.error}
        isSubmitting={generateMutation.isPending}
        onClose={() => setGenerateOpen(false)}
        onSubmit={(values) => generateMutation.mutate(values)}
        open={generateOpen}
      />
      <CloseManifestDialog
        error={closeMutation.error}
        isSubmitting={closeMutation.isPending}
        manifest={manifestPendingClose}
        onClose={() => setManifestPendingClose(null)}
        onSubmit={(values) => {
          if (manifestPendingClose) {
            closeMutation.mutate({ manifestId: manifestPendingClose.id, values })
          }
        }}
        open={Boolean(manifestPendingClose)}
      />
      <Dialog
        open={Boolean(manifestPendingPrint)}
        onClose={() => setManifestPendingPrint(null)}
        title={<CardTitle>Driver Manifest Print View</CardTitle>}
      >
        {printQuery.isLoading ? <LoadingState title="Loading manifest print view" /> : null}
        {printQuery.isError ? (
          <ErrorState
            title="Unable to load print view"
            message={getApiErrorMessage(printQuery.error)}
            onRetry={() => void printQuery.refetch()}
          />
        ) : null}
        {printQuery.data ? <ManifestPrintContent data={printQuery.data.data} /> : null}
      </Dialog>
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
