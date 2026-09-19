import { useQuery } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ClipboardCheck, Info, Package, Plus, Trash2, User } from 'lucide-react'
import { z } from 'zod'
import { FieldError } from '../../../../shared/components/forms/FieldError'
import { Button } from '../../../../shared/components/ui/Button'
import { Input } from '../../../../shared/components/ui/Input'
import { SearchableSelect, type SearchableSelectOption } from '../../../../shared/components/ui/SearchableSelect'
import { Select } from '../../../../shared/components/ui/Select'
import { StepWizard } from '../../../../shared/components/ui/StepWizard'
import { useFormApiErrors } from '../../../../shared/hooks/useFormApiErrors'
import {
  listMerchantPortalAreas,
  listMerchantPortalGovernorates,
  type MerchantPortalLocationOption,
} from '../../api/merchantPortal.api'
import type {
  MerchantPortalCreateOrderPayload,
  MerchantPortalOrder,
} from '../types/merchantPortalOrders.types'

const orderItemSchema = z.object({
  product_name: z.string().min(1, 'Product Name is required.'),
  sku: z.string().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1.'),
  unit_price: z.number().min(0, 'Unit Price must be zero or more.'),
  weight: z.number().or(z.nan()).optional(),
  notes: z.string().optional(),
})

const merchantOrderSchema = z.object({
  order_type: z.enum(['delivery', 'swap', 'return']),
  customer_name: z.string().min(1, 'Customer Name is required.'),
  customer_phone: z.string().min(1, 'Customer Phone is required.'),
  customer_phone_alt: z.string().optional(),
  delivery_governorate_id: z.number().min(1, 'Delivery Governorate is required.'),
  delivery_area_id: z.number().or(z.nan()).optional(),
  delivery_address: z.string().min(1, 'Delivery Address is required.'),
  delivery_notes: z.string().optional(),
  payment_type: z.enum(['cod', 'prepaid']),
  cod_amount: z.number().min(0, 'COD Amount must be zero or more.'),
  fulfillment_type: z.enum(['pickup_from_merchant', 'from_warehouse', 'pickup_from_customer']),
  is_fragile: z.boolean(),
  allow_inspection: z.boolean(),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'Items are required.'),
}).superRefine((values, context) => {
  // Validate COD amount equals items total
  if (values.payment_type === 'cod' && values.order_type !== 'return') {
    const itemsTotal = values.items.reduce((sum, item) => {
      const price = Number(item.unit_price) || 0
      const quantity = Number(item.quantity) || 0

      return sum + (price * quantity)
    }, 0)

    if (values.items.length > 0 && itemsTotal > 0) {
      const roundedCod = Math.round(values.cod_amount * 100) / 100
      const roundedTotal = Math.round(itemsTotal * 100) / 100

      if (roundedCod !== roundedTotal) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `COD amount (${roundedCod.toFixed(2)}) must equal the total items value (${roundedTotal.toFixed(2)}).`,
          path: ['cod_amount'],
        })
      }
    }
  }
})

type MerchantOrderFormValues = z.infer<typeof merchantOrderSchema>

type MerchantOrderFormProps = {
  defaultValues?: MerchantPortalOrder | null
  error?: unknown
  isSubmitting?: boolean
  onSubmit: (payload: MerchantPortalCreateOrderPayload) => void
  submitLabel: string
}

function emptyItem() {
  return {
    product_name: '',
    sku: '',
    quantity: 1,
    unit_price: 0,
    weight: undefined,
    notes: '',
  }
}

function normalizeOptionalNumber(value: number | undefined) {
  return Number.isFinite(value) ? value : undefined
}

function normalizeLocationId(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return undefined
  }

  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : undefined
}

function normalizePaymentTypeForForm(order?: MerchantPortalOrder | null): MerchantOrderFormValues['payment_type'] {
  const rawValue = order?.payment_type
    ?? order?.payment_summary?.payment_type
    ?? order?.payment?.type
    ?? order?.payment_method
    ?? order?.payment?.method
    ?? ''
  const normalizedValue = String(rawValue).trim().toLowerCase()

  if (normalizedValue === 'prepaid') {
    return 'prepaid'
  }

  if (normalizedValue === 'cod' || normalizedValue === 'cash_on_delivery') {
    return 'cod'
  }

  return 'cod'
}

function normalizeFulfillmentTypeForForm(order?: MerchantPortalOrder | null): MerchantOrderFormValues['fulfillment_type'] {
  const rawValue = order?.fulfillment_type
    ?? order?.warehouse_summary?.fulfillment_type
    ?? ''
  const normalizedValue = String(rawValue).trim().toLowerCase()

  if (
    normalizedValue === 'pickup_from_merchant'
    || normalizedValue === 'from_warehouse'
    || normalizedValue === 'pickup_from_customer'
  ) {
    return normalizedValue
  }

  return 'pickup_from_merchant'
}

function normalizeMoneyValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return 0
  }

  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

function normalizeBooleanValue(value: unknown, fallback = false) {
  if (typeof value === 'boolean') {
    return value
  }

  if (value === 1 || value === '1' || value === 'true') {
    return true
  }

  if (value === 0 || value === '0' || value === 'false') {
    return false
  }

  return fallback
}

function getFallbackGovernorateOption(order?: MerchantPortalOrder | null): MerchantPortalLocationOption | null {
  const id = normalizeLocationId(
    order?.delivery_governorate_id
    ?? order?.delivery_governorate?.id
    ?? order?.delivery?.governorate_id,
  )

  if (!id) {
    return null
  }

  const name = order?.delivery_governorate_name
    ?? order?.governorate_name
    ?? order?.delivery?.governorate_name
    ?? order?.delivery_governorate?.name
    ?? null
  const nameAr = order?.delivery_governorate?.name_ar ?? null

  if (!name && !nameAr) {
    return null
  }

  return {
    id,
    name,
    name_ar: nameAr,
  }
}

function getFallbackAreaOption(order?: MerchantPortalOrder | null): MerchantPortalLocationOption | null {
  const id = normalizeLocationId(
    order?.delivery_area_id
    ?? order?.delivery_area?.id
    ?? order?.delivery?.area_id,
  )

  if (!id) {
    return null
  }

  const name = order?.delivery_area_name
    ?? order?.area_name
    ?? order?.delivery?.area_name
    ?? order?.delivery_area?.name
    ?? null
  const nameAr = order?.delivery_area?.name_ar ?? null

  if (!name && !nameAr) {
    return null
  }

  return {
    id,
    name,
    name_ar: nameAr,
  }
}

function mapOrderToFormValues(order?: MerchantPortalOrder | null): MerchantOrderFormValues {
  return {
    order_type: order?.order_type ?? 'delivery',
    customer_name: order?.customer_name ?? order?.customer?.name ?? order?.customer?.customer_name ?? '',
    customer_phone: order?.customer_phone ?? order?.customer?.phone ?? order?.customer?.customer_phone ?? '',
    customer_phone_alt: order?.customer_phone_alt
      ?? order?.customer_alt_phone
      ?? order?.customer?.phone_alt
      ?? order?.customer?.alternative_phone
      ?? order?.customer?.alternate_phone
      ?? '',
    delivery_governorate_id: normalizeLocationId(
      order?.delivery_governorate_id
      ?? order?.delivery_governorate?.id
      ?? order?.delivery?.governorate_id,
    ) ?? 0,
    delivery_area_id: normalizeLocationId(
      order?.delivery_area_id
      ?? order?.delivery_area?.id
      ?? order?.delivery?.area_id,
    ),
    delivery_address: order?.delivery_address ?? order?.delivery?.address ?? order?.address ?? '',
    delivery_notes: order?.delivery_notes ?? order?.delivery?.notes ?? '',
    payment_type: normalizePaymentTypeForForm(order),
    cod_amount: normalizeMoneyValue(
      order?.cod_amount
      ?? order?.payment_summary?.cod_amount
      ?? order?.payment?.cod_amount
      ?? order?.amounts?.cod_amount,
    ),
    fulfillment_type: normalizeFulfillmentTypeForForm(order),
    is_fragile: normalizeBooleanValue(order?.is_fragile, false),
    allow_inspection: normalizeBooleanValue(order?.allow_inspection, false),
    notes: order?.notes ?? '',
    items: order?.items?.length
      ? order.items.map((item) => ({
          product_name: item.product_name,
          sku: item.sku ?? '',
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
          weight: item.weight ? Number(item.weight) : undefined,
          notes: item.notes ?? '',
        }))
      : [emptyItem()],
  }
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

export function MerchantOrderForm({
  defaultValues,
  error,
  isSubmitting = false,
  onSubmit,
  submitLabel,
}: MerchantOrderFormProps) {
  const { t, i18n } = useTranslation()
  const { formError, getFieldError } = useFormApiErrors(error)
  const initialValues = useMemo(() => mapOrderToFormValues(defaultValues), [defaultValues])
  const fallbackGovernorateOption = useMemo(() => getFallbackGovernorateOption(defaultValues), [defaultValues])
  const fallbackAreaOption = useMemo(() => getFallbackAreaOption(defaultValues), [defaultValues])
  const form = useForm<MerchantOrderFormValues>({
    resolver: zodResolver(merchantOrderSchema),
    defaultValues: initialValues,
  })

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
    trigger,
    watch,
  } = form
  const items = useFieldArray({
    control,
    name: 'items',
  })
  const [currentStep, setCurrentStep] = useState(0)
  const [cachedGovernorateLabel, setCachedGovernorateLabel] = useState('')
  const [cachedAreaLabel, setCachedAreaLabel] = useState('')
  const selectedOrderType = watch('order_type')
  const selectedPaymentType = watch('payment_type')
  const selectedGovernorateId = watch('delivery_governorate_id')
  const currentValues = watch()
  const previousGovernorateIdRef = useRef<number | undefined>(undefined)
  const useArabicLabel = i18n.resolvedLanguage === 'ar'

  const governoratesQuery = useQuery({
    queryKey: ['merchant-portal-governorates'],
    queryFn: listMerchantPortalGovernorates,
  })

  const areasQuery = useQuery({
    queryKey: ['merchant-portal-areas', selectedGovernorateId],
    queryFn: () => listMerchantPortalAreas(selectedGovernorateId),
    enabled: selectedGovernorateId > 0,
  })

  const governorateOptions = useMemo(() => {
    const options = (governoratesQuery.data ?? []).map((option) =>
      buildLocationSelectOption(option, useArabicLabel),
    )

    if (fallbackGovernorateOption && !options.some((option) => option.value === String(fallbackGovernorateOption.id))) {
      options.unshift(buildLocationSelectOption(fallbackGovernorateOption, useArabicLabel))
    }

    return options
  }, [fallbackGovernorateOption, governoratesQuery.data, useArabicLabel])

  const areaOptions = useMemo(() => {
    const options = (areasQuery.data ?? []).map((option) =>
      buildLocationSelectOption(option, useArabicLabel),
    )

    if (
      fallbackAreaOption
      && selectedGovernorateId === initialValues.delivery_governorate_id
      && !options.some((option) => option.value === String(fallbackAreaOption.id))
    ) {
      options.unshift(buildLocationSelectOption(fallbackAreaOption, useArabicLabel))
    }

    return options
  }, [areasQuery.data, fallbackAreaOption, initialValues.delivery_governorate_id, selectedGovernorateId, useArabicLabel])

  useEffect(() => {
    if (!defaultValues) {
      return
    }

    reset(initialValues)
    previousGovernorateIdRef.current = initialValues.delivery_governorate_id
  }, [defaultValues, initialValues, reset])

  useEffect(() => {
    if (selectedOrderType === 'return') {
      setValue('payment_type', 'prepaid', { shouldValidate: true })
      setValue('cod_amount', 0, { shouldValidate: true })
    }
  }, [selectedOrderType, setValue])

  useEffect(() => {
    if (selectedPaymentType === 'prepaid') {
      setValue('cod_amount', 0, { shouldValidate: true })
    }
  }, [selectedPaymentType, setValue])

  useEffect(() => {
    if (previousGovernorateIdRef.current === undefined) {
      previousGovernorateIdRef.current = selectedGovernorateId
      return
    }

    if (previousGovernorateIdRef.current !== selectedGovernorateId) {
      setValue('delivery_area_id', undefined, { shouldDirty: true, shouldValidate: true })
      previousGovernorateIdRef.current = selectedGovernorateId
    }
  }, [selectedGovernorateId, setValue])

  function handleValidSubmit(values: MerchantOrderFormValues) {
    const payload = {
      order_type: values.order_type,
      customer_name: values.customer_name,
      customer_phone: values.customer_phone,
      customer_phone_alt: values.customer_phone_alt || undefined,
      delivery_governorate_id: values.delivery_governorate_id,
      delivery_area_id: normalizeOptionalNumber(values.delivery_area_id),
      delivery_address: values.delivery_address,
      delivery_notes: values.delivery_notes || undefined,
      payment_type: values.order_type === 'return' ? 'prepaid' : values.payment_type,
      cod_amount: values.order_type === 'return' || values.payment_type === 'prepaid' ? 0 : values.cod_amount,
      fulfillment_type: values.fulfillment_type,
      is_fragile: values.is_fragile,
      allow_inspection: values.allow_inspection,
      notes: values.notes || undefined,
      items: values.items.map((item) => ({
        product_name: item.product_name,
        sku: item.sku || undefined,
        quantity: item.quantity,
        unit_price: item.unit_price,
        weight: normalizeOptionalNumber(item.weight),
        notes: item.notes || undefined,
      })),
    } satisfies MerchantPortalCreateOrderPayload

    onSubmit(payload)
  }

  return (
    <form style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} onSubmit={(event) => event.preventDefault()}>
      <StepWizard
        activeStep={currentStep}
        completeLabel={t(submitLabel, { defaultValue: submitLabel })}
        isCompleting={isSubmitting}
        onComplete={() => void handleSubmit(handleValidSubmit)()}
        onStepChange={setCurrentStep}
        steps={[
          {
            title: t('Basic Information', { defaultValue: 'Basic Information' }),
            icon: <Info size={16} />,
            validate: () => trigger([
              'order_type',
              'fulfillment_type',
              'is_fragile',
              'allow_inspection',
              'notes',
            ]),
            component: (
              <div className="order-wizard-step">
      <div className="form-section form-section--panel">
        <div className="form-section__header">
          <div className="form-section__header-copy">
            <h3 className="form-section__title">{t('Order Details', { defaultValue: 'Order Details' })}</h3>
            <p className="form-section__description">
              {t('Manage and track your orders.', { defaultValue: 'Manage and track your orders.' })}
            </p>
          </div>
        </div>
        <div className="form-section__body form-grid">
          <label className="field">
            <span>{t('Order Type', { defaultValue: 'Order Type' })}</span>
            <Select {...register('order_type')}>
              <option value="delivery">{t('delivery', { defaultValue: 'delivery' })}</option>
              <option value="swap">{t('swap', { defaultValue: 'swap' })}</option>
              <option value="return">{t('return', { defaultValue: 'return' })}</option>
            </Select>
            <FieldError error={errors.order_type?.message ?? getFieldError('order_type')} />
          </label>

          <label className="field">
            <span>{t('Fulfillment Type', { defaultValue: 'Fulfillment Type' })}</span>
            <Select {...register('fulfillment_type')}>
              <option value="pickup_from_merchant">{t('pickup_from_merchant', { defaultValue: 'pickup_from_merchant' })}</option>
              <option value="from_warehouse">{t('from_warehouse', { defaultValue: 'from_warehouse' })}</option>
              <option value="pickup_from_customer">{t('pickup_from_customer', { defaultValue: 'pickup_from_customer' })}</option>
            </Select>
            <FieldError error={errors.fulfillment_type?.message ?? getFieldError('fulfillment_type')} />
          </label>
        </div>
      </div>

      <div className="form-section form-section--panel">
        <div className="form-section__header">
          <div className="form-section__header-copy">
            <h3 className="form-section__title">{t('Fulfillment Information', { defaultValue: 'Fulfillment Information' })}</h3>
          </div>
        </div>
        <div className="form-section__body form-grid form-grid--two">
          <label className="field field--inline">
            <input type="checkbox" {...register('is_fragile')} />
            <span>{t('Fragile', { defaultValue: 'Fragile' })}</span>
          </label>

          <label className="field field--inline">
            <input type="checkbox" {...register('allow_inspection')} />
            <span>{t('Allow Inspection', { defaultValue: 'Allow Inspection' })}</span>
          </label>

          <label className="field field--full">
            <span>{t('Notes', { defaultValue: 'Notes' })}</span>
            <textarea className="ui-input" rows={3} {...register('notes')} />
            <FieldError error={errors.notes?.message ?? getFieldError('notes')} />
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

      <div className="form-section form-section--panel">
        <div className="form-section__header">
          <div className="form-section__header-copy">
            <h3 className="form-section__title">{t('Customer Information', { defaultValue: 'Customer Information' })}</h3>
          </div>
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
            <span>{t('Alternative Phone', { defaultValue: 'Alternative Phone' })}</span>
            <Input {...register('customer_phone_alt')} />
            <FieldError error={errors.customer_phone_alt?.message ?? getFieldError('customer_phone_alt')} />
          </label>

          <label className="field field--full">
            <span>{t('Delivery Address', { defaultValue: 'Delivery Address' })}</span>
            <Input {...register('delivery_address')} />
            <FieldError error={errors.delivery_address?.message ?? getFieldError('delivery_address')} />
          </label>

          <label className="field field--full">
            <span>{t('Delivery Notes', { defaultValue: 'Delivery Notes' })}</span>
            <textarea className="ui-input" rows={3} {...register('delivery_notes')} />
            <FieldError error={errors.delivery_notes?.message ?? getFieldError('delivery_notes')} />
          </label>
        </div>
      </div>

      <div className="form-section form-section--panel">
        <div className="form-section__header">
          <div className="form-section__header-copy">
            <h3 className="form-section__title">{t('Delivery Location', { defaultValue: 'Delivery Location' })}</h3>
          </div>
        </div>
        <div className="form-section__body form-grid">
          <label className="field">
            <span>{t('Delivery Governorate', { defaultValue: 'Delivery Governorate' })}</span>
            <Controller
              name="delivery_governorate_id"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value ? String(field.value) : ''}
                  options={governorateOptions}
                  placeholder={governoratesQuery.isLoading
                    ? t('Loading locations...', { defaultValue: 'Loading locations...' })
                    : t('Select governorate', { defaultValue: 'Select governorate' })}
                  searchPlaceholder={t('Search governorates...', { defaultValue: 'Search governorates...' })}
                  emptyMessage={t('No options found.', { defaultValue: 'No options found.' })}
                  disabled={governoratesQuery.isLoading || governoratesQuery.isError}
                  onChange={(value) => {
                    const selectedOption = governorateOptions.find((option) => option.value === value)
                    setCachedGovernorateLabel(selectedOption?.label ?? '')
                    setCachedAreaLabel('')
                    field.onChange(value ? Number(value) : 0)
                  }}
                />
              )}
            />
            {governoratesQuery.isLoading ? (
              <small>{t('Loading locations...', { defaultValue: 'Loading locations...' })}</small>
            ) : null}
            {governoratesQuery.isError ? (
              <small>{t('Failed to load locations', { defaultValue: 'Failed to load locations' })}</small>
            ) : null}
            {!governoratesQuery.isLoading && !governoratesQuery.isError && governorateOptions.length === 0 ? (
              <small>{t('No options found.', { defaultValue: 'No options found.' })}</small>
            ) : null}
            <FieldError error={errors.delivery_governorate_id?.message ?? getFieldError('delivery_governorate_id')} />
          </label>

          <label className="field">
            <span>{t('Delivery Area', { defaultValue: 'Delivery Area' })}</span>
            <Controller
              name="delivery_area_id"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value ? String(field.value) : ''}
                  options={areaOptions}
                  placeholder={!selectedGovernorateId
                    ? t('Select governorate first', { defaultValue: 'Select governorate first' })
                    : areasQuery.isLoading
                      ? t('Loading locations...', { defaultValue: 'Loading locations...' })
                      : t('Select area', { defaultValue: 'Select area' })}
                  searchPlaceholder={t('Search areas...', { defaultValue: 'Search areas...' })}
                  emptyMessage={t('No options found.', { defaultValue: 'No options found.' })}
                  disabled={!selectedGovernorateId || areasQuery.isLoading || areasQuery.isError}
                  onChange={(value) => {
                    const selectedOption = areaOptions.find((option) => option.value === value)
                    setCachedAreaLabel(selectedOption?.label ?? '')
                    field.onChange(value ? Number(value) : undefined)
                  }}
                />
              )}
            />
            {selectedGovernorateId && areasQuery.isLoading ? (
              <small>{t('Loading locations...', { defaultValue: 'Loading locations...' })}</small>
            ) : null}
            {selectedGovernorateId && areasQuery.isError ? (
              <small>{t('Failed to load locations', { defaultValue: 'Failed to load locations' })}</small>
            ) : null}
            {selectedGovernorateId && !areasQuery.isLoading && !areasQuery.isError && areaOptions.length === 0 ? (
              <small>{t('No options found.', { defaultValue: 'No options found.' })}</small>
            ) : null}
            <FieldError error={errors.delivery_area_id?.message ?? getFieldError('delivery_area_id')} />
          </label>
        </div>
      </div>
              </div>
            ),
          },
          {
            title: t('Items & Payment', { defaultValue: 'Items & Payment' }),
            icon: <Package size={16} />,
            validate: () => trigger(['payment_type', 'cod_amount', 'items']),
            component: (
              <div className="order-wizard-step">

      <div className="form-section form-section--panel">
        <div className="form-section__header">
          <div className="form-section__header-copy">
            <h3 className="form-section__title">{t('Payment Information', { defaultValue: 'Payment Information' })}</h3>
          </div>
        </div>
        <div className="form-section__body form-grid">
          <label className="field">
            <span>{t('Payment Type', { defaultValue: 'Payment Type' })}</span>
            <Select {...register('payment_type')} disabled={selectedOrderType === 'return'}>
              <option value="cod">{t('cod', { defaultValue: 'cod' })}</option>
              <option value="prepaid">{t('prepaid', { defaultValue: 'prepaid' })}</option>
            </Select>
            <FieldError error={errors.payment_type?.message ?? getFieldError('payment_type')} />
          </label>

          <label className="field">
            <span>{t('COD Amount', { defaultValue: 'COD Amount' })}</span>
            <Input
              disabled={selectedOrderType === 'return' || selectedPaymentType === 'prepaid'}
              step="0.01"
              type="number"
              {...register('cod_amount', { valueAsNumber: true })}
            />
            <FieldError error={errors.cod_amount?.message ?? getFieldError('cod_amount')} />
          </label>
        </div>
      </div>

      <div className="form-section form-section--panel">
        <div className="form-section__header">
          <div className="form-section__header-copy">
            <h3 className="form-section__title">{t('Items', { defaultValue: 'Items' })}</h3>
          </div>
        </div>
        <div className="form-section__body">
          <div className="order-items-toolbar">
            <p>{t('Add one or more products included in this order.', { defaultValue: 'Add one or more products included in this order.' })}</p>
            <Button type="button" variant="secondary" onClick={() => items.append(emptyItem())}>
              <Plus size={16} />
              {t('Add Item', { defaultValue: 'Add Item' })}
            </Button>
          </div>
          <div className="order-items-list">
            {items.fields.map((field, index) => (
              <div className="order-item-row" key={field.id}>
                <span className="order-item-row__number">
                  {t('Item {{number}}', { number: index + 1, defaultValue: `Item ${index + 1}` })}
                </span>
                <label className="field">
                  <span>{t('Product Name', { defaultValue: 'Product Name' })}</span>
                  <Input {...register(`items.${index}.product_name`)} />
                  <FieldError error={errors.items?.[index]?.product_name?.message ?? getFieldError(`items.${index}.product_name`)} />
                </label>

                <label className="field">
                  <span>{t('SKU', { defaultValue: 'SKU' })}</span>
                  <Input {...register(`items.${index}.sku`)} />
                  <FieldError error={errors.items?.[index]?.sku?.message ?? getFieldError(`items.${index}.sku`)} />
                </label>

                <label className="field">
                  <span>{t('Quantity', { defaultValue: 'Quantity' })}</span>
                  <Input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                  <FieldError error={errors.items?.[index]?.quantity?.message ?? getFieldError(`items.${index}.quantity`)} />
                </label>

                <label className="field">
                  <span>{t('Unit Price', { defaultValue: 'Unit Price' })}</span>
                  <Input step="0.01" type="number" {...register(`items.${index}.unit_price`, { valueAsNumber: true })} />
                  <FieldError error={errors.items?.[index]?.unit_price?.message ?? getFieldError(`items.${index}.unit_price`)} />
                </label>

                <label className="field">
                  <span>{t('Weight', { defaultValue: 'Weight' })}</span>
                  <Input step="0.01" type="number" {...register(`items.${index}.weight`, { valueAsNumber: true })} />
                  <FieldError error={errors.items?.[index]?.weight?.message ?? getFieldError(`items.${index}.weight`)} />
                </label>

                <label className="field field--full">
                  <span>{t('Notes', { defaultValue: 'Notes' })}</span>
                  <Input {...register(`items.${index}.notes`)} />
                  <FieldError error={errors.items?.[index]?.notes?.message ?? getFieldError(`items.${index}.notes`)} />
                </label>

                <div className="order-item-row__actions">
                  <Button
                    disabled={items.fields.length === 1}
                    type="button"
                    variant="danger"
                    onClick={() => items.remove(index)}
                  >
                    <Trash2 size={15} />
                    {t('Remove Item', { defaultValue: 'Remove Item' })}
                  </Button>
                </div>
              </div>
            ))}
          </div>
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
                    <div><dt>{t('Order Type', { defaultValue: 'Order Type' })}</dt><dd>{currentValues.order_type}</dd></div>
                    <div><dt>{t('Fulfillment Type', { defaultValue: 'Fulfillment Type' })}</dt><dd>{currentValues.fulfillment_type}</dd></div>
                    <div><dt>{t('Fragile', { defaultValue: 'Fragile' })}</dt><dd>{currentValues.is_fragile ? t('Yes', { defaultValue: 'Yes' }) : t('No', { defaultValue: 'No' })}</dd></div>
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
                    <div><dt>{t('Alternative Phone', { defaultValue: 'Alternative Phone' })}</dt><dd>{currentValues.customer_phone_alt || '-'}</dd></div>
                    <div>
                      <dt>{t('Delivery Governorate', { defaultValue: 'Delivery Governorate' })}</dt>
                      <dd>{governorateOptions.find((governorate) => governorate.value === String(currentValues.delivery_governorate_id))?.label || cachedGovernorateLabel || '-'}</dd>
                    </div>
                    <div>
                      <dt>{t('Delivery Area', { defaultValue: 'Delivery Area' })}</dt>
                      <dd>{areaOptions.find((area) => area.value === String(currentValues.delivery_area_id))?.label || cachedAreaLabel || '-'}</dd>
                    </div>
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
                    <div><dt>{t('Items')}</dt><dd>{currentValues.items.length}</dd></div>
                    <div><dt>{t('Products')}</dt><dd>{currentValues.items.map((item) => `${item.product_name || '-'} × ${item.quantity}`).join(', ') || '-'}</dd></div>
                  </dl>
                </section>
              </div>
            ),
          },
        ]}
      />

      {formError ? <div className="form-error">{formError}</div> : null}
    </form>
  )
}
