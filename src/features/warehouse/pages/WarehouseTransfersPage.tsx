import { useEffect, useMemo, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Controller } from 'react-hook-form'
import {
  cancelWarehouseTransfer,
  confirmWarehouseTransfer,
  createWarehouseTransfer,
  dispatchWarehouseTransfer,
  listWarehouseProducts,
  listWarehouseTransfers,
  receiveWarehouseTransfer,
  updateWarehouseTransfer,
} from '../api/warehouse.api'
import type {
  CreateWarehouseTransferRequest,
  WarehouseTransfer,
} from '../types/warehouse.types'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { FilterButton } from '../../../shared/components/filters/FilterButton'
import { FilterPopover } from '../../../shared/components/filters/FilterPopover'
import { FilterField } from '../../../shared/components/filters/FilterField'
import { AppliedFilterChips, type AppliedFilterChip } from '../../../shared/components/filters/AppliedFilterChips'
import { DateRangeFilter } from '../../../shared/components/filters/DateRangeFilter'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { ConfirmActionModal } from '../../../shared/components/modals/ConfirmActionModal'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Dialog } from '../../../shared/components/ui/Dialog'
import { Input } from '../../../shared/components/ui/Input'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { WarehouseSelector } from '../../../shared/components/selectors/WarehouseSelector'
import { SearchableSelect } from '../../../shared/components/ui/SearchableSelect'
import { Select } from '../../../shared/components/ui/Select'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { useFormApiErrors } from '../../../shared/hooks/useFormApiErrors'
import { pickDisplayLabel } from '../../../shared/i18n/locale'
import { adminPath } from '../../../shared/routing/paths'
import { formatDate } from '../../../shared/utils/formatters'
import { useTranslation } from 'react-i18next'

type WarehouseTransferFilters = {
  source_warehouse_id: string
  destination_warehouse_id: string
  status: string
  transfer_number: string
  date_from: string
  date_to: string
}

type WarehouseTransferFormValues = CreateWarehouseTransferRequest

const initialFilters: WarehouseTransferFilters = {
  source_warehouse_id: '',
  destination_warehouse_id: '',
  status: '',
  transfer_number: '',
  date_from: '',
  date_to: '',
}

function mapTransferToValues(transfer?: WarehouseTransfer | null): WarehouseTransferFormValues {
  return {
    source_warehouse_id: transfer?.source_warehouse_id ?? 0,
    destination_warehouse_id: transfer?.destination_warehouse_id ?? 0,
    notes: transfer?.notes ?? '',
    items: transfer?.items?.length
      ? transfer.items.map((item) => ({
          warehouse_product_id: item.warehouse_product_id,
          quantity: item.quantity,
          notes: item.notes ?? '',
        }))
      : [
          {
            warehouse_product_id: 0,
            quantity: 1,
            notes: '',
          },
        ],
  }
}

function WarehouseTransferFormDialog({
  currentTransfer,
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
}: {
  currentTransfer?: WarehouseTransfer | null
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: WarehouseTransferFormValues) => void
  open: boolean
}) {
  const { t } = useTranslation()
  const { formError, getFieldError } = useFormApiErrors(error)
  const {
    control,
    handleSubmit,
    register,
    reset,
    watch,
    formState: { errors },
  } = useForm<WarehouseTransferFormValues>({
    defaultValues: mapTransferToValues(currentTransfer),
  })
  const sourceWarehouseId = watch('source_warehouse_id')
  const productsQuery = useQuery({
    queryKey: ['warehouse-products', 'transfers-form', sourceWarehouseId],
    queryFn: () => listWarehouseProducts({ warehouse_id: sourceWarehouseId || undefined }),
    enabled: open && Boolean(sourceWarehouseId),
  })
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  useEffect(() => {
    if (open) {
      reset(mapTransferToValues(currentTransfer))
    }
  }, [currentTransfer, open, reset])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={<CardTitle>{currentTransfer ? t('Edit {{name}}', { name: currentTransfer.transfer_number ?? t('Transfer') }) : t('Create Transfer')}</CardTitle>}
    >
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>{t('Source Warehouse')}</span>
          <Controller
            name="source_warehouse_id"
            control={control}
            render={({ field }) => (
              <WarehouseSelector
                value={field.value > 0 ? String(field.value) : ''}
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
              />
            )}
          />
          <FieldError error={errors.source_warehouse_id?.message ?? getFieldError('source_warehouse_id')} />
        </label>

        <label className="field">
          <span>{t('Destination Warehouse')}</span>
          <Controller
            name="destination_warehouse_id"
            control={control}
            render={({ field }) => (
              <WarehouseSelector
                value={field.value > 0 ? String(field.value) : ''}
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
              />
            )}
          />
          <FieldError error={errors.destination_warehouse_id?.message ?? getFieldError('destination_warehouse_id')} />
        </label>

        <label className="field">
          <span>{t('Notes')}</span>
          <Input {...register('notes')} />
          <FieldError error={errors.notes?.message ?? getFieldError('notes')} />
        </label>

        <div className="page-stack">
          <div className="section-title-row">
            <div>
              <CardTitle>{t('Items')}</CardTitle>
              <CardDescription>{t('Source stock context appears when the backend supplies it.')}</CardDescription>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => append({
                warehouse_product_id: 0,
                quantity: 1,
                notes: '',
              })}
            >
              {t('Add Item')}
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={field.id} variant="flat">
              <CardContent className="form-grid">
                <label className="field">
                  <span>{t('Product')}</span>
                  <Controller
                    name={`items.${index}.warehouse_product_id`}
                    control={control}
                    render={({ field: controllerField }) => (
                      <SearchableSelect
                        value={controllerField.value > 0 ? String(controllerField.value) : ''}
                        placeholder={t('Select product')}
                        searchPlaceholder={t('Search products...')}
                        onChange={(value) => controllerField.onChange(value ? Number(value) : 0)}
                        options={[
                          { label: t('Select product'), value: '' },
                          ...((productsQuery.data?.data ?? []).map((product) => ({
                            label: `${product.name} (${product.sku})`,
                            value: String(product.id),
                            keywords: [product.sku, product.barcode ?? '', product.merchant_name ?? ''],
                          }))),
                        ]}
                      />
                    )}
                  />
                  <FieldError error={errors.items?.[index]?.warehouse_product_id?.message ?? getFieldError(`items.${index}.warehouse_product_id`)} />
                </label>

                <label className="field">
                  <span>{t('Quantity')}</span>
                  <Input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                  <FieldError error={errors.items?.[index]?.quantity?.message ?? getFieldError(`items.${index}.quantity`)} />
                </label>

                <label className="field">
                  <span>{t('Notes')}</span>
                  <Input {...register(`items.${index}.notes`)} />
                  <FieldError error={errors.items?.[index]?.notes?.message ?? getFieldError(`items.${index}.notes`)} />
                </label>

                {fields.length > 1 ? (
                  <div className="form-actions">
                    <Button type="button" variant="danger" onClick={() => remove(index)}>
                      {t('Remove Item')}
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>

        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {currentTransfer ? t('Save Transfer') : t('Create Transfer')}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function WarehouseTransfersPanel({
  embedded = false,
  onCountChange,
}: {
  embedded?: boolean
  onCountChange?: (count: number) => void
}) {
  const { t } = useTranslation()
  const [filters, setFilters] = useState(initialFilters)
  const [draftFilters, setDraftFilters] = useState(initialFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [transferInForm, setTransferInForm] = useState<WarehouseTransfer | null>(null)
  const [pendingAction, setPendingAction] = useState<{ kind: 'confirm' | 'dispatch' | 'receive' | 'cancel'; transfer: WarehouseTransfer } | null>(null)
  const queryClient = useQueryClient()

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.source_warehouse_id) count++
    if (filters.destination_warehouse_id) count++
    if (filters.status) count++
    if (filters.transfer_number) count++
    if (filters.date_from || filters.date_to) count++
    return count
  }, [filters])

  const appliedChips: AppliedFilterChip[] = useMemo(() => {
    const chips: AppliedFilterChip[] = []
    if (filters.source_warehouse_id) {
      chips.push({ key: 'source_warehouse_id', label: t('Source Warehouse'), value: filters.source_warehouse_id })
    }
    if (filters.destination_warehouse_id) {
      chips.push({ key: 'destination_warehouse_id', label: t('Destination Warehouse'), value: filters.destination_warehouse_id })
    }
    if (filters.status) {
      chips.push({ key: 'status', label: t('Status'), value: t(filters.status) })
    }
    if (filters.transfer_number) {
      chips.push({ key: 'transfer_number', label: t('Transfer Number'), value: filters.transfer_number })
    }
    if (filters.date_from || filters.date_to) {
      chips.push({
        key: 'date_range',
        label: t('Date Range', { defaultValue: 'Date Range' }),
        value: `${filters.date_from || '...'} → ${filters.date_to || '...'}`,
      })
    }
    return chips
  }, [filters, t])

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraftFilters(filters)
    }
    setFiltersOpen(nextOpen)
  }

  const handleApply = () => {
    setFilters(draftFilters)
    setFiltersOpen(false)
  }

  const handleReset = () => {
    setDraftFilters(initialFilters)
    setFilters(initialFilters)
    setFiltersOpen(false)
  }

  const handleRemoveChip = (key: string) => {
    if (key === 'source_warehouse_id') {
      setFilters((c) => ({ ...c, source_warehouse_id: '' }))
      setDraftFilters((c) => ({ ...c, source_warehouse_id: '' }))
    }
    if (key === 'destination_warehouse_id') {
      setFilters((c) => ({ ...c, destination_warehouse_id: '' }))
      setDraftFilters((c) => ({ ...c, destination_warehouse_id: '' }))
    }
    if (key === 'status') {
      setFilters((c) => ({ ...c, status: '' }))
      setDraftFilters((c) => ({ ...c, status: '' }))
    }
    if (key === 'transfer_number') {
      setFilters((c) => ({ ...c, transfer_number: '' }))
      setDraftFilters((c) => ({ ...c, transfer_number: '' }))
    }
    if (key === 'date_range') {
      setFilters((c) => ({ ...c, date_from: '', date_to: '' }))
      setDraftFilters((c) => ({ ...c, date_from: '', date_to: '' }))
    }
  }

  const params = useMemo(() => ({
    ...(filters.source_warehouse_id ? { source_warehouse_id: filters.source_warehouse_id } : {}),
    ...(filters.destination_warehouse_id ? { destination_warehouse_id: filters.destination_warehouse_id } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.transfer_number ? { transfer_number: filters.transfer_number } : {}),
    ...(filters.date_from ? { date_from: filters.date_from } : {}),
    ...(filters.date_to ? { date_to: filters.date_to } : {}),
  }), [filters])
  const query = useQuery({
    queryKey: ['warehouse-transfers', params],
    queryFn: () => listWarehouseTransfers(params),
  })
  const createMutation = useMutation({
    mutationFn: createWarehouseTransfer,
    onSuccess: async () => {
      setTransferInForm(null)
      setSuccessMessage(t('Warehouse transfer saved successfully.'))
      await queryClient.invalidateQueries({ queryKey: ['warehouse-transfers'] })
    },
  })
  const updateMutation = useMutation({
    mutationFn: ({ transferId, payload }: { transferId: number; payload: WarehouseTransferFormValues }) =>
      updateWarehouseTransfer(transferId, payload),
    onSuccess: async () => {
      setTransferInForm(null)
      setSuccessMessage(t('Warehouse transfer updated successfully.'))
      await queryClient.invalidateQueries({ queryKey: ['warehouse-transfers'] })
    },
  })
  const actionMutation = useMutation({
    mutationFn: ({ kind, transferId }: { kind: 'confirm' | 'dispatch' | 'receive' | 'cancel'; transferId: number }) => {
      switch (kind) {
        case 'confirm':
          return confirmWarehouseTransfer(transferId)
        case 'dispatch':
          return dispatchWarehouseTransfer(transferId)
        case 'receive':
          return receiveWarehouseTransfer(transferId)
        case 'cancel':
          return cancelWarehouseTransfer(transferId)
      }
    },
    onSuccess: async (_, variables) => {
      setPendingAction(null)
      const successKey = variables.kind === 'confirm'
        ? 'Warehouse transfer confirmed successfully.'
        : variables.kind === 'dispatch'
          ? 'Warehouse transfer dispatched successfully.'
          : variables.kind === 'receive'
            ? 'Warehouse transfer received successfully.'
            : 'Warehouse transfer cancelled successfully.'
      setSuccessMessage(t(successKey))
      await queryClient.invalidateQueries({ queryKey: ['warehouse-transfers'] })
    },
  })

  const transfers = query.data?.data ?? []
  const formMutation = transferInForm?.id ? updateMutation : createMutation

  useEffect(() => {
    if (query.data) {
      onCountChange?.(query.data.data.length)
    }
  }, [onCountChange, query.data])

  return (
    <section className="page-section page-layout--fullwidth">
      {!embedded ? (
        <PageHeader
          title={t('Warehouse Transfers')}
          description={t('Inter-warehouse transfer drafts, dispatch, receiving, and cancellation.')}
          actions={
            <Button type="button" onClick={() => setTransferInForm({} as WarehouseTransfer)}>
              {t('Create Transfer')}
            </Button>
          }
        />
      ) : null}

      <div className="page-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
        <AppliedFilterChips
          chips={appliedChips}
          onRemove={handleRemoveChip}
          onClearAll={handleReset}
        />
        <div style={{ marginInlineStart: 'auto' }}>
          <FilterPopover
            title={t('Filter Warehouse Transfers', { defaultValue: 'Filter Warehouse Transfers' })}
            open={filtersOpen}
            onOpenChange={handleOpenChange}
            onApply={handleApply}
            onReset={handleReset}
            activeCount={activeFilterCount}
            trigger={
              <FilterButton
                activeCount={activeFilterCount}
                open={filtersOpen}
                onClick={() => handleOpenChange(!filtersOpen)}
              />
            }
          >
            <div className="space-y-4">
              <FilterField label={t('Source Warehouse')}>
                <WarehouseSelector
                  value={draftFilters.source_warehouse_id}
                  includeAllOption
                  onChange={(source_warehouse_id) => setDraftFilters((current) => ({ ...current, source_warehouse_id }))}
                />
              </FilterField>
              <FilterField label={t('Destination Warehouse')}>
                <WarehouseSelector
                  value={draftFilters.destination_warehouse_id}
                  includeAllOption
                  onChange={(destination_warehouse_id) => setDraftFilters((current) => ({ ...current, destination_warehouse_id }))}
                />
              </FilterField>
              <FilterField label={t('Status')}>
                <Select
                  value={draftFilters.status}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}
                >
                  <option value="">{t('All statuses')}</option>
                  <option value="draft">{t('draft')}</option>
                  <option value="confirmed">{t('confirmed')}</option>
                  <option value="in_transit">{t('in_transit')}</option>
                  <option value="received">{t('received')}</option>
                  <option value="cancelled">{t('cancelled')}</option>
                </Select>
              </FilterField>
              <FilterField label={t('Transfer Number')}>
                <Input
                  placeholder={t('Enter transfer number...', { defaultValue: 'Enter transfer number...' })}
                  value={draftFilters.transfer_number}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, transfer_number: event.target.value }))}
                />
              </FilterField>
              <FilterField label={t('Date Range', { defaultValue: 'Date Range' })}>
                <DateRangeFilter
                  dateFrom={draftFilters.date_from}
                  dateTo={draftFilters.date_to}
                  onChange={({ date_from, date_to }) => setDraftFilters((current) => ({ ...current, date_from, date_to }))}
                />
              </FilterField>
            </div>
          </FilterPopover>
        </div>
      </div>

      <main className="page-main-content">
      <Card className="table-card">
        <CardHeader className="table-card__header">
          <CardTitle>{t('Transfers')}</CardTitle>
          <CardDescription>{t('Draft transfers can be edited before they move into transit.')}</CardDescription>
        </CardHeader>
        <CardContent>
          {successMessage ? <div className="form-success">{successMessage}</div> : null}
          {formMutation.error ? <div className="form-error">{getApiErrorMessage(formMutation.error)}</div> : null}
          {actionMutation.error ? <div className="form-error">{getApiErrorMessage(actionMutation.error)}</div> : null}
          {query.isLoading ? <LoadingState title={t('Loading warehouse transfers')} /> : null}
          {query.isError ? (
            <ErrorState title={t('Unable to load warehouse transfers')} message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
          ) : null}
          {!query.isLoading && !query.isError && !transfers.length ? (
            <EmptyState title={t('No warehouse transfers')} description={t('No transfers match the selected filters.')} />
          ) : null}
          {transfers.length ? (
            <TableContainer>
              <Table variant="striped">
                <thead>
                  <tr>
                    <TableHead>{t('Transfer')}</TableHead>
                    <TableHead>{t('Source')}</TableHead>
                    <TableHead>{t('Destination')}</TableHead>
                    <TableHead>{t('Items')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Created')}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((transfer) => (
                    <tr key={transfer.id}>
                      <TableCell>
                        <Link className="table-link" to={adminPath(`/warehouse/transfers/${transfer.id}`)}>
                          {transfer.transfer_number ?? `Transfer #${transfer.id}`}
                        </Link>
                      </TableCell>
                      <TableCell>{transfer.source_warehouse_name ?? transfer.source_warehouse_id}</TableCell>
                      <TableCell>{transfer.destination_warehouse_name ?? transfer.destination_warehouse_id}</TableCell>
                      <TableCell>{transfer.items.length}</TableCell>
                      <TableCell>
                        <StatusBadge value={transfer.status}>
                          {pickDisplayLabel(transfer.status, transfer.status_label)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>{formatDate(transfer.created_at)}</TableCell>
                      <TableCell>
                        <div className="page-header__button-row">
                          {transfer.status === 'draft' ? (
                            <Button type="button" variant="secondary" onClick={() => setTransferInForm(transfer)}>
                              {t('Edit')}
                            </Button>
                          ) : null}
                          {transfer.status === 'draft' ? (
                            <Button type="button" variant="secondary" onClick={() => setPendingAction({ kind: 'confirm', transfer })}>
                              {t('Confirm')}
                            </Button>
                          ) : null}
                          {transfer.status === 'confirmed' ? (
                            <Button type="button" variant="secondary" onClick={() => setPendingAction({ kind: 'dispatch', transfer })}>
                              {t('Dispatch')}
                            </Button>
                          ) : null}
                          {transfer.status === 'in_transit' ? (
                            <Button type="button" variant="secondary" onClick={() => setPendingAction({ kind: 'receive', transfer })}>
                              {t('Receive')}
                            </Button>
                          ) : null}
                          {['draft', 'confirmed'].includes(transfer.status) ? (
                            <Button type="button" variant="danger" onClick={() => setPendingAction({ kind: 'cancel', transfer })}>
                              {t('Cancel')}
                            </Button>
                          ) : null}
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

      <WarehouseTransferFormDialog
        currentTransfer={transferInForm?.id ? transferInForm : null}
        error={formMutation.error}
        isSubmitting={formMutation.isPending}
        onClose={() => setTransferInForm(null)}
        onSubmit={(values) => {
          if (transferInForm?.id) {
            updateMutation.mutate({ transferId: transferInForm.id, payload: values })
            return
          }

          createMutation.mutate(values)
        }}
        open={Boolean(transferInForm)}
      />

      <ConfirmActionModal
        open={Boolean(pendingAction)}
        title={pendingAction ? t('{{action}} transfer', {
          action: pendingAction.kind === 'confirm'
            ? t('Confirm')
            : pendingAction.kind === 'dispatch'
              ? t('Dispatch')
              : pendingAction.kind === 'receive'
                ? t('Receive')
                : t('Cancel'),
        }) : ''}
        description={pendingAction ? t('{{action}} {{name}}?', {
          action: pendingAction.kind === 'confirm'
            ? t('Confirm')
            : pendingAction.kind === 'dispatch'
              ? t('Dispatch')
              : pendingAction.kind === 'receive'
                ? t('Receive')
                : t('Cancel'),
          name: pendingAction.transfer.transfer_number ?? `transfer #${pendingAction.transfer.id}`,
        }) : ''}
        confirmLabel={pendingAction ? t('{{action}} transfer', {
          action: pendingAction.kind === 'confirm'
            ? t('Confirm')
            : pendingAction.kind === 'dispatch'
              ? t('Dispatch')
              : pendingAction.kind === 'receive'
                ? t('Receive')
                : t('Cancel'),
        }) : t('Confirm')}
        variant={pendingAction?.kind === 'cancel' ? 'danger' : 'default'}
        loading={actionMutation.isPending}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          if (pendingAction) {
            actionMutation.mutate({ kind: pendingAction.kind, transferId: pendingAction.transfer.id })
          }
        }}
      />
      </main>
    </section>
  )
}

export function WarehouseTransfersPage() {
  return <WarehouseTransfersPanel />
}
