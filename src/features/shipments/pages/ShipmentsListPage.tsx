import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { assignShipmentDriver, getShipmentsPrintList, listShipments, updateShipmentStatus } from '../api/shipments.api'
import { getShipmentLabel } from '../../../shared/api/labels.api'
import type { Shipment, ShipmentPrintListResponse, ShipmentStatus } from '../types/shipment.types'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { DateRangeFilter } from '../../../shared/components/filters/DateRangeFilter'
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
import { Dropdown, DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '../../../shared/components/ui/Dropdown'
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

function logShipmentLabelEntry(message: string, details?: Record<string, unknown>) {
  if (!import.meta.env.DEV || typeof console === 'undefined') {
    return
  }

  console.info('[shipment-label]', message, details ?? {})
}

type ShipmentsListFilters = {
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
  search: string
}

const initialFilters: ShipmentsListFilters = {
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
  search: '',
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
  const [filters, setFilters] = useState(() => ({
    ...initialFilters,
    search: searchText,
  }))
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
  const params = useMemo(() => ({
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.order_type ? { order_type: filters.order_type } : {}),
    ...(filters.payment_type ? { payment_type: filters.payment_type } : {}),
    ...(filters.cod_only ? { cod_only: filters.cod_only } : {}),
    ...(filters.shipment_number ? { shipment_number: filters.shipment_number } : {}),
    ...(filters.partially_delivered ? { partially_delivered: filters.partially_delivered } : {}),
    ...(filters.merchant_id ? { merchant_id: filters.merchant_id } : {}),
    ...(filters.assigned_driver_id ? { assigned_driver_id: filters.assigned_driver_id } : {}),
    ...(filters.delivery_governorate_id ? { delivery_governorate_id: filters.delivery_governorate_id } : {}),
    ...(filters.delivery_area_id ? { delivery_area_id: filters.delivery_area_id } : {}),
    ...(filters.date_from ? { date_from: filters.date_from } : {}),
    ...(filters.date_to ? { date_to: filters.date_to } : {}),
    ...(filters.search ? { search: filters.search } : {}),
  }), [filters])
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
        failedIds: selectedShipmentIds.filter((_, index) => results[index]?.status === 'rejected'),
        succeeded: results.filter((result) => result.status === 'fulfilled').length,
      }
    },
    onSuccess: async ({ failedIds, succeeded }) => {
      setSelectedShipmentIds(failedIds)
      setBulkDialog(null)
      setBulkDriverId('')
      setBulkMessage(failedIds.length
        ? `${succeeded} shipments assigned; ${failedIds.length} could not be updated.`
        : `${succeeded} shipments assigned successfully.`)
      await queryClient.invalidateQueries({ queryKey: ['shipments'] })
    },
  })
  const bulkStatusMutation = useMutation({
    mutationFn: async (status: ShipmentStatus) => {
      const results = await Promise.allSettled(
        selectedShipmentIds.map((shipmentId) => updateShipmentStatus(shipmentId, {
          status,
          ...(bulkStatusNotes.trim() ? { notes: bulkStatusNotes.trim() } : {}),
        })),
      )
      return {
        failedIds: selectedShipmentIds.filter((_, index) => results[index]?.status === 'rejected'),
        succeeded: results.filter((result) => result.status === 'fulfilled').length,
      }
    },
    onSuccess: async ({ failedIds, succeeded }) => {
      setSelectedShipmentIds(failedIds)
      setBulkDialog(null)
      setBulkStatusNotes('')
      setBulkMessage(failedIds.length
        ? `${succeeded} shipment statuses updated; ${failedIds.length} could not be updated.`
        : `${succeeded} shipment statuses updated successfully.`)
      await queryClient.invalidateQueries({ queryKey: ['shipments'] })
    },
  })

  function requestPrintShipments() {
    if (!filters.date_to) {
      setPrintValidation('Please select Date To before printing.')
      return
    }

    setPrintValidation('')
    printMutation.mutate({
      date: filters.date_to,
      ...(filters.assigned_driver_id ? { assigned_driver_id: filters.assigned_driver_id } : {}),
      ...(filters.merchant_id ? { merchant_id: filters.merchant_id } : {}),
      ...(filters.delivery_governorate_id ? { delivery_governorate_id: filters.delivery_governorate_id } : {}),
      ...(filters.delivery_area_id ? { delivery_area_id: filters.delivery_area_id } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    })
  }

  const shipments = useMemo(() => query.data?.data ?? [], [query.data?.data])
  const selectedShipments = useMemo(
    () => shipments.filter((shipment) => selectedShipmentIds.includes(shipment.id)),
    [selectedShipmentIds, shipments],
  )
  const allShipmentsSelected = shipments.length > 0
    && shipments.every((shipment) => selectedShipmentIds.includes(shipment.id))

  useEffect(() => {
    setFilters((current) => (
      current.search === searchText
        ? current
        : {
          ...current,
          search: searchText,
        }
    ))
  }, [searchText])

  return (
    <section className="page-section page-section--with-sidebar shipments-page">
      <PageHeader
        title={t('Shipments', { defaultValue: 'Shipments' })}
        description={t('Shipments with merchant, delivery, driver, and current operational status.', { defaultValue: 'Shipments with merchant, delivery, driver, and current operational status.' })}
      />

      <aside className="page-sidebar-filters">
        <Card variant="flat" className="dashboard-filter-card no-print">
          <CardHeader>
            <CardTitle>{t('Filters')}</CardTitle>
            <CardDescription>{t('Filters are applied with local state and backend query params without reloading the page.', { defaultValue: 'Filters are applied with local state and backend query params without reloading the page.' })}</CardDescription>
          </CardHeader>
          <CardContent className="dashboard-filters dashboard-filters--sidebar">
          <label className="field">
            <span>{t('Status')}</span>
            <Select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
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
          </label>

          <label className="field">
            <span>{t('Order Type', { defaultValue: 'Order Type' })}</span>
            <Select value={filters.order_type} onChange={(event) => setFilters((current) => ({ ...current, order_type: event.target.value }))}>
              <option value="">{t('All order types', { defaultValue: 'All order types' })}</option>
              <option value="delivery">delivery</option>
              <option value="swap">swap</option>
              <option value="return">return</option>
            </Select>
          </label>

          <label className="field">
            <span>{t('Payment Type', { defaultValue: 'Payment Type' })}</span>
            <Select value={filters.payment_type} onChange={(event) => setFilters((current) => ({ ...current, payment_type: event.target.value }))}>
              <option value="">{t('All payment types', { defaultValue: 'All payment types' })}</option>
              <option value="cod">cod</option>
              <option value="prepaid">prepaid</option>
            </Select>
          </label>

          <label className="field">
            <span>{t('COD Only', { defaultValue: 'COD Only' })}</span>
            <Select value={filters.cod_only} onChange={(event) => setFilters((current) => ({ ...current, cod_only: event.target.value }))}>
              <option value="">{t('All shipments', { defaultValue: 'All shipments' })}</option>
              <option value="1">{t('Yes', { defaultValue: 'Yes' })}</option>
              <option value="0">{t('No', { defaultValue: 'No' })}</option>
            </Select>
          </label>

          <label className="field">
            <span>{t('Partially Delivered', { defaultValue: 'Partially Delivered' })}</span>
            <Select value={filters.partially_delivered} onChange={(event) => setFilters((current) => ({ ...current, partially_delivered: event.target.value }))}>
              <option value="">{t('All shipments', { defaultValue: 'All shipments' })}</option>
              <option value="1">{t('Yes', { defaultValue: 'Yes' })}</option>
              <option value="0">{t('No', { defaultValue: 'No' })}</option>
            </Select>
          </label>

          <label className="field">
            <span>{t('Merchant')}</span>
            <MerchantSelector
              value={filters.merchant_id}
              onChange={(merchant_id) => setFilters((current) => ({ ...current, merchant_id }))}
              includeAllOption
            />
          </label>

          <label className="field">
            <span>{t('Shipment Number', { defaultValue: 'Shipment Number' })}</span>
            <Input
              value={filters.shipment_number}
              onChange={(event) => setFilters((current) => ({ ...current, shipment_number: event.target.value }))}
              placeholder={t('SHP-...', { defaultValue: 'SHP-...' })}
            />
          </label>

          <label className="field">
            <span>{t('Assigned Driver')}</span>
            <DriverSelector
              value={filters.assigned_driver_id}
              onChange={(assigned_driver_id) => setFilters((current) => ({ ...current, assigned_driver_id }))}
              includeAllOption
            />
          </label>

          <GovernorateAreaSelector
            governorateId={filters.delivery_governorate_id}
            areaId={filters.delivery_area_id}
            includeAllOption
            onChange={({ governorate_id, area_id }) => {
              setFilters((current) => ({
                ...current,
                delivery_governorate_id: governorate_id,
                delivery_area_id: area_id,
              }))
            }}
          />

          <label className="field">
            <span>{t('Search')}</span>
            <Input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder={t('Shipment number, customer, or phone', { defaultValue: 'Shipment number, customer, or phone' })}
            />
          </label>

          <DateRangeFilter
            dateFrom={filters.date_from}
            dateTo={filters.date_to}
            onChange={({ date_from, date_to }) => {
              setFilters((current) => ({ ...current, date_from, date_to }))
              setPrintValidation('')
            }}
          />
        </CardContent>
        <CardContent>
          {bulkMessage ? <div className="form-success">{bulkMessage}</div> : null}
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => { setFilters(initialFilters); setPrintData(null); setPrintValidation('') }}>
              {t('Reset filters')}
            </Button>
            {selectedShipmentIds.length ? (
              <LabelDocumentDialog
                defaultFormat="html"
                fetchDocument={(options) => {
                  return buildBulkShipmentLabelDocument({
                    dimensions: {
                      heightMm: options.height_mm,
                      widthMm: options.width_mm,
                    },
                    locale,
                    shipments: selectedShipments,
                    t,
                  })
                }}
                formats={['html', 'pdf']}
                title={t('Bulk Shipment Waybills ({{count}})', {
                  count: selectedShipmentIds.length,
                  defaultValue: `Bulk Shipment Waybills (${selectedShipmentIds.length})`,
                })}
                triggerLabel={t('Bulk Waybills ({{count}})', {
                  count: selectedShipmentIds.length,
                  defaultValue: `Bulk Waybills (${selectedShipmentIds.length})`,
                })}
              />
            ) : null}
            <Can permission={PERMISSIONS.SHIPMENTS_PRINT}>
              <span title={!filters.date_to ? t('Please select Date To before printing.', { defaultValue: 'Please select Date To before printing.' }) : undefined}>
                <Button
                  className="no-print"
                  type="button"
                  variant="secondary"
                  loading={printMutation.isPending}
                  disabled={!filters.date_to}
                  onClick={requestPrintShipments}
                >
                  {t('Load Print Manifest', { defaultValue: 'Load Print Manifest' })}
                </Button>
              </span>
            </Can>
          </div>
          {!filters.date_to ? <div className="empty-state-inline">{t('Please select Date To before printing.', { defaultValue: 'Please select Date To before printing.' })}</div> : null}
          {printValidation ? <div className="form-error">{printValidation}</div> : null}
          {printMutation.error ? <div className="form-error">{getApiErrorMessage(printMutation.error)}</div> : null}
        </CardContent>
        </Card>
      </aside>

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
            <TableContainer>
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
                  {shipments.map((shipment) => (
                    <tr key={shipment.id}>
                      <TableCell>
                        <input
                          aria-label={t('Select shipment {{shipmentNumber}}', {
                            shipmentNumber: shipment.shipment_number,
                            defaultValue: `Select shipment ${shipment.shipment_number}`,
                          })}
                          checked={selectedShipmentIds.includes(shipment.id)}
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
                        <Link className="table-link" to={adminPath(`/shipments/${shipment.id}`)}>
                          {shipment.shipment_number}
                        </Link>
                      </TableCell>
                      <TableCell>{shipment.merchant_name}</TableCell>
                      <TableCell>
                        {shipment.delivery_governorate_name}
                        <p className="table-meta">{shipment.delivery_area_name ?? '-'}</p>
                      </TableCell>
                      <TableCell>{shipment.assigned_driver_name ?? '-'}</TableCell>
                      <TableCell>
                        <StatusBadge value={shipment.status}>
                          {pickDisplayLabel(shipment.status, shipment.status_label)}
                        </StatusBadge>
                        {(shipment.payment_type || shipment.payment_type_label) ? (
                          <p className="table-meta">
                            <StatusBadge value={shipment.payment_type}>
                              {pickDisplayLabel(shipment.payment_type, shipment.payment_type_label)}
                            </StatusBadge>
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>{formatDate(shipment.created_at)}</TableCell>
                      <TableCell>
                        <Dropdown>
                          <DropdownMenu>
                            <DropdownTrigger>...</DropdownTrigger>
                            <DropdownContent>
                              <DropdownItem
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  logShipmentLabelEntry('shipment-label label action clicked', {
                                    shipmentId: shipment.id,
                                    shipmentNumber: shipment.shipment_number,
                                  })
                                  setSelectedShipmentForLabel(shipment)
                                  setIsShipmentLabelDialogOpen(true)
                                }}
                              >
                                {t('Label', { defaultValue: 'Label' })}
                              </DropdownItem>
                              <DropdownItem
                                onClick={() => {
                                  logShipmentLabelEntry('shipment-actions view clicked', {
                                    shipmentId: shipment.id,
                                  })
                                  navigate(adminPath(`/shipments/${shipment.id}`))
                                }}
                              >
                                {t('View')}
                              </DropdownItem>
                            </DropdownContent>
                          </DropdownMenu>
                        </Dropdown>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          ) : null}
        </CardContent>
      </Card>

      <LabelDocumentDialog
        defaultFormat="html"
        fetchDocument={(options) => {
          if (!selectedShipmentForLabel) {
            throw new Error(t('No shipment selected for label.', { defaultValue: 'No shipment selected for label.' }))
          }

          logShipmentLabelEntry('ShipmentsListPage label action invoked', {
            shipmentId: selectedShipmentForLabel.id,
            shipmentNumber: selectedShipmentForLabel.shipment_number,
          })

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
        title={<CardTitle>{t('Update Selected Shipments', { defaultValue: 'Update Selected Shipments' })}</CardTitle>}
        variant="small"
      >
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault()
            bulkStatusMutation.mutate(bulkStatus)
          }}
        >
          <p>{t('The new status will be applied to {{count}} selected shipments.', {
            count: selectedShipmentIds.length,
            defaultValue: `The new status will be applied to ${selectedShipmentIds.length} selected shipments.`,
          })}</p>
          <label className="field">
            <span>{t('Status')}</span>
            <Select value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value as ShipmentStatus)}>
              {bulkShipmentStatuses.map((status) => <option key={status} value={status}>{t(status, { defaultValue: status })}</option>)}
            </Select>
          </label>
          <label className="field">
            <span>{t('Notes')}</span>
            <Input value={bulkStatusNotes} onChange={(event) => setBulkStatusNotes(event.target.value)} />
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
        <PrintView title={t('Shipments Manifest', { defaultValue: 'Shipments Manifest' })} className="print-manifest">
          <Card>
            <CardHeader className="section-title-row">
              <div>
                <CardTitle>{t('Shipments Manifest', { defaultValue: 'Shipments Manifest' })}</CardTitle>
                <CardDescription>
                  {t('Generated {{date}} for {{filterDate}}', {
                    date: formatDate(printData.generated_at),
                    filterDate: printData.filters.date,
                    defaultValue: `Generated ${formatDate(printData.generated_at)} for ${printData.filters.date}`,
                  })}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="stats-grid">
                <div className="insight-tile">
                  <p>{t('Total Shipments', { defaultValue: 'Total Shipments' })}</p>
                  <strong>{printData.summary.total_shipments}</strong>
                </div>
                <div className="insight-tile">
                  <p>{t('Total COD', { defaultValue: 'Total COD' })}</p>
                  <strong><MoneyDisplay value={printData.summary.total_cod_amount} /></strong>
                </div>
                <div className="insight-tile">
                  <p>{t('Total Shipping', { defaultValue: 'Total Shipping' })}</p>
                  <strong><MoneyDisplay value={printData.summary.total_shipping_fee} /></strong>
                </div>
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
