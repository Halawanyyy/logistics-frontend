import { useMemo, useState } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Truck } from 'lucide-react'
import { listShipments } from '../../shipments/api/shipments.api'
import type { Shipment } from '../../shipments/types/shipment.types'
import {
  closeDriverManifest,
  generateDriverManifest,
  listDriverManifests,
} from '../api/driver-manifests.api'
import type {
  DriverManifest,
  DriverManifestFilters,
  GenerateDriverManifestPayload,
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
import { DriverManifestPrintDialog } from '../components/DriverManifestPrintDialog'

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

function canCloseDriverManifest(manifest: DriverManifest) {
  return manifest.status === 'open'
    && manifest.items.length > 0
    && manifest.items.every((item) => item.current_status === 'delivered')
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
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const {
    control,
    register,
    handleSubmit,
    setValue,
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
  const selectedShipments = useWatch({ control, name: 'shipment_ids', defaultValue: [] })
  const selectedDriverId = useWatch({ control, name: 'driver_id' })
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
  const eligibleShipments = useMemo(
    () => selectedDriverId
      ? availableShipments.filter((shipment) => (
          shipment.assigned_driver_id == null
          || shipment.assigned_driver_id === selectedDriverId
        ))
      : [],
    [availableShipments, selectedDriverId],
  )
  const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase()
  const filteredShipments = useMemo(
    () => eligibleShipments.filter((shipment) => {
      if (!normalizedSearchTerm) {
        return true
      }

      return [
        shipment.shipment_number,
        shipment.customer_name,
        shipment.delivery_area_name,
        shipment.delivery_governorate_name,
      ].some((value) => value?.toLocaleLowerCase().includes(normalizedSearchTerm))
    }),
    [eligibleShipments, normalizedSearchTerm],
  )
  const candidateSections = useMemo(() => {
    function groupByGovernorate(shipments: Shipment[]) {
      const groups = new Map<string, Shipment[]>()

      shipments.forEach((shipment) => {
        const governorate = shipment.delivery_governorate_name || t('Unknown governorate', { defaultValue: 'Unknown governorate' })
        const group = groups.get(governorate) ?? []
        group.push(shipment)
        groups.set(governorate, group)
      })

      return Array.from(groups.entries()).map(([governorate, grouped]) => ({
        governorate,
        shipments: grouped.sort((first, second) =>
          (first.delivery_area_name ?? '').localeCompare(second.delivery_area_name ?? ''),
        ),
      }))
    }

    const assigned = filteredShipments.filter((shipment) => shipment.assigned_driver_id === selectedDriverId)
    const unassigned = filteredShipments.filter((shipment) => shipment.assigned_driver_id == null)

    return [
      {
        id: 'assigned',
        title: t('Assigned to selected driver', { defaultValue: 'Assigned to selected driver' }),
        description: t('These shipments are already assigned to this driver and are still awaiting delivery.', {
          defaultValue: 'These shipments are already assigned to this driver and are still awaiting delivery.',
        }),
        shipments: assigned,
        groups: groupByGovernorate(assigned),
      },
      {
        id: 'unassigned',
        title: t('Unassigned shipments', { defaultValue: 'Unassigned shipments' }),
        description: t('These shipments have no driver yet. Selecting them adds them to the selected driver\'s manifest.', {
          defaultValue: 'These shipments have no driver yet. Selecting them adds them to the selected driver\'s manifest.',
        }),
        shipments: unassigned,
        groups: groupByGovernorate(unassigned),
      },
    ]
  }, [filteredShipments, selectedDriverId, t])
  const selectedShipmentRecords = useMemo(
    () => eligibleShipments.filter((shipment) => selectedShipments.includes(shipment.id)),
    [eligibleShipments, selectedShipments],
  )
  const selectedTotalCod = selectedShipmentRecords.reduce(
    (total, shipment) => total + Number(shipment.cod_amount || 0),
    0,
  )
  const selectedAreasCount = new Set(
    selectedShipmentRecords.map((shipment) => shipment.delivery_area_name).filter(Boolean),
  ).size

  function toggleShipment(shipmentId: number) {
    const nextValue = selectedShipments.includes(shipmentId)
      ? selectedShipments.filter((id) => id !== shipmentId)
      : [...selectedShipments, shipmentId]
    setValue('shipment_ids', nextValue, { shouldValidate: true })
  }

  function toggleShipmentGroup(shipments: Shipment[]) {
    const groupIds = shipments.map((shipment) => shipment.id)
    const allSelected = groupIds.every((shipmentId) => selectedShipments.includes(shipmentId))
    const nextValue = allSelected
      ? selectedShipments.filter((shipmentId) => !groupIds.includes(shipmentId))
      : Array.from(new Set([...selectedShipments, ...groupIds]))
    setValue('shipment_ids', nextValue, { shouldValidate: true })
  }

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>{t('Generate Driver Manifest', { defaultValue: 'Generate Driver Manifest' })}</CardTitle>}>
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>{t('Driver', { defaultValue: 'Driver' })}</span>
          <DriverSelector
            value={selectedDriverId ? String(selectedDriverId) : ''}
            onChange={(driverId) => {
              setValue('driver_id', driverId ? Number(driverId) : 0, { shouldValidate: true })
              setValue('shipment_ids', [], { shouldValidate: true })
            }}
          />
          <FieldError error={errors.driver_id?.message ?? getFieldError('driver_id')} />
        </label>
        <label className="field">
          <span>{t('Manifest Date', { defaultValue: 'Manifest Date' })}</span>
          <Input
            type="date"
            {...register('manifest_date', { required: 'Manifest date is required.' })}
          />
          <FieldError error={errors.manifest_date?.message ?? getFieldError('manifest_date')} />
        </label>
        <label className="field">
          <span>{t('Notes')}</span>
          <Input {...register('notes')} />
          <FieldError error={errors.notes?.message ?? getFieldError('notes')} />
        </label>
        <div className="field">
          <span>{t('Shipments')}</span>
          {readyForDispatchQuery.isLoading || outForDeliveryQuery.isLoading ? (
            <LoadingState title={t('Loading shipment candidates', { defaultValue: 'Loading shipment candidates' })} />
          ) : null}
          {readyForDispatchQuery.isError || outForDeliveryQuery.isError ? (
            <ErrorState
              title={t('Unable to load shipment candidates', { defaultValue: 'Unable to load shipment candidates' })}
              message={getApiErrorMessage(readyForDispatchQuery.error ?? outForDeliveryQuery.error)}
              onRetry={() => {
                void readyForDispatchQuery.refetch()
                void outForDeliveryQuery.refetch()
              }}
            />
          ) : null}
          {!readyForDispatchQuery.isLoading && !outForDeliveryQuery.isLoading && !selectedDriverId ? (
            <div className="manifest-empty-state manifest-empty-state--driver" role="status">
              <div className="manifest-empty-state__icon" aria-hidden="true">
                <Truck size={22} />
              </div>
              <div className="manifest-empty-state__content">
                <strong>{t('Select a driver first', { defaultValue: 'Select a driver first' })}</strong>
                <p>{t('The form will then show shipments assigned to that driver separately from shipments that are not assigned to anyone.', {
                  defaultValue: 'The form will then show shipments assigned to that driver separately from shipments that are not assigned to anyone.',
                })}</p>
              </div>
            </div>
          ) : null}
          {!readyForDispatchQuery.isLoading && !outForDeliveryQuery.isLoading && selectedDriverId && !eligibleShipments.length ? (
            <div className="manifest-empty-state" role="status">
              <div className="manifest-empty-state__icon" aria-hidden="true">
                <Truck size={22} />
              </div>
              <div className="manifest-empty-state__content">
                <strong>{t('No manifest-ready shipments available', {
                  defaultValue: 'No manifest-ready shipments available',
                })}</strong>
                <p>{t('No ready shipments are assigned to the selected driver, and no unassigned shipments are currently available.', {
                  defaultValue: 'No ready shipments are assigned to the selected driver, and no unassigned shipments are currently available.',
                })}</p>
                <div className="manifest-empty-state__criteria" aria-label={t('Shipment requirements', { defaultValue: 'Shipment requirements' })}>
                  <span>{t('Selected driver or unassigned', { defaultValue: 'Selected driver or unassigned' })}</span>
                  <span>{t('Not delivered', { defaultValue: 'Not delivered' })}</span>
                </div>
              </div>
            </div>
          ) : null}
          {selectedDriverId && eligibleShipments.length ? (
            <div className="page-stack manifest-candidates">
              <Input
                aria-label={t('Search manifest shipments', { defaultValue: 'Search manifest shipments' })}
                className="manifest-candidates__search"
                type="search"
                placeholder={t('Search by shipment number, customer, or area...', {
                  defaultValue: 'Search by shipment number, customer, or area...',
                })}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />

              {filteredShipments.length ? (
                <div className="manifest-assignment-sections">
                  {candidateSections.map((section) => (
                    <section
                      className={`manifest-assignment-section manifest-assignment-section--${section.id}`}
                      key={section.id}
                    >
                      <div className="manifest-assignment-section__header">
                        <div>
                          <strong>{section.title}</strong>
                          <p>{section.description}</p>
                        </div>
                        <span className="manifest-assignment-section__count">
                          {section.shipments.length}
                        </span>
                      </div>

                      {section.groups.length ? (
                        <div className="manifest-groups">
                          {section.groups.map(({ governorate, shipments }) => {
                            const allSelected = shipments.every((shipment) => selectedShipments.includes(shipment.id))

                            return (
                              <section className="manifest-group" key={`${section.id}-${governorate}`}>
                                <div className="manifest-group__header">
                                  <label className="manifest-group__select">
                                    <input
                                      checked={allSelected}
                                      type="checkbox"
                                      onChange={() => toggleShipmentGroup(shipments)}
                                    />
                                    <span>{governorate}</span>
                                    <span className="manifest-group__count">
                                      {t('{{count}} shipments', {
                                        count: shipments.length,
                                        defaultValue: `${shipments.length} shipments`,
                                      })}
                                    </span>
                                  </label>
                                </div>
                                <div className="manifest-group__items">
                                  {shipments.map((shipment) => (
                                    <label className="manifest-group__item" key={shipment.id}>
                                      <input
                                        checked={selectedShipments.includes(shipment.id)}
                                        type="checkbox"
                                        onChange={() => toggleShipment(shipment.id)}
                                      />
                                      <strong>{shipment.shipment_number}</strong>
                                      <span className="manifest-group__customer">{shipment.customer_name}</span>
                                      <span className="manifest-group__area">{shipment.delivery_area_name ?? t('Unassigned area', { defaultValue: 'Unassigned area' })}</span>
                                      <span className="manifest-group__cod"><MoneyDisplay value={shipment.cod_amount} /></span>
                                    </label>
                                  ))}
                                </div>
                              </section>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="manifest-assignment-section__empty">
                          {section.id === 'assigned'
                            ? t('No ready shipments are currently assigned to this driver.', {
                                defaultValue: 'No ready shipments are currently assigned to this driver.',
                              })
                            : t('No unassigned ready shipments are currently available.', {
                                defaultValue: 'No unassigned ready shipments are currently available.',
                              })}
                        </p>
                      )}
                    </section>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={t('No matching shipments', { defaultValue: 'No matching shipments' })}
                  description={t('Try a different shipment number, customer, governorate, or area.', {
                    defaultValue: 'Try a different shipment number, customer, governorate, or area.',
                  })}
                />
              )}

              <div className="manifest-summary" aria-live="polite">
                <div className="compact-stats-row">
                  <div className="compact-stat">
                    <span className="compact-stat__label">{t('Selected', { defaultValue: 'Selected' })}</span>
                    <span className="compact-stat__value">{selectedShipments.length}</span>
                  </div>
                  <div className="compact-stat">
                    <span className="compact-stat__label">{t('Total COD', { defaultValue: 'Total COD' })}</span>
                    <span className="compact-stat__value"><MoneyDisplay value={selectedTotalCod} /></span>
                  </div>
                  <div className="compact-stat">
                    <span className="compact-stat__label">{t('Areas', { defaultValue: 'Areas' })}</span>
                    <span className="compact-stat__value">{selectedAreasCount}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          <FieldError error={errors.shipment_ids?.message ?? getFieldError('shipment_ids')} />
        </div>
        {formError ? <div className="form-error" role="alert">{formError}</div> : null}
        <div className="form-actions manifest-generate-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!selectedShipments.length}
          >
            {t('Generate Manifest', { defaultValue: 'Generate Manifest' })}
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
  const { t } = useTranslation()
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
    <Dialog open={open} onClose={onClose} title={<CardTitle>{t('Close Manifest', { defaultValue: 'Close Manifest' })}</CardTitle>} variant="small">
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <p>
          {t('Close {{manifestNumber}}? The backend will validate unresolved shipments and calculate the discrepancy automatically.', {
            manifestNumber: manifest?.manifest_number ?? '',
            defaultValue: `Close ${manifest?.manifest_number ?? ''}? The backend will validate unresolved shipments and calculate the discrepancy automatically.`,
          })}
        </p>
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

export function DriverManifestsPage() {
  const { t } = useTranslation()
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
        title={t('Driver Manifests')}
        description={t('Generate, close, and print daily driver manifests from the documented API flow.', {
          defaultValue: 'Generate, close, and print daily driver manifests from the documented API flow.',
        })}
        actions={(
          <Can permission={PERMISSIONS.DRIVER_MANIFESTS_CREATE}>
            <Button type="button" onClick={() => setGenerateOpen(true)}>
              {t('Generate Manifest', { defaultValue: 'Generate Manifest' })}
            </Button>
          </Can>
        )}
      />

      <Card variant="flat" className="dashboard-filter-card">
        <CardContent className="dashboard-filters">
          <label className="field">
            <span>{t('Driver', { defaultValue: 'Driver' })}</span>
            <DriverSelector
              value={filters.driver_id}
              includeAllOption
              onChange={(driver_id) => setFilters((current) => ({ ...current, driver_id }))}
            />
          </label>
          <label className="field">
            <span>{t('Manifest Date', { defaultValue: 'Manifest Date' })}</span>
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
            <span>{t('Status')}</span>
            <Select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="">{t('All statuses')}</option>
              <option value="open">{t('open', { defaultValue: 'open' })}</option>
              <option value="closed">{t('closed', { defaultValue: 'closed' })}</option>
            </Select>
          </label>
        </CardContent>
        <CardContent>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setFilters(initialFilters)}>
              {t('Reset filters')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="table-card">
        <CardHeader>
          <CardTitle>{t('Daily Manifests', { defaultValue: 'Daily Manifests' })}</CardTitle>
          <CardDescription>{t('Open and closed driver manifests with COD closure values.', {
            defaultValue: 'Open and closed driver manifests with COD closure values.',
          })}</CardDescription>
        </CardHeader>
        <CardContent>
          {manifestsQuery.isLoading ? <LoadingState title={t('Loading driver manifests', { defaultValue: 'Loading driver manifests' })} /> : null}
          {manifestsQuery.isError ? (
            <ErrorState
              title={t('Unable to load driver manifests', { defaultValue: 'Unable to load driver manifests' })}
              message={getApiErrorMessage(manifestsQuery.error)}
              onRetry={() => void manifestsQuery.refetch()}
            />
          ) : null}
          {!manifestsQuery.isLoading && !manifestsQuery.isError && !manifests.length ? (
            <EmptyState
              title={t('No manifests found', { defaultValue: 'No manifests found' })}
              description={t('No driver manifests matched the selected filters.', {
                defaultValue: 'No driver manifests matched the selected filters.',
              })}
            />
          ) : null}
          {manifests.length ? (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>{t('Manifest', { defaultValue: 'Manifest' })}</TableHead>
                    <TableHead>{t('Date')}</TableHead>
                    <TableHead>{t('Driver', { defaultValue: 'Driver' })}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Shipments')}</TableHead>
                    <TableHead>{t('Expected COD', { defaultValue: 'Expected COD' })}</TableHead>
                    <TableHead>{t('Actual Received', { defaultValue: 'Actual Received' })}</TableHead>
                    <TableHead>{t('Difference', { defaultValue: 'Difference' })}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
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
                            {t('View')}
                          </Link>
                          <Can permission={PERMISSIONS.DRIVER_MANIFESTS_PRINT}>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => setManifestPendingPrint(manifest)}
                            >
                              {t('Print')}
                            </Button>
                          </Can>
                          <Can permission={PERMISSIONS.DRIVER_MANIFESTS_CLOSE}>
                            {manifest.status === 'open' ? (
                              <Button
                                type="button"
                                variant="secondary"
                                disabled={!canCloseDriverManifest(manifest)}
                                title={!canCloseDriverManifest(manifest)
                                  ? t('All manifest shipments must be delivered before closing.', {
                                      defaultValue: 'All manifest shipments must be delivered before closing.',
                                    })
                                  : undefined}
                                onClick={() => setManifestPendingClose(manifest)}
                              >
                                {t('Close')}
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
      <DriverManifestPrintDialog
        filters={{
          dateFrom: filters.date_from,
          dateTo: filters.date_to,
          driverName: manifestPendingPrint?.driver.name,
          manifestDate: manifestPendingPrint?.manifest_date,
          status: filters.status || manifestPendingPrint?.status,
        }}
        manifest={manifestPendingPrint}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setManifestPendingPrint(null)
          }
        }}
        open={Boolean(manifestPendingPrint)}
      />
    </section>
  )
}
