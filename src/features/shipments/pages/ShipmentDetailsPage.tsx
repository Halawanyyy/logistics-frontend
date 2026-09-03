import { zodResolver } from '@hookform/resolvers/zod'
import { inferStatAccent, type StatAccent } from '../../../shared/utils/statAccent'
import { useFieldArray, useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { getOrder } from '../../orders/api/orders.api'
import { getShipmentLabel } from '../../../shared/api/labels.api'
import {
  assignShipmentDriver,
  completeShipmentDelivery,
  createShipmentDeliveryAttempt,
  getShipment,
  getShipmentsPrintList,
  listDeliveryAttempts,
  updateShipmentStatus,
} from '../api/shipments.api'
import type {
  CreateDeliveryAttemptPayload,
  ReturnCondition,
  ShipmentPrintListResponse,
  ShipmentItemResultStatus,
  ShipmentStatus,
} from '../types/shipment.types'
import { getApiErrorMessage, isApiNotFound } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { hasPermission } from '../../../shared/auth/permissions'
import { Attachments } from '../../../shared/components/attachments/Attachments'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { LabelDocumentDialog } from '../../../shared/components/labels/LabelDocumentDialog'
import { DriverSelector } from '../../../shared/components/selectors/DriverSelector'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Dialog } from '../../../shared/components/ui/Dialog'
import { Input } from '../../../shared/components/ui/Input'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { Select } from '../../../shared/components/ui/Select'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { useFormApiErrors } from '../../../shared/hooks/useFormApiErrors'
import { pickDisplayLabel } from '../../../shared/i18n/locale'
import { useLocale } from '../../../shared/i18n/useLocale'
import { adminPath } from '../../../shared/routing/paths'
import { formatDate } from '../../../shared/utils/formatters'
import { listWarehouseProducts } from '../../warehouse/api/warehouse.api'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import { NotFoundState } from '../../../shared/components/states/NotFoundState'
import { PrintView } from '../../../shared/components/print/PrintView'
import { useAuthStore } from '../../auth/store/auth.store'
import { getShipmentPrintableLabelDocument } from '../utils/shipmentLabel'

function logShipmentLabelEntry(message: string, details?: Record<string, unknown>) {
  if (!import.meta.env.DEV || typeof console === 'undefined') {
    return
  }

  console.info('[shipment-label]', message, details ?? {})
}

const shipmentStatuses: ShipmentStatus[] = [
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
  'delivered',
  'partially_delivered',
  'failed',
  'returned',
  'returned_to_hub',
  'returned_to_warehouse',
  'cancelled',
]

const terminalShipmentStatuses = new Set<string>([
  'delivered',
  'returned',
  'cancelled',
  'partially_delivered',
  'failed',
  'returned_to_hub',
  'returned_to_warehouse',
])

const manualShipmentStatuses = shipmentStatuses.filter((status) => !['delivered', 'partially_delivered', 'failed'].includes(status))

const deliveryResultOptions = ['failed', 'postponed', 'rescheduled', 'customer_unreachable', 'customer_refused']

const statusSchema = z.object({
  status: z.custom<ShipmentStatus>(
    (value) => typeof value === 'string' && shipmentStatuses.includes(value as ShipmentStatus),
    { message: 'Status is required.' },
  ),
  notes: z.string().optional(),
})

const assignDriverSchema = z.object({
  driver_id: z.number().min(1, 'Driver is required.'),
})

const deliveryAttemptSchema = z.object({
  result: z.string().min(1, 'Result is required.'),
  reason: z.string().min(1, 'Reason is required.'),
  notes: z.string().optional(),
  next_action: z.string().optional(),
  next_attempt_date: z.string().optional(),
})

type StatusFormValues = z.infer<typeof statusSchema>
type AssignDriverFormValues = z.infer<typeof assignDriverSchema>
type DeliveryAttemptFormValues = z.infer<typeof deliveryAttemptSchema>
type PrintShipmentListFormValues = {
  date: string
  status: string
}

type CompleteDeliveryFormValues = {
  shipment_status: 'delivered' | 'partially_delivered' | 'failed'
  notes: string
  items: Array<{
    order_item_id: number
    result_status: ShipmentItemResultStatus
    quantity: number
    warehouse_product_id: number
    return_condition: '' | ReturnCondition
    notes: string
  }>
}

function UpdateStatusDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
  currentStatus,
}: {
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: StatusFormValues) => void
  open: boolean
  currentStatus: ShipmentStatus
}) {
  const { t } = useTranslation()
  const { formError, getFieldError } = useFormApiErrors(error)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StatusFormValues>({
    resolver: zodResolver(statusSchema),
    defaultValues: { status: currentStatus, notes: '' },
  })

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>{t('Update Status', { defaultValue: 'Update Status' })}</CardTitle>}>
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>{t('Status')}</span>
          <Select {...register('status')}>
            {manualShipmentStatuses.map((status) => (
              <option key={status} value={status}>{pickDisplayLabel(status, t(status, { defaultValue: status }))}</option>
            ))}
          </Select>
          <FieldError error={errors.status?.message ?? getFieldError('status')} />
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
            {t('Update Status', { defaultValue: 'Update Status' })}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function AssignDriverDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
  currentDriverId,
}: {
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: AssignDriverFormValues) => void
  open: boolean
  currentDriverId?: number | null
}) {
  const { t } = useTranslation()
  const { formError, getFieldError } = useFormApiErrors(error)
  const {
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<AssignDriverFormValues>({
    resolver: zodResolver(assignDriverSchema),
    defaultValues: { driver_id: currentDriverId ?? 0 },
  })

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>{t('Assign Driver', { defaultValue: 'Assign Driver' })}</CardTitle>}>
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>{t('Driver', { defaultValue: 'Driver' })}</span>
          <DriverSelector
            value={watch('driver_id') ? String(watch('driver_id')) : ''}
            onChange={(driverId) => setValue('driver_id', driverId ? Number(driverId) : 0, { shouldValidate: true })}
          />
          <FieldError error={errors.driver_id?.message ?? getFieldError('driver_id')} />
        </label>
        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {t('Assign Driver', { defaultValue: 'Assign Driver' })}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function DeliveryAttemptDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
}: {
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: DeliveryAttemptFormValues) => void
  open: boolean
}) {
  const { t } = useTranslation()
  const { formError, getFieldError } = useFormApiErrors(error)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeliveryAttemptFormValues>({
    resolver: zodResolver(deliveryAttemptSchema),
    defaultValues: {
      result: 'failed',
      reason: '',
      notes: '',
      next_action: '',
      next_attempt_date: '',
    },
  })

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>{t('Add Delivery Attempt', { defaultValue: 'Add Delivery Attempt' })}</CardTitle>}>
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>{t('Result', { defaultValue: 'Result' })}</span>
          <Select {...register('result')}>
            {deliveryResultOptions.map((result) => (
              <option key={result} value={result}>{t(result, { defaultValue: result })}</option>
            ))}
          </Select>
          <FieldError error={errors.result?.message ?? getFieldError('result')} />
        </label>
        <label className="field">
          <span>{t('Reason', { defaultValue: 'Reason' })}</span>
          <Input {...register('reason')} />
          <FieldError error={errors.reason?.message ?? getFieldError('reason')} />
        </label>
        <label className="field">
          <span>{t('Notes')}</span>
          <Input {...register('notes')} />
          <FieldError error={errors.notes?.message ?? getFieldError('notes')} />
        </label>
        <label className="field">
          <span>{t('Next Action', { defaultValue: 'Next Action' })}</span>
          <Input {...register('next_action')} />
          <FieldError error={errors.next_action?.message ?? getFieldError('next_action')} />
        </label>
        <label className="field">
          <span>{t('Next Attempt Date', { defaultValue: 'Next Attempt Date' })}</span>
          <Input type="datetime-local" {...register('next_attempt_date')} />
          <FieldError error={errors.next_attempt_date?.message ?? getFieldError('next_attempt_date')} />
        </label>
        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {t('Add Attempt', { defaultValue: 'Add Attempt' })}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function ShipmentPrintDialog({
  error,
  initialDate,
  initialStatus,
  isSubmitting,
  onClose,
  onSubmit,
  open,
}: {
  error?: unknown
  initialDate: string
  initialStatus: string
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: PrintShipmentListFormValues) => void
  open: boolean
}) {
  const { t } = useTranslation()
  const { formError, getFieldError } = useFormApiErrors(error)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PrintShipmentListFormValues>({
    defaultValues: {
      date: initialDate,
      status: initialStatus,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        date: initialDate,
        status: initialStatus,
      })
    }
  }, [initialDate, initialStatus, open, reset])

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>{t('Load Print View', { defaultValue: 'Load Print View' })}</CardTitle>} variant="small">
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>{t('Print Date', { defaultValue: 'Print Date' })}</span>
          <Input
            type="date"
            {...register('date', { required: t('Print date is required.', { defaultValue: 'Print date is required.' }) })}
          />
          <FieldError error={errors.date?.message ?? getFieldError('date')} />
        </label>
        <label className="field">
          <span>{t('Status')}</span>
          <Select {...register('status')}>
            <option value="">{t('All statuses')}</option>
            {shipmentStatuses.map((status) => (
              <option key={status} value={status}>{pickDisplayLabel(status, t(status, { defaultValue: status }))}</option>
            ))}
          </Select>
          <FieldError error={errors.status?.message ?? getFieldError('status')} />
        </label>
        <p className="table-meta">
          {t('Driver and delivery location filters are taken from this shipment when available.', {
            defaultValue: 'Driver and delivery location filters are taken from this shipment when available.',
          })}
        </p>
        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {t('Load Print View', { defaultValue: 'Load Print View' })}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function CompleteDeliveryDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
  fulfillmentType,
  merchantId,
  orderItems,
}: {
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: CompleteDeliveryFormValues) => void
  open: boolean
  fulfillmentType?: string
  merchantId: number
  orderItems: Array<{
    id: number
    product_name: string
    quantity: number
    delivered_quantity?: number
    returned_quantity?: number
    damaged_quantity?: number
  }>
}) {
  const { t } = useTranslation()
  const { formError, getFieldError } = useFormApiErrors(error)
  const remainingItems = useMemo(
    () => orderItems.map((item) => ({
      ...item,
      remaining: Math.max(
        0,
        item.quantity - (item.delivered_quantity ?? 0) - (item.returned_quantity ?? 0) - (item.damaged_quantity ?? 0),
      ),
    })).filter((item) => item.remaining > 0),
    [orderItems],
  )
  const warehouseProductsQuery = useQuery({
    queryKey: ['warehouse-products', 'complete-delivery', merchantId],
    queryFn: () => listWarehouseProducts({ merchant_id: merchantId, status: 'active' }),
    enabled: open && fulfillmentType === 'from_warehouse' && merchantId > 0,
  })
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CompleteDeliveryFormValues>({
    defaultValues: {
      shipment_status: 'delivered',
      notes: '',
      items: remainingItems.map((item) => ({
        order_item_id: item.id,
        result_status: 'delivered',
        quantity: item.remaining,
        warehouse_product_id: 0,
        return_condition: '',
        notes: '',
      })),
    },
  })
  const { fields } = useFieldArray({ control, name: 'items' })

  useEffect(() => {
    reset({
      shipment_status: 'delivered',
      notes: '',
      items: remainingItems.map((item) => ({
        order_item_id: item.id,
        result_status: 'delivered',
        quantity: item.remaining,
        warehouse_product_id: 0,
        return_condition: '',
        notes: '',
      })),
    })
  }, [open, remainingItems, reset])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={<CardTitle>{t('Complete Delivery', { defaultValue: 'Complete Delivery' })}</CardTitle>}
    >
      {remainingItems.length ? (
        <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
          <label className="field">
            <span>{t('Shipment Status', { defaultValue: 'Shipment Status' })}</span>
            <Select {...register('shipment_status')}>
              <option value="delivered">{t('delivered', { defaultValue: 'delivered' })}</option>
              <option value="partially_delivered">{t('partially_delivered', { defaultValue: 'partially_delivered' })}</option>
              <option value="failed">{t('failed', { defaultValue: 'failed' })}</option>
            </Select>
            <FieldError error={errors.shipment_status?.message ?? getFieldError('shipment_status')} />
          </label>
          <label className="field">
            <span>{t('Notes')}</span>
            <Input {...register('notes')} />
            <FieldError error={errors.notes?.message ?? getFieldError('notes')} />
          </label>

          <div className="order-items-list">
            {fields.map((field, index) => {
              const orderItem = remainingItems[index]
              const resultStatus = watch(`items.${index}.result_status`)
              const showReturnCondition = fulfillmentType === 'from_warehouse' && (resultStatus === 'returned' || resultStatus === 'damaged')

              return (
                <div className="order-item-row" key={field.id}>
                  <input type="hidden" {...register(`items.${index}.order_item_id`, { valueAsNumber: true })} />
                  <label className="field">
                    <span>{t('Product')}</span>
                    <Input value={orderItem.product_name} disabled />
                  </label>
                  <label className="field">
                    <span>{t('Ordered', { defaultValue: 'Ordered' })}</span>
                    <Input value={String(orderItem.quantity)} disabled />
                  </label>
                  <label className="field">
                    <span>{t('Remaining', { defaultValue: 'Remaining' })}</span>
                    <Input value={String(orderItem.remaining)} disabled />
                  </label>
                  <label className="field">
                    <span>{t('Result', { defaultValue: 'Result' })}</span>
                    <Select {...register(`items.${index}.result_status`)}>
                      <option value="delivered">{t('delivered', { defaultValue: 'delivered' })}</option>
                      <option value="returned">{t('returned', { defaultValue: 'returned' })}</option>
                      <option value="damaged">{t('damaged', { defaultValue: 'damaged' })}</option>
                      <option value="cancelled">{t('cancelled', { defaultValue: 'cancelled' })}</option>
                    </Select>
                    <FieldError error={errors.items?.[index]?.result_status?.message ?? getFieldError(`items.${index}.result_status`)} />
                  </label>
                  <label className="field">
                    <span>{t('Quantity')}</span>
                    <Input
                      type="number"
                      {...register(`items.${index}.quantity`, {
                        valueAsNumber: true,
                        validate: (value) => {
                          if (!value || value <= 0) {
                            return 'Quantity must be at least 1.'
                          }
                          if (value > orderItem.remaining) {
                            return 'Quantity cannot exceed the remaining quantity for this item.'
                          }
                          return true
                        },
                      })}
                    />
                    <FieldError error={errors.items?.[index]?.quantity?.message ?? getFieldError(`items.${index}.quantity`)} />
                  </label>
                  {showReturnCondition ? (
                    <>
                      <label className="field">
                        <span>{t('Warehouse Product', { defaultValue: 'Warehouse Product' })}</span>
                        <Select {...register(`items.${index}.warehouse_product_id`, { valueAsNumber: true })}>
                          <option value={0}>{t('Select product', { defaultValue: 'Select product' })}</option>
                          {(warehouseProductsQuery.data?.data ?? []).map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} ({product.sku})
                            </option>
                          ))}
                        </Select>
                        <FieldError error={errors.items?.[index]?.warehouse_product_id?.message ?? getFieldError(`items.${index}.warehouse_product_id`)} />
                      </label>
                      <label className="field">
                        <span>{t('Return Condition', { defaultValue: 'Return Condition' })}</span>
                        <Select
                          {...register(`items.${index}.return_condition`, {
                            validate: (value) => (showReturnCondition && !value ? 'Return condition is required.' : true),
                          })}
                        >
                          <option value="">{t('Select condition', { defaultValue: 'Select condition' })}</option>
                          <option value="sellable">{t('sellable', { defaultValue: 'sellable' })}</option>
                          <option value="damaged">{t('damaged', { defaultValue: 'damaged' })}</option>
                          <option value="disposed">{t('disposed', { defaultValue: 'disposed' })}</option>
                        </Select>
                        <FieldError error={errors.items?.[index]?.return_condition?.message ?? getFieldError(`items.${index}.return_condition`)} />
                      </label>
                    </>
                  ) : null}
                  <label className="field">
                    <span>{t('Notes')}</span>
                    <Input {...register(`items.${index}.notes`)} />
                    <FieldError error={errors.items?.[index]?.notes?.message ?? getFieldError(`items.${index}.notes`)} />
                  </label>
                </div>
              )
            })}
          </div>

          {formError ? <div className="form-error">{formError}</div> : null}
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('Cancel')}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {t('Complete Delivery', { defaultValue: 'Complete Delivery' })}
            </Button>
          </div>
        </form>
      ) : (
        <EmptyState
          title={t('No remaining order items', { defaultValue: 'No remaining order items' })}
          description={t('All order items already have completed delivery counters, so there is nothing left to complete here.', {
            defaultValue: 'All order items already have completed delivery counters, so there is nothing left to complete here.',
          })}
        />
      )}
    </Dialog>
  )
}

export function ShipmentDetailsPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { shipmentId } = useParams()
  const user = useAuthStore((state) => state.user)
  const [statusOpen, setStatusOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [completeDeliveryOpen, setCompleteDeliveryOpen] = useState(false)
  const [deliveryAttemptOpen, setDeliveryAttemptOpen] = useState(false)

  const [printOpen, setPrintOpen] = useState(false)
  const [printData, setPrintData] = useState<ShipmentPrintListResponse['data'] | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const queryClient = useQueryClient()
  const canViewDeliveryAttempts = hasPermission(user, PERMISSIONS.DELIVERY_ATTEMPTS_VIEW)
    const query = useQuery({
    queryKey: ['shipments', shipmentId],
    queryFn: () => getShipment(shipmentId!),
    enabled: Boolean(shipmentId),
  })
  const shipmentData = query.data?.data
  const orderQuery = useQuery({
    queryKey: ['shipments', shipmentId, 'order'],
    queryFn: () => getOrder(shipmentData!.order_id),
    enabled: Boolean(shipmentData?.order_id),
  })
  const attemptsQuery = useQuery({
    queryKey: ['delivery-attempts', shipmentId],
    queryFn: () => listDeliveryAttempts({ shipment_id: shipmentId! }),
    enabled: Boolean(shipmentId) && canViewDeliveryAttempts,
  })
  
  async function invalidateShipment() {
    await queryClient.invalidateQueries({ queryKey: ['shipments'] })
    await queryClient.invalidateQueries({ queryKey: ['shipments', shipmentId] })
    await queryClient.invalidateQueries({ queryKey: ['shipments', shipmentId, 'order'] })
    await queryClient.invalidateQueries({ queryKey: ['delivery-attempts', shipmentId] })
    await queryClient.invalidateQueries({ queryKey: ['shipments', shipmentId, 'timeline'] })
    await queryClient.invalidateQueries({ queryKey: ['orders'] })
  }

  const statusMutation = useMutation({
    mutationFn: (values: StatusFormValues) => updateShipmentStatus(shipmentId!, values),
    onSuccess: async () => {
      setStatusOpen(false)
      setSuccessMessage(t('Shipment status updated successfully.', { defaultValue: 'Shipment status updated successfully.' }))
      await invalidateShipment()
    },
  })
  const assignMutation = useMutation({
    mutationFn: (values: AssignDriverFormValues) => assignShipmentDriver(shipmentId!, values),
    onSuccess: async () => {
      setAssignOpen(false)
      setSuccessMessage(t('Driver assigned successfully.', { defaultValue: 'Driver assigned successfully.' }))
      await invalidateShipment()
    },
  })
  const completeDeliveryMutation = useMutation({
    mutationFn: (values: CompleteDeliveryFormValues) => completeShipmentDelivery(shipmentId!, {
      shipment_status: values.shipment_status,
      notes: values.notes || undefined,
      items: values.items.map((item) => ({
        order_item_id: item.order_item_id,
        result_status: item.result_status,
        quantity: item.quantity,
        ...(item.warehouse_product_id ? { warehouse_product_id: item.warehouse_product_id } : {}),
        ...((item.return_condition && (item.result_status === 'returned' || item.result_status === 'damaged'))
          ? { return_condition: item.return_condition }
          : {}),
        ...(item.notes ? { notes: item.notes } : {}),
      })),
    }),
    onSuccess: async () => {
      setCompleteDeliveryOpen(false)
      setSuccessMessage(t('Delivery completed successfully.', { defaultValue: 'Delivery completed successfully.' }))
      await invalidateShipment()
    },
  })
  const deliveryAttemptMutation = useMutation({
    mutationFn: (values: DeliveryAttemptFormValues) => {
      const payload: CreateDeliveryAttemptPayload = {
        result: values.result,
        reason: values.reason,
        notes: values.notes || undefined,
        next_action: values.next_action || undefined,
        next_attempt_date: values.next_attempt_date
          ? values.next_attempt_date.replace('T', ' ') + ':00'
          : undefined,
      }
      return createShipmentDeliveryAttempt(shipmentId!, payload)
    },
    onSuccess: async () => {
      setDeliveryAttemptOpen(false)
      setSuccessMessage(t('Delivery attempt recorded successfully.', { defaultValue: 'Delivery attempt recorded successfully.' }))
      await invalidateShipment()
    },
  })
  const printMutation = useMutation({
    mutationFn: getShipmentsPrintList,
    onSuccess: (response) => {
      setPrintData(response.data)
    },
  })

  if (query.isLoading) {
    return (
      <LoadingState
        title={t('Loading shipment', { defaultValue: 'Loading shipment' })}
        description={t('Fetching shipment details and status history from the API.', {
          defaultValue: 'Fetching shipment details and status history from the API.',
        })}
      />
    )
  }

  if (query.isError && isApiNotFound(query.error)) {
    return (
      <NotFoundState
        title={t('Shipment not found', { defaultValue: 'Shipment not found' })}
        description={t('This shipment could not be found in the shipments API.', {
          defaultValue: 'This shipment could not be found in the shipments API.',
        })}
      />
    )
  }

  if (query.isError || !query.data) {
    return <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
  }

  const shipment = query.data.data
  const order = orderQuery.data?.data
  const orderItems = order?.items ?? []
  const canUpdateStatus = hasPermission(user, PERMISSIONS.SHIPMENTS_UPDATE_STATUS)
  const canAssignDriver = hasPermission(user, PERMISSIONS.SHIPMENTS_ASSIGN_DRIVER)
  const canCreateDeliveryAttempt = hasPermission(user, PERMISSIONS.DELIVERY_ATTEMPTS_CREATE)
  const isTerminalShipment = terminalShipmentStatuses.has(shipment.status)
  const canRecordDeliveryAttempt = ['in_transit', 'out_for_delivery'].includes(shipment.status)
  const canCompleteDelivery = shipment.status === 'delivery_attempted'

  const defaultPrintDate = shipment.histories[shipment.histories.length - 1]?.created_at?.slice(0, 10)
    ?? shipment.created_at.slice(0, 10)

  return (
    <section className="page-section report-surface">
      <PageHeader
        title={shipment.shipment_number}
        description={t('Shipment created from order #{{orderNumber}}.', {
          orderNumber: shipment.order_number ?? shipment.order_id,
          defaultValue: `Shipment created from order #${shipment.order_number ?? shipment.order_id}.`,
        })}
        actions={
          <div className="page-header__button-row">
            {canAssignDriver && !isTerminalShipment ? (
              <Button type="button" variant="secondary" onClick={() => setAssignOpen(true)}>
                {shipment.assigned_driver_id
                  ? t('Change Driver', { defaultValue: 'Change Driver' })
                  : t('Assign Driver', { defaultValue: 'Assign Driver' })}
              </Button>
            ) : null}
            {canUpdateStatus && !isTerminalShipment ? (
              <Button type="button" onClick={() => setStatusOpen(true)}>
                {t('Update Status', { defaultValue: 'Update Status' })}
              </Button>
            ) : null}
            {canCreateDeliveryAttempt && canRecordDeliveryAttempt ? (
              <Button type="button" variant="secondary" onClick={() => setDeliveryAttemptOpen(true)}>
                {t('Add Delivery Attempt', { defaultValue: 'Add Delivery Attempt' })}
              </Button>
            ) : null}
            {canUpdateStatus && canCompleteDelivery ? (
              <Button
                type="button"
                variant="secondary"
                disabled={orderQuery.isLoading || !orderItems.length}
                onClick={() => setCompleteDeliveryOpen(true)}
              >
                {t('Complete Delivery', { defaultValue: 'Complete Delivery' })}
              </Button>
            ) : null}
            <Can permission={PERMISSIONS.SHIPMENTS_PRINT}>
              <Button variant="secondary" onClick={() => setPrintOpen(true)} loading={printMutation.isPending}>
                {t('Load Print View', { defaultValue: 'Load Print View' })}
              </Button>
            </Can>
            <LabelDocumentDialog
              defaultFormat="html"
              fetchDocument={(options) => {
                logShipmentLabelEntry('ShipmentDetailsPage label action invoked', {
                  shipmentId: shipment.id,
                  shipmentNumber: shipment.shipment_number,
                })

                return getShipmentPrintableLabelDocument({
                  fetchDocument: (requestOptions) => getShipmentLabel(shipment.id, requestOptions),
                  locale,
                  options,
                  shipment,
                  t,
                })
              }}
              formats={['html', 'pdf']}
              title={t('Shipment Waybill - {{shipmentNumber}}', {
                shipmentNumber: shipment.shipment_number,
                defaultValue: `Shipment Waybill - ${shipment.shipment_number}`,
              })}
              triggerLabel={t('Waybill', { defaultValue: 'Waybill' })}
            />
            <Link className="ui-link-reset" to={adminPath('/shipments')}>
              <Button variant="secondary">{t('Back to shipments', { defaultValue: 'Back to shipments' })}</Button>
            </Link>
          </div>
        }
      />

      {successMessage ? <div className="form-success">{successMessage}</div> : null}
      {statusMutation.error ? <div className="form-error">{getApiErrorMessage(statusMutation.error)}</div> : null}
      {assignMutation.error ? <div className="form-error">{getApiErrorMessage(assignMutation.error)}</div> : null}
      {completeDeliveryMutation.error ? <div className="form-error">{getApiErrorMessage(completeDeliveryMutation.error)}</div> : null}
      {deliveryAttemptMutation.error ? <div className="form-error">{getApiErrorMessage(deliveryAttemptMutation.error)}</div> : null}
      {printMutation.error ? <div className="form-error">{getApiErrorMessage(printMutation.error)}</div> : null}

      <div className="details-grid">
        <Card className="detail-card">
          <CardHeader>
            <CardTitle>{t('Overview', { defaultValue: 'Overview' })}</CardTitle>
            <CardDescription>{t('Shipment summary, customer, order type, and collection values.', {
              defaultValue: 'Shipment summary, customer, order type, and collection values.',
            })}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="detail-list">
              <div><dt>{t('Merchant')}</dt><dd>{shipment.merchant_name}</dd></div>
              <div><dt>{t('Customer')}</dt><dd>{shipment.customer_name}</dd></div>
              <div><dt>{t('Phone')}</dt><dd>{shipment.customer_phone}</dd></div>
              <div>
                <dt>{t('Status')}</dt>
                <dd>
                  <StatusBadge value={shipment.status}>
                    {pickDisplayLabel(shipment.status, shipment.status_label)}
                  </StatusBadge>
                </dd>
              </div>
              <div><dt>{t('Order Type', { defaultValue: 'Order Type' })}</dt><dd>{shipment.order_type ?? '-'}</dd></div>
              <div>
                <dt>{t('Fulfillment Type', { defaultValue: 'Fulfillment Type' })}</dt>
                <dd>
                  <StatusBadge value={shipment.fulfillment_type}>
                    {pickDisplayLabel(shipment.fulfillment_type, null)}
                  </StatusBadge>
                </dd>
              </div>
              <div>
                <dt>{t('Payment Type', { defaultValue: 'Payment Type' })}</dt>
                <dd>
                  <StatusBadge value={shipment.payment_type}>
                    {pickDisplayLabel(shipment.payment_type, shipment.payment_type_label)}
                  </StatusBadge>
                </dd>
              </div>
              <div><dt>{t('Assigned Driver', { defaultValue: 'Assigned Driver' })}</dt><dd>{shipment.assigned_driver_name ?? '-'}</dd></div>
              <div><dt>{t('COD Amount', { defaultValue: 'COD Amount' })}</dt><dd><MoneyDisplay value={shipment.cod_amount} /></dd></div>
              <div><dt>{t('Delivered COD Amount', { defaultValue: 'Delivered COD Amount' })}</dt><dd><MoneyDisplay value={shipment.delivered_cod_amount ?? null} /></dd></div>
              <div><dt>{t('Shipping Fee', { defaultValue: 'Shipping Fee' })}</dt><dd><MoneyDisplay value={shipment.shipping_fee} /></dd></div>
              <div><dt>{t('Created At', { defaultValue: 'Created At' })}</dt><dd>{formatDate(shipment.created_at)}</dd></div>
            </dl>
          </CardContent>
        </Card>

        <Card className="detail-card">
          <CardHeader>
            <CardTitle>{t('Delivery', { defaultValue: 'Delivery' })}</CardTitle>
            <CardDescription>{t('Delivery destination and tracking notes.', {
              defaultValue: 'Delivery destination and tracking notes.',
            })}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="detail-list">
              <div><dt>{t('Governorate')}</dt><dd>{shipment.delivery_governorate_name}</dd></div>
              <div><dt>{t('Area')}</dt><dd>{shipment.delivery_area_name ?? '-'}</dd></div>
              <div><dt>{t('Address')}</dt><dd>{shipment.delivery_address}</dd></div>
              <div><dt>{t('Tracking Notes', { defaultValue: 'Tracking Notes' })}</dt><dd>{shipment.tracking_notes ?? '-'}</dd></div>
              <div>
                <dt>{t('Order', { defaultValue: 'Order' })}</dt>
                <dd>
                  <Link className="table-link" to={adminPath(`/orders/${shipment.order_id}`)}>
                    {shipment.order_number ?? `#${shipment.order_id}`}
                  </Link>
                </dd>
              </div>
              <div>
                <dt>{t('Public Tracking', { defaultValue: 'Public Tracking' })}</dt>
                <dd>{`/track/${shipment.shipment_number}`}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="table-card">
        <CardHeader className="section-title-row">
          <CardTitle>{t('Status History', { defaultValue: 'Status History' })}</CardTitle>
          <CardDescription>{t('Chronological history returned by the shipment API.', {
            defaultValue: 'Chronological history returned by the shipment API.',
          })}</CardDescription>
        </CardHeader>
        <CardContent>
          <TableContainer>
            <Table variant="compact">
              <thead>
                <tr>
                  <TableHead>{t('Status')}</TableHead>
                  <TableHead>{t('Changed By', { defaultValue: 'Changed By' })}</TableHead>
                  <TableHead>{t('Changed At', { defaultValue: 'Changed At' })}</TableHead>
                </tr>
              </thead>
              <tbody>
                {[...shipment.histories].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((history) => (
                  <tr key={history.id}>
                    <TableCell><StatusBadge value={history.status} /></TableCell>
                    <TableCell>{history.changed_by_name}</TableCell>
                    <TableCell>{formatDate(history.created_at)}</TableCell>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Can permission={PERMISSIONS.DELIVERY_ATTEMPTS_VIEW}>
        <Card className="table-card">
          <CardHeader className="section-title-row">
            <div>
              <CardTitle>{t('Delivery Attempts', { defaultValue: 'Delivery Attempts' })}</CardTitle>
              <CardDescription>{t('Driver attempts linked to this shipment.', {
                defaultValue: 'Driver attempts linked to this shipment.',
              })}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {attemptsQuery.isLoading ? <LoadingState title={t('Loading delivery attempts', { defaultValue: 'Loading delivery attempts' })} /> : null}
            {attemptsQuery.isError ? (
              <ErrorState
                title={t('Unable to load delivery attempts', { defaultValue: 'Unable to load delivery attempts' })}
                message={getApiErrorMessage(attemptsQuery.error)}
                onRetry={() => void attemptsQuery.refetch()}
              />
            ) : null}
            {!attemptsQuery.isLoading && !attemptsQuery.isError && !(attemptsQuery.data?.data.length) ? (
              <EmptyState
                title={t('No delivery attempts', { defaultValue: 'No delivery attempts' })}
                description={t('No delivery attempts have been recorded for this shipment.', {
                  defaultValue: 'No delivery attempts have been recorded for this shipment.',
                })}
              />
            ) : null}
            {attemptsQuery.data?.data.length ? (
              <TableContainer>
                <Table variant="compact">
                  <thead>
                    <tr>
                      <TableHead>{t('Attempt #', { defaultValue: 'Attempt #' })}</TableHead>
                      <TableHead>{t('Driver', { defaultValue: 'Driver' })}</TableHead>
                      <TableHead>{t('Result', { defaultValue: 'Result' })}</TableHead>
                      <TableHead>{t('Reason', { defaultValue: 'Reason' })}</TableHead>
                      <TableHead>{t('Next Action', { defaultValue: 'Next Action' })}</TableHead>
                      <TableHead>{t('Next Attempt', { defaultValue: 'Next Attempt' })}</TableHead>
                      <TableHead>{t('Created', { defaultValue: 'Created' })}</TableHead>
                    </tr>
                  </thead>
                  <tbody>
                    {attemptsQuery.data.data.map((attempt) => (
                      <tr key={attempt.id}>
                        <TableCell>{attempt.attempt_number}</TableCell>
                        <TableCell>{attempt.driver_name ?? '-'}</TableCell>
                        <TableCell>
                          <StatusBadge value={attempt.result}>
                            {attempt.result}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>{attempt.reason}</TableCell>
                        <TableCell>
                          {attempt.next_action ?? '-'}
                          {attempt.notes ? <p className="table-meta">{attempt.notes}</p> : null}
                        </TableCell>
                        <TableCell>{attempt.next_attempt_date ? formatDate(attempt.next_attempt_date) : '-'}</TableCell>
                        <TableCell>{formatDate(attempt.created_at)}</TableCell>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableContainer>
            ) : null}
          </CardContent>
        </Card>
      </Can>

      <Card className="table-card">
        <CardHeader className="section-title-row">
          <div>
            <CardTitle>{t('Delivery Item Results', { defaultValue: 'Delivery Item Results' })}</CardTitle>
            <CardDescription>{t('Recorded item-level delivery results and returned or damaged warehouse handling.', {
              defaultValue: 'Recorded item-level delivery results and returned or damaged warehouse handling.',
            })}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {orderQuery.isLoading ? (
            <LoadingState
              title={t('Loading order items', { defaultValue: 'Loading order items' })}
              description={t('Fetching the linked order items for item-level delivery completion.', {
                defaultValue: 'Fetching the linked order items for item-level delivery completion.',
              })}
            />
          ) : null}
          {orderQuery.isError ? (
            <ErrorState
              title={t('Unable to load linked order items', { defaultValue: 'Unable to load linked order items' })}
              message={getApiErrorMessage(orderQuery.error)}
              onRetry={() => void orderQuery.refetch()}
            />
          ) : null}
          {!orderQuery.isLoading && !orderQuery.isError && !orderItems.length ? (
            <EmptyState
              title={t('No order items available', { defaultValue: 'No order items available' })}
              description={t('The linked order did not return items for item-level delivery completion.', {
                defaultValue: 'The linked order did not return items for item-level delivery completion.',
              })}
            />
          ) : null}
          {shipment.item_results?.length ? (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>{t('Product')}</TableHead>
                    <TableHead>{t('Result', { defaultValue: 'Result' })}</TableHead>
                    <TableHead>{t('Quantity')}</TableHead>
                    <TableHead>{t('Return Condition', { defaultValue: 'Return Condition' })}</TableHead>
                    <TableHead>{t('Notes')}</TableHead>
                    <TableHead>{t('Created', { defaultValue: 'Created' })}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {shipment.item_results.map((result) => (
                    <tr key={result.id}>
                      <TableCell>{result.product_name}</TableCell>
                      <TableCell>
                        <StatusBadge value={result.result_status}>
                          {result.result_status}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>{result.quantity}</TableCell>
                      <TableCell>
                        {result.return_condition ? (
                          <StatusBadge value={result.return_condition}>
                            {result.return_condition}
                          </StatusBadge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{result.notes ?? '-'}</TableCell>
                      <TableCell>{formatDate(result.created_at)}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          ) : (
            !orderQuery.isLoading && !orderQuery.isError ? (
              <EmptyState
                title={t('No item-level delivery results', { defaultValue: 'No item-level delivery results' })}
                description={t('No complete-delivery item results have been recorded for this shipment yet.', {
                  defaultValue: 'No complete-delivery item results have been recorded for this shipment yet.',
                })}
              />
            ) : null
          )}
        </CardContent>
      </Card>





      <Can permission={PERMISSIONS.ATTACHMENTS_VIEW}>
        <Attachments attachableType="shipments" attachableId={shipment.id} />
      </Can>

      {printData ? (
        <PrintView title={t('Shipment Manifest', { defaultValue: 'Shipment Manifest' })}>
          <Card>
            <CardHeader>
              <CardTitle>{t('Shipment Print View', { defaultValue: 'Shipment Print View' })}</CardTitle>
              <CardDescription>{t('Rendered from the documented shipment print-list response for the selected print date.', {
                defaultValue: 'Rendered from the documented shipment print-list response for the selected print date.',
              })}</CardDescription>
            </CardHeader>
            <CardContent className="page-stack">
              <div className="stats-grid">
                <StatTile label={t('Generated At', { defaultValue: 'Generated At' })} value={formatDate(printData.generated_at)} />
                <StatTile label={t('Print Date', { defaultValue: 'Print Date' })} value={printData.filters.date} />
                <StatTile label={t('Total Shipments', { defaultValue: 'Total Shipments' })} value={printData.summary.total_shipments} />
                <StatTile label={t('Total COD', { defaultValue: 'Total COD' })} value={<MoneyDisplay value={printData.summary.total_cod_amount} />} />
                <StatTile label={t('Total Shipping Fee', { defaultValue: 'Total Shipping Fee' })} value={<MoneyDisplay value={printData.summary.total_shipping_fee} />} />
              </div>
              <TableContainer>
                <Table variant="compact">
                  <thead>
                    <tr>
                      <TableHead>{t('Shipment', { defaultValue: 'Shipment' })}</TableHead>
                      <TableHead>{t('Merchant')}</TableHead>
                      <TableHead>{t('Customer')}</TableHead>
                      <TableHead>{t('Phone')}</TableHead>
                      <TableHead>{t('Governorate')}</TableHead>
                      <TableHead>{t('Area')}</TableHead>
                      <TableHead>{t('Address')}</TableHead>
                      <TableHead>{t('Driver', { defaultValue: 'Driver' })}</TableHead>
                      <TableHead>{t('Merchant Phone', { defaultValue: 'Merchant Phone' })}</TableHead>
                      <TableHead>{t('COD')}</TableHead>
                    </tr>
                  </thead>
                  <tbody>
                    {printData.shipments.map((item, index) => (
                      <tr key={`${item.shipment_number}-${index}`}>
                        <TableCell>{item.shipment_number}</TableCell>
                        <TableCell>{item.merchant_name}</TableCell>
                        <TableCell>{item.customer_name}</TableCell>
                        <TableCell>{item.customer_phone}</TableCell>
                        <TableCell>{item.delivery_governorate_name}</TableCell>
                        <TableCell>{item.delivery_area_name ?? '-'}</TableCell>
                        <TableCell>{item.delivery_address}</TableCell>
                        <TableCell>{item.driver_name ?? '-'}</TableCell>
                        <TableCell>{item.merchant_phone ?? '-'}</TableCell>
                        <TableCell><MoneyDisplay value={item.cod_amount} /></TableCell>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </PrintView>
      ) : null}

      {!isTerminalShipment ? (
        <UpdateStatusDialog
          error={statusMutation.error}
          isSubmitting={statusMutation.isPending}
          onClose={() => setStatusOpen(false)}
          onSubmit={(values) => statusMutation.mutate(values)}
          open={statusOpen}
          currentStatus={shipment.status}
        />
      ) : null}
      {!isTerminalShipment ? (
        <AssignDriverDialog
          currentDriverId={shipment.assigned_driver_id}
          error={assignMutation.error}
          isSubmitting={assignMutation.isPending}
          onClose={() => setAssignOpen(false)}
          onSubmit={(values) => assignMutation.mutate(values)}
          open={assignOpen}
        />
      ) : null}
      {canRecordDeliveryAttempt ? (
        <DeliveryAttemptDialog
          error={deliveryAttemptMutation.error}
          isSubmitting={deliveryAttemptMutation.isPending}
          onClose={() => setDeliveryAttemptOpen(false)}
          onSubmit={(values) => deliveryAttemptMutation.mutate(values)}
          open={deliveryAttemptOpen}
        />
      ) : null}
      <ShipmentPrintDialog
        error={printMutation.error}
        initialDate={defaultPrintDate}
        initialStatus={shipment.status}
        isSubmitting={printMutation.isPending}
        onClose={() => setPrintOpen(false)}
        onSubmit={(values) => {
          printMutation.mutate({
            date: values.date,
            ...(values.status ? { status: values.status } : {}),
            ...(shipment.assigned_driver_id ? { assigned_driver_id: shipment.assigned_driver_id } : {}),
            ...(shipment.delivery_governorate_id ? { delivery_governorate_id: shipment.delivery_governorate_id } : {}),
            ...(shipment.delivery_area_id ? { delivery_area_id: shipment.delivery_area_id } : {}),
          })
          setPrintOpen(false)
        }}
        open={printOpen}
      />

      {canCompleteDelivery ? (
        <CompleteDeliveryDialog
          error={completeDeliveryMutation.error}
          fulfillmentType={shipment.fulfillment_type}
          isSubmitting={completeDeliveryMutation.isPending}
          merchantId={shipment.merchant_id}
          onClose={() => setCompleteDeliveryOpen(false)}
          onSubmit={(values) => completeDeliveryMutation.mutate(values)}
          open={completeDeliveryOpen}
          orderItems={orderItems}
        />
      ) : null}
    </section>
  )
}

function StatTile({ accent, label, value }: { accent?: StatAccent; label: string; value: string | number | ReactNode }) {
  return (
    <Card variant="stat" className="stat-card stat-card--neutral" data-accent={accent ?? inferStatAccent(label, 'shipments')}>
      <CardHeader className="stat-card__header">
        <span className="eyebrow">{label}</span>
      </CardHeader>
      <CardContent className="stat-card__content">
        <CardTitle className="stat-card__value">{value}</CardTitle>
      </CardContent>
    </Card>
  )
}
