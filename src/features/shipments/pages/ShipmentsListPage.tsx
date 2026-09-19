import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { assignShipmentDriver, getShipmentsPrintList, listShipments, updateShipmentStatus } from '../api/shipments.api'
import { getShipmentLabel } from '../../../shared/api/labels.api'
import type { Shipment, ShipmentPrintListResponse, ShipmentStatus } from '../types/shipment.types'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import {
  FilterButton,
  FilterPopover,
  FilterField,
  AppliedFilterChips,
  DateRangeFilter,
  type AppliedChip,
} from '../../../shared/components/filters'
import { LabelDocumentDialog } from '../../../shared/components/labels/LabelDocumentDialog'
import { DriverSelector } from '../../../shared/components/selectors/DriverSelector'
import { GovernorateAreaSelector } from '../../../shared/components/selectors/GovernorateAreaSelector'
import { MerchantSelector } from '../../../shared/components/selectors/MerchantSelector'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { PrintView } from '../../../shared/components/print/PrintView'
import { Button } from '../../../shared/components/ui/Button'
import { BulkActionBar } from '../../../shared/components/ui/BulkActionBar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '../../../shared/components/ui/Dropdown'
import { Input } from '../../../shared/components/ui/Input'
import { Dialog } from '../../../shared/components/ui/Dialog'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { Select } from '../../../shared/components/ui/Select'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { pickDisplayLabel } from '../../../shared/i18n/locale'
import { useLocale } from '../../../shared/i18n/useLocale'
import { adminPath } from '../../../shared/routing/paths'
import { formatDate } from '../../../shared/utils/formatters'
import { buildBulkShipmentLabelDocument, getShipmentPrintableLabelDocument } from '../utils/shipmentLabel'

type AdvancedShipmentsFilters = {
  status: string
  order_type: string
  payment_type: string
  cod_only: string
  shipment_number: string
  partially_delivered: string
  merchant_id: string
  assigned_driver_id: string
  delivery_governorate_id: string
  delivery_area_id: string
  date_from: string
  date_to: string
}

const initialAdvancedFilters: AdvancedShipmentsFilters = {
  status: '',
  order_type: '',
  payment_type: '',
  cod_only: '',
  shipment_number: '',
  partially_delivered: '',
  merchant_id: '',
  assigned_driver_id: '',
  delivery_governorate_id: '',
  delivery_area_id: '',
  date_from: '',
  date_to: '',
}

const bulkShipmentStatuses: ShipmentStatus[] = [
  'pending_pickup',
  'driver_assigned',
  'picked_up',
  'arrived_at_hub',
  'sorting',
  'ready_for_dispatch',
  'in_transit',
  'out_for_delivery',
  'delivery_attempted',
  'rescheduled',
  'returned',
  'returned_to_hub',
  'returned_to_warehouse',
  'cancelled',
]

export function ShipmentsListPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const searchText = searchParams.get('search') ?? ''

  const [searchValue, setSearchValue] = useState(searchText)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<AdvancedShipmentsFilters>(initialAdvancedFilters)
  const [draftFilters, setDraftFilters] = useState<AdvancedShipmentsFilters>(initialAdvancedFilters)
  const [filterError, setFilterError] = useState('')

  const [selectedShipmentIds, setSelectedShipmentIds] = useState<number[]>([])
  const [selectedShipmentForLabel, setSelectedShipmentForLabel] = useState<Shipment | null>(null)
  const [isShipmentLabelDialogOpen, setIsShipmentLabelDialogOpen] = useState(false)
  const [isBulkLabelDialogOpen, setIsBulkLabelDialogOpen] = useState(false)
  const [bulkDialog, setBulkDialog] = useState<'assign-driver' | 'update-status' | null>(null)
  const [bulkDriverId, setBulkDriverId] = useState('')
  const [bulkStatus, setBulkStatus] = useState<ShipmentStatus>('in_transit')
  const [bulkStatusNotes, setBulkStatusNotes] = useState('')
  const [bulkMessage, setBulkMessage] = useState('')
  const [printValidation, setPrintValidation] = useState('')
  const [printData, setPrintData] = useState<ShipmentPrintListResponse['data'] | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    setSearchValue(searchText)
  }, [searchText])

  const params = useMemo(() => ({
    ...(searchValue ? { search: searchValue.trim() } : {}),
    ...(appliedFilters.status ? { status: appliedFilters.status } : {}),
    ...(appliedFilters.order_type ? { order_type: appliedFilters.order_type } : {}),
    ...(appliedFilters.payment_type ? { payment_type: appliedFilters.payment_type } : {}),
    ...(appliedFilters.cod_only ? { cod_only: appliedFilters.cod_only } : {}),
    ...(appliedFilters.shipment_number ? { shipment_number: appliedFilters.shipment_number } : {}),
    ...(appliedFilters.partially_delivered ? { partially_delivered: appliedFilters.partially_delivered } : {}),
    ...(appliedFilters.merchant_id ? { merchant_id: appliedFilters.merchant_id } : {}),
    ...(appliedFilters.assigned_driver_id ? { assigned_driver_id: appliedFilters.assigned_driver_id } : {}),
    ...(appliedFilters.delivery_governorate_id ? { delivery_governorate_id: appliedFilters.delivery_governorate_id } : {}),
    ...(appliedFilters.delivery_area_id ? { delivery_area_id: appliedFilters.delivery_area_id } : {}),
    ...(appliedFilters.date_from ? { date_from: appliedFilters.date_from } : {}),
    ...(appliedFilters.date_to ? { date_to: appliedFilters.date_to } : {}),
  }), [searchValue, appliedFilters])

  const query = useQuery({
    queryKey: ['shipments', params],
    queryFn: () => listShipments(params),
    placeholderData: (previousData) => previousData,
  })

  const printMutation = useMutation({
    mutationFn: getShipmentsPrintList,
    onSuccess: (response) => setPrintData(response.data),
  })

  const bulkAssignMutation = useMutation({
    mutationFn: async (driverId: number) => {
      const results = await Promise.allSettled(
        selectedShipmentIds.map((shipmentId) => assignShipmentDriver(shipmentId, { driver_id: driverId })),
      )
      return {
        driverId,
        attempted: selectedShipmentIds.length,
        failedIds: selectedShipmentIds.filter((_, index) => results[index]?.status === 'rejected'),
        succeededIds: selectedShipmentIds.filter((_, index) => results[index]?.status === 'fulfilled'),
      }
    },
    onSuccess: async ({ attempted, failedIds, succeededIds }) => {
      setBulkDialog(null)
      setBulkDriverId('')
      setSelectedShipmentIds((current) => current.filter((id) => !succeededIds.includes(id)))
      setBulkMessage(failedIds.length
        ? `${succeededIds.length} of ${attempted} shipments assigned to driver; ${failedIds.length} could not be updated.`
        : `${succeededIds.length} shipments assigned to driver successfully.`)
      await queryClient.invalidateQueries({ queryKey: ['shipments'] })
    },
  })

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ notes, status }: { status: ShipmentStatus; notes?: string }) => {
      const results = await Promise.allSettled(
        selectedShipmentIds.map((shipmentId) => updateShipmentStatus(shipmentId, { notes, status })),
      )
      return {
        status,
        attempted: selectedShipmentIds.length,
        failedIds: selectedShipmentIds.filter((_, index) => results[index]?.status === 'rejected'),
        succeededIds: selectedShipmentIds.filter((_, index) => results[index]?.status === 'fulfilled'),
      }
    },
    onSuccess: async ({ attempted, failedIds, status, succeededIds }) => {
      setBulkDialog(null)
      setBulkStatus('in_transit')
      setBulkStatusNotes('')
      setSelectedShipmentIds((current) => current.filter((id) => !succeededIds.includes(id)))
      setBulkMessage(failedIds.length
        ? `${succeededIds.length} of ${attempted} shipments moved to ${status}; ${failedIds.length} could not be updated.`
        : `${succeededIds.length} shipments moved to ${status} successfully.`)
      await queryClient.invalidateQueries({ queryKey: ['shipments'] })
    },
  })

  const shipments = useMemo(() => query.data?.data ?? [], [query.data?.data])
  const selectedShipments = useMemo(
    () => shipments.filter((shipment) => selectedShipmentIds.includes(shipment.id)),
    [selectedShipmentIds, shipments],
  )
  const allShipmentsSelected = shipments.length > 0
    && shipments.every((shipment) => selectedShipmentIds.includes(shipment.id))

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (appliedFilters.status) count += 1
    if (appliedFilters.order_type) count += 1
    if (appliedFilters.payment_type) count += 1
    if (appliedFilters.cod_only) count += 1
    if (appliedFilters.partially_delivered) count += 1
    if (appliedFilters.merchant_id) count += 1
    if (appliedFilters.shipment_number) count += 1
    if (appliedFilters.assigned_driver_id) count += 1
    if (appliedFilters.delivery_governorate_id || appliedFilters.delivery_area_id) count += 1
    if (appliedFilters.date_from || appliedFilters.date_to) count += 1
    return count
  }, [appliedFilters])

  const handleOpenChange = (open: boolean) => {
    setFiltersOpen(open)
    if (open) {
      setDraftFilters(appliedFilters)
      setFilterError('')
    }
  }

  const handleApply = () => {
    if (draftFilters.date_from && draftFilters.date_to && draftFilters.date_from > draftFilters.date_to) {
      setFilterError(t('Date From must not be later than Date To.', { defaultValue: 'Date From must not be later than Date To.' }))
      return
    }
    setFilterError('')
    setAppliedFilters(draftFilters)
    setFiltersOpen(false)
  }

  const handleReset = () => {
    setDraftFilters(initialAdvancedFilters)
    setAppliedFilters(initialAdvancedFilters)
    setFilterError('')
    setPrintData(null)
    setPrintValidation('')
    setFiltersOpen(false)
  }

  const appliedChips = useMemo<AppliedChip[]>(() => {
    const chips: AppliedChip[] = []
    if (appliedFilters.status) {
      chips.push({
        id: 'status',
        label: t('Status'),
        value: appliedFilters.status,
      })
    }
    if (appliedFilters.order_type) {
      chips.push({
        id: 'order_type',
        label: t('Order Type', { defaultValue: 'Order Type' }),
        value: appliedFilters.order_type,
      })
    }
    if (appliedFilters.payment_type) {
      chips.push({
        id: 'payment_type',
        label: t('Payment Type', { defaultValue: 'Payment Type' }),
        value: appliedFilters.payment_type,
      })
    }
    if (appliedFilters.cod_only) {
      chips.push({
        id: 'cod_only',
        label: t('COD Only', { defaultValue: 'COD Only' }),
        value: appliedFilters.cod_only === '1' ? t('Yes') : t('No'),
      })
    }
    if (appliedFilters.partially_delivered) {
      chips.push({
        id: 'partially_delivered',
        label: t('Partially Delivered', { defaultValue: 'Partially Delivered' }),
        value: appliedFilters.partially_delivered === '1' ? t('Yes') : t('No'),
      })
    }
    if (appliedFilters.shipment_number) {
      chips.push({
        id: 'shipment_number',
        label: t('Shipment Number', { defaultValue: 'Shipment Number' }),
        value: appliedFilters.shipment_number,
      })
    }
    if (appliedFilters.date_from || appliedFilters.date_to) {
      chips.push({
        id: 'date_range',
        label: t('Date'),
        value: `${appliedFilters.date_from || ''} → ${appliedFilters.date_to || ''}`,
      })
    }
    return chips
  }, [appliedFilters, t])

  const handleRemoveChip = (chipId: string) => {
    if (chipId === 'date_range') {
      setAppliedFilters((c) => ({ ...c, date_from: '', date_to: '' }))
    } else {
      setAppliedFilters((c) => ({ ...c, [chipId]: '' }))
    }
  }

  const handleClearAllChips = () => {
    setAppliedFilters(initialAdvancedFilters)
  }

  const requestPrintShipments = () => {
    if (!appliedFilters.date_to) {
      setPrintValidation(t('Date To is required to generate the print manifest.', { defaultValue: 'Date To is required to generate the print manifest.' }))
      return
    }

    setPrintValidation('')
    printMutation.mutate({
      assigned_driver_id: appliedFilters.assigned_driver_id ? Number(appliedFilters.assigned_driver_id) : undefined,
      date: appliedFilters.date_to,
      delivery_governorate_id: appliedFilters.delivery_governorate_id ? Number(appliedFilters.delivery_governorate_id) : undefined,
      status: (appliedFilters.status as ShipmentStatus) || undefined,
    })
  }

  return (
    <section className="page-section page-layout--fullwidth shipments-page">
      <PageHeader
        title={t('Shipments', { defaultValue: 'Shipments' })}
        description={t('Shipments with merchant, delivery, driver, and current operational status.', { defaultValue: 'Shipments with merchant, delivery, driver, and current operational status.' })}
        actions={
          <div className="flex items-center gap-2">
            <Can permission={PERMISSIONS.SHIPMENTS_PRINT}>
              <Button
                className="no-print"
                type="button"
                variant="secondary"
                loading={printMutation.isPending}
                disabled={!appliedFilters.date_to}
                onClick={requestPrintShipments}
                title={!appliedFilters.date_to ? t('Please select Date To before printing.', { defaultValue: 'Please select Date To before printing.' }) : undefined}
              >
                {t('Load Print Manifest', { defaultValue: 'Load Print Manifest' })}
              </Button>
            </Can>
          </div>
        }
      />

      {bulkMessage ? <div className="form-success">{bulkMessage}</div> : null}
      {printValidation ? <div className="form-error">{printValidation}</div> : null}
      {printMutation.error ? <div className="form-error">{getApiErrorMessage(printMutation.error)}</div> : null}

      {/* Toolbar: Search input + Filter button */}
      <div className="page-toolbar">
        <div style={{ position: 'relative', flex: '1 1 280px' }}>
          <Search size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, pointerEvents: 'none' }} />
          <Input
            placeholder={t('Search by shipment number, customer, or phone', { defaultValue: 'Search by shipment number, customer, or phone' })}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
        </div>

        <div className="page-toolbar__actions">
          <FilterPopover
            title={t('Filter Shipments', { defaultValue: 'Filter Shipments' })}
            open={filtersOpen}
            onOpenChange={handleOpenChange}
            onApply={handleApply}
            onReset={handleReset}
            trigger={
              <FilterButton
                activeCount={activeFilterCount}
                onClick={() => handleOpenChange(!filtersOpen)}
              />
            }
          >
            <div className="space-y-4">
              <FilterField label={t('Status')}>
                <Select value={draftFilters.status} onChange={(event) => setDraftFilters((c) => ({ ...c, status: event.target.value }))}>
                  <option value="">{t('All statuses')}</option>
                  <option value="pending_pickup">pending_pickup</option>
                  <option value="driver_assigned">driver_assigned</option>
                  <option value="picked_up">picked_up</option>
                  <option value="arrived_at_hub">arrived_at_hub</option>
                  <option value="sorting">sorting</option>
                  <option value="ready_for_dispatch">ready_for_dispatch</option>
                  <option value="in_transit">in_transit</option>
                  <option value="out_for_delivery">out_for_delivery</option>
                  <option value="delivery_attempted">delivery_attempted</option>
                  <option value="rescheduled">rescheduled</option>
                  <option value="delivered">delivered</option>
                  <option value="partially_delivered">partially_delivered</option>
                  <option value="failed">failed</option>
                  <option value="returned">returned</option>
                  <option value="returned_to_hub">returned_to_hub</option>
                  <option value="returned_to_warehouse">returned_to_warehouse</option>
                  <option value="cancelled">cancelled</option>
                </Select>
              </FilterField>

              <DateRangeFilter
                dateFrom={draftFilters.date_from}
                dateTo={draftFilters.date_to}
                error={filterError}
                onChange={({ date_from, date_to }) => {
                  setFilterError('')
                  setDraftFilters((c) => ({ ...c, date_from, date_to }))
                }}
              />

              <FilterField label={t('Order Type', { defaultValue: 'Order Type' })}>
                <Select value={draftFilters.order_type} onChange={(event) => setDraftFilters((c) => ({ ...c, order_type: event.target.value }))}>
                  <option value="">{t('All order types', { defaultValue: 'All order types' })}</option>
                  <option value="delivery">delivery</option>
                  <option value="swap">swap</option>
                  <option value="return">return</option>
                </Select>
              </FilterField>

              <FilterField label={t('Payment Type', { defaultValue: 'Payment Type' })}>
                <Select value={draftFilters.payment_type} onChange={(event) => setDraftFilters((c) => ({ ...c, payment_type: event.target.value }))}>
                  <option value="">{t('All payment types', { defaultValue: 'All payment types' })}</option>
                  <option value="cod">cod</option>
                  <option value="prepaid">prepaid</option>
                </Select>
              </FilterField>

              <FilterField label={t('COD Only', { defaultValue: 'COD Only' })}>
                <Select value={draftFilters.cod_only} onChange={(event) => setDraftFilters((c) => ({ ...c, cod_only: event.target.value }))}>
                  <option value="">{t('All shipments', { defaultValue: 'All shipments' })}</option>
                  <option value="1">{t('Yes', { defaultValue: 'Yes' })}</option>
                  <option value="0">{t('No', { defaultValue: 'No' })}</option>
                </Select>
              </FilterField>

              <FilterField label={t('Partially Delivered', { defaultValue: 'Partially Delivered' })}>
                <Select value={draftFilters.partially_delivered} onChange={(event) => setDraftFilters((c) => ({ ...c, partially_delivered: event.target.value }))}>
                  <option value="">{t('All shipments', { defaultValue: 'All shipments' })}</option>
                  <option value="1">{t('Yes', { defaultValue: 'Yes' })}</option>
                  <option value="0">{t('No', { defaultValue: 'No' })}</option>
                </Select>
              </FilterField>

              <FilterField label={t('Merchant')}>
                <MerchantSelector
                  value={draftFilters.merchant_id}
                  onChange={(merchant_id) => setDraftFilters((c) => ({ ...c, merchant_id }))}
                  includeAllOption
                />
              </FilterField>

              <FilterField label={t('Shipment Number', { defaultValue: 'Shipment Number' })}>
                <Input
                  value={draftFilters.shipment_number}
                  onChange={(event) => setDraftFilters((c) => ({ ...c, shipment_number: event.target.value }))}
                  placeholder={t('SHP-...', { defaultValue: 'SHP-...' })}
                />
              </FilterField>

              <FilterField label={t('Assigned Driver')}>
                <DriverSelector
                  value={draftFilters.assigned_driver_id}
                  onChange={(assigned_driver_id) => setDraftFilters((c) => ({ ...c, assigned_driver_id }))}
                  includeAllOption
                />
              </FilterField>

              <GovernorateAreaSelector
                governorateId={draftFilters.delivery_governorate_id}
                areaId={draftFilters.delivery_area_id}
                includeAllOption
                onChange={({ governorate_id, area_id }) => {
                  setDraftFilters((c) => ({
                    ...c,
                    delivery_governorate_id: governorate_id,
                    delivery_area_id: area_id,
                  }))
                }}
              />
            </div>
          </FilterPopover>
        </div>
      </div>

      <AppliedFilterChips
        chips={appliedChips}
        onRemove={handleRemoveChip}
        onClearAll={handleClearAllChips}
      />

      <main className="page-main-content">
        <Card className="table-card no-print">
          <CardHeader className="table-card__header">
            <CardTitle>{t('Shipments')}</CardTitle>
            <CardDescription>{t('Backend-filtered shipment records with driver, location, and status context.', { defaultValue: 'Backend-filtered shipment records with driver, location, and status context.' })}</CardDescription>
          </CardHeader>
          <CardContent>
            {query.isPending && !query.data ? <LoadingState title={t('Loading shipments', { defaultValue: 'Loading shipments' })} /> : null}
            {query.isError ? (
              <ErrorState
                title={t('Unable to load shipments', { defaultValue: 'Unable to load shipments' })}
                message={getApiErrorMessage(query.error)}
                onRetry={() => void query.refetch()}
              />
            ) : null}
            {!query.isPending && !query.isError && !shipments.length ? (
              <EmptyState
                title={t('No shipments found', { defaultValue: 'No shipments found' })}
                description={t('No shipments match the selected filters.', { defaultValue: 'No shipments match the selected filters.' })}
              />
            ) : null}
            {shipments.length ? (
              <TableContainer className="table-responsive-wrapper">
                <Table variant="striped">
                  <thead>
                    <tr>
                      <TableHead>
                        <input
                          aria-label={t('Select all shipments', { defaultValue: 'Select all shipments' })}
                          checked={allShipmentsSelected}
                          className="bulk-select-checkbox"
                          type="checkbox"
                          onChange={(event) => {
                            setSelectedShipmentIds(event.target.checked ? shipments.map((shipment) => shipment.id) : [])
                          }}
                        />
                      </TableHead>
                      <TableHead>{t('Shipment')}</TableHead>
                      <TableHead>{t('Merchant')}</TableHead>
                      <TableHead>{t('Location', { defaultValue: 'Location' })}</TableHead>
                      <TableHead>{t('Assigned Driver')}</TableHead>
                      <TableHead>{t('Status')}</TableHead>
                      <TableHead>{t('Created')}</TableHead>
                      <TableHead>{t('Actions')}</TableHead>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.map((shipment) => {
                      const isSelected = selectedShipmentIds.includes(shipment.id)
                      const locationLabel = [shipment.delivery_governorate_name, shipment.delivery_area_name].filter(Boolean).join(', ')

                      return (
                        <tr key={shipment.id} className={isSelected ? 'table-row--selected' : undefined}>
                          <TableCell>
                            <input
                              aria-label={t('Select shipment {{shipmentNumber}}', {
                                defaultValue: `Select shipment ${shipment.shipment_number}`,
                                shipmentNumber: shipment.shipment_number,
                              })}
                              checked={isSelected}
                              className="bulk-select-checkbox"
                              type="checkbox"
                              onChange={(event) => {
                                setSelectedShipmentIds((current) => (
                                  event.target.checked
                                    ? [...current, shipment.id]
                                    : current.filter((id) => id !== shipment.id)
                                ))
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Link className="table-link font-medium" to={adminPath(`/shipments/${shipment.id}`)}>
                              {shipment.shipment_number}
                            </Link>
                          </TableCell>
                          <TableCell>{shipment.merchant_name}</TableCell>
                          <TableCell>{locationLabel || '-'}</TableCell>
                          <TableCell>{shipment.assigned_driver_name ?? '-'}</TableCell>
                          <TableCell>
                            <StatusBadge value={shipment.status}>{shipment.status_label ?? shipment.status}</StatusBadge>
                          </TableCell>
                          <TableCell>{formatDate(shipment.created_at)}</TableCell>
                          <TableCell>
                            <DropdownMenu align="end">
                              <DropdownTrigger aria-label={t('Actions')} className="ui-btn ui-btn--secondary ui-btn--sm">
                                {t('Actions')}
                              </DropdownTrigger>
                              <DropdownContent>
                                <DropdownItem onClick={() => navigate(adminPath(`/shipments/${shipment.id}`))}>
                                  {t('View Details')}
                                </DropdownItem>
                                <Can permission={PERMISSIONS.SHIPMENTS_ASSIGN_DRIVER}>
                                  <DropdownItem
                                    onClick={() => {
                                      setSelectedShipmentIds([shipment.id])
                                      setBulkDriverId(shipment.assigned_driver_id ? String(shipment.assigned_driver_id) : '')
                                      setBulkDialog('assign-driver')
                                    }}
                                  >
                                    {t('Assign Driver', { defaultValue: 'Assign Driver' })}
                                  </DropdownItem>
                                </Can>
                                <Can permission={PERMISSIONS.SHIPMENTS_UPDATE_STATUS}>
                                  <DropdownItem
                                    onClick={() => {
                                      setSelectedShipmentIds([shipment.id])
                                      setBulkStatus(shipment.status)
                                      setBulkDialog('update-status')
                                    }}
                                  >
                                    {t('Update Status', { defaultValue: 'Update Status' })}
                                  </DropdownItem>
                                </Can>
                                <DropdownItem
                                  onClick={(event) => {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    setSelectedShipmentForLabel(shipment)
                                    setIsShipmentLabelDialogOpen(true)
                                  }}
                                >
                                  {t('Label', { defaultValue: 'Label' })}
                                </DropdownItem>
                              </DropdownContent>
                            </DropdownMenu>
                          </TableCell>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              </TableContainer>
            ) : null}
          </CardContent>
        </Card>

        <BulkActionBar
          selectedCount={selectedShipmentIds.length}
          onClear={() => setSelectedShipmentIds([])}
        >
          <Can permission={PERMISSIONS.SHIPMENTS_ASSIGN_DRIVER}>
            <Button size="sm" type="button" onClick={() => setBulkDialog('assign-driver')}>
              {t('Assign Driver', { defaultValue: 'Assign Driver' })}
            </Button>
          </Can>
          <Can permission={PERMISSIONS.SHIPMENTS_PRINT}>
            <Button size="sm" type="button" variant="secondary" onClick={() => setIsBulkLabelDialogOpen(true)}>
              {t('Print Labels', { defaultValue: 'Print Labels' })}
            </Button>
          </Can>
          <Can permission={PERMISSIONS.SHIPMENTS_UPDATE_STATUS}>
            <Button size="sm" type="button" variant="secondary" onClick={() => setBulkDialog('update-status')}>
              {t('Update Status', { defaultValue: 'Update Status' })}
            </Button>
          </Can>
        </BulkActionBar>

        <LabelDocumentDialog
          defaultFormat="html"
          fetchDocument={(options) => {
            if (!selectedShipmentForLabel) {
              throw new Error(t('No shipment selected for label.', { defaultValue: 'No shipment selected for label.' }))
            }

            return getShipmentPrintableLabelDocument({
              fetchDocument: (requestOptions) => getShipmentLabel(selectedShipmentForLabel.id, requestOptions),
              locale,
              options,
              shipment: selectedShipmentForLabel,
              t,
            })
          }}
          formats={['html', 'pdf']}
          hideTrigger
          onOpenChange={(nextOpen) => {
            setIsShipmentLabelDialogOpen(nextOpen)
            if (!nextOpen) {
              setSelectedShipmentForLabel(null)
            }
          }}
          open={isShipmentLabelDialogOpen}
          title={t('Shipment Waybill - {{shipmentNumber}}', {
            shipmentNumber: selectedShipmentForLabel?.shipment_number ?? '',
            defaultValue: selectedShipmentForLabel
              ? `Shipment Label - ${selectedShipmentForLabel.shipment_number}`
              : 'Shipment Waybill',
          })}
          triggerLabel={t('Waybill', { defaultValue: 'Waybill' })}
        />

        <LabelDocumentDialog
          defaultFormat="html"
          fetchDocument={(options) => buildBulkShipmentLabelDocument({
            dimensions: { heightMm: options.height_mm, widthMm: options.width_mm },
            locale,
            shipments: selectedShipments,
            t,
          })}
          formats={['html', 'pdf']}
          hideTrigger
          onOpenChange={setIsBulkLabelDialogOpen}
          open={isBulkLabelDialogOpen}
          title={t('Bulk Shipment Waybills ({{count}})', {
            count: selectedShipmentIds.length,
            defaultValue: `Bulk Shipment Waybills (${selectedShipmentIds.length})`,
          })}
          triggerLabel={t('Print Labels', { defaultValue: 'Print Labels' })}
        />

        <Dialog
          open={bulkDialog === 'assign-driver'}
          onClose={() => setBulkDialog(null)}
          title={<CardTitle>{t('Assign Driver to Selected Shipments', { defaultValue: 'Assign Driver to Selected Shipments' })}</CardTitle>}
          variant="small"
        >
          <form
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault()
              if (bulkDriverId) {
                bulkAssignMutation.mutate(Number(bulkDriverId))
              }
            }}
          >
            <p>{t('This driver will be assigned to {{count}} selected shipments.', {
              count: selectedShipmentIds.length,
              defaultValue: `This driver will be assigned to ${selectedShipmentIds.length} selected shipments.`,
            })}</p>
            <label className="field">
              <span>{t('Driver')}</span>
              <DriverSelector value={bulkDriverId} onChange={setBulkDriverId} />
            </label>
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => setBulkDialog(null)}>{t('Cancel')}</Button>
              <Button disabled={!bulkDriverId} loading={bulkAssignMutation.isPending} type="submit">
                {t('Assign Driver', { defaultValue: 'Assign Driver' })}
              </Button>
            </div>
          </form>
        </Dialog>

        <Dialog
          open={bulkDialog === 'update-status'}
          onClose={() => setBulkDialog(null)}
          title={<CardTitle>{t('Update Status for Selected Shipments', { defaultValue: 'Update Status for Selected Shipments' })}</CardTitle>}
          variant="small"
        >
          <form
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault()
              bulkStatusMutation.mutate({ notes: bulkStatusNotes || undefined, status: bulkStatus })
            }}
          >
            <label className="field">
              <span>{t('Status')}</span>
              <Select value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value as ShipmentStatus)}>
                {bulkShipmentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {pickDisplayLabel(status, status)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="field">
              <span>{t('Status Notes', { defaultValue: 'Status Notes' })}</span>
              <Input
                placeholder={t('Optional transition details', { defaultValue: 'Optional transition details' })}
                value={bulkStatusNotes}
                onChange={(event) => setBulkStatusNotes(event.target.value)}
              />
            </label>
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => setBulkDialog(null)}>{t('Cancel')}</Button>
              <Button loading={bulkStatusMutation.isPending} type="submit">
                {t('Update Status', { defaultValue: 'Update Status' })}
              </Button>
            </div>
          </form>
        </Dialog>

        {printData ? (
          <PrintView
            title={t('Shipments Manifest', { defaultValue: 'Shipments Manifest' })}
          >
            <Card className="print-manifest-card">
              <CardHeader>
                <div className="print-manifest-header">
                  <div>
                    <CardTitle>{t('Shipments Manifest', { defaultValue: 'Shipments Manifest' })}</CardTitle>
                    <CardDescription>{formatDate(printData.generated_at)}</CardDescription>
                  </div>
                  <Button className="no-print" type="button" variant="secondary" onClick={() => setPrintData(null)}>
                    {t('Close Print View', { defaultValue: 'Close Print View' })}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="stats-grid print-manifest-summary">
                  <Card variant="stat"><CardContent><div className="compact-stat"><span className="compact-stat__label">{t('Total Shipments')}</span><span className="compact-stat__value">{printData.summary.total_shipments}</span></div></CardContent></Card>
                  <Card variant="stat"><CardContent><div className="compact-stat"><span className="compact-stat__label">{t('Total COD')}</span><span className="compact-stat__value"><MoneyDisplay value={printData.summary.total_cod_amount} /></span></div></CardContent></Card>
                  <Card variant="stat"><CardContent><div className="compact-stat"><span className="compact-stat__label">{t('Total Fees')}</span><span className="compact-stat__value"><MoneyDisplay value={printData.summary.total_shipping_fee} /></span></div></CardContent></Card>
                </div>
                {printData.shipments.length ? (
                  <TableContainer>
                    <Table variant="compact">
                      <thead>
                        <tr>
                          <TableHead>{t('Shipment')}</TableHead>
                          <TableHead>{t('Merchant')}</TableHead>
                          <TableHead>{t('Customer')}</TableHead>
                          <TableHead>{t('Phone')}</TableHead>
                          <TableHead>{t('Governorate')}</TableHead>
                          <TableHead>{t('Area')}</TableHead>
                          <TableHead>{t('Address')}</TableHead>
                          <TableHead>{t('Driver')}</TableHead>
                          <TableHead>{t('Merchant Phone', { defaultValue: 'Merchant Phone' })}</TableHead>
                          <TableHead>{t('COD')}</TableHead>
                        </tr>
                      </thead>
                      <tbody>
                        {printData.shipments.map((shipment, index) => (
                          <tr key={`${shipment.shipment_number}-${index}`}>
                            <TableCell>{shipment.shipment_number}</TableCell>
                            <TableCell>{shipment.merchant_name}</TableCell>
                            <TableCell>{shipment.customer_name}</TableCell>
                            <TableCell>{shipment.customer_phone}</TableCell>
                            <TableCell>{shipment.delivery_governorate_name}</TableCell>
                            <TableCell>{shipment.delivery_area_name ?? '-'}</TableCell>
                            <TableCell>
                              {shipment.delivery_address}
                            </TableCell>
                            <TableCell>{shipment.driver_name ?? '-'}</TableCell>
                            <TableCell>{shipment.merchant_phone ?? '-'}</TableCell>
                            <TableCell><MoneyDisplay value={shipment.cod_amount} /></TableCell>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </TableContainer>
                ) : (
                  <EmptyState
                    title={t('No shipments found for selected print filters', { defaultValue: 'No shipments found for selected print filters' })}
                    description={t('Try another print date, driver, location, or status.', { defaultValue: 'Try another print date, driver, location, or status.' })}
                  />
                )}
              </CardContent>
            </Card>
          </PrintView>
        ) : null}
      </main>
    </section>
  )
}
