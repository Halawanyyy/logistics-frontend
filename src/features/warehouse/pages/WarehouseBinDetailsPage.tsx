import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Copy } from 'lucide-react'
import {
  deleteWarehouseBin,
  getWarehouseBin,
  listWarehouseShelves,
  listWarehouseZones,
  updateWarehouseBin,
} from '../api/warehouse.api'
import type { UpdateWarehouseBinRequest, WarehouseBin, WarehouseLocationStatus } from '../types/warehouse.types'
import { getWarehouseBinLabel } from '../../../shared/api/labels.api'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { LabelDocumentDialog } from '../../../shared/components/labels/LabelDocumentDialog'
import { ConfirmActionModal } from '../../../shared/components/modals/ConfirmActionModal'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { WarehouseSelector } from '../../../shared/components/selectors/WarehouseSelector'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Dialog } from '../../../shared/components/ui/Dialog'
import { Input } from '../../../shared/components/ui/Input'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { SearchableSelect } from '../../../shared/components/ui/SearchableSelect'
import { Select } from '../../../shared/components/ui/Select'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { useFormApiErrors } from '../../../shared/hooks/useFormApiErrors'
import { pickDisplayLabel } from '../../../shared/i18n/locale'
import { useLocale } from '../../../shared/i18n/useLocale'
import { adminPath } from '../../../shared/routing/paths'
import { formatDate } from '../../../shared/utils/formatters'
import { useTranslation } from 'react-i18next'
import { getBinPrintableLabelDocument } from '../utils/binLabel'

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

function mapBinToValues(bin?: WarehouseBin | null): BinFormValues {
  return {
    warehouse_id: bin?.warehouse_id ?? 0,
    warehouse_zone_id: bin?.warehouse_zone_id ?? bin?.zone_id ?? 0,
    warehouse_shelf_id: bin?.warehouse_shelf_id ?? bin?.shelf_id ?? 0,
    name: bin?.name ?? '',
    code: bin?.code ?? '',
    barcode: bin?.barcode ?? '',
    status: (bin?.status as WarehouseLocationStatus | undefined) ?? 'active',
    notes: bin?.notes ?? '',
  }
}

function EditBinDialog({
  bin,
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
}: {
  bin: WarehouseBin | null
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: BinFormValues) => void
  open: boolean
}) {
  const { t } = useTranslation()
  const { formError, getFieldError } = useFormApiErrors(error)
  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BinFormValues>({
    defaultValues: mapBinToValues(bin),
  })
  const selectedWarehouseId = watch('warehouse_id')
  const selectedZoneId = watch('warehouse_zone_id')
  const zonesQuery = useQuery({
    queryKey: ['warehouse-zones', 'bin-details', selectedWarehouseId],
    queryFn: () => listWarehouseZones({ warehouse_id: selectedWarehouseId }),
    enabled: open && selectedWarehouseId > 0,
  })
  const shelvesQuery = useQuery({
    queryKey: ['warehouse-shelves', 'bin-details', selectedWarehouseId, selectedZoneId],
    queryFn: () => listWarehouseShelves({
      warehouse_id: selectedWarehouseId,
      ...(selectedZoneId > 0 ? { zone_id: selectedZoneId } : {}),
    }),
    enabled: open && selectedWarehouseId > 0,
  })

  useEffect(() => {
    if (open) {
      reset(mapBinToValues(bin))
    }
  }, [bin, open, reset])

  useEffect(() => {
    if (!open) {
      return
    }

    const nextZoneId = bin?.warehouse_zone_id ?? bin?.zone_id ?? 0
    const nextShelfId = bin?.warehouse_shelf_id ?? bin?.shelf_id ?? 0

    setValue('warehouse_zone_id', selectedWarehouseId === (bin?.warehouse_id ?? 0) ? nextZoneId : 0)
    setValue('warehouse_shelf_id', 0)
    if (selectedWarehouseId === (bin?.warehouse_id ?? 0)) {
      setValue('warehouse_shelf_id', nextShelfId)
    }
  }, [bin, open, selectedWarehouseId, setValue])

  useEffect(() => {
    if (!open) {
      return
    }

    const nextShelfId = bin?.warehouse_shelf_id ?? bin?.shelf_id ?? 0
    setValue('warehouse_shelf_id', selectedZoneId === (bin?.warehouse_zone_id ?? bin?.zone_id ?? 0) ? nextShelfId : 0)
  }, [bin, open, selectedZoneId, setValue])

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>{t('Edit Warehouse Bin')}</CardTitle>}>
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>{t('Warehouse')}</span>
          <Controller
            name="warehouse_id"
            control={control}
            rules={{ validate: (value) => value > 0 || t('Warehouse is required.') }}
            render={({ field }) => (
              <WarehouseSelector
                value={field.value > 0 ? String(field.value) : ''}
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
              />
            )}
          />
          <FieldError error={errors.warehouse_id?.message ?? getFieldError('warehouse_id')} />
        </label>
        <label className="field">
          <span>{t('Zone')}</span>
          <Controller
            name="warehouse_zone_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                value={field.value > 0 ? String(field.value) : ''}
                placeholder={t('No zone')}
                searchPlaceholder={t('Search zones...')}
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
                options={[
                  { label: t('No zone'), value: '' },
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
          <span>{t('Shelf')}</span>
          <Controller
            name="warehouse_shelf_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                value={field.value > 0 ? String(field.value) : ''}
                placeholder={t('No shelf')}
                searchPlaceholder={t('Search shelves...')}
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
                options={[
                  { label: t('No shelf'), value: '' },
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
          <span>{t('Name')}</span>
          <Input {...register('name', { required: t('Name is required.') })} />
          <FieldError error={errors.name?.message ?? getFieldError('name')} />
        </label>
        <label className="field">
          <span>{t('Code')}</span>
          <Input {...register('code', { required: t('Code is required.') })} />
          <FieldError error={errors.code?.message ?? getFieldError('code')} />
        </label>
        <label className="field">
          <span>{t('Barcode')}</span>
          <Input {...register('barcode')} />
          <p className="table-meta">{t('Leave empty to auto-generate a barcode on save if the backend supports it.')}</p>
          <FieldError error={errors.barcode?.message ?? getFieldError('barcode')} />
        </label>
        <label className="field">
          <span>{t('Status')}</span>
          <Select {...register('status')}>
            <option value="active">{t('active')}</option>
            <option value="inactive">{t('inactive')}</option>
          </Select>
        </label>
        <label className="field">
          <span>{t('Notes')}</span>
          <Input {...register('notes')} />
          <FieldError error={errors.notes?.message ?? getFieldError('notes')} />
        </label>
        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {t('Save Bin')}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function WarehouseBinDetailsPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { warehouseBinId = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')

  const binQuery = useQuery({
    queryKey: ['warehouse-bin', warehouseBinId],
    queryFn: () => getWarehouseBin(warehouseBinId),
    enabled: Boolean(warehouseBinId),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateWarehouseBinRequest) => updateWarehouseBin(warehouseBinId, payload),
    onSuccess: async () => {
      setEditOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['warehouse-bin', warehouseBinId] })
      await queryClient.invalidateQueries({ queryKey: ['warehouse-bins'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteWarehouseBin(warehouseBinId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['warehouse-bins'] })
      navigate(`${adminPath('/warehouse/locations')}?tab=bins`)
    },
  })

  const bin = binQuery.data?.data ?? null

  async function copyBarcode() {
    if (!bin?.barcode) {
      return
    }

    await navigator.clipboard.writeText(bin.barcode)
    setCopyState('copied')
    window.setTimeout(() => setCopyState('idle'), 1600)
  }

  if (binQuery.isLoading) {
    return <LoadingState title={t('Loading warehouse bin')} />
  }

  if (binQuery.isError || !bin) {
    return (
      <ErrorState
        title={t('Unable to load warehouse bin')}
        message={getApiErrorMessage(binQuery.error)}
        onRetry={() => void binQuery.refetch()}
      />
    )
  }

  return (
    <section className="page-section">
      <PageHeader
        title={bin.name}
        description={t('Warehouse bin details, barcode actions, and label printing.')}
        actions={(
          <div className="page-header__button-row">
            <Link className="ui-link-reset" to={`${adminPath('/warehouse/locations')}?tab=bins`}>
              <Button type="button" variant="secondary">{t('Back to Bins')}</Button>
            </Link>
            {bin.barcode ? (
              <Button type="button" variant="secondary" onClick={() => void copyBarcode()}>
                <Copy size={14} />
                {copyState === 'copied' ? t('Copied') : t('Copy Barcode')}
              </Button>
            ) : null}
            <LabelDocumentDialog
              defaultFormat="html"
              fetchDocument={(options) => getBinPrintableLabelDocument({
                bin,
                fetchDocument: (requestOptions) => getWarehouseBinLabel(bin.id, requestOptions),
                locale,
                options,
                t,
              })}
              formats={['html', 'pdf']}
              title={t('Bin Label - {{name}}', { name: bin.name })}
              triggerLabel={t('Print Label')}
            />
            <Can permission={PERMISSIONS.WAREHOUSE_LOCATIONS_CREATE}>
              <Button type="button" onClick={() => setEditOpen(true)}>{t('Edit Bin')}</Button>
            </Can>
            <Can permission={PERMISSIONS.WAREHOUSE_LOCATIONS_CREATE}>
              <Button type="button" variant="danger" onClick={() => setDeleteOpen(true)}>{t('Delete Bin')}</Button>
            </Can>
          </div>
        )}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('Bin Overview')}</CardTitle>
          <CardDescription>{t('Storage placement, barcode reference, and lifecycle status.')}</CardDescription>
        </CardHeader>
        <CardContent className="page-stack">
          <dl className="detail-list">
            <div><dt>{t('Name')}</dt><dd>{bin.name}</dd></div>
            <div><dt>{t('Code')}</dt><dd>{bin.code}</dd></div>
            <div><dt>{t('Barcode')}</dt><dd>{bin.barcode ?? '-'}</dd></div>
            <div><dt>{t('Warehouse')}</dt><dd>{bin.warehouse_name ?? `#${bin.warehouse_id}`}</dd></div>
            <div><dt>{t('Zone')}</dt><dd>{bin.zone_name ?? '-'}</dd></div>
            <div><dt>{t('Shelf')}</dt><dd>{bin.shelf_name ?? '-'}</dd></div>
            <div>
              <dt>{t('Status')}</dt>
              <dd>
                <StatusBadge value={bin.status}>
                  {pickDisplayLabel(bin.status, bin.status_label)}
                </StatusBadge>
              </dd>
            </div>
            <div><dt>{t('Notes')}</dt><dd>{bin.notes ?? '-'}</dd></div>
            <div><dt>{t('Created')}</dt><dd>{formatDate(bin.created_at)}</dd></div>
            <div><dt>{t('Updated')}</dt><dd>{bin.updated_at ? formatDate(bin.updated_at) : '-'}</dd></div>
          </dl>
        </CardContent>
      </Card>

      <EditBinDialog
        bin={bin}
        error={updateMutation.error}
        isSubmitting={updateMutation.isPending}
        onClose={() => setEditOpen(false)}
        onSubmit={(values) => {
          const payload: UpdateWarehouseBinRequest = {
            warehouse_id: values.warehouse_id,
            ...(values.warehouse_zone_id > 0 ? { warehouse_zone_id: values.warehouse_zone_id } : {}),
            ...(values.warehouse_shelf_id > 0 ? { warehouse_shelf_id: values.warehouse_shelf_id } : {}),
            name: values.name,
            code: values.code,
            barcode: values.barcode || undefined,
            status: values.status,
            notes: values.notes || undefined,
          }
          updateMutation.mutate(payload)
        }}
        open={editOpen}
      />

      <ConfirmActionModal
        open={deleteOpen}
        title={t('Delete warehouse bin')}
        description={t('Delete {{name}}? This action cannot be undone.', { name: bin.name })}
        confirmLabel={t('Delete Bin')}
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </section>
  )
}
