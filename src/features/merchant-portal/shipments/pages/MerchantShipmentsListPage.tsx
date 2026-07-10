import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { MoneyDisplay } from '../../../../shared/components/display/MoneyDisplay'
import { DateRangeFilter } from '../../../../shared/components/filters/DateRangeFilter'
import { LabelDocumentDialog } from '../../../../shared/components/labels/LabelDocumentDialog'
import { EmptyState } from '../../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { Button } from '../../../../shared/components/ui/Button'
import { DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '../../../../shared/components/ui/Dropdown'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../shared/components/ui/Card'
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
import { getMerchantPortalShipments, getMerchantPortalShipmentLabel, getMerchantPortalShipmentWaybill } from '../api/merchantPortalShipments.api'
import { MerchantShipmentStatusBadge } from '../components/MerchantShipmentStatusBadge'
import type { MerchantPortalShipment, MerchantPortalShipmentsFilters } from '../types/merchantPortalShipments.types'

const initialFilters: Required<Omit<MerchantPortalShipmentsFilters, 'page'>> = {
  status: '',
  search: '',
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

  const [filters, setFilters] = useState<MerchantPortalShipmentsFilters>(() => ({
    ...initialFilters,
    search: searchText,
    page: 1,
  }))

  const [printState, setPrintState] = useState<{ shipment: MerchantPortalShipment; type: 'label' | 'waybill' } | null>(null)

  const selectedGovernorateId = Number(filters.delivery_governorate_id || 0)

  const params = useMemo(() => ({
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.date_from ? { date_from: filters.date_from } : {}),
    ...(filters.date_to ? { date_to: filters.date_to } : {}),
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.tracking_number ? { tracking_number: filters.tracking_number } : {}),
    ...(filters.order_number ? { order_number: filters.order_number } : {}),
    ...(filters.customer_phone ? { customer_phone: filters.customer_phone } : {}),
    ...(filters.delivery_governorate_id ? { delivery_governorate_id: filters.delivery_governorate_id } : {}),
    ...(filters.delivery_area_id ? { delivery_area_id: filters.delivery_area_id } : {}),
    page: filters.page,
  }), [filters])

  const shipmentsQuery = useQuery({
    queryKey: ['merchant-portal-shipments', params],
    queryFn: () => getMerchantPortalShipments(params),
  })
  
  const governoratesQuery = useQuery({
    queryKey: ['merchant-portal-governorates', 'shipments-list'],
    queryFn: listMerchantPortalGovernorates,
  })
  const areasQuery = useQuery({
    queryKey: ['merchant-portal-areas', 'shipments-list', selectedGovernorateId],
    queryFn: () => listMerchantPortalAreas(selectedGovernorateId),
    enabled: selectedGovernorateId > 0,
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

  function handleFilterChange(key: keyof MerchantPortalShipmentsFilters, value: string | number) {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }))
  }

  return (
    <section className="page-section page-section--with-sidebar">
      <PageHeader
        eyebrow={t('Merchant Portal', { defaultValue: 'Merchant Portal' })}
        title={t('Shipments', { defaultValue: 'Shipments' })}
        description={t('Track and review shipments created from your orders.', { defaultValue: 'Track and review shipments created from your orders.' })}
      />

      <aside className="page-sidebar-filters">
        <Card variant="flat" className="dashboard-filter-card">
          <CardHeader>
            <CardTitle>{t('Filters', { defaultValue: 'Filters' })}</CardTitle>
            <CardDescription>
              {t('Merchant-safe filters applied with merchant portal query params only.', {
                defaultValue: 'Merchant-safe filters applied with merchant portal query params only.',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="dashboard-filters dashboard-filters--sidebar">
            <label className="field">
              <span>{t('Search', { defaultValue: 'Search' })}</span>
              <Input
                placeholder={t('Search...', { defaultValue: 'Search...' })}
                type="search"
                value={filters.search || ''}
                onChange={(event) => handleFilterChange('search', event.target.value)}
              />
            </label>

            <label className="field">
              <span>{t('Status', { defaultValue: 'Status' })}</span>
              <Select value={filters.status || ''} onChange={(event) => handleFilterChange('status', event.target.value)}>
                <option value="">{t('All statuses', { defaultValue: 'All statuses' })}</option>
                <option value="pending_pickup">{t('Pending Pickup', { defaultValue: 'Pending Pickup' })}</option>
                <option value="picked_up">{t('Picked Up', { defaultValue: 'Picked Up' })}</option>
                <option value="in_transit">{t('In Transit', { defaultValue: 'In Transit' })}</option>
                <option value="delivered">{t('Delivered', { defaultValue: 'Delivered' })}</option>
                <option value="failed">{t('Failed', { defaultValue: 'Failed' })}</option>
                <option value="returned">{t('Returned', { defaultValue: 'Returned' })}</option>
                <option value="cancelled">{t('Cancelled', { defaultValue: 'Cancelled' })}</option>
              </Select>
            </label>

            <DateRangeFilter
              dateFrom={filters.date_from}
              dateTo={filters.date_to}
              onChange={({ date_from, date_to }) => setFilters((current) => ({ ...current, date_from, date_to, page: 1 }))}
            />

            <label className="field">
              <span>{t('Tracking Number', { defaultValue: 'Tracking Number' })}</span>
              <Input
                value={filters.tracking_number || ''}
                onChange={(event) => handleFilterChange('tracking_number', event.target.value)}
              />
            </label>

            <label className="field">
              <span>{t('Order Number', { defaultValue: 'Order Number' })}</span>
              <Input
                value={filters.order_number || ''}
                onChange={(event) => handleFilterChange('order_number', event.target.value)}
              />
            </label>

            <label className="field">
              <span>{t('Customer Phone', { defaultValue: 'Customer Phone' })}</span>
              <Input
                value={filters.customer_phone || ''}
                onChange={(event) => handleFilterChange('customer_phone', event.target.value)}
              />
            </label>

            <label className="field">
              <span>{t('Delivery Governorate', { defaultValue: 'Delivery Governorate' })}</span>
              <SearchableSelect
                value={filters.delivery_governorate_id ? String(filters.delivery_governorate_id) : ''}
                options={governorateOptions}
                placeholder={governoratesQuery.isLoading
                  ? t('Loading locations...', { defaultValue: 'Loading locations...' })
                  : t('Select governorate', { defaultValue: 'Select governorate' })}
                searchPlaceholder={t('Search governorates...', { defaultValue: 'Search governorates...' })}
                emptyMessage={t('No options found.', { defaultValue: 'No options found.' })}
                disabled={governoratesQuery.isLoading || governoratesQuery.isError}
                onChange={(value) => setFilters((current) => ({
                  ...current,
                  delivery_governorate_id: value,
                  delivery_area_id: '',
                  page: 1,
                }))}
              />
            </label>

            <label className="field">
              <span>{t('Delivery Area', { defaultValue: 'Delivery Area' })}</span>
              <SearchableSelect
                value={filters.delivery_area_id ? String(filters.delivery_area_id) : ''}
                options={areaOptions}
                placeholder={!selectedGovernorateId
                  ? t('Select governorate first', { defaultValue: 'Select governorate first' })
                  : areasQuery.isLoading
                    ? t('Loading locations...', { defaultValue: 'Loading locations...' })
                    : t('Select area', { defaultValue: 'Select area' })}
                searchPlaceholder={t('Search areas...', { defaultValue: 'Search areas...' })}
                emptyMessage={t('No options found.', { defaultValue: 'No options found.' })}
                disabled={!selectedGovernorateId || areasQuery.isLoading || areasQuery.isError}
                onChange={(value) => handleFilterChange('delivery_area_id', value)}
              />
            </label>
          </CardContent>
          <CardContent>
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => setFilters({ ...initialFilters, page: 1 })}>
                {t('Reset filters', { defaultValue: 'Reset filters' })}
              </Button>
            </div>
          </CardContent>
        </Card>
      </aside>

      <main className="page-main-content">
        <Card className="table-card">
          <CardHeader className="table-card__header">
            <div>
              <CardTitle>{t('Shipments', { defaultValue: 'Shipments' })}</CardTitle>
              <CardDescription>
                {t('Read-only merchant shipments tracking list.', {
                  defaultValue: 'Read-only merchant shipments tracking list.',
                })}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {shipmentsQuery.isLoading ? (
              <LoadingState title={t('Loading Shipments', { defaultValue: 'Loading Shipments' })} />
            ) : shipmentsQuery.isError ? (
              <ErrorState 
                title={t('Failed to load shipments.', { defaultValue: 'Failed to load shipments.' })}
                message={getApiErrorMessage(shipmentsQuery.error)} 
                onRetry={() => void shipmentsQuery.refetch()} 
              />
            ) : !shipments.length ? (
              <EmptyState
                title={t('No shipments found.', { defaultValue: 'No shipments found.' })}
                description={t('No shipments matched the selected filters.', { defaultValue: 'No shipments matched the selected filters.' })}
              />
            ) : (
              <TableContainer style={{ opacity: shipmentsQuery.isFetching ? 0.5 : 1 }}>
                <Table variant="striped">
                  <thead>
                    <tr>
                      <TableHead>{t('Tracking Number', { defaultValue: 'Tracking Number' })}</TableHead>
                      <TableHead>{t('Customer', { defaultValue: 'Customer' })}</TableHead>
                      <TableHead>{t('Destination', { defaultValue: 'Destination' })}</TableHead>
                      <TableHead>{t('COD', { defaultValue: 'COD' })}</TableHead>
                      <TableHead>{t('Status', { defaultValue: 'Status' })}</TableHead>
                      <TableHead>{t('Created', { defaultValue: 'Created' })}</TableHead>
                      <TableHead className="text-right">{t('Actions', { defaultValue: 'Actions' })}</TableHead>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.map((shipment: MerchantPortalShipment) => (
                      <tr key={shipment.id}>
                        <TableCell>
                          <Link className="table-link" to={merchantPath('/shipments/' + shipment.id)}>
                            {shipment.shipment_number}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div style={{ fontWeight: 500 }}>{shipment.customer_name || '-'}</div>
                          <div className="text-muted" style={{ fontSize: '0.875rem' }}>{shipment.customer_phone || '-'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                            {shipment.delivery_location_summary?.governorate_name || shipment.delivery_governorate_name || '-'}, {shipment.delivery_location_summary?.area_name || shipment.delivery_area_name || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <MoneyDisplay value={shipment.cod_amount} />
                        </TableCell>
                        <TableCell>
                          <MerchantShipmentStatusBadge status={shipment.status} statusLabel={shipment.status_label} />
                        </TableCell>
                        <TableCell>
                          {formatDate(shipment.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu align="end">
                            <DropdownTrigger className="ui-btn ui-btn--secondary ui-btn--sm">
                              ...
                            </DropdownTrigger>
                            <DropdownContent>
                              <Link className="ui-link-reset" to={merchantPath('/shipments/' + shipment.id)}>
                                <DropdownItem>{t('View', { defaultValue: 'View' })}</DropdownItem>
                              </Link>
                              <CanMerchant capability="labels.print">
                                <DropdownItem
                                  onClick={() => setPrintState({ shipment, type: 'label' })}
                                >
                                  {t('Print Label', { defaultValue: 'Print Label' })}
                                </DropdownItem>
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
          </CardContent>
        </Card>
      </main>

      {printState ? (
        <LabelDocumentDialog
          hideTrigger
          open={!!printState}
          onOpenChange={(open) => {
            if (!open) setPrintState(null)
          }}
          fetchDocument={(opts) => 
            printState.type === 'label'
              ? getMerchantPortalShipmentLabel(printState.shipment.id, opts)
              : getMerchantPortalShipmentWaybill(printState.shipment.id, opts)
          }
          title={printState.type === 'label' 
            ? t('Print Label', { defaultValue: 'Print Label' }) 
            : t('Print Waybill', { defaultValue: 'Print Waybill' })}
        />
      ) : null}
    </section>
  )
}
