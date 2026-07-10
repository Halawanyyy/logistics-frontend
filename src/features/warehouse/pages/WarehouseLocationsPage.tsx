import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getWarehouseBinLabel } from '../../../shared/api/labels.api'
import { listWarehouses, createWarehouseBin, createWarehouseShelf, createWarehouseZone, listWarehouseBins, listWarehouseShelves, listWarehouseZones } from '../api/warehouse.api'
import type {
  CreateWarehouseBinRequest,
  CreateWarehouseShelfRequest,
  CreateWarehouseZoneRequest,
  WarehouseBin,
  WarehouseFilters,
  WarehouseLocationStatus,
  WarehouseShelf,
  WarehouseZone,
} from '../types/warehouse.types'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Dialog } from '../../../shared/components/ui/Dialog'
import { Input } from '../../../shared/components/ui/Input'
import { LabelDocumentDialog } from '../../../shared/components/labels/LabelDocumentDialog'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { SearchableSelect } from '../../../shared/components/ui/SearchableSelect'
import { Select } from '../../../shared/components/ui/Select'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { useFormApiErrors } from '../../../shared/hooks/useFormApiErrors'
import { pickDisplayLabel } from '../../../shared/i18n/locale'
import { useLocale } from '../../../shared/i18n/useLocale'
import { adminPath } from '../../../shared/routing/paths'
import { formatDate } from '../../../shared/utils/formatters'
import { getBinPrintableLabelDocument } from '../utils/binLabel'

type LocationsTab = 'zones' | 'shelves' | 'bins'

type LocationsFiltersState = {
  warehouse_id: string
  zone_id: string
  shelf_id: string
  status: string
}

type ZoneFormValues = {
  warehouse_id: number
  name: string
  code: string
  status: WarehouseLocationStatus
  notes: string
}

type ShelfFormValues = {
  warehouse_id: number
  warehouse_zone_id: number
  name: string
  code: string
  status: WarehouseLocationStatus
  notes: string
}

type BinFormValues = {
  warehouse_id: number
  warehouse_zone_id: number
  warehouse_shelf_id: number
  name: string
  code: string
  barcode: string
  status: WarehouseLocationStatus
  notes: string
}

const initialFilters: LocationsFiltersState = {
  warehouse_id: '',
  zone_id: '',
  shelf_id: '',
  status: '',
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <Button type="button" variant={active ? 'primary' : 'secondary'} onClick={onClick}>
      {label}
    </Button>
  )
}

function CreateZoneDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
}: {
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: ZoneFormValues) => void
  open: boolean
}) {
  const { t } = useTranslation()
  const warehousesQuery = useQuery({
    queryKey: ['warehouses', 'locations-zone'],
    queryFn: listWarehouses,
    enabled: open,
  })
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ZoneFormValues>({
    defaultValues: {
      warehouse_id: 0,
      name: '',
      code: '',
      status: 'active',
      notes: '',
    },
  })
  const { formError, getFieldError } = useFormApiErrors(error)

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>{t('Create Warehouse Zone', { defaultValue: 'Create Warehouse Zone' })}</CardTitle>}>
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>Warehouse</span>
          <Controller
            name="warehouse_id"
            control={control}
            rules={{ validate: (value) => value > 0 || 'Warehouse is required.' }}
            render={({ field }) => (
              <SearchableSelect
                value={field.value > 0 ? String(field.value) : ''}
                placeholder="Select warehouse"
                searchPlaceholder="Search warehouses..."
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
                options={[
                  { label: 'Select warehouse', value: '' },
                  ...((warehousesQuery.data?.data ?? []).map((warehouse) => ({
                    label: warehouse.name,
                    value: String(warehouse.id),
                    keywords: [warehouse.code ?? ''],
                  }))),
                ]}
              />
            )}
          />
          <FieldError error={errors.warehouse_id?.message ?? getFieldError('warehouse_id')} />
        </label>
        <label className="field">
          <span>Name</span>
          <Input {...register('name', { required: 'Name is required.' })} />
          <FieldError error={errors.name?.message ?? getFieldError('name')} />
        </label>
        <label className="field">
          <span>Code</span>
          <Input {...register('code', { required: 'Code is required.' })} />
          <FieldError error={errors.code?.message ?? getFieldError('code')} />
        </label>
        <label className="field">
          <span>Status</span>
          <Select {...register('status')}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </Select>
        </label>
        <label className="field">
          <span>Notes</span>
          <Input {...register('notes')} />
        </label>
        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>Create Zone</Button>
        </div>
      </form>
    </Dialog>
  )
}

function CreateShelfDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
}: {
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: ShelfFormValues) => void
  open: boolean
}) {
  const { t } = useTranslation()
  const warehousesQuery = useQuery({
    queryKey: ['warehouses', 'locations-shelf'],
    queryFn: listWarehouses,
    enabled: open,
  })
  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ShelfFormValues>({
    defaultValues: {
      warehouse_id: 0,
      warehouse_zone_id: 0,
      name: '',
      code: '',
      status: 'active',
      notes: '',
    },
  })
  const selectedWarehouseId = watch('warehouse_id')
  const zonesQuery = useQuery({
    queryKey: ['warehouse-zones', 'dialog', selectedWarehouseId],
    queryFn: () => listWarehouseZones({ warehouse_id: selectedWarehouseId }),
    enabled: open && selectedWarehouseId > 0,
  })
  const { formError, getFieldError } = useFormApiErrors(error)

  useEffect(() => {
    setValue('warehouse_zone_id', 0)
  }, [selectedWarehouseId, setValue])

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>{t('Create Warehouse Shelf', { defaultValue: 'Create Warehouse Shelf' })}</CardTitle>}>
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>Warehouse</span>
          <Controller
            name="warehouse_id"
            control={control}
            rules={{ validate: (value) => value > 0 || 'Warehouse is required.' }}
            render={({ field }) => (
              <SearchableSelect
                value={field.value > 0 ? String(field.value) : ''}
                placeholder="Select warehouse"
                searchPlaceholder="Search warehouses..."
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
                options={[
                  { label: 'Select warehouse', value: '' },
                  ...((warehousesQuery.data?.data ?? []).map((warehouse) => ({
                    label: warehouse.name,
                    value: String(warehouse.id),
                    keywords: [warehouse.code ?? ''],
                  }))),
                ]}
              />
            )}
          />
          <FieldError error={errors.warehouse_id?.message ?? getFieldError('warehouse_id')} />
        </label>
        <label className="field">
          <span>Zone</span>
          <Controller
            name="warehouse_zone_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                value={field.value > 0 ? String(field.value) : ''}
                placeholder="No zone"
                searchPlaceholder="Search zones..."
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
                options={[
                  { label: 'No zone', value: '' },
                  ...((zonesQuery.data?.data ?? []).map((zone) => ({
                    label: zone.name,
                    value: String(zone.id),
                    keywords: [zone.code ?? ''],
                  }))),
                ]}
              />
            )}
          />
          <p className="table-meta">Zone is optional for shelves.</p>
          <FieldError error={errors.warehouse_zone_id?.message ?? getFieldError('warehouse_zone_id')} />
        </label>
        <label className="field">
          <span>Name</span>
          <Input {...register('name', { required: 'Name is required.' })} />
          <FieldError error={errors.name?.message ?? getFieldError('name')} />
        </label>
        <label className="field">
          <span>Code</span>
          <Input {...register('code', { required: 'Code is required.' })} />
          <FieldError error={errors.code?.message ?? getFieldError('code')} />
        </label>
        <label className="field">
          <span>Status</span>
          <Select {...register('status')}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </Select>
        </label>
        <label className="field">
          <span>Notes</span>
          <Input {...register('notes')} />
        </label>
        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>Create Shelf</Button>
        </div>
      </form>
    </Dialog>
  )
}

function CreateBinDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
}: {
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: BinFormValues) => void
  open: boolean
}) {
  const { t } = useTranslation()
  const warehousesQuery = useQuery({
    queryKey: ['warehouses', 'locations-bin'],
    queryFn: listWarehouses,
    enabled: open,
  })
  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BinFormValues>({
    defaultValues: {
      warehouse_id: 0,
      warehouse_zone_id: 0,
      warehouse_shelf_id: 0,
      name: '',
      code: '',
      barcode: '',
      status: 'active',
      notes: '',
    },
  })
  const selectedWarehouseId = watch('warehouse_id')
  const selectedZoneId = watch('warehouse_zone_id')
  const zonesQuery = useQuery({
    queryKey: ['warehouse-zones', 'bin-dialog', selectedWarehouseId],
    queryFn: () => listWarehouseZones({ warehouse_id: selectedWarehouseId }),
    enabled: open && selectedWarehouseId > 0,
  })
  const shelvesQuery = useQuery({
    queryKey: ['warehouse-shelves', 'bin-dialog', selectedWarehouseId, selectedZoneId],
    queryFn: () => listWarehouseShelves({
      warehouse_id: selectedWarehouseId,
      ...(selectedZoneId > 0 ? { zone_id: selectedZoneId } : {}),
    }),
    enabled: open && selectedWarehouseId > 0,
  })
  const { formError, getFieldError } = useFormApiErrors(error)

  useEffect(() => {
    setValue('warehouse_zone_id', 0)
    setValue('warehouse_shelf_id', 0)
  }, [selectedWarehouseId, setValue])

  useEffect(() => {
    setValue('warehouse_shelf_id', 0)
  }, [selectedZoneId, setValue])

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>{t('Create Warehouse Bin', { defaultValue: 'Create Warehouse Bin' })}</CardTitle>}>
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>Warehouse</span>
          <Controller
            name="warehouse_id"
            control={control}
            rules={{ validate: (value) => value > 0 || 'Warehouse is required.' }}
            render={({ field }) => (
              <SearchableSelect
                value={field.value > 0 ? String(field.value) : ''}
                placeholder="Select warehouse"
                searchPlaceholder="Search warehouses..."
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
                options={[
                  { label: 'Select warehouse', value: '' },
                  ...((warehousesQuery.data?.data ?? []).map((warehouse) => ({
                    label: warehouse.name,
                    value: String(warehouse.id),
                    keywords: [warehouse.code ?? ''],
                  }))),
                ]}
              />
            )}
          />
          <FieldError error={errors.warehouse_id?.message ?? getFieldError('warehouse_id')} />
        </label>
        <label className="field">
          <span>Zone</span>
          <Controller
            name="warehouse_zone_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                value={field.value > 0 ? String(field.value) : ''}
                placeholder="No zone"
                searchPlaceholder="Search zones..."
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
                options={[
                  { label: 'No zone', value: '' },
                  ...((zonesQuery.data?.data ?? []).map((zone) => ({
                    label: zone.name,
                    value: String(zone.id),
                    keywords: [zone.code ?? ''],
                  }))),
                ]}
              />
            )}
          />
          <FieldError error={errors.warehouse_zone_id?.message ?? getFieldError('warehouse_zone_id')} />
        </label>
        <label className="field">
          <span>Shelf</span>
          <Controller
            name="warehouse_shelf_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                value={field.value > 0 ? String(field.value) : ''}
                placeholder="No shelf"
                searchPlaceholder="Search shelves..."
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
                options={[
                  { label: 'No shelf', value: '' },
                  ...((shelvesQuery.data?.data ?? []).map((shelf) => ({
                    label: shelf.name,
                    value: String(shelf.id),
                    keywords: [shelf.code ?? ''],
                  }))),
                ]}
              />
            )}
          />
          <FieldError error={errors.warehouse_shelf_id?.message ?? getFieldError('warehouse_shelf_id')} />
        </label>
        <label className="field">
          <span>Name</span>
          <Input {...register('name', { required: 'Name is required.' })} />
          <FieldError error={errors.name?.message ?? getFieldError('name')} />
        </label>
        <label className="field">
          <span>Code</span>
          <Input {...register('code', { required: 'Code is required.' })} />
          <FieldError error={errors.code?.message ?? getFieldError('code')} />
        </label>
        <label className="field">
          <span>Barcode</span>
          <Input {...register('barcode')} />
          <p className="table-meta">Leave empty to auto-generate barcode.</p>
          <FieldError error={errors.barcode?.message ?? getFieldError('barcode')} />
        </label>
        <label className="field">
          <span>Status</span>
          <Select {...register('status')}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </Select>
        </label>
        <label className="field">
          <span>Notes</span>
          <Input {...register('notes')} />
        </label>
        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>Create Bin</Button>
        </div>
      </form>
    </Dialog>
  )
}

export function WarehouseLocationsPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab')
  const [tab, setTab] = useState<LocationsTab>(
    initialTab === 'shelves' || initialTab === 'bins' ? initialTab : 'zones',
  )
  const [filters, setFilters] = useState<LocationsFiltersState>(initialFilters)
  const [createZoneOpen, setCreateZoneOpen] = useState(false)
  const [createShelfOpen, setCreateShelfOpen] = useState(false)
  const [createBinOpen, setCreateBinOpen] = useState(false)
  const params: WarehouseFilters = useMemo(
    () => ({
      ...(filters.warehouse_id ? { warehouse_id: filters.warehouse_id } : {}),
      ...(filters.zone_id ? { zone_id: filters.zone_id } : {}),
      ...(filters.shelf_id ? { shelf_id: filters.shelf_id } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    }),
    [filters],
  )
  const warehousesQuery = useQuery({
    queryKey: ['warehouses', 'locations-page'],
    queryFn: listWarehouses,
  })
  const zonesQuery = useQuery({
    queryKey: ['warehouse-zones', params],
    queryFn: () => listWarehouseZones(params),
    enabled: tab === 'zones' || tab === 'shelves' || tab === 'bins',
  })
  const shelvesQuery = useQuery({
    queryKey: ['warehouse-shelves', params],
    queryFn: () => listWarehouseShelves(params),
    enabled: tab === 'shelves' || tab === 'bins',
  })
  const binsQuery = useQuery({
    queryKey: ['warehouse-bins', params],
    queryFn: () => listWarehouseBins(params),
    enabled: tab === 'bins',
  })
  const zoneMutation = useMutation({
    mutationFn: (values: ZoneFormValues) => {
      const payload: CreateWarehouseZoneRequest = {
        warehouse_id: values.warehouse_id,
        name: values.name,
        code: values.code,
        status: values.status,
        notes: values.notes || undefined,
      }
      return createWarehouseZone(payload)
    },
    onSuccess: async () => {
      setCreateZoneOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['warehouse-zones'] })
    },
  })
  const shelfMutation = useMutation({
    mutationFn: (values: ShelfFormValues) => {
      const payload: CreateWarehouseShelfRequest = {
        warehouse_id: values.warehouse_id,
        ...(values.warehouse_zone_id > 0 ? { warehouse_zone_id: values.warehouse_zone_id } : {}),
        name: values.name,
        code: values.code,
        status: values.status,
        notes: values.notes || undefined,
      }
      return createWarehouseShelf(payload)
    },
    onSuccess: async () => {
      setCreateShelfOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['warehouse-shelves'] })
    },
  })
  const binMutation = useMutation({
    mutationFn: (values: BinFormValues) => {
      const payload: CreateWarehouseBinRequest = {
        warehouse_id: values.warehouse_id,
        ...(values.warehouse_zone_id > 0 ? { warehouse_zone_id: values.warehouse_zone_id } : {}),
        ...(values.warehouse_shelf_id > 0 ? { warehouse_shelf_id: values.warehouse_shelf_id } : {}),
        name: values.name,
        code: values.code,
        barcode: values.barcode || undefined,
        status: values.status,
        notes: values.notes || undefined,
      }
      return createWarehouseBin(payload)
    },
    onSuccess: async () => {
      setCreateBinOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['warehouse-bins'] })
    },
  })
  const zones = zonesQuery.data?.data ?? []
  const shelves = shelvesQuery.data?.data ?? []
  const bins = binsQuery.data?.data ?? []

  useEffect(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('tab', tab)
      return next
    }, { replace: true })
  }, [setSearchParams, tab])

  return (
    <section className="page-section">
      <PageHeader
        title={t('Warehouse Locations', { defaultValue: 'Warehouse Locations' })}
        description={t('Zones, shelves, and bins used by warehouse storage operations.', { defaultValue: 'Zones, shelves, and bins used by warehouse storage operations.' })}
        actions={(
          <Can permission={PERMISSIONS.WAREHOUSE_LOCATIONS_CREATE}>
            <div className="page-header__button-row">
              {tab === 'zones' ? <Button type="button" onClick={() => setCreateZoneOpen(true)}>{t('Create Zone', { defaultValue: 'Create Zone' })}</Button> : null}
              {tab === 'shelves' ? <Button type="button" onClick={() => setCreateShelfOpen(true)}>{t('Create Shelf', { defaultValue: 'Create Shelf' })}</Button> : null}
              {tab === 'bins' ? <Button type="button" onClick={() => setCreateBinOpen(true)}>{t('Create Bin', { defaultValue: 'Create Bin' })}</Button> : null}
            </div>
          </Can>
        )}
      />

      <Card variant="flat" className="dashboard-filter-card">
        <CardContent className="dashboard-filters">
          <label className="field">
            <span>{t('Warehouse', { defaultValue: 'Warehouse' })}</span>
            <SearchableSelect
              value={filters.warehouse_id}
              placeholder={t('All warehouses', { defaultValue: 'All warehouses' })}
              searchPlaceholder={t('Search warehouses...', { defaultValue: 'Search warehouses...' })}
              onChange={(warehouse_id) => setFilters((current) => ({
                ...current,
                warehouse_id,
                zone_id: '',
                shelf_id: '',
              }))}
              options={[
                { label: t('All warehouses', { defaultValue: 'All warehouses' }), value: '' },
                ...((warehousesQuery.data?.data ?? []).map((warehouse) => ({
                  label: warehouse.name,
                  value: String(warehouse.id),
                  keywords: [warehouse.code ?? ''],
                }))),
              ]}
            />
          </label>
          {(tab === 'shelves' || tab === 'bins') ? (
            <label className="field">
              <span>{t('Zone', { defaultValue: 'Zone' })}</span>
              <SearchableSelect
                value={filters.zone_id}
                placeholder={t('All zones', { defaultValue: 'All zones' })}
                searchPlaceholder={t('Search zones...', { defaultValue: 'Search zones...' })}
                onChange={(zone_id) => setFilters((current) => ({
                  ...current,
                  zone_id,
                  shelf_id: '',
                }))}
                options={[
                  { label: t('All zones', { defaultValue: 'All zones' }), value: '' },
                  ...zones.map((zone) => ({
                    label: zone.name,
                    value: String(zone.id),
                    keywords: [zone.code ?? ''],
                  })),
                ]}
              />
            </label>
          ) : null}
          {tab === 'bins' ? (
            <label className="field">
              <span>{t('Shelf', { defaultValue: 'Shelf' })}</span>
              <SearchableSelect
                value={filters.shelf_id}
                placeholder={t('All shelves', { defaultValue: 'All shelves' })}
                searchPlaceholder={t('Search shelves...', { defaultValue: 'Search shelves...' })}
                onChange={(shelf_id) => setFilters((current) => ({ ...current, shelf_id }))}
                options={[
                  { label: t('All shelves', { defaultValue: 'All shelves' }), value: '' },
                  ...shelves.map((shelf) => ({
                    label: shelf.name,
                    value: String(shelf.id),
                    keywords: [shelf.code ?? ''],
                  })),
                ]}
              />
            </label>
          ) : null}
          <label className="field">
            <span>{t('Status', { defaultValue: 'Status' })}</span>
            <Select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="">{t('All statuses', { defaultValue: 'All statuses' })}</option>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </Select>
          </label>
        </CardContent>
        <CardContent>
          <div className="form-actions">
            <TabButton active={tab === 'zones'} label={t('Zones', { defaultValue: 'Zones' })} onClick={() => setTab('zones')} />
            <TabButton active={tab === 'shelves'} label={t('Shelves', { defaultValue: 'Shelves' })} onClick={() => setTab('shelves')} />
            <TabButton active={tab === 'bins'} label={t('Bins', { defaultValue: 'Bins' })} onClick={() => setTab('bins')} />
            <Button type="button" variant="secondary" onClick={() => setFilters(initialFilters)}>
              {t('Reset filters', { defaultValue: 'Reset filters' })}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="table-card">
        <CardHeader>
          <CardTitle>
            {tab === 'zones' ? t('Warehouse Zones', { defaultValue: 'Warehouse Zones' }) : tab === 'shelves' ? t('Warehouse Shelves', { defaultValue: 'Warehouse Shelves' }) : t('Warehouse Bins', { defaultValue: 'Warehouse Bins' })}
          </CardTitle>
          <CardDescription>
            {tab === 'zones'
              ? t('Zone storage locations inside each warehouse.', { defaultValue: 'Zone storage locations inside each warehouse.' })
              : tab === 'shelves'
                ? t('Shelf locations linked to warehouse zones.', { defaultValue: 'Shelf locations linked to warehouse zones.' })
                : t('Bin locations including barcode display for scan workflows.', { defaultValue: 'Bin locations including barcode display for scan workflows.' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(tab === 'zones' && zonesQuery.isLoading) || (tab === 'shelves' && shelvesQuery.isLoading) || (tab === 'bins' && binsQuery.isLoading)
            ? <LoadingState title={t('Loading warehouse {{tab}}', { tab, defaultValue: `Loading warehouse ${tab}` })} />
            : null}
          {(tab === 'zones' && zonesQuery.isError) || (tab === 'shelves' && shelvesQuery.isError) || (tab === 'bins' && binsQuery.isError) ? (
            <ErrorState
              title={`Unable to load warehouse ${tab}`}
              message={getApiErrorMessage(zonesQuery.error ?? shelvesQuery.error ?? binsQuery.error)}
              onRetry={() => {
                void zonesQuery.refetch()
                void shelvesQuery.refetch()
                void binsQuery.refetch()
              }}
            />
          ) : null}
          {((tab === 'zones' && !zones.length && !zonesQuery.isLoading && !zonesQuery.isError) || (tab === 'shelves' && !shelves.length && !shelvesQuery.isLoading && !shelvesQuery.isError) || (tab === 'bins' && !bins.length && !binsQuery.isLoading && !binsQuery.isError)) ? (
            tab === 'zones' ? (
              <EmptyState title={t('No warehouse zones', { defaultValue: 'No warehouse zones' })} description={t('No zones matched the selected filters.', { defaultValue: 'No zones matched the selected filters.' })} />
            ) : tab === 'shelves' ? (
              <EmptyState title={t('No warehouse shelves', { defaultValue: 'No warehouse shelves' })} description={t('No shelves matched the selected filters.', { defaultValue: 'No shelves matched the selected filters.' })} />
            ) : (
              <EmptyState title={t('No warehouse bins', { defaultValue: 'No warehouse bins' })} description={t('No bins matched the selected filters.', { defaultValue: 'No bins matched the selected filters.' })} />
            )
          ) : null}

          {tab === 'zones' && zones.length ? <ZonesTable zones={zones} /> : null}
          {tab === 'shelves' && shelves.length ? <ShelvesTable shelves={shelves} /> : null}
          {tab === 'bins' && bins.length ? <BinsTable bins={bins} locale={locale} /> : null}
        </CardContent>
      </Card>

      <CreateZoneDialog
        error={zoneMutation.error}
        isSubmitting={zoneMutation.isPending}
        onClose={() => setCreateZoneOpen(false)}
        onSubmit={(values) => zoneMutation.mutate(values)}
        open={createZoneOpen}
      />
      <CreateShelfDialog
        error={shelfMutation.error}
        isSubmitting={shelfMutation.isPending}
        onClose={() => setCreateShelfOpen(false)}
        onSubmit={(values) => shelfMutation.mutate(values)}
        open={createShelfOpen}
      />
      <CreateBinDialog
        error={binMutation.error}
        isSubmitting={binMutation.isPending}
        onClose={() => setCreateBinOpen(false)}
        onSubmit={(values) => binMutation.mutate(values)}
        open={createBinOpen}
      />
    </section>
  )
}

function ZonesTable({ zones }: { zones: WarehouseZone[] }) {
  const { t } = useTranslation()

  return (
    <TableContainer>
      <Table variant="compact">
        <thead>
          <tr>
            <TableHead>{t('Warehouse', { defaultValue: 'Warehouse' })}</TableHead>
            <TableHead>{t('Name', { defaultValue: 'Name' })}</TableHead>
            <TableHead>{t('Code', { defaultValue: 'Code' })}</TableHead>
            <TableHead>{t('Status', { defaultValue: 'Status' })}</TableHead>
            <TableHead>{t('Created', { defaultValue: 'Created' })}</TableHead>
          </tr>
        </thead>
        <tbody>
          {zones.map((zone) => (
            <tr key={zone.id}>
              <TableCell>{zone.warehouse_name ?? `#${zone.warehouse_id}`}</TableCell>
              <TableCell>{zone.name}</TableCell>
              <TableCell>{zone.code ?? '-'}</TableCell>
              <TableCell>
                <StatusBadge value={zone.status}>
                  {pickDisplayLabel(zone.status, zone.status_label)}
                </StatusBadge>
              </TableCell>
              <TableCell>{formatDate(zone.created_at)}</TableCell>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableContainer>
  )
}

function ShelvesTable({ shelves }: { shelves: WarehouseShelf[] }) {
  const { t } = useTranslation()

  return (
    <TableContainer>
      <Table variant="compact">
        <thead>
          <tr>
            <TableHead>{t('Warehouse', { defaultValue: 'Warehouse' })}</TableHead>
            <TableHead>{t('Zone', { defaultValue: 'Zone' })}</TableHead>
            <TableHead>{t('Name', { defaultValue: 'Name' })}</TableHead>
            <TableHead>{t('Code', { defaultValue: 'Code' })}</TableHead>
            <TableHead>{t('Status', { defaultValue: 'Status' })}</TableHead>
            <TableHead>{t('Created', { defaultValue: 'Created' })}</TableHead>
          </tr>
        </thead>
        <tbody>
          {shelves.map((shelf) => (
            <tr key={shelf.id}>
              <TableCell>{shelf.warehouse_name ?? `#${shelf.warehouse_id}`}</TableCell>
              <TableCell>{shelf.zone_name ?? '-'}</TableCell>
              <TableCell>{shelf.name}</TableCell>
              <TableCell>{shelf.code ?? '-'}</TableCell>
              <TableCell>
                <StatusBadge value={shelf.status}>
                  {pickDisplayLabel(shelf.status, shelf.status_label)}
                </StatusBadge>
              </TableCell>
              <TableCell>{formatDate(shelf.created_at)}</TableCell>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableContainer>
  )
}

function BinsTable({ bins, locale }: { bins: WarehouseBin[]; locale: 'en' | 'ar' }) {
  const { t } = useTranslation()

  return (
    <TableContainer>
      <Table variant="compact">
        <thead>
          <tr>
            <TableHead>{t('Warehouse', { defaultValue: 'Warehouse' })}</TableHead>
            <TableHead>{t('Zone', { defaultValue: 'Zone' })}</TableHead>
            <TableHead>{t('Shelf', { defaultValue: 'Shelf' })}</TableHead>
            <TableHead>{t('Name', { defaultValue: 'Name' })}</TableHead>
            <TableHead>{t('Code', { defaultValue: 'Code' })}</TableHead>
            <TableHead>{t('Barcode', { defaultValue: 'Barcode' })}</TableHead>
            <TableHead>{t('Label', { defaultValue: 'Label' })}</TableHead>
            <TableHead>{t('Status', { defaultValue: 'Status' })}</TableHead>
            <TableHead>{t('Created', { defaultValue: 'Created' })}</TableHead>
            <TableHead>{t('Actions', { defaultValue: 'Actions' })}</TableHead>
          </tr>
        </thead>
        <tbody>
          {bins.map((bin) => (
            <tr key={bin.id}>
              <TableCell>{bin.warehouse_name ?? `#${bin.warehouse_id}`}</TableCell>
              <TableCell>{bin.zone_name ?? '-'}</TableCell>
              <TableCell>{bin.shelf_name ?? '-'}</TableCell>
              <TableCell>
                <Link className="table-link" to={`${adminPath('/warehouse/bins')}/${bin.id}`}>
                  {bin.name}
                </Link>
              </TableCell>
              <TableCell>{bin.code}</TableCell>
              <TableCell>{bin.barcode ?? '-'}</TableCell>
              <TableCell>
                <LabelDocumentDialog
                  buttonVariant="ghost"
                  defaultFormat="html"
                  fetchDocument={(options) => getBinPrintableLabelDocument({
                    bin,
                    fetchDocument: (requestOptions) => getWarehouseBinLabel(bin.id, requestOptions),
                    locale,
                    options,
                    t,
                  })}
                  formats={['html', 'pdf']}
                  title={t('Bin Label - {{name}}', {
                    defaultValue: `Bin Label - ${bin.name}`,
                    name: bin.name,
                  })}
                  triggerLabel={t('Label', { defaultValue: 'Label' })}
                />
              </TableCell>
              <TableCell>
                <StatusBadge value={bin.status}>
                  {pickDisplayLabel(bin.status, bin.status_label)}
                </StatusBadge>
              </TableCell>
              <TableCell>{formatDate(bin.created_at)}</TableCell>
              <TableCell>
                <Link className="table-link" to={`${adminPath('/warehouse/bins')}/${bin.id}`}>
                  View details
                </Link>
              </TableCell>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableContainer>
  )
}
