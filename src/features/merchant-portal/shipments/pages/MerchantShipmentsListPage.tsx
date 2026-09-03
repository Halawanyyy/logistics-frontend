import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { MoneyDisplay } from '../../../../shared/components/display/MoneyDisplay'
import { DateRangeFilter } from '../../../../shared/components/filters/DateRangeFilter'
import { LabelDocumentDialog } from '../../../../shared/components/labels/LabelDocumentDialog'
import { EmptyState } from '../../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { Button } from '../../../../shared/components/ui/Button'
import { DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '../../../../shared/components/ui/Dropdown'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/Card'
import { Input } from '../../../../shared/components/ui/Input'
import { PageHeader } from '../../../../shared/components/ui/PageHeader'
import { SearchableSelect, type SearchableSelectOption } from '../../../../shared/components/ui/SearchableSelect'
import { Select } from '../../../../shared/components/ui/Select'
import { Table, TableCell, TableContainer, TableHead } from '../../../../shared/components/ui/Table'
import { ActionToolbar } from '../../../../shared/components/ui/ActionToolbar'
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

  const hasActiveFilters = Object.values(filters).some((val) => Boolean(val) && val !== 1)

  return (
    <section className="page-section page-section--with-sidebar merchant-data-workspace shipments-workspace">
      <PageHeader
        eyebrow={t('Merchant Portal', { defaultValue: 'Merchant Portal' })}
        title={t('Shipments', { defaultValue: 'Shipments' })}
        description={t('Track and review shipments created from your orders.', { defaultValue: 'Track and review shipments created from your orders.' })}
      />

      <ActionToolbar
        title={t('Shipments Workspace')}
        searchComponent={
          <Input
            id="search"
            placeholder={t('Search by shipment number, tracking number, or phone...')}
            value={filters.search ?? ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        }
        filterComponents={
          <>
            <Select
              id="status"
              className="w-44"
              value={filters.status ?? ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">{t('All Statuses')}</option>
              <option value="pending_pickup">{t('Pending Pickup')}</option>
              <option value="in_transit">{t('In Transit')}</option>
              <option value="out_for_delivery">{t('Out For Delivery')}</option>
              <option value="delivered">{t('Delivered')}</option>
              <option value="failed">{t('Failed')}</option>
              <option value="returned">{t('Returned')}</option>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={() => setFilters({ ...initialFilters, page: 1 })}>
                <RotateCcw size={15} />
                {t('Clear Filters')}
              </Button>
            )}
          </>
        }
      />

      <aside className="page-sidebar-filters mt-4">
        <Card variant="flat" className="dashboard-filter-card">
          <CardHeader>
            <CardTitle>{t('Location & Advanced Filters', { defaultValue: 'Location & Advanced Filters' })}</CardTitle>
          </CardHeader>
          <CardContent className="dashboard-filters dashboard-filters--sidebar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

            <DateRangeFilter
              dateFrom={filters.date_from || ''}
              dateTo={filters.date_to || ''}
              onChange={({ date_from, date_to }) => setFilters((current) => ({
                ...current,
                date_from,
                date_to,
                page: 1,
              }))}
            />

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
        </Card>
      </aside>

      <main className="page-main-content mt-4">
        {shipmentsQuery.isLoading ? (
          <LoadingState title={t('Loading shipments...', { defaultValue: 'Loading shipments...' })} />
        ) : shipmentsQuery.isError ? (
          <ErrorState
            message={getApiErrorMessage(shipmentsQuery.error)}
            onRetry={() => void shipmentsQuery.refetch()}
          />
        ) : !shipments.length ? (
          <EmptyState
            title={t('No shipments found', { defaultValue: 'No shipments found' })}
            description={t('No shipments match your current criteria.', { defaultValue: 'No shipments match your current criteria.' })}
          />
        ) : (
          <TableContainer className="merchant-data-table-scroll">
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
                      <Link className="table-link" to={merchantPath(`/shipments/${shipment.id}`)}>
                        {shipment.shipment_number}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{shipment.tracking_number || '-'}</TableCell>
                    <TableCell>{shipment.customer_name || '-'}</TableCell>
                    <TableCell>
                      <MerchantShipmentStatusBadge status={shipment.status} statusLabel={shipment.status_label} />
                    </TableCell>
                    <TableCell><MoneyDisplay value={shipment.cod_amount} /></TableCell>
                    <TableCell><MoneyDisplay value={shipment.shipping_fee} /></TableCell>
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
                          <CanMerchant capability="labels.print">
                            <DropdownItem onClick={() => setPrintState({ shipment, type: 'waybill' })}>
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
