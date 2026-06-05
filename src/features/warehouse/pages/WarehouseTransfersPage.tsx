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
      title={<CardTitle>{currentTransfer ? `Edit ${currentTransfer.transfer_number ?? 'Transfer'}` : 'Create Transfer'}</CardTitle>}
    >
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>Source Warehouse</span>
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
          <span>Destination Warehouse</span>
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
          <span>Notes</span>
          <Input {...register('notes')} />
          <FieldError error={errors.notes?.message ?? getFieldError('notes')} />
        </label>

        <div className="page-stack">
          <div className="section-title-row">
            <div>
              <CardTitle>Items</CardTitle>
              <CardDescription>Source stock context appears when the backend supplies it.</CardDescription>
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
              Add Item
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={field.id} variant="flat">
              <CardContent className="form-grid">
                <label className="field">
                  <span>Product</span>
                  <Controller
                    name={`items.${index}.warehouse_product_id`}
                    control={control}
                    render={({ field: controllerField }) => (
                      <SearchableSelect
                        value={controllerField.value > 0 ? String(controllerField.value) : ''}
                        placeholder="Select product"
                        searchPlaceholder="Search products..."
                        onChange={(value) => controllerField.onChange(value ? Number(value) : 0)}
                        options={[
                          { label: 'Select product', value: '' },
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
                  <span>Quantity</span>
                  <Input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                  <FieldError error={errors.items?.[index]?.quantity?.message ?? getFieldError(`items.${index}.quantity`)} />
                </label>

                <label className="field">
                  <span>Notes</span>
                  <Input {...register(`items.${index}.notes`)} />
                  <FieldError error={errors.items?.[index]?.notes?.message ?? getFieldError(`items.${index}.notes`)} />
                </label>

                {fields.length > 1 ? (
                  <div className="form-actions">
                    <Button type="button" variant="danger" onClick={() => remove(index)}>
                      Remove Item
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
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {currentTransfer ? 'Save Transfer' : 'Create Transfer'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function WarehouseTransfersPage() {
  const [filters, setFilters] = useState(initialFilters)
  const [successMessage, setSuccessMessage] = useState('')
  const [transferInForm, setTransferInForm] = useState<WarehouseTransfer | null>(null)
  const [pendingAction, setPendingAction] = useState<{ kind: 'confirm' | 'dispatch' | 'receive' | 'cancel'; transfer: WarehouseTransfer } | null>(null)
  const queryClient = useQueryClient()
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
      setSuccessMessage('Warehouse transfer saved successfully.')
      await queryClient.invalidateQueries({ queryKey: ['warehouse-transfers'] })
    },
  })
  const updateMutation = useMutation({
    mutationFn: ({ transferId, payload }: { transferId: number; payload: WarehouseTransferFormValues }) =>
      updateWarehouseTransfer(transferId, payload),
    onSuccess: async () => {
      setTransferInForm(null)
      setSuccessMessage('Warehouse transfer updated successfully.')
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
      setSuccessMessage(`Warehouse transfer ${variables.kind}ed successfully.`)
      await queryClient.invalidateQueries({ queryKey: ['warehouse-transfers'] })
    },
  })

  const transfers = query.data?.data ?? []
  const formMutation = transferInForm?.id ? updateMutation : createMutation

  return (
    <section className="page-section">
      <PageHeader
        title="Warehouse Transfers"
        description="Inter-warehouse transfer drafts, dispatch, receiving, and cancellation."
        actions={<Button type="button" onClick={() => setTransferInForm({} as WarehouseTransfer)}>Create Transfer</Button>}
      />

      <Card variant="flat" className="dashboard-filter-card">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Backend transfer filters for source/destination warehouses, status, number, and date range.</CardDescription>
        </CardHeader>
        <CardContent className="dashboard-filters">
          <label className="field">
            <span>Source Warehouse</span>
            <WarehouseSelector
              value={filters.source_warehouse_id}
              includeAllOption
              onChange={(source_warehouse_id) => setFilters((current) => ({ ...current, source_warehouse_id }))}
            />
          </label>
          <label className="field">
            <span>Destination Warehouse</span>
            <WarehouseSelector
              value={filters.destination_warehouse_id}
              includeAllOption
              onChange={(destination_warehouse_id) => setFilters((current) => ({ ...current, destination_warehouse_id }))}
            />
          </label>
          <label className="field">
            <span>Status</span>
            <Select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="">All statuses</option>
              <option value="draft">draft</option>
              <option value="confirmed">confirmed</option>
              <option value="in_transit">in_transit</option>
              <option value="received">received</option>
              <option value="cancelled">cancelled</option>
            </Select>
          </label>
          <label className="field">
            <span>Transfer Number</span>
            <Input value={filters.transfer_number} onChange={(event) => setFilters((current) => ({ ...current, transfer_number: event.target.value }))} />
          </label>
          <DateRangeFilter
            dateFrom={filters.date_from}
            dateTo={filters.date_to}
            onChange={({ date_from, date_to }) => setFilters((current) => ({ ...current, date_from, date_to }))}
          />
        </CardContent>
        <CardContent>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setFilters(initialFilters)}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="table-card">
        <CardHeader className="table-card__header">
          <CardTitle>Transfers</CardTitle>
          <CardDescription>Draft transfers can be edited before they move into transit.</CardDescription>
        </CardHeader>
        <CardContent>
          {successMessage ? <div className="form-success">{successMessage}</div> : null}
          {formMutation.error ? <div className="form-error">{getApiErrorMessage(formMutation.error)}</div> : null}
          {actionMutation.error ? <div className="form-error">{getApiErrorMessage(actionMutation.error)}</div> : null}
          {query.isLoading ? <LoadingState title="Loading warehouse transfers" /> : null}
          {query.isError ? (
            <ErrorState title="Unable to load warehouse transfers" message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
          ) : null}
          {!query.isLoading && !query.isError && !transfers.length ? (
            <EmptyState title="No warehouse transfers" description="No transfers match the selected filters." />
          ) : null}
          {transfers.length ? (
            <TableContainer>
              <Table variant="striped">
                <thead>
                  <tr>
                    <TableHead>Transfer</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
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
                              Edit
                            </Button>
                          ) : null}
                          {transfer.status === 'draft' ? (
                            <Button type="button" variant="secondary" onClick={() => setPendingAction({ kind: 'confirm', transfer })}>
                              Confirm
                            </Button>
                          ) : null}
                          {transfer.status === 'confirmed' ? (
                            <Button type="button" variant="secondary" onClick={() => setPendingAction({ kind: 'dispatch', transfer })}>
                              Dispatch
                            </Button>
                          ) : null}
                          {transfer.status === 'in_transit' ? (
                            <Button type="button" variant="secondary" onClick={() => setPendingAction({ kind: 'receive', transfer })}>
                              Receive
                            </Button>
                          ) : null}
                          {['draft', 'confirmed'].includes(transfer.status) ? (
                            <Button type="button" variant="danger" onClick={() => setPendingAction({ kind: 'cancel', transfer })}>
                              Cancel
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
        title={pendingAction ? `${pendingAction.kind.charAt(0).toUpperCase()}${pendingAction.kind.slice(1)} transfer` : ''}
        description={pendingAction ? `${pendingAction.kind.charAt(0).toUpperCase()}${pendingAction.kind.slice(1)} ${pendingAction.transfer.transfer_number ?? `transfer #${pendingAction.transfer.id}`}?` : ''}
        confirmLabel={pendingAction ? `${pendingAction.kind.charAt(0).toUpperCase()}${pendingAction.kind.slice(1)} transfer` : 'Confirm'}
        variant={pendingAction?.kind === 'cancel' ? 'danger' : 'default'}
        loading={actionMutation.isPending}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          if (pendingAction) {
            actionMutation.mutate({ kind: pendingAction.kind, transferId: pendingAction.transfer.id })
          }
        }}
      />
    </section>
  )
}
