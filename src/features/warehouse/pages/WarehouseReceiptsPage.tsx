import { useEffect, useMemo, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Controller } from 'react-hook-form'
import {
  cancelWarehouseReceipt,
  confirmWarehouseReceipt,
  createWarehouseReceipt,
  listWarehouseProducts,
  listWarehouseReceipts,
  updateWarehouseReceipt,
} from '../api/warehouse.api'
import type {
  CreateWarehouseReceiptRequest,
  WarehouseReceipt,
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
import { MerchantSelector } from '../../../shared/components/selectors/MerchantSelector'
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

type WarehouseReceiptFilters = {
  merchant_id: string
  warehouse_id: string
  status: string
  receipt_number: string
  date_from: string
  date_to: string
}

type WarehouseReceiptFormValues = CreateWarehouseReceiptRequest

const initialFilters: WarehouseReceiptFilters = {
  merchant_id: '',
  warehouse_id: '',
  status: '',
  receipt_number: '',
  date_from: '',
  date_to: '',
}

function mapReceiptToValues(receipt?: WarehouseReceipt | null): WarehouseReceiptFormValues {
  return {
    merchant_id: receipt?.merchant_id ?? 0,
    warehouse_id: receipt?.warehouse_id ?? 0,
    notes: receipt?.notes ?? '',
    items: receipt?.items?.length
      ? receipt.items.map((item) => ({
          warehouse_product_id: item.warehouse_product_id,
          quantity: item.quantity,
          accepted_quantity: item.accepted_quantity,
          rejected_quantity: item.rejected_quantity,
          condition: item.condition ?? '',
          notes: item.notes ?? '',
        }))
      : [
          {
            warehouse_product_id: 0,
            quantity: 1,
            accepted_quantity: 1,
            rejected_quantity: 0,
            condition: 'good',
            notes: '',
          },
        ],
  }
}

function WarehouseReceiptFormDialog({
  currentReceipt,
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
}: {
  currentReceipt?: WarehouseReceipt | null
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: WarehouseReceiptFormValues) => void
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
  } = useForm<WarehouseReceiptFormValues>({
    defaultValues: mapReceiptToValues(currentReceipt),
  })
  const merchantId = watch('merchant_id')
  const productsQuery = useQuery({
    queryKey: ['warehouse-products', 'receipts-form', merchantId],
    queryFn: () => listWarehouseProducts({ merchant_id: merchantId || undefined }),
    enabled: open && Boolean(merchantId),
  })
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  useEffect(() => {
    if (open) {
      reset(mapReceiptToValues(currentReceipt))
    }
  }, [currentReceipt, open, reset])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={<CardTitle>{currentReceipt ? t('Edit {{name}}', { name: currentReceipt.receipt_number ?? t('Receipt') }) : t('Create Receipt')}</CardTitle>}
    >
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>{t('Merchant')}</span>
          <Controller
            name="merchant_id"
            control={control}
            render={({ field }) => (
              <MerchantSelector
                value={field.value > 0 ? String(field.value) : ''}
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
              />
            )}
          />
          <FieldError error={errors.merchant_id?.message ?? getFieldError('merchant_id')} />
        </label>

        <label className="field">
          <span>{t('Warehouse')}</span>
          <Controller
            name="warehouse_id"
            control={control}
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
          <span>{t('Notes')}</span>
          <Input {...register('notes')} />
          <FieldError error={errors.notes?.message ?? getFieldError('notes')} />
        </label>

        <div className="page-stack">
          <div className="section-title-row">
            <div>
              <CardTitle>{t('Items')}</CardTitle>
              <CardDescription>{t('Accepted quantities increase stock after confirmation.')}</CardDescription>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => append({
                warehouse_product_id: 0,
                quantity: 1,
                accepted_quantity: 1,
                rejected_quantity: 0,
                condition: 'good',
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
                  <span>{t('Accepted')}</span>
                  <Input type="number" {...register(`items.${index}.accepted_quantity`, { valueAsNumber: true })} />
                  <FieldError error={errors.items?.[index]?.accepted_quantity?.message ?? getFieldError(`items.${index}.accepted_quantity`)} />
                </label>

                <label className="field">
                  <span>{t('Rejected')}</span>
                  <Input type="number" {...register(`items.${index}.rejected_quantity`, { valueAsNumber: true })} />
                  <FieldError error={errors.items?.[index]?.rejected_quantity?.message ?? getFieldError(`items.${index}.rejected_quantity`)} />
                </label>

                <label className="field">
                  <span>{t('Condition')}</span>
                  <Input {...register(`items.${index}.condition`)} />
                  <FieldError error={errors.items?.[index]?.condition?.message ?? getFieldError(`items.${index}.condition`)} />
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
            {currentReceipt ? t('Save Receipt') : t('Create Receipt')}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function WarehouseReceiptsPage() {
  const { t } = useTranslation()
  const [filters, setFilters] = useState(initialFilters)
  const [successMessage, setSuccessMessage] = useState('')
  const [receiptInForm, setReceiptInForm] = useState<WarehouseReceipt | null>(null)
  const [pendingAction, setPendingAction] = useState<{ kind: 'confirm' | 'cancel'; receipt: WarehouseReceipt } | null>(null)
  const queryClient = useQueryClient()
  const params = useMemo(() => ({
    ...(filters.merchant_id ? { merchant_id: filters.merchant_id } : {}),
    ...(filters.warehouse_id ? { warehouse_id: filters.warehouse_id } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.receipt_number ? { receipt_number: filters.receipt_number } : {}),
    ...(filters.date_from ? { date_from: filters.date_from } : {}),
    ...(filters.date_to ? { date_to: filters.date_to } : {}),
  }), [filters])
  const query = useQuery({
    queryKey: ['warehouse-receipts', params],
    queryFn: () => listWarehouseReceipts(params),
  })
  const createMutation = useMutation({
    mutationFn: createWarehouseReceipt,
    onSuccess: async () => {
      setReceiptInForm(null)
      setSuccessMessage(t('Warehouse receipt saved successfully.'))
      await queryClient.invalidateQueries({ queryKey: ['warehouse-receipts'] })
    },
  })
  const updateMutation = useMutation({
    mutationFn: ({ receiptId, payload }: { receiptId: number; payload: WarehouseReceiptFormValues }) =>
      updateWarehouseReceipt(receiptId, payload),
    onSuccess: async () => {
      setReceiptInForm(null)
      setSuccessMessage(t('Warehouse receipt updated successfully.'))
      await queryClient.invalidateQueries({ queryKey: ['warehouse-receipts'] })
    },
  })
  const actionMutation = useMutation({
    mutationFn: ({ kind, receiptId }: { kind: 'confirm' | 'cancel'; receiptId: number }) => (
      kind === 'confirm'
        ? confirmWarehouseReceipt(receiptId)
        : cancelWarehouseReceipt(receiptId)
    ),
    onSuccess: async (_, variables) => {
      setPendingAction(null)
      setSuccessMessage(
        variables.kind === 'confirm'
          ? t('Warehouse receipt confirmed successfully.')
          : t('Warehouse receipt cancelled successfully.'),
      )
      await queryClient.invalidateQueries({ queryKey: ['warehouse-receipts'] })
    },
  })

  const receipts = query.data?.data ?? []
  const formMutation = receiptInForm?.id ? updateMutation : createMutation

  return (
    <section className="page-section page-section--with-sidebar">
      <PageHeader
        title={t('Warehouse Receipts')}
        description={t('Inbound merchant receipts, draft review, and stock-in confirmation.')}
        actions={
          <Button type="button" onClick={() => setReceiptInForm({} as WarehouseReceipt)}>
            {t('Create Receipt')}
          </Button>
        }
      />

      <aside className="page-sidebar-filters">
        <Card variant="flat" className="dashboard-filter-card">
          <CardHeader>
            <CardTitle>{t('Filters')}</CardTitle>
            <CardDescription>{t('Backend receipt filters for merchant, warehouse, status, number, and date range.')}</CardDescription>
          </CardHeader>
          <CardContent className="dashboard-filters dashboard-filters--sidebar">
          <label className="field">
            <span>{t('Merchant')}</span>
            <MerchantSelector
              value={filters.merchant_id}
              includeAllOption
              onChange={(merchant_id) => setFilters((current) => ({ ...current, merchant_id }))}
            />
          </label>
          <label className="field">
            <span>{t('Warehouse')}</span>
            <WarehouseSelector
              value={filters.warehouse_id}
              includeAllOption
              onChange={(warehouse_id) => setFilters((current) => ({ ...current, warehouse_id }))}
            />
          </label>
          <label className="field">
            <span>{t('Status')}</span>
            <Select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="">{t('All statuses')}</option>
              <option value="draft">{t('draft')}</option>
              <option value="confirmed">{t('confirmed')}</option>
              <option value="cancelled">{t('cancelled')}</option>
            </Select>
          </label>
          <label className="field">
            <span>{t('Receipt Number')}</span>
            <Input value={filters.receipt_number} onChange={(event) => setFilters((current) => ({ ...current, receipt_number: event.target.value }))} />
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
              {t('Reset')}
            </Button>
          </div>
        </CardContent>
      </Card>
      </aside>

      <main className="page-main-content">
      <Card className="table-card">
        <CardHeader className="table-card__header">
          <CardTitle>{t('Receipts')}</CardTitle>
          <CardDescription>{t('Draft receipts can be edited, confirmed, or cancelled.')}</CardDescription>
        </CardHeader>
        <CardContent>
          {successMessage ? <div className="form-success">{successMessage}</div> : null}
          {formMutation.error ? <div className="form-error">{getApiErrorMessage(formMutation.error)}</div> : null}
          {actionMutation.error ? <div className="form-error">{getApiErrorMessage(actionMutation.error)}</div> : null}
          {query.isLoading ? <LoadingState title={t('Loading warehouse receipts')} /> : null}
          {query.isError ? (
            <ErrorState title={t('Unable to load warehouse receipts')} message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
          ) : null}
          {!query.isLoading && !query.isError && !receipts.length ? (
            <EmptyState title={t('No warehouse receipts')} description={t('No receipts match the selected filters.')} />
          ) : null}
          {receipts.length ? (
            <TableContainer>
              <Table variant="striped">
                <thead>
                  <tr>
                    <TableHead>{t('Receipt')}</TableHead>
                    <TableHead>{t('Merchant')}</TableHead>
                    <TableHead>{t('Warehouse')}</TableHead>
                    <TableHead>{t('Items')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Created')}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((receipt) => (
                    <tr key={receipt.id}>
                      <TableCell>
                        <Link className="table-link" to={adminPath(`/warehouse/receipts/${receipt.id}`)}>
                          {receipt.receipt_number ?? `Receipt #${receipt.id}`}
                        </Link>
                      </TableCell>
                      <TableCell>{receipt.merchant_name ?? receipt.merchant_id}</TableCell>
                      <TableCell>{receipt.warehouse_name ?? receipt.warehouse_id}</TableCell>
                      <TableCell>{receipt.items.length}</TableCell>
                      <TableCell>
                        <StatusBadge value={receipt.status}>
                          {pickDisplayLabel(receipt.status, receipt.status_label)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>{formatDate(receipt.created_at)}</TableCell>
                      <TableCell>
                        <div className="page-header__button-row">
                          {receipt.status === 'draft' ? (
                            <Button type="button" variant="secondary" onClick={() => setReceiptInForm(receipt)}>
                              {t('Edit')}
                            </Button>
                          ) : null}
                          {receipt.status === 'draft' ? (
                            <Button type="button" variant="secondary" onClick={() => setPendingAction({ kind: 'confirm', receipt })}>
                              {t('Confirm')}
                            </Button>
                          ) : null}
                          {receipt.status === 'draft' ? (
                            <Button type="button" variant="danger" onClick={() => setPendingAction({ kind: 'cancel', receipt })}>
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

      <WarehouseReceiptFormDialog
        currentReceipt={receiptInForm?.id ? receiptInForm : null}
        error={formMutation.error}
        isSubmitting={formMutation.isPending}
        onClose={() => setReceiptInForm(null)}
        onSubmit={(values) => {
          if (receiptInForm?.id) {
            updateMutation.mutate({ receiptId: receiptInForm.id, payload: values })
            return
          }

          createMutation.mutate(values)
        }}
        open={Boolean(receiptInForm)}
      />

      <ConfirmActionModal
        open={Boolean(pendingAction)}
        title={pendingAction?.kind === 'confirm' ? t('Confirm receipt') : t('Cancel receipt')}
        description={pendingAction ? t('{{action}} {{name}}?', {
          action: pendingAction.kind === 'confirm' ? t('Confirm') : t('Cancel'),
          name: pendingAction.receipt.receipt_number ?? `receipt #${pendingAction.receipt.id}`,
        }) : ''}
        confirmLabel={pendingAction?.kind === 'confirm' ? t('Confirm receipt') : t('Cancel receipt')}
        variant={pendingAction?.kind === 'confirm' ? 'default' : 'danger'}
        loading={actionMutation.isPending}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          if (pendingAction) {
            actionMutation.mutate({ kind: pendingAction.kind, receiptId: pendingAction.receipt.id })
          }
        }}
      />
      </main>
    </section>
  )
}
