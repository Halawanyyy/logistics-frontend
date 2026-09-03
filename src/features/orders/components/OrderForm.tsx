import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { User, MapPin, CreditCard, Package, Info, ClipboardCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { listCompanyCatalogItems } from '../../company-catalog/api/companyCatalog.api'
import { getMerchantPortalProducts } from '../../merchant-portal/api/merchantPortal.api'
import { listWarehouseProducts } from '../../warehouse/api/warehouse.api'
import type { WarehouseProduct } from '../../warehouse/types/warehouse.types'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { GovernorateAreaSelector } from '../../../shared/components/selectors/GovernorateAreaSelector'
import { MerchantSelector } from '../../../shared/components/selectors/MerchantSelector'
import { Button } from '../../../shared/components/ui/Button'
import { Input } from '../../../shared/components/ui/Input'
import { SearchableSelect } from '../../../shared/components/ui/SearchableSelect'
import { Select } from '../../../shared/components/ui/Select'
import { StepWizard } from '../../../shared/components/ui/StepWizard'
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
  requires_packaging: z.boolean().optional(),
  package_notes: z.string().optional(),
  notes: z.string().optional(),
  shipping_fee: z.number().or(z.nan()).optional(),
  status: z.string().optional(),
  items: z.array(orderItemSchema),
  warehouse_items: z.array(warehouseOrderItemSchema).optional(),
  packaging_items: z.array(z.object({
    company_catalog_item_id: z.number().min(1, 'Item is required'),
    quantity: z.number().min(1, 'Quantity is required'),
  })).optional(),
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
  secondaryAction?: ReactNode
  submitLabel: string
  onSubmit: (values: OrderFormValues) => void
  isMerchantPortal?: boolean
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

function emptyPackagingItem() {
  return { company_catalog_item_id: 0, quantity: 1 }
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
  secondaryAction,
  onSubmit,
  submitLabel,
  isMerchantPortal = false,
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
    trigger,
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
      requires_packaging: false,
      package_notes: '',
      packaging_items: [],
    },
  })
  const manualItems = useFieldArray({ control, name: 'items' })
  const warehouseItems = useFieldArray({ control, name: 'warehouse_items' })
  const packagingItems = useFieldArray({ control, name: 'packaging_items' })
  const [currentStep, setCurrentStep] = useState(0)
  const requiresPackaging = watch('requires_packaging')
  const selectedGovernorateId = watch('delivery_governorate_id')
  const selectedFulfillmentType = watch('fulfillment_type')
  const selectedMerchantId = watch('merchant_id')
  const selectedPaymentType = watch('payment_type')
  const selectedOrderType = watch('order_type')
  const selectedDeliveryAreaId = watch('delivery_area_id')
  const currentValues = watch()
  const warehouseProductsQuery = useQuery({
    queryKey: ['warehouse-products', 'order-form', isMerchantPortal ? 'merchant-portal' : selectedMerchantId, selectedFulfillmentType],
    queryFn: () => isMerchantPortal
      ? getMerchantPortalProducts()
      : listWarehouseProducts({ merchant_id: selectedMerchantId, status: 'active' }),
    enabled: selectedFulfillmentType === 'from_warehouse' && (isMerchantPortal || selectedMerchantId > 0),
  })

  const packagingProductsQuery = useQuery({
    queryKey: ['company-catalog-packaging'],
    queryFn: () => listCompanyCatalogItems({ category: 'packaging', status: 'active' }),
  })
  
  const packagingOptions = (packagingProductsQuery.data?.data ?? []).map(p => ({
    label: p.name,
    value: String(p.id)
  }))

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
    return (warehouseProductsQuery.data?.data ?? []).find((product: any) => product.id === productId)
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
    <form style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} onSubmit={(event) => event.preventDefault()}>
      <StepWizard
        activeStep={currentStep}
        completeLabel={t(submitLabel, { defaultValue: submitLabel })}
        isCompleting={isSubmitting}
        onComplete={() => void handleSubmit(handleValidSubmit)()}
        onStepChange={setCurrentStep}
        secondaryAction={secondaryAction}
        steps={[
          {
            title: t('Basic Information', { defaultValue: 'Basic Information' }),
            icon: <Info size={16} />,
            validate: () => trigger([
              'merchant_id',
              'order_type',
              'fulfillment_type',
              'original_order_id',
              'swap_notes',
              'notes',
              'allow_inspection',
            ]),
            component: (
              <div className="order-wizard-step">
      <div className="form-section form-section--panel">
        <div className="form-section__header">
          <div className="form-section__header-copy">
            <h3 className="form-section__title">{t('Order Context', { defaultValue: 'Order Context' })}</h3>
            <p className="form-section__description">
              {t('Choose the merchant and order path first so the rest of the workflow stays consistent.', {
                defaultValue: 'Choose the merchant and order path first so the rest of the workflow stays consistent.',
              })}
            </p>
          </div>
          <span className="form-section__icon" aria-hidden="true"><Info size={18} /></span>
        </div>
        <div className="form-section__body form-grid">
          {!isMerchantPortal ? (
            <label className="field">
              <span>{t('Merchant')}</span>
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
          ) : null}

          <label className="field">
            <span>{t('Order Type', { defaultValue: 'Order Type' })}</span>
            <Select {...register('order_type')}>
              <option value="delivery">{t('delivery', { defaultValue: 'delivery' })}</option>
              <option value="swap">{t('Exchange (swap)', { defaultValue: 'Exchange (swap)' })}</option>
              <option value="return">{t('return', { defaultValue: 'return' })}</option>
            </Select>
            <FieldError error={errors.order_type?.message ?? getFieldError('order_type')} />
          </label>

          <label className="field">
            <span>{t('Fulfillment Type', { defaultValue: 'Fulfillment Type' })}</span>
            <Select {...register('fulfillment_type')} disabled={disableFulfillmentType}>
              <option value="pickup_from_merchant">{t('pickup_from_merchant', { defaultValue: 'pickup_from_merchant' })}</option>
              <option value="from_warehouse">{t('from_warehouse', { defaultValue: 'from_warehouse' })}</option>
              <option value="pickup_from_customer">{t('pickup_from_customer', { defaultValue: 'pickup_from_customer' })}</option>
            </Select>
            <FieldError error={errors.fulfillment_type?.message ?? getFieldError('fulfillment_type')} />
          </label>

          {showSwapFields ? (
            <>
              <label className="field">
                <span>{t('Original Order ID', { defaultValue: 'Original Order ID' })}</span>
                <Input type="number" {...register('original_order_id', { valueAsNumber: true })} />
                <FieldError error={errors.original_order_id?.message ?? getFieldError('original_order_id')} />
              </label>
              <label className="field field--full">
                <span>{t('Swap Notes', { defaultValue: 'Swap Notes' })}</span>
                <Input {...register('swap_notes')} />
                <FieldError error={errors.swap_notes?.message ?? getFieldError('swap_notes')} />
              </label>
            </>
          ) : null}
        </div>
      </div>

      <div className="form-section form-section--panel">
        <div className="form-section__header">
          <div className="form-section__header-copy">
            <h3 className="form-section__title">{t('Operational Notes', { defaultValue: 'Operational Notes' })}</h3>
            <p className="form-section__description">
              {t('Share extra instructions for handling, inspection, and internal follow-up.', {
                defaultValue: 'Share extra instructions for handling, inspection, and internal follow-up.',
              })}
            </p>
          </div>
          <span className="form-section__icon" aria-hidden="true"><Info size={18} /></span>
        </div>
        <div className="form-section__body form-grid form-grid--two">
          <label className="field">
            <span>{t('Notes')}</span>
            <Input {...register('notes')} />
            <FieldError error={errors.notes?.message ?? getFieldError('notes')} />
          </label>

          <label className="field field--inline">
            <input type="checkbox" {...register('allow_inspection')} />
            <span>{t('Allow Inspection', { defaultValue: 'Allow Inspection' })}</span>
          </label>
        </div>
      </div>
              </div>
            ),
          },
          {
            title: t('Customer & Delivery', { defaultValue: 'Customer & Delivery' }),
            icon: <User size={16} />,
            validate: () => trigger([
              'customer_name',
              'customer_phone',
              'customer_phone_alt',
              'delivery_governorate_id',
              'delivery_area_id',
              'delivery_address',
              'delivery_notes',
            ]),
            component: (
              <div className="order-wizard-step">

      {showSwapFields ? (
        <div className="form-section form-section--panel">
          <div className="form-section__header">
            <div className="form-section__header-copy">
              <h3 className="form-section__title">{t('Exchange Pickup', { defaultValue: 'Exchange Pickup' })}</h3>
              <p className="form-section__description">
                {t('The courier will collect the original order from this customer while delivering the replacement to the address below.', {
                  defaultValue: 'The courier will collect the original order from this customer while delivering the replacement to the address below.',
                })}
              </p>
            </div>
            <span className="form-section__icon" aria-hidden="true"><Package size={18} /></span>
          </div>
        </div>
      ) : null}

      <div className="form-section form-section--panel">
        <div className="form-section__header">
          <div className="form-section__header-copy">
            <h3 className="form-section__title">{t('Customer Details', { defaultValue: 'Customer Details' })}</h3>
            <p className="form-section__description">
              {t('Capture the customer identity and delivery contact numbers before dispatch.', {
                defaultValue: 'Capture the customer identity and delivery contact numbers before dispatch.',
              })}
            </p>
          </div>
          <span className="form-section__icon" aria-hidden="true"><User size={18} /></span>
        </div>
        <div className="form-section__body form-grid">
          <label className="field">
            <span>{t('Customer Name', { defaultValue: 'Customer Name' })}</span>
            <Input {...register('customer_name')} />
            <FieldError error={errors.customer_name?.message ?? getFieldError('customer_name')} />
          </label>

          <label className="field">
            <span>{t('Customer Phone', { defaultValue: 'Customer Phone' })}</span>
            <Input {...register('customer_phone')} />
            <FieldError error={errors.customer_phone?.message ?? getFieldError('customer_phone')} />
          </label>

          <label className="field">
            <span>{t('Alt Phone', { defaultValue: 'Alt Phone' })}</span>
            <Input {...register('customer_phone_alt')} />
            <FieldError error={errors.customer_phone_alt?.message ?? getFieldError('customer_phone_alt')} />
          </label>
        </div>
      </div>

      <div className="form-section form-section--panel">
        <div className="form-section__header">
          <div className="form-section__header-copy">
            <h3 className="form-section__title">{t('Delivery Details', { defaultValue: 'Delivery Details' })}</h3>
            <p className="form-section__description">
              {t('Set the delivery destination and address notes that operations needs for the route.', {
                defaultValue: 'Set the delivery destination and address notes that operations needs for the route.',
              })}
            </p>
          </div>
          <span className="form-section__icon" aria-hidden="true"><MapPin size={18} /></span>
        </div>
        <div className="form-section__body">
          <label className="field field--full">
            <span>{t('Delivery Coverage', { defaultValue: 'Delivery Coverage' })}</span>
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
            <FieldError error={errors.delivery_governorate_id?.message ?? getFieldError('delivery_governorate_id')} />
            <FieldError error={errors.delivery_area_id?.message ?? getFieldError('delivery_area_id')} />
          </label>

          <div className="form-grid form-grid--two">
            <label className="field">
              <span>{t('Delivery Address', { defaultValue: 'Delivery Address' })}</span>
              <Input {...register('delivery_address')} />
              <FieldError error={errors.delivery_address?.message ?? getFieldError('delivery_address')} />
            </label>

            <label className="field">
              <span>{t('Delivery Notes', { defaultValue: 'Delivery Notes' })}</span>
              <Input {...register('delivery_notes')} />
              <FieldError error={errors.delivery_notes?.message ?? getFieldError('delivery_notes')} />
            </label>
          </div>
        </div>
      </div>
              </div>
            ),
          },
          {
            title: t('Items & Payment', { defaultValue: 'Items & Payment' }),
            icon: <Package size={16} />,
            validate: () => trigger([
              'payment_type',
              'cod_amount',
              'shipping_fee',
              'status',
              'requires_packaging',
              'package_notes',
              'packaging_items',
              'items',
              'warehouse_items',
            ]),
            component: (
              <div className="order-wizard-step">

      <div className="form-section form-section--panel">
        <div className="form-section__header">
          <div className="form-section__header-copy">
            <h3 className="form-section__title">{t('Commercial Details', { defaultValue: 'Commercial Details' })}</h3>
            <p className="form-section__description">
              {t('Review the payment method, COD amount, and commercial controls before saving.', {
                defaultValue: 'Review the payment method, COD amount, and commercial controls before saving.',
              })}
            </p>
          </div>
          <span className="form-section__icon" aria-hidden="true"><CreditCard size={18} /></span>
        </div>
        <div className="form-section__body form-grid">
          <label className="field">
            <span>{t('Payment Type', { defaultValue: 'Payment Type' })}</span>
            <Select {...register('payment_type')} disabled={disablePaymentType}>
              <option value="cod">{t('cod', { defaultValue: 'cod' })}</option>
              <option value="prepaid">{t('prepaid', { defaultValue: 'prepaid' })}</option>
            </Select>
            {selectedOrderType === 'return' ? (
              <span className="field-help">
                {t('Return orders use prepaid logic and keep COD at 0.', {
                  defaultValue: 'Return orders use prepaid logic and keep COD at 0.',
                })}
              </span>
            ) : null}
            <FieldError error={errors.payment_type?.message ?? getFieldError('payment_type')} />
          </label>

          <label className="field">
            <span>{t('COD Amount', { defaultValue: 'COD Amount' })}</span>
            <Input
              type="number"
              step="0.01"
              {...register('cod_amount', { valueAsNumber: true })}
              disabled={selectedPaymentType === 'prepaid' || selectedOrderType === 'return'}
            />
            <FieldError error={errors.cod_amount?.message ?? getFieldError('cod_amount')} />
          </label>

          {isEdit ? (
            <label className="field">
              <span>{t('Shipping Fee', { defaultValue: 'Shipping Fee' })}</span>
              <Input type="number" step="0.01" {...register('shipping_fee', { valueAsNumber: true })} />
              <FieldError error={errors.shipping_fee?.message ?? getFieldError('shipping_fee')} />
            </label>
          ) : (
            <div />
          )}

          {isEdit ? (
            <label className="field">
              <span>{t('Status')}</span>
              <Select {...register('status')}>
                <option value="draft">{t('draft', { defaultValue: 'draft' })}</option>
                <option value="pending_review">{t('pending_review', { defaultValue: 'pending_review' })}</option>
                <option value="confirmed">{t('confirmed', { defaultValue: 'confirmed' })}</option>
                <option value="cancelled">{t('cancelled', { defaultValue: 'cancelled' })}</option>
              </Select>
              <FieldError error={errors.status?.message ?? getFieldError('status')} />
            </label>
          ) : null}
        </div>
      </div>

      <Can permission={PERMISSIONS.ORDER_PACKAGING_MANAGE}>
        <div className="form-section form-section--panel">
          <div className="form-section__header">
            <div className="form-section__header-copy">
              <h3 className="form-section__title">{t('Packaging', { defaultValue: 'Packaging' })}</h3>
              <p className="form-section__description">
                {t('Choose company-owned packaging products separately from warehouse order items when this order needs packing.', {
                  defaultValue: 'Choose company-owned packaging products separately from warehouse order items when this order needs packing.',
                })}
              </p>
            </div>
            <span className="form-section__icon" aria-hidden="true"><Package size={18} /></span>
          </div>
          <div className="form-section__body">
            <label className="field field--inline">
              <input type="checkbox" {...register('requires_packaging')} />
              <span>{t('Requires Packaging', { defaultValue: 'Requires Packaging' })}</span>
            </label>

            {requiresPackaging ? (
              <>
                <label className="field field--full">
                  <span>{t('Package Notes', { defaultValue: 'Package Notes' })}</span>
                  <Input {...register('package_notes')} />
                  <FieldError error={errors.package_notes?.message ?? getFieldError('package_notes')} />
                </label>

                <div className="form-section__body" style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={packagingProductsQuery.isLoading || !(packagingProductsQuery.data?.data.length || defaultValues?.packaging_items?.length)}
                    onClick={() => packagingItems.append(emptyPackagingItem())}
                  >
                    {t('Add Packaging Item', { defaultValue: 'Add Packaging Item' })}
                  </Button>
                </div>

                {packagingProductsQuery.isLoading ? (
                  <div className="empty-state-inline">{t('Loading packaging products...', { defaultValue: 'Loading packaging products...' })}</div>
                ) : null}
                {!packagingProductsQuery.isLoading && !packagingOptions.length ? (
                  <div className="empty-state-inline">{t('No active packaging products found in the company catalog.', {
                    defaultValue: 'No active packaging products found in the company catalog.',
                  })}</div>
                ) : null}

                <div className="order-items-list">
                  {packagingItems.fields.map((field, index) => (
                    <div className="order-item-row" key={field.id}>
                      <label className="field">
                        <span>{t('Packaging Item', { defaultValue: 'Packaging Item' })}</span>
                        <Controller
                          control={control}
                          name={`packaging_items.${index}.company_catalog_item_id`}
                          render={({ field: selectField }) => (
                            <SearchableSelect
                              value={String(selectField.value ?? '')}
                              onChange={(val) => selectField.onChange(val ? Number(val) : undefined)}
                              options={packagingOptions}
                              placeholder={t('Select item', { defaultValue: 'Select item' })}
                            />
                          )}
                        />
                        <FieldError error={errors.packaging_items?.[index]?.company_catalog_item_id?.message} />
                      </label>

                      <label className="field">
                        <span>{t('Quantity')}</span>
                        <Input
                          type="number"
                          min="1"
                          {...register(`packaging_items.${index}.quantity`, { valueAsNumber: true })}
                        />
                        <FieldError error={errors.packaging_items?.[index]?.quantity?.message} />
                      </label>

                      <div className="order-item-row__actions">
                        <Button type="button" variant="danger" onClick={() => packagingItems.remove(index)}>
                          {t('Remove', { defaultValue: 'Remove' })}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </Can>

      <div className="form-section form-section--panel">
        <div className="form-section__header">
          <div className="form-section__header-copy">
            <h3 className="form-section__title">
              {showWarehouseItems
                ? t('Warehouse Products', { defaultValue: 'Warehouse Products' })
                : t('Items')}
            </h3>
            <p className="form-section__description">
              {showWarehouseItems
                ? t('Warehouse products are selected from the merchant inventory and priced here before fulfillment.', {
                  defaultValue: 'Warehouse products are selected from the merchant inventory and priced here before fulfillment.',
                })
                : t('List the order items with SKU, quantity, price, and optional weight details.', {
                  defaultValue: 'List the order items with SKU, quantity, price, and optional weight details.',
                })}
            </p>
          </div>
          <span className="form-section__icon" aria-hidden="true"><Package size={18} /></span>
        </div>
        <div className="form-section__body" style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
          {!showWarehouseItems ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => manualItems.append(emptyOrderItem())}
            >
              {t('Add Item', { defaultValue: 'Add Item' })}
            </Button>
          ) : (isMerchantPortal || selectedMerchantId > 0) ? (
            <Button
              type="button"
              variant="secondary"
              disabled={warehouseProductsQuery.isLoading || !(warehouseProductsQuery.data?.data.length)}
              onClick={() => warehouseItems.append(emptyWarehouseItem())}
            >
              {t('Add Product', { defaultValue: 'Add Product' })}
            </Button>
          ) : null}
        </div>

        <div className="form-section__body">
          {showWarehouseItems ? (
            <>
              {!isMerchantPortal && !selectedMerchantId ? (
                <div className="empty-state-inline">{t('Select a merchant first to load warehouse products.', { defaultValue: 'Select a merchant first to load warehouse products.' })}</div>
              ) : null}
              {(isMerchantPortal || selectedMerchantId > 0) && warehouseProductsQuery.isLoading ? (
                <div className="empty-state-inline">{t('Loading warehouse products...', { defaultValue: 'Loading warehouse products...' })}</div>
              ) : null}
              {(isMerchantPortal || selectedMerchantId > 0) && !warehouseProductsQuery.isLoading && !(warehouseProductsQuery.data?.data.length) ? (
                <div className="empty-state-inline">{t('No warehouse products found for this merchant.', { defaultValue: 'No warehouse products found for this merchant.' })}</div>
              ) : null}
              <div className="order-items-list">
                {warehouseItems.fields.map((field, index) => (
                  <div className="order-item-row order-item-row--warehouse" key={field.id}>
                    <label className="field">
                      <span>{t('Warehouse Product', { defaultValue: 'Warehouse Product' })}</span>
                      <Controller
                        control={control}
                        name={`warehouse_items.${index}.warehouse_product_id`}
                        render={({ field: warehouseField }) => (
                          <SearchableSelect
                            value={warehouseField.value ? String(warehouseField.value) : '0'}
                            placeholder={t('Select product', { defaultValue: 'Select product' })}
                            searchPlaceholder={t('Search warehouse products...', { defaultValue: 'Search warehouse products...' })}
                            onChange={(warehouse_product_id) => warehouseField.onChange(Number(warehouse_product_id || 0))}
                            options={[
                              { label: t('Select product', { defaultValue: 'Select product' }), value: '0' },
                              ...((warehouseProductsQuery.data?.data ?? []).map((product: any) => ({
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
                      <span>{t('Qty', { defaultValue: 'Qty' })}</span>
                      <Input type="number" {...register(`warehouse_items.${index}.quantity`, { valueAsNumber: true })} />
                      <FieldError
                        error={
                          errors.warehouse_items?.[index]?.quantity?.message
                          ?? getFieldError(`warehouse_items.${index}.quantity`)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>{t('Unit Price', { defaultValue: 'Unit Price' })}</span>
                      <Input type="number" step="0.01" {...register(`warehouse_items.${index}.unit_price`, { valueAsNumber: true })} />
                      <FieldError
                        error={
                          errors.warehouse_items?.[index]?.unit_price?.message
                          ?? getFieldError(`warehouse_items.${index}.unit_price`)
                        }
                      />
                    </label>
                    <Button type="button" variant="danger" onClick={() => warehouseItems.remove(index)}>
                      {t('Remove', { defaultValue: 'Remove' })}
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
                    <span>{t('Product')}</span>
                    <Input {...register(`items.${index}.product_name`)} />
                    <FieldError error={errors.items?.[index]?.product_name?.message ?? getFieldError(`items.${index}.product_name`)} />
                  </label>
                  <label className="field">
                    <span>{t('SKU', { defaultValue: 'SKU' })}</span>
                    <Input {...register(`items.${index}.sku`)} />
                    <FieldError error={errors.items?.[index]?.sku?.message ?? getFieldError(`items.${index}.sku`)} />
                  </label>
                  <label className="field">
                    <span>{t('Qty', { defaultValue: 'Qty' })}</span>
                    <Input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                    <FieldError error={errors.items?.[index]?.quantity?.message ?? getFieldError(`items.${index}.quantity`)} />
                  </label>
                  <label className="field">
                    <span>{t('Unit Price', { defaultValue: 'Unit Price' })}</span>
                    <Input type="number" step="0.01" {...register(`items.${index}.unit_price`, { valueAsNumber: true })} />
                    <FieldError error={errors.items?.[index]?.unit_price?.message ?? getFieldError(`items.${index}.unit_price`)} />
                  </label>
                  <label className="field">
                    <span>{t('Weight', { defaultValue: 'Weight' })}</span>
                    <Input type="number" step="0.01" {...register(`items.${index}.weight`, { valueAsNumber: true })} />
                    <FieldError error={errors.items?.[index]?.weight?.message ?? getFieldError(`items.${index}.weight`)} />
                  </label>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => manualItems.remove(index)}
                    disabled={manualItems.fields.length === 1}
                  >
                    {t('Remove', { defaultValue: 'Remove' })}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
              </div>
            ),
          },
          {
            title: t('Review', { defaultValue: 'Review' }),
            icon: <ClipboardCheck size={16} />,
            component: (
              <div className="step-wizard-review">
                <section className="step-wizard-review__section">
                  <div className="step-wizard-review__header">
                    <h3>{t('Basic Information', { defaultValue: 'Basic Information' })}</h3>
                    <button className="step-wizard-review__edit" type="button" onClick={() => setCurrentStep(0)}>
                      {t('Edit', { defaultValue: 'Edit' })}
                    </button>
                  </div>
                  <dl className="step-wizard-review__grid">
                    {!isMerchantPortal ? <div><dt>{t('Merchant')}</dt><dd>{currentValues.merchant_id || '-'}</dd></div> : null}
                    <div><dt>{t('Order Type', { defaultValue: 'Order Type' })}</dt><dd>{currentValues.order_type}</dd></div>
                    <div><dt>{t('Fulfillment Type', { defaultValue: 'Fulfillment Type' })}</dt><dd>{currentValues.fulfillment_type}</dd></div>
                    {currentValues.order_type === 'swap' ? <div><dt>{t('Original Order ID', { defaultValue: 'Original Order ID' })}</dt><dd>{currentValues.original_order_id || '-'}</dd></div> : null}
                    <div><dt>{t('Allow Inspection', { defaultValue: 'Allow Inspection' })}</dt><dd>{currentValues.allow_inspection ? t('Yes', { defaultValue: 'Yes' }) : t('No', { defaultValue: 'No' })}</dd></div>
                    <div><dt>{t('Notes')}</dt><dd>{currentValues.notes || '-'}</dd></div>
                  </dl>
                </section>

                <section className="step-wizard-review__section">
                  <div className="step-wizard-review__header">
                    <h3>{t('Customer & Delivery', { defaultValue: 'Customer & Delivery' })}</h3>
                    <button className="step-wizard-review__edit" type="button" onClick={() => setCurrentStep(1)}>
                      {t('Edit', { defaultValue: 'Edit' })}
                    </button>
                  </div>
                  <dl className="step-wizard-review__grid">
                    <div><dt>{t('Customer Name', { defaultValue: 'Customer Name' })}</dt><dd>{currentValues.customer_name || '-'}</dd></div>
                    <div><dt>{t('Customer Phone', { defaultValue: 'Customer Phone' })}</dt><dd>{currentValues.customer_phone || '-'}</dd></div>
                    <div><dt>{t('Alt Phone', { defaultValue: 'Alt Phone' })}</dt><dd>{currentValues.customer_phone_alt || '-'}</dd></div>
                    <div><dt>{t('Governorate')}</dt><dd>{currentValues.delivery_governorate_id || '-'}</dd></div>
                    <div><dt>{t('Area')}</dt><dd>{currentValues.delivery_area_id || '-'}</dd></div>
                    <div><dt>{t('Delivery Address', { defaultValue: 'Delivery Address' })}</dt><dd>{currentValues.delivery_address || '-'}</dd></div>
                    <div><dt>{t('Delivery Notes', { defaultValue: 'Delivery Notes' })}</dt><dd>{currentValues.delivery_notes || '-'}</dd></div>
                  </dl>
                </section>

                <section className="step-wizard-review__section">
                  <div className="step-wizard-review__header">
                    <h3>{t('Items & Payment', { defaultValue: 'Items & Payment' })}</h3>
                    <button className="step-wizard-review__edit" type="button" onClick={() => setCurrentStep(2)}>
                      {t('Edit', { defaultValue: 'Edit' })}
                    </button>
                  </div>
                  <dl className="step-wizard-review__grid">
                    <div><dt>{t('Payment Type', { defaultValue: 'Payment Type' })}</dt><dd>{currentValues.payment_type}</dd></div>
                    <div><dt>{t('COD Amount', { defaultValue: 'COD Amount' })}</dt><dd>{currentValues.cod_amount}</dd></div>
                    <div><dt>{t('Items')}</dt><dd>{showWarehouseItems ? (currentValues.warehouse_items?.length ?? 0) : currentValues.items.length}</dd></div>
                    <div><dt>{t('Products')}</dt><dd>{showWarehouseItems ? (currentValues.warehouse_items ?? []).map((item) => `#${item.warehouse_product_id} × ${item.quantity}`).join(', ') || '-' : currentValues.items.map((item) => `${item.product_name || '-'} × ${item.quantity}`).join(', ') || '-'}</dd></div>
                    <div><dt>{t('Requires Packaging', { defaultValue: 'Requires Packaging' })}</dt><dd>{currentValues.requires_packaging ? t('Yes', { defaultValue: 'Yes' }) : t('No', { defaultValue: 'No' })}</dd></div>
                    <div><dt>{t('Packaging Items', { defaultValue: 'Packaging Items' })}</dt><dd>{currentValues.packaging_items?.length ?? 0}</dd></div>
                  </dl>
                </section>
              </div>
            ),
          },
        ]}
      />

      {errors.items?.message ? <div className="form-error">{errors.items.message}</div> : null}
      {errors.warehouse_items?.message ? <div className="form-error">{errors.warehouse_items.message}</div> : null}
      {warehouseProductsQuery.error ? <div className="form-error">{getApiErrorMessage(warehouseProductsQuery.error)}</div> : null}
      {formError ? <div className="form-error">{formError}</div> : null}

    </form>
  )
}
