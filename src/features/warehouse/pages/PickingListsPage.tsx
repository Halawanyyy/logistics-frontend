import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { listOrders } from '../../orders/api/orders.api'
import { cancelPickingList, generatePickingList, listPickingLists } from '../api/warehouse.api'
import type { GeneratePickingListRequest, PickingList } from '../types/warehouse.types'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { ConfirmActionModal } from '../../../shared/components/modals/ConfirmActionModal'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { DriverSelector } from '../../../shared/components/selectors/DriverSelector'
import { WarehouseSelector } from '../../../shared/components/selectors/WarehouseSelector'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Dialog } from '../../../shared/components/ui/Dialog'
import { Input } from '../../../shared/components/ui/Input'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { useFormApiErrors } from '../../../shared/hooks/useFormApiErrors'
import { adminPath } from '../../../shared/routing/paths'
import { formatDate } from '../../../shared/utils/formatters'

type GeneratePickingListFormValues = {
  warehouse_id: number
  assigned_to: number
  notes: string
  order_ids: number[]
}

function GeneratePickingListDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
}: {
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: GeneratePickingListFormValues) => void
  open: boolean
}) {
  const { t } = useTranslation()
  const ordersQuery = useQuery({
    queryKey: ['orders', 'picking-generate'],
    queryFn: () => listOrders({ fulfillment_type: 'from_warehouse' }),
    enabled: open,
  })
  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GeneratePickingListFormValues>({
    defaultValues: {
      warehouse_id: 0,
      assigned_to: 0,
      notes: '',
      order_ids: [],
    },
  })
  const { formError, getFieldError } = useFormApiErrors(error)
  const selectedOrderIds = watch('order_ids') ?? []

  function toggleOrder(orderId: number) {
    const nextOrderIds = selectedOrderIds.includes(orderId)
      ? selectedOrderIds.filter((id) => id !== orderId)
      : [...selectedOrderIds, orderId]
    setValue('order_ids', nextOrderIds, { shouldValidate: true })
  }

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>{t('Generate Picking List')}</CardTitle>}>
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>{t('Warehouse')}</span>
          <Controller
            control={control}
            name="warehouse_id"
            render={({ field }) => (
              <WarehouseSelector
                value={field.value ? String(field.value) : ''}
                onChange={(warehouse_id) => field.onChange(warehouse_id ? Number(warehouse_id) : 0)}
              />
            )}
          />
          <FieldError error={errors.warehouse_id?.message ?? getFieldError('warehouse_id')} />
        </label>
        <label className="field">
          <span>{t('Assigned To')}</span>
          <Controller
            control={control}
            name="assigned_to"
            render={({ field }) => (
              <DriverSelector
                value={field.value ? String(field.value) : ''}
                placeholder="Optional assignee"
                onChange={(assigned_to) => field.onChange(assigned_to ? Number(assigned_to) : 0)}
              />
            )}
          />
          <FieldError error={errors.assigned_to?.message ?? getFieldError('assigned_to')} />
        </label>
        <label className="field">
          <span>{t('Notes')}</span>
          <Input {...register('notes')} />
        </label>

        <div className="field">
          <span>{t('Orders')}</span>
          {ordersQuery.isLoading ? <LoadingState title={t('Loading warehouse orders')} /> : null}
          {ordersQuery.isError ? (
            <ErrorState
              title={t('Unable to load warehouse orders', { defaultValue: 'Unable to load warehouse orders' })}
              message={getApiErrorMessage(ordersQuery.error)}
            />
          ) : null}
          {!ordersQuery.isLoading && !ordersQuery.isError && !(ordersQuery.data?.data.length) ? (
            <EmptyState
              title={t('No warehouse orders found', { defaultValue: 'No warehouse orders found' })}
              description={t('No from_warehouse orders were returned for picking list generation.', { defaultValue: 'No from_warehouse orders were returned for picking list generation.' })}
            />
          ) : null}
          {ordersQuery.data?.data.length ? (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>Select</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {ordersQuery.data.data.map((order) => (
                    <tr key={order.id}>
                      <TableCell>
                        <input
                          checked={selectedOrderIds.includes(order.id)}
                          type="checkbox"
                          onChange={() => toggleOrder(order.id)}
                        />
                      </TableCell>
                      <TableCell>{order.order_number}</TableCell>
                      <TableCell>{order.merchant_name}</TableCell>
                      <TableCell>{order.customer_name}</TableCell>
                      <TableCell><StatusBadge value={order.status} /></TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          ) : null}
          <FieldError error={errors.order_ids?.message ?? getFieldError('order_ids')} />
        </div>

        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>{t('Cancel')}</Button>
          <Button type="submit" loading={isSubmitting} disabled={!selectedOrderIds.length}>
            {t('Generate Picking List')}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function PickingListsPanel({
  embedded = false,
  onCountChange,
}: {
  embedded?: boolean
  onCountChange?: (count: number) => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [generateOpen, setGenerateOpen] = useState(false)
  const [pickingListPendingCancel, setPickingListPendingCancel] = useState<PickingList | null>(null)
  const pickingListsQuery = useQuery({
    queryKey: ['picking-lists'],
    queryFn: () => listPickingLists(),
  })
  const generateMutation = useMutation({
    mutationFn: (values: GeneratePickingListFormValues) => {
      const payload: GeneratePickingListRequest = {
        warehouse_id: values.warehouse_id,
        order_ids: values.order_ids,
        assigned_to: values.assigned_to || undefined,
        notes: values.notes || undefined,
      }
      return generatePickingList(payload)
    },
    onSuccess: async () => {
      setGenerateOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['picking-lists'] })
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
  const cancelMutation = useMutation({
    mutationFn: (pickingListId: number) => cancelPickingList(pickingListId),
    onSuccess: async () => {
      setPickingListPendingCancel(null)
      await queryClient.invalidateQueries({ queryKey: ['picking-lists'] })
    },
  })
  const pickingLists = pickingListsQuery.data?.data ?? []

  useEffect(() => {
    if (pickingListsQuery.data) {
      onCountChange?.(pickingListsQuery.data.data.length)
    }
  }, [onCountChange, pickingListsQuery.data])

  return (
    <section className="page-section">
      {!embedded ? <PageHeader
        title={t('Picking Lists', { defaultValue: 'Picking Lists' })}
        description={t('Generate and manage warehouse picking lists for from_warehouse orders.', { defaultValue: 'Generate and manage warehouse picking lists for from_warehouse orders.' })}
        actions={(
          <Can permission={PERMISSIONS.PICKING_LISTS_CREATE}>
            <Button type="button" onClick={() => setGenerateOpen(true)}>
              {t('Generate Picking List', { defaultValue: 'Generate Picking List' })}
            </Button>
          </Can>
        )}
      /> : null}

      <Card className="table-card">
        <CardHeader>
          <CardTitle>{t('Picking Lists', { defaultValue: 'Picking Lists' })}</CardTitle>
          <CardDescription>{t('Picking batches returned by the documented warehouse list endpoint.', { defaultValue: 'Picking batches returned by the documented warehouse list endpoint.' })}</CardDescription>
        </CardHeader>
        <CardContent>
          {pickingListsQuery.isLoading ? <LoadingState title={t('Loading picking lists', { defaultValue: 'Loading picking lists' })} /> : null}
          {pickingListsQuery.isError ? (
            <ErrorState
              title={t('Unable to load picking lists', { defaultValue: 'Unable to load picking lists' })}
              message={getApiErrorMessage(pickingListsQuery.error)}
              onRetry={() => void pickingListsQuery.refetch()}
            />
          ) : null}
          {!pickingListsQuery.isLoading && !pickingListsQuery.isError && !pickingLists.length ? (
            <EmptyState
              title={t('No picking lists', { defaultValue: 'No picking lists' })}
              description={t('No picking lists were returned from the warehouse API.', { defaultValue: 'No picking lists were returned from the warehouse API.' })}
            />
          ) : null}
          {pickingLists.length ? (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>Picking List</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Orders</TableHead>
                    <TableHead>Total Items</TableHead>
                    <TableHead>Picked Items</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {pickingLists.map((pickingList) => (
                    <tr key={pickingList.id}>
                      <TableCell>
                        <Link className="table-link" to={adminPath(`/warehouse/picking-lists/${pickingList.id}`)}>
                          {pickingList.picking_number ?? pickingList.picking_list_number ?? `Picking List #${pickingList.id}`}
                        </Link>
                      </TableCell>
                      <TableCell>{pickingList.warehouse_name ?? '-'}</TableCell>
                      <TableCell>{pickingList.assigned_to_name ?? '-'}</TableCell>
                      <TableCell><StatusBadge value={pickingList.status ?? 'pending'} /></TableCell>
                      <TableCell>{pickingList.total_orders ?? '-'}</TableCell>
                      <TableCell>{pickingList.total_items ?? '-'}</TableCell>
                      <TableCell>{pickingList.picked_items ?? '-'}</TableCell>
                      <TableCell>{formatDate(pickingList.created_at)}</TableCell>
                      <TableCell>
                        <div className="page-header__button-row">
                          <Link className="table-link" to={adminPath(`/warehouse/picking-lists/${pickingList.id}`)}>
                            View
                          </Link>
                          <Can permission={PERMISSIONS.PICKING_LISTS_CANCEL}>
                            {pickingList.status !== 'cancelled' ? (
                              <Button type="button" variant="secondary" onClick={() => setPickingListPendingCancel(pickingList)}>
                                Cancel
                              </Button>
                            ) : null}
                          </Can>
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

      <GeneratePickingListDialog
        error={generateMutation.error}
        isSubmitting={generateMutation.isPending}
        onClose={() => setGenerateOpen(false)}
        onSubmit={(values) => generateMutation.mutate(values)}
        open={generateOpen}
      />
      <ConfirmActionModal
        open={Boolean(pickingListPendingCancel)}
        title={t('Cancel picking list', { defaultValue: 'Cancel picking list' })}
        description={pickingListPendingCancel ? t('Cancel {{pickingList}}?', { pickingList: pickingListPendingCancel.picking_number ?? pickingListPendingCancel.picking_list_number ?? `#${pickingListPendingCancel.id}`, defaultValue: `Cancel ${pickingListPendingCancel.picking_number ?? pickingListPendingCancel.picking_list_number ?? `#${pickingListPendingCancel.id}`}?` }) : ''}
        confirmLabel={t('Cancel picking list', { defaultValue: 'Cancel picking list' })}
        variant="danger"
        loading={cancelMutation.isPending}
        onCancel={() => setPickingListPendingCancel(null)}
        onConfirm={() => {
          if (pickingListPendingCancel) {
            cancelMutation.mutate(pickingListPendingCancel.id)
          }
        }}
      />
    </section>
  )
}

export function PickingListsPage() {
  return <PickingListsPanel />
}
