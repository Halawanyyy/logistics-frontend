import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { MoneyDisplay } from '../../../../shared/components/display/MoneyDisplay'
import {
  FilterButton,
  FilterPopover,
  FilterField,
  AppliedFilterChips,
  DateRangeFilter,
  type AppliedChip,
} from '../../../../shared/components/filters'
import { LabelDocumentDialog } from '../../../../shared/components/labels/LabelDocumentDialog'
import { EmptyState } from '../../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { Button } from '../../../../shared/components/ui/Button'
import { DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '../../../../shared/components/ui/Dropdown'
import { Input } from '../../../../shared/components/ui/Input'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { SearchableSelect, type SearchableSelectOption } from '../../../../shared/components/ui/SearchableSelect'
import { Select } from '../../../../shared/components/ui/Select'
import { Table, TableCell, TableContainer, TableHead } from '../../../../shared/components/ui/Table'
import { useLocale } from '../../../../shared/i18n/useLocale'
import { merchantPath } from '../../../../shared/routing/paths'
import { formatDate } from '../../../../shared/utils/formatters'
import { CanMerchant } from '../../components/CanMerchant'
import {
  listMerchantPortalAreas,
  listMerchantPortalGovernorates,
  type MerchantPortalLocationOption,
} from '../../api/merchantPortal.api'
import { getMerchantPortalShipments, getMerchantPortalShipmentWaybill } from '../api/merchantPortalShipments.api'
import { MerchantShipmentStatusBadge } from '../components/MerchantShipmentStatusBadge'
import type { MerchantPortalShipment, MerchantPortalShipmentsFilters } from '../types/merchantPortalShipments.types'

type DetailedShipmentFilters = Required<Omit<MerchantPortalShipmentsFilters, 'page' | 'search'>>

const initialDetailedFilters: DetailedShipmentFilters = {
  status: '',
  date_from: '',
  date_to: '',
  tracking_number: '',
  order_number: '',
  customer_phone: '',
  delivery_governorate_id: '',
  delivery_area_id: '',
}

function buildLocationSelectOption(
  option: MerchantPortalLocationOption,
  useArabicLabel: boolean,
): SearchableSelectOption {
  const fallbackLabel = String(option.id)

  return {
    label: useArabicLabel
      ? option.name_ar || option.name || fallbackLabel
      : option.name || option.name_ar || fallbackLabel,
    value: String(option.id),
    keywords: [option.name, option.name_ar, fallbackLabel].filter(Boolean) as string[],
  }
}

export function MerchantShipmentsListPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const [searchParams] = useSearchParams()
  const searchText = searchParams.get('search') ?? ''
  const useArabicLabel = locale === 'ar'

  const [searchValue, setSearchValue] = useState(searchText)
  const [debouncedSearch, setDebouncedSearch] = useState(searchText)
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<DetailedShipmentFilters>(initialDetailedFilters)
  const [draftFilters, setDraftFilters] = useState<DetailedShipmentFilters>(initialDetailedFilters)
  const [filterError, setFilterError] = useState('')
  const [printState, setPrintState] = useState<{ shipment: MerchantPortalShipment; type: 'label' | 'waybill' } | null>(null)

  const draftGovernorateId = Number(draftFilters.delivery_governorate_id || 0)

  useEffect(() => {
    setSearchValue(searchText)
    setDebouncedSearch(searchText)
    setPage(1)
  }, [searchText])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchValue.trim())
      setPage(1)
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [searchValue])

  const params = useMemo<MerchantPortalShipmentsFilters>(() => ({
    ...(appliedFilters.status ? { status: appliedFilters.status } : {}),
    ...(appliedFilters.date_from ? { date_from: appliedFilters.date_from } : {}),
    ...(appliedFilters.date_to ? { date_to: appliedFilters.date_to } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(appliedFilters.tracking_number ? { tracking_number: appliedFilters.tracking_number } : {}),
    ...(appliedFilters.order_number ? { order_number: appliedFilters.order_number } : {}),
    ...(appliedFilters.customer_phone ? { customer_phone: appliedFilters.customer_phone } : {}),
    ...(appliedFilters.delivery_governorate_id ? { delivery_governorate_id: appliedFilters.delivery_governorate_id } : {}),
    ...(appliedFilters.delivery_area_id ? { delivery_area_id: appliedFilters.delivery_area_id } : {}),
    page,
  }), [appliedFilters, debouncedSearch, page])

  const shipmentsQuery = useQuery({
    queryKey: ['merchant-portal-shipments', params],
    queryFn: () => getMerchantPortalShipments(params),
  })
  
  const governoratesQuery = useQuery({
    queryKey: ['merchant-portal-governorates', 'shipments-list'],
    queryFn: listMerchantPortalGovernorates,
  })
  const areasQuery = useQuery({
    queryKey: ['merchant-portal-areas', 'shipments-list', draftGovernorateId],
    queryFn: () => listMerchantPortalAreas(draftGovernorateId),
    enabled: draftGovernorateId > 0,
  })

  const governorateOptions = useMemo(
    () => (governoratesQuery.data ?? []).map((option) => buildLocationSelectOption(option, useArabicLabel)),
    [governoratesQuery.data, useArabicLabel],
  )
  const areaOptions = useMemo(
    () => (areasQuery.data ?? []).map((option) => buildLocationSelectOption(option, useArabicLabel)),
    [areasQuery.data, useArabicLabel],
  )
  
  const shipments = shipmentsQuery.data?.data ?? []
  const pagination = shipmentsQuery.data?.meta
  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length
  const hasAppliedFilters = activeFilterCount > 0
  const hasQueryCriteria = hasAppliedFilters || Boolean(debouncedSearch)

  const statusOptions = [
    { value: '', label: t('All Statuses', { defaultValue: 'All Statuses' }) },
    { value: 'pending_pickup', label: t('Pending Pickup', { defaultValue: 'Pending Pickup' }) },
    { value: 'in_transit', label: t('In Transit', { defaultValue: 'In Transit' }) },
    { value: 'out_for_delivery', label: t('Out For Delivery', { defaultValue: 'Out For Delivery' }) },
    { value: 'delivered', label: t('Delivered', { defaultValue: 'Delivered' }) },
    { value: 'failed', label: t('Failed', { defaultValue: 'Failed' }) },
    { value: 'returned', label: t('Returned', { defaultValue: 'Returned' }) },
  ]

  const activeFilterChips: AppliedChip[] = []
  const statusLabel = statusOptions.find((option) => option.value === appliedFilters.status)?.label
  const governorateLabel = governorateOptions.find((option) => option.value === String(appliedFilters.delivery_governorate_id))?.label
  const areaLabel = areaOptions.find((option) => option.value === String(appliedFilters.delivery_area_id))?.label

  if (appliedFilters.status) activeFilterChips.push({ key: 'status', label: `${t('Status')}: ${statusLabel ?? appliedFilters.status}` })
  if (appliedFilters.date_from || appliedFilters.date_to) {
    activeFilterChips.push({
      key: 'date_range',
      label: `${t('Date')}: ${appliedFilters.date_from || ''} → ${appliedFilters.date_to || ''}`,
    })
  }
  if (appliedFilters.tracking_number) activeFilterChips.push({ key: 'tracking_number', label: `${t('Tracking Number', { defaultValue: 'Tracking Number' })}: ${appliedFilters.tracking_number}` })
  if (appliedFilters.order_number) activeFilterChips.push({ key: 'order_number', label: `${t('Order Number', { defaultValue: 'Order Number' })}: ${appliedFilters.order_number}` })
  if (appliedFilters.customer_phone) activeFilterChips.push({ key: 'customer_phone', label: `${t('Customer Phone', { defaultValue: 'Customer Phone' })}: ${appliedFilters.customer_phone}` })
  if (appliedFilters.delivery_governorate_id) activeFilterChips.push({ key: 'delivery_governorate_id', label: `${t('Delivery Governorate', { defaultValue: 'Delivery Governorate' })}: ${governorateLabel ?? appliedFilters.delivery_governorate_id}` })
  if (appliedFilters.delivery_area_id) activeFilterChips.push({ key: 'delivery_area_id', label: `${t('Delivery Area', { defaultValue: 'Delivery Area' })}: ${areaLabel ?? appliedFilters.delivery_area_id}` })

  function handleOpenChange(open: boolean) {
    setFiltersOpen(open)
    if (open) {
      setDraftFilters(appliedFilters)
      setFilterError('')
    }
  }

  function applyFilters() {
    if (draftFilters.date_from && draftFilters.date_to && draftFilters.date_from > draftFilters.date_to) {
      setFilterError(t('Date From must not be later than Date To.', {
        defaultValue: 'Date From must not be later than Date To.',
      }))
      return
    }

    setAppliedFilters({ ...draftFilters })
    setPage(1)
    setFilterError('')
    setFiltersOpen(false)
  }

  function resetFilters() {
    setDraftFilters(initialDetailedFilters)
    setAppliedFilters(initialDetailedFilters)
    setFilterError('')
    setPage(1)
    setFiltersOpen(false)
  }

  function removeFilter(key: string) {
    if (key === 'date_range') {
      setAppliedFilters((current) => ({ ...current, date_from: '', date_to: '' }))
    } else {
      setAppliedFilters((current) => ({ ...current, [key]: '' }))
    }
    setPage(1)
  }

  function clearAppliedFilters() {
    setAppliedFilters(initialDetailedFilters)
    setDraftFilters(initialDetailedFilters)
    setPage(1)
  }

  function clearAllCriteria() {
    clearAppliedFilters()
    setSearchValue('')
    setDebouncedSearch('')
  }

  return (
    <section className="page-section merchant-data-workspace shipments-workspace merchant-shipments-page">
      <PageHeader
        className="merchant-shipments-page__header"
        eyebrow={t('Merchant Portal', { defaultValue: 'Merchant Portal' })}
        title={t('Shipments', { defaultValue: 'Shipments' })}
        description={t('Track and review shipments created from your orders.', { defaultValue: 'Track and review shipments created from your orders.' })}
      />

      <div className="page-toolbar merchant-shipments-toolbar">
        <div className="merchant-shipments-search" style={{ flex: '1 1 280px' }}>
          <Search aria-hidden="true" className="merchant-shipments-search__icon" size={18} />
          <Input
            id="search"
            className="merchant-shipments-search__input"
            placeholder={t('Search by shipment number, tracking number, or customer', {
              defaultValue: 'Search by shipment number, tracking number, or customer',
            })}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
        </div>

        <div className="page-toolbar__actions">
          <FilterPopover
            title={t('Filter Shipments', { defaultValue: 'Filter Shipments' })}
            open={filtersOpen}
            onOpenChange={handleOpenChange}
            onApply={applyFilters}
            onReset={resetFilters}
            trigger={
              <FilterButton
                activeCount={activeFilterCount}
                onClick={() => handleOpenChange(!filtersOpen)}
              />
            }
          >
            <div className="space-y-4">
              <FilterField label={t('Shipment Status', { defaultValue: 'Shipment Status' })}>
                <Select
                  value={draftFilters.status}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </FilterField>

              <DateRangeFilter
                dateFrom={draftFilters.date_from}
                dateTo={draftFilters.date_to}
                error={filterError}
                onChange={({ date_from, date_to }) => {
                  setDraftFilters((current) => ({ ...current, date_from, date_to }))
                  setFilterError('')
                }}
              />

              <FilterField label={t('Tracking Number', { defaultValue: 'Tracking Number' })}>
                <Input
                  value={draftFilters.tracking_number}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, tracking_number: event.target.value }))}
                />
              </FilterField>

              <FilterField label={t('Order Number', { defaultValue: 'Order Number' })}>
                <Input
                  value={draftFilters.order_number}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, order_number: event.target.value }))}
                />
              </FilterField>

              <FilterField label={t('Customer Phone', { defaultValue: 'Customer Phone' })}>
                <Input
                  inputMode="tel"
                  value={draftFilters.customer_phone}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, customer_phone: event.target.value }))}
                />
              </FilterField>

              <FilterField label={t('Delivery Governorate', { defaultValue: 'Delivery Governorate' })}>
                <SearchableSelect
                  disabled={governoratesQuery.isLoading || governoratesQuery.isError}
                  emptyMessage={t('No options found.', { defaultValue: 'No options found.' })}
                  options={governorateOptions}
                  placeholder={governoratesQuery.isLoading
                    ? t('Loading locations...', { defaultValue: 'Loading locations...' })
                    : t('Select governorate', { defaultValue: 'Select governorate' })}
                  searchPlaceholder={t('Search governorates...', { defaultValue: 'Search governorates...' })}
                  value={draftFilters.delivery_governorate_id ? String(draftFilters.delivery_governorate_id) : ''}
                  onChange={(value) => setDraftFilters((current) => ({
                    ...current,
                    delivery_governorate_id: value,
                    delivery_area_id: '',
                  }))}
                />
              </FilterField>

              <FilterField label={t('Delivery Area', { defaultValue: 'Delivery Area' })}>
                <SearchableSelect
                  disabled={!draftGovernorateId || areasQuery.isLoading || areasQuery.isError}
                  emptyMessage={t('No options found.', { defaultValue: 'No options found.' })}
                  options={areaOptions}
                  placeholder={!draftGovernorateId
                    ? t('Select governorate first', { defaultValue: 'Select governorate first' })
                    : areasQuery.isLoading
                      ? t('Loading locations...', { defaultValue: 'Loading locations...' })
                      : t('Select area', { defaultValue: 'Select area' })}
                  searchPlaceholder={t('Search areas...', { defaultValue: 'Search areas...' })}
                  value={draftFilters.delivery_area_id ? String(draftFilters.delivery_area_id) : ''}
                  onChange={(value) => setDraftFilters((current) => ({ ...current, delivery_area_id: value }))}
                />
              </FilterField>
            </div>
          </FilterPopover>
        </div>
      </div>

      <AppliedFilterChips
        chips={activeFilterChips}
        onRemove={removeFilter}
        onClearAll={clearAppliedFilters}
      />

      <main className="page-main-content merchant-shipments-table-region">
        {shipmentsQuery.isLoading ? (
          <LoadingState title={t('Loading shipments...', { defaultValue: 'Loading shipments...' })} />
        ) : shipmentsQuery.isError ? (
          <ErrorState
            message={getApiErrorMessage(shipmentsQuery.error)}
            onRetry={() => void shipmentsQuery.refetch()}
          />
        ) : !shipments.length ? (
          <EmptyState
            title={hasQueryCriteria
              ? t('No shipments match these filters', { defaultValue: 'No shipments match these filters' })
              : t('No shipments yet', { defaultValue: 'No shipments yet' })}
            description={hasQueryCriteria
              ? t('Try changing or clearing the applied filters.', { defaultValue: 'Try changing or clearing the applied filters.' })
              : t('Shipments created from your orders will appear here.', { defaultValue: 'Shipments created from your orders will appear here.' })}
            action={hasQueryCriteria ? (
              <Button type="button" variant="secondary" onClick={clearAllCriteria}>
                {t('Clear filters', { defaultValue: 'Clear filters' })}
              </Button>
            ) : undefined}
          />
        ) : (
          <TableContainer className="merchant-data-table-scroll table-responsive-wrapper">
            <Table variant="striped">
              <thead>
                <tr>
                  <TableHead>{t('Shipment Number', { defaultValue: 'Shipment Number' })}</TableHead>
                  <TableHead>{t('Tracking Number', { defaultValue: 'Tracking Number' })}</TableHead>
                  <TableHead>{t('Customer', { defaultValue: 'Customer' })}</TableHead>
                  <TableHead>{t('Status', { defaultValue: 'Status' })}</TableHead>
                  <TableHead>{t('COD Amount', { defaultValue: 'COD Amount' })}</TableHead>
                  <TableHead>{t('Shipping Fee', { defaultValue: 'Shipping Fee' })}</TableHead>
                  <TableHead>{t('Created At', { defaultValue: 'Created At' })}</TableHead>
                  <TableHead>{t('Actions', { defaultValue: 'Actions' })}</TableHead>
                </tr>
              </thead>
              <tbody>
                {shipments.map((shipment) => (
                  <tr key={shipment.id}>
                    <TableCell>
                      <Link className="table-link font-medium" to={merchantPath(`/shipments/${shipment.id}`)}>
                        {shipment.shipment_number}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{shipment.tracking_number || '-'}</TableCell>
                    <TableCell>
                      <div className="merchant-shipment-customer-cell">
                        <span className="font-medium">{shipment.customer_name || '-'}</span>
                        {shipment.customer_phone ? (
                          <span className="text-xs text-muted">{shipment.customer_phone}</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <MerchantShipmentStatusBadge
                        status={shipment.status}
                        statusLabel={shipment.status_label}
                      />
                    </TableCell>
                    <TableCell>
                      <MoneyDisplay value={shipment.cod_amount} />
                    </TableCell>
                    <TableCell>
                      <MoneyDisplay value={shipment.shipping_fee} />
                    </TableCell>
                    <TableCell>{formatDate(shipment.created_at)}</TableCell>
                    <TableCell>
                      <DropdownMenu align="end">
                        <DropdownTrigger className="ui-btn ui-btn--secondary ui-btn--sm">
                          ...
                        </DropdownTrigger>
                        <DropdownContent>
                          <Link className="ui-link-reset" to={merchantPath(`/shipments/${shipment.id}`)}>
                            <DropdownItem>{t('View Details', { defaultValue: 'View Details' })}</DropdownItem>
                          </Link>
                          <CanMerchant capability="shipments.print_waybill">
                            <DropdownItem
                              onClick={() => setPrintState({ shipment, type: 'waybill' })}
                            >
                              {t('Print Waybill', { defaultValue: 'Print Waybill' })}
                            </DropdownItem>
                          </CanMerchant>
                        </DropdownContent>
                      </DropdownMenu>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        )}
      </main>

      {pagination && pagination.last_page > 1 ? (
        <nav
          aria-label={t('Shipments pagination', { defaultValue: 'Shipments pagination' })}
          className="merchant-shipments-pagination"
        >
          <span className="text-xs text-muted">
            {t('Page {{current}} of {{total}}', {
              current: pagination.current_page,
              defaultValue: `Page ${pagination.current_page} of ${pagination.last_page}`,
              total: pagination.last_page,
            })}
          </span>
          <div className="merchant-shipments-pagination__controls">
            <Button
              aria-label={t('Previous page')}
              disabled={pagination.current_page <= 1}
              size="sm"
              type="button"
              variant="secondary"
              onClick={() => setPage(Math.max(1, pagination.current_page - 1))}
            >
              {locale === 'ar' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              {t('Previous', { defaultValue: 'Previous' })}
            </Button>
            <span aria-current="page" className="merchant-shipments-pagination__current">
              {pagination.current_page}
            </span>
            <Button
              aria-label={t('Next page')}
              disabled={pagination.current_page >= pagination.last_page}
              size="sm"
              type="button"
              variant="secondary"
              onClick={() => setPage(Math.min(pagination.last_page, pagination.current_page + 1))}
            >
              {t('Next', { defaultValue: 'Next' })}
              {locale === 'ar' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </Button>
          </div>
        </nav>
      ) : null}

      {printState ? (
        <LabelDocumentDialog
          fetchDocument={(opts) => getMerchantPortalShipmentWaybill(printState.shipment.id, opts)}
          open={true}
          title={t('Print Waybill', { defaultValue: 'Print Waybill' })}
          triggerLabel={t('Print Waybill', { defaultValue: 'Print Waybill' })}
          onOpenChange={(open) => {
            if (!open) setPrintState(null)
          }}
        />
      ) : null}
    </section>
  )
}
