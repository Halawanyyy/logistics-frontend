import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { listWarehouseProducts } from '../../warehouse/api/warehouse.api'
import type { WarehouseProduct } from '../../warehouse/types/warehouse.types'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { GovernorateAreaSelector } from '../../../shared/components/selectors/GovernorateAreaSelector'
import { MerchantSelector } from '../../../shared/components/selectors/MerchantSelector'
import { Button } from '../../../shared/components/ui/Button'
import { Input } from '../../../shared/components/ui/Input'
import { SearchableSelect } from '../../../shared/components/ui/SearchableSelect'
import { Select } from '../../../shared/components/ui/Select'
import { useFormApiErrors } from '../../../shared/hooks/useFormApiErrors'
import type {
  FulfillmentType,
  Order,
  OrderType,
  PaymentType,
} from '../types/order.types'

const orderItemSchema = z.object({
  product_name: z.string().min(1, 'Product name is required.'),
  sku: z.string().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1.'),
  unit_price: z.number().min(0, 'Unit price must be zero or more.'),
  weight: z.number().or(z.nan()).optional(),
})

const warehouseOrderItemSchema = z.object({
  warehouse_product_id: z.number().min(0),
  quantity: z.number().min(1, 'Quantity must be at least 1.'),
  unit_price: z.number().min(0, 'Unit price must be zero or more.'),
})

const orderSchema = z.object({
  merchant_id: z.number().min(1, 'Merchant is required.'),
  order_type: z.enum(['delivery', 'swap', 'return']),
  original_order_id: z.number().or(z.nan()).optional(),
  swap_notes: z.string().optional(),
  customer_name: z.string().min(1, 'Customer name is required.'),
  customer_phone: z.string().min(1, 'Customer phone is required.'),
  customer_phone_alt: z.string().optional(),
  delivery_governorate_id: z.number().min(1, 'Governorate is required.'),
  delivery_area_id: z.number().or(z.nan()).optional(),
  delivery_address: z.string().min(1, 'Delivery address is required.'),
  delivery_notes: z.string().optional(),
  payment_type: z.enum(['cod', 'prepaid']),
  cod_amount: z.number().min(0, 'COD amount must be zero or more.'),
  fulfillment_type: z.enum(['pickup_from_merchant', 'from_warehouse', 'pickup_from_customer']),
  allow_inspection: z.boolean(),
  notes: z.string().optional(),
  shipping_fee: z.number().or(z.nan()).optional(),
  status: z.string().optional(),
  items: z.array(orderItemSchema),
  warehouse_items: z.array(warehouseOrderItemSchema).optional(),
}).superRefine((values, context) => {
  if (values.order_type === 'swap' && !Number.isFinite(values.original_order_id)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Original order is required for swap orders.',
      path: ['original_order_id'],
    })
  }

  if (values.order_type === 'return' && values.fulfillment_type !== 'pickup_from_customer') {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Return orders must use pickup_from_customer fulfillment.',
      path: ['fulfillment_type'],
    })
  }

  if (values.payment_type === 'cod' && values.order_type !== 'return' && values.cod_amount <= 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'COD amount is required for COD orders.',
      path: ['cod_amount'],
    })
  }

  if (values.fulfillment_type === 'pickup_from_merchant' && values.items.length < 1) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one manual item is required for pickup_from_merchant orders.',
      path: ['items'],
    })
  }

  if (values.fulfillment_type === 'from_warehouse' && !values.warehouse_items?.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Select at least one warehouse product.',
      path: ['warehouse_items'],
    })
  }
})

export type OrderFormValues = z.infer<typeof orderSchema>

type OrderFormProps = {
  defaultValues?: Order
  error?: unknown
  isEdit?: boolean
  isSubmitting?: boolean
  submitLabel: string
  onSubmit: (values: OrderFormValues) => void
}

function optionalNumber(value: number | undefined) {
  return Number.isFinite(value) ? value : undefined
}

function emptyOrderItem() {
  return { product_name: '', sku: '', quantity: 1, unit_price: 0, weight: undefined }
}

function emptyWarehouseItem() {
  return { warehouse_product_id: 0, quantity: 1, unit_price: 0 }
}

function productStockLabel(product: WarehouseProduct) {
  const available = (product as WarehouseProduct & { quantity_available?: number }).quantity_available
  const barcode = product.barcode ? ` - ${product.barcode}` : ''
  const stock = typeof available === 'number' ? ` - available ${available}` : ''
  return `${product.name} (${product.sku}${barcode}${stock})`
}

export function OrderForm({
  defaultValues,
  error,
  isEdit = false,
  isSubmitting = false,
  onSubmit,
  submitLabel,
}: OrderFormProps) {
  const { t } = useTranslation()
  const { formError, getFieldError } = useFormApiErrors(error)
  const defaultFulfillmentType = (defaultValues?.fulfillment_type ?? 'pickup_from_merchant') as FulfillmentType
  const defaultPaymentType = (defaultValues?.payment_type ?? 'cod') as PaymentType
  const defaultOrderType = (defaultValues?.order_type ?? 'delivery') as OrderType
  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      merchant_id: defaultValues?.merchant_id ?? 0,
      order_type: defaultOrderType,
      original_order_id: defaultValues?.original_order_id ?? undefined,
      swap_notes: defaultValues?.swap_notes ?? '',
      customer_name: defaultValues?.customer_name ?? '',
      customer_phone: defaultValues?.customer_phone ?? '',
      customer_phone_alt: defaultValues?.customer_phone_alt ?? '',
      delivery_governorate_id: defaultValues?.delivery_governorate_id ?? 0,
      delivery_area_id: defaultValues?.delivery_area_id ?? undefined,
      delivery_address: defaultValues?.delivery_address ?? '',
      delivery_notes: defaultValues?.delivery_notes ?? '',
      payment_type: defaultPaymentType,
      cod_amount: Number(defaultValues?.cod_amount ?? 0),
      fulfillment_type: defaultFulfillmentType,
      allow_inspection: defaultValues?.allow_inspection ?? false,
      notes: defaultValues?.notes ?? '',
      shipping_fee: defaultValues ? Number(defaultValues.shipping_fee) : undefined,
      status: defaultValues?.status ?? undefined,
      items: defaultValues?.items.length
        ? defaultValues.items.map((item) => ({
            product_name: item.product_name,
            sku: item.sku ?? '',
            quantity: item.quantity,
            unit_price: Number(item.unit_price),
            weight: item.weight ? Number(item.weight) : undefined,
          }))
        : [emptyOrderItem()],
      warehouse_items:
        defaultFulfillmentType === 'from_warehouse' && defaultValues?.items.length
          ? defaultValues.items.map((item) => ({
              warehouse_product_id: item.warehouse_product_id ?? 0,
              quantity: item.quantity,
              unit_price: Number(item.unit_price),
            }))
          : [],
    },
  })
  const manualItems = useFieldArray({ control, name: 'items' })
  const warehouseItems = useFieldArray({ control, name: 'warehouse_items' })
  const selectedGovernorateId = watch('delivery_governorate_id')
  const selectedFulfillmentType = watch('fulfillment_type')
  const selectedMerchantId = watch('merchant_id')
  const selectedPaymentType = watch('payment_type')
  const selectedOrderType = watch('order_type')
  const selectedDeliveryAreaId = watch('delivery_area_id')
  const warehouseProductsQuery = useQuery({
    queryKey: ['warehouse-products', 'order-form', selectedMerchantId, selectedFulfillmentType],
    queryFn: () => listWarehouseProducts({ merchant_id: selectedMerchantId, status: 'active' }),
    enabled: selectedFulfillmentType === 'from_warehouse' && selectedMerchantId > 0,
  })

  useEffect(() => {
    if (selectedPaymentType === 'prepaid') {
      setValue('cod_amount', 0, { shouldValidate: true })
    }
  }, [selectedPaymentType, setValue])

  useEffect(() => {
    setValue('delivery_area_id', undefined, { shouldValidate: true })
  }, [selectedGovernorateId, setValue])

  useEffect(() => {
    if (selectedOrderType === 'return') {
      setValue('fulfillment_type', 'pickup_from_customer', { shouldValidate: true })
      setValue('payment_type', 'prepaid', { shouldValidate: true })
      setValue('cod_amount', 0, { shouldValidate: true })
    }
  }, [selectedOrderType, setValue])

  function getWarehouseProduct(productId: number) {
    return (warehouseProductsQuery.data?.data ?? []).find((product) => product.id === productId)
  }

  function handleValidSubmit(values: OrderFormValues) {
    const items = values.fulfillment_type === 'from_warehouse'
      ? (values.warehouse_items ?? []).map((item, index) => {
          const product = getWarehouseProduct(item.warehouse_product_id)
          const existingItem = defaultValues?.items[index]
          return {
            product_name: product?.name ?? existingItem?.product_name ?? `Warehouse product #${item.warehouse_product_id}`,
            sku: product?.sku ?? existingItem?.sku ?? undefined,
            quantity: item.quantity,
            unit_price: item.unit_price,
            weight: optionalNumber(product?.unit_weight ? Number(product.unit_weight) : (existingItem?.weight ? Number(existingItem.weight) : undefined)),
          }
        })
      : values.items.map((item) => ({
          ...item,
          sku: item.sku || undefined,
          weight: optionalNumber(item.weight),
        }))

    onSubmit({
      ...values,
      order_type: values.order_type,
      original_order_id: values.order_type === 'swap' ? optionalNumber(values.original_order_id) : undefined,
      swap_notes: values.order_type === 'swap' ? values.swap_notes || undefined : undefined,
      delivery_area_id: optionalNumber(values.delivery_area_id),
      shipping_fee: optionalNumber(values.shipping_fee),
      customer_phone_alt: values.customer_phone_alt || undefined,
      delivery_notes: values.delivery_notes || undefined,
      notes: values.notes || undefined,
      payment_type: values.order_type === 'return' ? 'prepaid' : values.payment_type,
      cod_amount: values.payment_type === 'prepaid' || values.order_type === 'return' ? 0 : values.cod_amount,
      items,
      warehouse_items: undefined,
    })
  }

  const showWarehouseItems = selectedFulfillmentType === 'from_warehouse'
  const showSwapFields = selectedOrderType === 'swap'
  const disablePaymentType = selectedOrderType === 'return'
  const disableFulfillmentType = selectedOrderType === 'return'

  return (
    <form className="form-grid" onSubmit={handleSubmit(handleValidSubmit)}>
      <div className="form-grid form-grid--two">
        <label className="field">
          <span>Merchant</span>
          <Controller
            control={control}
            name="merchant_id"
            render={({ field }) => (
              <MerchantSelector
                value={field.value ? String(field.value) : ''}
                disabled={isEdit}
                onChange={(merchantId) => field.onChange(merchantId ? Number(merchantId) : 0)}
              />
            )}
          />
          <FieldError error={errors.merchant_id?.message ?? getFieldError('merchant_id')} />
        </label>

        <label className="field">
          <span>Order Type</span>
          <Select {...register('order_type')}>
            <option value="delivery">delivery</option>
            <option value="swap">swap</option>
            <option value="return">return</option>
          </Select>
          <FieldError error={errors.order_type?.message ?? getFieldError('order_type')} />
        </label>

        {showSwapFields ? (
          <>
            <label className="field">
              <span>Original Order ID</span>
              <Input type="number" {...register('original_order_id', { valueAsNumber: true })} />
              <FieldError error={errors.original_order_id?.message ?? getFieldError('original_order_id')} />
            </label>
            <label className="field">
              <span>Swap Notes</span>
              <Input {...register('swap_notes')} />
              <FieldError error={errors.swap_notes?.message ?? getFieldError('swap_notes')} />
            </label>
          </>
        ) : null}

        <label className="field">
          <span>Customer Name</span>
          <Input {...register('customer_name')} />
          <FieldError error={errors.customer_name?.message ?? getFieldError('customer_name')} />
        </label>

        <label className="field">
          <span>Customer Phone</span>
          <Input {...register('customer_phone')} />
          <FieldError error={errors.customer_phone?.message ?? getFieldError('customer_phone')} />
        </label>

        <label className="field">
          <span>Alt Phone</span>
          <Input {...register('customer_phone_alt')} />
          <FieldError error={errors.customer_phone_alt?.message ?? getFieldError('customer_phone_alt')} />
        </label>

        <Controller
          control={control}
          name="delivery_governorate_id"
          render={({ field }) => (
            <GovernorateAreaSelector
              governorateId={field.value ? String(field.value) : ''}
              areaId={selectedDeliveryAreaId ? String(selectedDeliveryAreaId) : ''}
              onChange={({ governorate_id, area_id }) => {
                field.onChange(governorate_id ? Number(governorate_id) : 0)
                setValue('delivery_area_id', area_id ? Number(area_id) : undefined, {
                  shouldValidate: true,
                })
              }}
            />
          )}
        />
        <div className="form-grid form-grid--two">
          <FieldError error={errors.delivery_governorate_id?.message ?? getFieldError('delivery_governorate_id')} />
          <FieldError error={errors.delivery_area_id?.message ?? getFieldError('delivery_area_id')} />
        </div>

        <label className="field">
          <span>Payment Type</span>
          <Select {...register('payment_type')} disabled={disablePaymentType}>
            <option value="cod">cod</option>
            <option value="prepaid">prepaid</option>
          </Select>
          {selectedOrderType === 'return' ? (
            <span className="table-meta">Return orders use prepaid logic and keep COD at 0.</span>
          ) : null}
          <FieldError error={errors.payment_type?.message ?? getFieldError('payment_type')} />
        </label>

        <label className="field">
          <span>COD Amount</span>
          <Input
            type="number"
            step="0.01"
            {...register('cod_amount', { valueAsNumber: true })}
            disabled={selectedPaymentType === 'prepaid' || selectedOrderType === 'return'}
          />
          <FieldError error={errors.cod_amount?.message ?? getFieldError('cod_amount')} />
        </label>

        <label className="field">
          <span>Fulfillment Type</span>
          <Select {...register('fulfillment_type')} disabled={disableFulfillmentType}>
            <option value="pickup_from_merchant">pickup_from_merchant</option>
            <option value="from_warehouse">from_warehouse</option>
            <option value="pickup_from_customer">pickup_from_customer</option>
          </Select>
          <FieldError error={errors.fulfillment_type?.message ?? getFieldError('fulfillment_type')} />
        </label>

        {isEdit ? (
          <>
            <label className="field">
              <span>Shipping Fee</span>
              <Input type="number" step="0.01" {...register('shipping_fee', { valueAsNumber: true })} />
              <FieldError error={errors.shipping_fee?.message ?? getFieldError('shipping_fee')} />
            </label>
            <label className="field">
              <span>Status</span>
              <Select {...register('status')}>
                <option value="draft">draft</option>
                <option value="pending_review">pending_review</option>
                <option value="confirmed">confirmed</option>
                <option value="cancelled">cancelled</option>
              </Select>
              <FieldError error={errors.status?.message ?? getFieldError('status')} />
            </label>
          </>
        ) : null}
      </div>

      <label className="field">
        <span>Delivery Address</span>
        <Input {...register('delivery_address')} />
        <FieldError error={errors.delivery_address?.message ?? getFieldError('delivery_address')} />
      </label>

      <label className="field">
        <span>Delivery Notes</span>
        <Input {...register('delivery_notes')} />
        <FieldError error={errors.delivery_notes?.message ?? getFieldError('delivery_notes')} />
      </label>

      <label className="field">
        <span>Notes</span>
        <Input {...register('notes')} />
        <FieldError error={errors.notes?.message ?? getFieldError('notes')} />
      </label>

      <label className="field field--inline">
        <input type="checkbox" {...register('allow_inspection')} />
        <span>Allow inspection</span>
      </label>

      <div className="form-section">
        <div className="section-title-row">
          <div>
            <h3>{showWarehouseItems ? 'Warehouse Products' : 'Items'}</h3>
            {showWarehouseItems ? (
              <p className="table-meta">Warehouse products are selected from merchant inventory.</p>
            ) : null}
          </div>
          {!showWarehouseItems ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => manualItems.append(emptyOrderItem())}
            >
              Add item
            </Button>
          ) : selectedMerchantId > 0 ? (
            <Button
              type="button"
              variant="secondary"
              disabled={warehouseProductsQuery.isLoading || !(warehouseProductsQuery.data?.data.length)}
              onClick={() => warehouseItems.append(emptyWarehouseItem())}
            >
              Add product
            </Button>
          ) : null}
        </div>

        {showWarehouseItems ? (
          <>
            {!selectedMerchantId ? (
              <div className="empty-state-inline">{t('Select a merchant first to load warehouse products.')}</div>
            ) : null}
            {selectedMerchantId > 0 && warehouseProductsQuery.isLoading ? (
              <div className="empty-state-inline">{t('Loading warehouse products...')}</div>
            ) : null}
            {selectedMerchantId > 0 && !warehouseProductsQuery.isLoading && !(warehouseProductsQuery.data?.data.length) ? (
              <div className="empty-state-inline">{t('No warehouse products found for this merchant.')}</div>
            ) : null}
            <div className="order-items-list">
              {warehouseItems.fields.map((field, index) => (
                <div className="order-item-row" key={field.id}>
                  <label className="field">
                    <span>{t('Warehouse Product')}</span>
                    <Controller
                      control={control}
                      name={`warehouse_items.${index}.warehouse_product_id`}
                      render={({ field: warehouseField }) => (
                        <SearchableSelect
                          value={warehouseField.value ? String(warehouseField.value) : '0'}
                          placeholder="Select product"
                          searchPlaceholder="Search warehouse products..."
                          onChange={(warehouse_product_id) => warehouseField.onChange(Number(warehouse_product_id || 0))}
                          options={[
                            { label: 'Select product', value: '0' },
                            ...((warehouseProductsQuery.data?.data ?? []).map((product) => ({
                              label: productStockLabel(product),
                              value: String(product.id),
                              keywords: [product.name, product.sku, product.barcode ?? '', product.merchant_name ?? ''],
                            }))),
                          ]}
                        />
                      )}
                    />
                    <FieldError
                      error={
                        errors.warehouse_items?.[index]?.warehouse_product_id?.message
                        ?? getFieldError(`warehouse_items.${index}.warehouse_product_id`)
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Qty</span>
                    <Input type="number" {...register(`warehouse_items.${index}.quantity`, { valueAsNumber: true })} />
                    <FieldError
                      error={
                        errors.warehouse_items?.[index]?.quantity?.message
                        ?? getFieldError(`warehouse_items.${index}.quantity`)
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Unit Price</span>
                    <Input type="number" step="0.01" {...register(`warehouse_items.${index}.unit_price`, { valueAsNumber: true })} />
                    <FieldError
                      error={
                        errors.warehouse_items?.[index]?.unit_price?.message
                        ?? getFieldError(`warehouse_items.${index}.unit_price`)
                      }
                    />
                  </label>
                  <Button type="button" variant="danger" onClick={() => warehouseItems.remove(index)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="order-items-list">
            {manualItems.fields.map((field, index) => (
              <div className="order-item-row" key={field.id}>
                <label className="field">
                  <span>Product</span>
                  <Input {...register(`items.${index}.product_name`)} />
                  <FieldError error={errors.items?.[index]?.product_name?.message ?? getFieldError(`items.${index}.product_name`)} />
                </label>
                <label className="field">
                  <span>SKU</span>
                  <Input {...register(`items.${index}.sku`)} />
                  <FieldError error={errors.items?.[index]?.sku?.message ?? getFieldError(`items.${index}.sku`)} />
                </label>
                <label className="field">
                  <span>Qty</span>
                  <Input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                  <FieldError error={errors.items?.[index]?.quantity?.message ?? getFieldError(`items.${index}.quantity`)} />
                </label>
                <label className="field">
                  <span>Unit Price</span>
                  <Input type="number" step="0.01" {...register(`items.${index}.unit_price`, { valueAsNumber: true })} />
                  <FieldError error={errors.items?.[index]?.unit_price?.message ?? getFieldError(`items.${index}.unit_price`)} />
                </label>
                <label className="field">
                  <span>Weight</span>
                  <Input type="number" step="0.01" {...register(`items.${index}.weight`, { valueAsNumber: true })} />
                  <FieldError error={errors.items?.[index]?.weight?.message ?? getFieldError(`items.${index}.weight`)} />
                </label>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => manualItems.remove(index)}
                  disabled={manualItems.fields.length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {errors.items?.message ? <div className="form-error">{errors.items.message}</div> : null}
      {errors.warehouse_items?.message ? <div className="form-error">{errors.warehouse_items.message}</div> : null}
      {warehouseProductsQuery.error ? <div className="form-error">{getApiErrorMessage(warehouseProductsQuery.error)}</div> : null}
      {formError ? <div className="form-error">{formError}</div> : null}

      <div className="form-actions">
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
