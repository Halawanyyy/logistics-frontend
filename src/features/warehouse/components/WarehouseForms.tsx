import { zodResolver } from '@hookform/resolvers/zod'
import type { ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { FormActionsBar } from '../../../shared/components/forms/FormActionsBar'
import { useFormApiErrors } from '../../../shared/hooks/useFormApiErrors'
import { SearchableSelect } from '../../../shared/components/ui/SearchableSelect'
import { Input } from '../../../shared/components/ui/Input'
import { Select } from '../../../shared/components/ui/Select'
import type { Area, Governorate } from '../../location-pricing/types/location-pricing.types'
import type { Merchant } from '../../merchants/types/merchant.types'
import type { Order } from '../../orders/types/order.types'
import type { Shipment } from '../../shipments/types/shipment.types'
import type { Warehouse, WarehouseProduct } from '../types/warehouse.types'

export const warehouseSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  address: z.string().min(1),
  governorate_id: z.number().min(1),
  area_id: z.number().or(z.nan()).nullable(),
  status: z.string().min(1),
  notes: z.string().optional(),
})

export const productSchema = z.object({
  merchant_id: z.number().min(1),
  name: z.string().min(1),
  sku: z.string().min(1),
  barcode: z.string().optional(),
  description: z.string().optional(),
  unit_weight: z.number().or(z.nan()).optional(),
  is_fragile: z.boolean(),
  requires_packaging: z.boolean(),
  status: z.string().min(1),
})

export const stockAdjustSchema = z.object({
  warehouse_id: z.number().min(1),
  warehouse_product_id: z.number().min(1),
  type: z.string().min(1),
  quantity: z.number().min(1),
  notes: z.string().optional(),
})

export const warehouseReturnSchema = z.object({
  shipment_id: z.number().min(1),
  order_id: z.number().min(1),
  warehouse_id: z.number().min(1),
  warehouse_product_id: z.number().min(1),
  quantity: z.number().min(1),
  condition: z.string().min(1),
  notes: z.string().optional(),
})

export const warehouseChargeSchema = z.object({
  merchant_id: z.number().min(1),
  warehouse_id: z.number().min(1),
  order_id: z.number().or(z.nan()).nullable(),
  shipment_id: z.number().or(z.nan()).nullable(),
  warehouse_product_id: z.number().or(z.nan()).nullable(),
  type: z.string().min(1),
  description: z.string().min(1),
  quantity: z.number().min(0),
  unit_price: z.number().min(0),
  status: z.string().min(1),
  charge_date: z.string().optional(),
  notes: z.string().optional(),
})

export type WarehouseFormKind = 'warehouse' | 'product' | 'adjust' | 'return' | 'charge'

type Props = {
  areas?: Area[]
  defaultValues?: any
  error?: unknown
  governorates?: Governorate[]
  isSubmitting?: boolean
  merchants?: Merchant[]
  orders?: Order[]
  products?: WarehouseProduct[]
  shipments?: Shipment[]
  secondaryAction?: ReactNode
  submitLabel: string
  warehouses?: Warehouse[]
  onSubmit: (values: any) => void
}

export function WarehouseForm({
  areas = [],
  defaultValues,
  error,
  governorates = [],
  isSubmitting,
  kind,
  merchants = [],
  onSubmit,
  orders = [],
  products = [],
  secondaryAction,
  shipments = [],
  submitLabel,
  warehouses = [],
}: Props & { kind: WarehouseFormKind }) {
  const { t } = useTranslation()
  const schema = kind === 'warehouse'
    ? warehouseSchema
    : kind === 'product'
      ? productSchema
      : kind === 'adjust'
        ? stockAdjustSchema
        : kind === 'return'
          ? warehouseReturnSchema
          : warehouseChargeSchema

  const form = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: defaults(kind, defaultValues),
  })
  const {
    formState: { errors },
  } = form
  const { formError, getFieldError } = useFormApiErrors(error)

  return (
    <form className="form-grid" onSubmit={form.handleSubmit((values) => onSubmit(clean(values)))}>
      {kind === 'warehouse' ? (
        <>
          <Field
            error={errors.name?.message ?? getFieldError('name')}
            label={t('Name')}
          >
            <Input {...form.register('name')} />
          </Field>
          <Field
            error={errors.code?.message ?? getFieldError('code')}
            label={t('Code')}
          >
            <Input {...form.register('code')} />
          </Field>
          <Field
            error={errors.address?.message ?? getFieldError('address')}
            label={t('Address')}
          >
            <Input {...form.register('address')} />
          </Field>
          <Controller
            name="governorate_id"
            control={form.control}
            render={({ field }) => (
              <SearchField
                error={errors.governorate_id?.message ?? getFieldError('governorate_id')}
                label={t('Governorate')}
                value={field.value}
                placeholder="Select governorate"
                searchPlaceholder="Search governorates..."
                options={[
                  { label: 'Select governorate', value: '' },
                  ...governorates.map((item) => ({
                    label: item.name,
                    value: String(item.id),
                    keywords: [String(item.id)],
                  })),
                ]}
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
              />
            )}
          />
          <Controller
            name="area_id"
            control={form.control}
            render={({ field }) => (
              <SearchField
                error={errors.area_id?.message ?? getFieldError('area_id')}
                label={t('Area')}
                value={field.value}
                placeholder="No area"
                searchPlaceholder="Search areas..."
                options={[
                  { label: 'No area', value: '' },
                  ...areas.map((item) => ({
                    label: item.name,
                    value: String(item.id),
                    keywords: [item.governorate_name ?? '', String(item.id)],
                  })),
                ]}
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
              />
            )}
          />
          <Status
            error={errors.status?.message ?? getFieldError('status')}
            register={form.register('status')}
          />
          <Field
            error={errors.notes?.message ?? getFieldError('notes')}
            label={t('Notes')}
          >
            <Input {...form.register('notes')} />
          </Field>
        </>
      ) : null}

      {kind === 'product' ? (
        <>
          <Controller
            name="merchant_id"
            control={form.control}
            render={({ field }) => (
              <SearchField
                error={errors.merchant_id?.message ?? getFieldError('merchant_id')}
                label={t('Merchant')}
                value={field.value}
                placeholder="Select merchant"
                searchPlaceholder="Search merchants..."
                options={[
                  { label: 'Select merchant', value: '' },
                  ...merchants.map((item) => ({
                    label: item.name,
                    value: String(item.id),
                    keywords: [item.company_name ?? '', item.email ?? '', String(item.id)],
                  })),
                ]}
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
              />
            )}
          />
          <Field
            error={errors.name?.message ?? getFieldError('name')}
            label={t('Name')}
          >
            <Input {...form.register('name')} />
          </Field>
          <Field
            error={errors.sku?.message ?? getFieldError('sku')}
            label="SKU"
          >
            <Input {...form.register('sku')} />
          </Field>
          <Field
            error={errors.barcode?.message ?? getFieldError('barcode')}
            label="Barcode"
          >
            <Input {...form.register('barcode')} />
          </Field>
          <Field
            error={errors.description?.message ?? getFieldError('description')}
            label={t('Description')}
          >
            <Input {...form.register('description')} />
          </Field>
          <Field
            error={errors.unit_weight?.message ?? getFieldError('unit_weight')}
            label={t('Unit Weight', { defaultValue: 'Unit Weight' })}
          >
            <Input type="number" step="0.01" {...form.register('unit_weight', { valueAsNumber: true })} />
          </Field>
          <label className="field field--inline">
            <input type="checkbox" {...form.register('is_fragile')} />
            <span>{t('Fragile', { defaultValue: 'Fragile' })}</span>
          </label>
          <label className="field field--inline">
            <input type="checkbox" {...form.register('requires_packaging')} />
            <span>{t('Requires packaging', { defaultValue: 'Requires packaging' })}</span>
          </label>
          <Status
            error={errors.status?.message ?? getFieldError('status')}
            register={form.register('status')}
          />
        </>
      ) : null}

      {kind === 'adjust' ? (
        <>
          <Controller
            name="warehouse_id"
            control={form.control}
            render={({ field }) => (
              <SearchField
                error={errors.warehouse_id?.message ?? getFieldError('warehouse_id')}
                label={t('Warehouse')}
                value={field.value}
                placeholder="Select warehouse"
                searchPlaceholder="Search warehouses..."
                options={[
                  { label: 'Select warehouse', value: '' },
                  ...warehouses.map((item) => ({
                    label: item.name,
                    value: String(item.id),
                    keywords: [item.code ?? '', String(item.id)],
                  })),
                ]}
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
              />
            )}
          />
          <Controller
            name="warehouse_product_id"
            control={form.control}
            render={({ field }) => (
              <SearchField
                error={errors.warehouse_product_id?.message ?? getFieldError('warehouse_product_id')}
                label={t('Product')}
                value={field.value}
                placeholder="Select product"
                searchPlaceholder="Search products..."
                options={[
                  { label: 'Select product', value: '' },
                  ...products.map((item) => ({
                    label: item.name,
                    value: String(item.id),
                    keywords: [item.sku, item.barcode ?? '', String(item.id)],
                  })),
                ]}
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
              />
            )}
          />
          <Field
            error={errors.type?.message ?? getFieldError('type')}
            label={t('Type')}
          >
            <Select {...form.register('type')}>
              <option value="in">in</option>
              <option value="out">out</option>
              <option value="damaged">damaged</option>
              <option value="adjustment">adjustment</option>
            </Select>
          </Field>
          <Field
            error={errors.quantity?.message ?? getFieldError('quantity')}
            label={t('Quantity', { defaultValue: 'Quantity' })}
          >
            <Input type="number" {...form.register('quantity', { valueAsNumber: true })} />
          </Field>
          <Field
            error={errors.notes?.message ?? getFieldError('notes')}
            label={t('Notes')}
          >
            <Input {...form.register('notes')} />
          </Field>
        </>
      ) : null}

      {kind === 'return' ? (
        <>
          <Controller
            name="shipment_id"
            control={form.control}
            render={({ field }) => (
              <SearchField
                error={errors.shipment_id?.message ?? getFieldError('shipment_id')}
                label={t('Shipment')}
                value={field.value}
                placeholder="Select shipment"
                searchPlaceholder="Search shipments..."
                options={[
                  { label: 'Select shipment', value: '' },
                  ...shipments.map((item) => ({
                    label: item.shipment_number,
                    value: String(item.id),
                    keywords: [item.customer_name, item.merchant_name ?? '', String(item.id)],
                  })),
                ]}
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
              />
            )}
          />
          <Controller
            name="order_id"
            control={form.control}
            render={({ field }) => (
              <SearchField
                error={errors.order_id?.message ?? getFieldError('order_id')}
                label={t('Order')}
                value={field.value}
                placeholder="Select order"
                searchPlaceholder="Search orders..."
                options={[
                  { label: 'Select order', value: '' },
                  ...orders.map((item) => ({
                    label: item.order_number,
                    value: String(item.id),
                    keywords: [item.customer_name, item.merchant_name ?? '', String(item.id)],
                  })),
                ]}
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
              />
            )}
          />
          <Controller
            name="warehouse_id"
            control={form.control}
            render={({ field }) => (
              <SearchField
                error={errors.warehouse_id?.message ?? getFieldError('warehouse_id')}
                label={t('Warehouse')}
                value={field.value}
                placeholder="Select warehouse"
                searchPlaceholder="Search warehouses..."
                options={[
                  { label: 'Select warehouse', value: '' },
                  ...warehouses.map((item) => ({
                    label: item.name,
                    value: String(item.id),
                    keywords: [item.code ?? '', String(item.id)],
                  })),
                ]}
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
              />
            )}
          />
          <Controller
            name="warehouse_product_id"
            control={form.control}
            render={({ field }) => (
              <SearchField
                error={errors.warehouse_product_id?.message ?? getFieldError('warehouse_product_id')}
                label={t('Product')}
                value={field.value}
                placeholder="Select product"
                searchPlaceholder="Search products..."
                options={[
                  { label: 'Select product', value: '' },
                  ...products.map((item) => ({
                    label: item.name,
                    value: String(item.id),
                    keywords: [item.sku, item.barcode ?? '', String(item.id)],
                  })),
                ]}
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
              />
            )}
          />
          <Field
            error={errors.quantity?.message ?? getFieldError('quantity')}
            label={t('Quantity', { defaultValue: 'Quantity' })}
          >
            <Input type="number" {...form.register('quantity', { valueAsNumber: true })} />
          </Field>
          <Field
            error={errors.condition?.message ?? getFieldError('condition')}
            label="Condition"
          >
            <Select {...form.register('condition')}>
              <option value="sellable">sellable</option>
              <option value="damaged">damaged</option>
              <option value="disposed">disposed</option>
            </Select>
          </Field>
          <Field
            error={errors.notes?.message ?? getFieldError('notes')}
            label={t('Notes')}
          >
            <Input {...form.register('notes')} />
          </Field>
        </>
      ) : null}

      {kind === 'charge' ? (
        <>
          <Controller
            name="merchant_id"
            control={form.control}
            render={({ field }) => (
              <SearchField
                error={errors.merchant_id?.message ?? getFieldError('merchant_id')}
                label={t('Merchant')}
                value={field.value}
                placeholder="Select merchant"
                searchPlaceholder="Search merchants..."
                options={[
                  { label: 'Select merchant', value: '' },
                  ...merchants.map((item) => ({
                    label: item.name,
                    value: String(item.id),
                    keywords: [item.company_name ?? '', item.email ?? '', String(item.id)],
                  })),
                ]}
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
              />
            )}
          />
          <Controller
            name="warehouse_id"
            control={form.control}
            render={({ field }) => (
              <SearchField
                error={errors.warehouse_id?.message ?? getFieldError('warehouse_id')}
                label={t('Warehouse')}
                value={field.value}
                placeholder="Select warehouse"
                searchPlaceholder="Search warehouses..."
                options={[
                  { label: 'Select warehouse', value: '' },
                  ...warehouses.map((item) => ({
                    label: item.name,
                    value: String(item.id),
                    keywords: [item.code ?? '', String(item.id)],
                  })),
                ]}
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
              />
            )}
          />
          <Controller
            name="order_id"
            control={form.control}
            render={({ field }) => (
              <SearchField
                error={errors.order_id?.message ?? getFieldError('order_id')}
                label={t('Order')}
                value={field.value}
                placeholder="No order"
                searchPlaceholder="Search orders..."
                options={[
                  { label: 'No order', value: '' },
                  ...orders.map((item) => ({
                    label: item.order_number,
                    value: String(item.id),
                    keywords: [item.customer_name, item.merchant_name ?? '', String(item.id)],
                  })),
                ]}
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
              />
            )}
          />
          <Controller
            name="shipment_id"
            control={form.control}
            render={({ field }) => (
              <SearchField
                error={errors.shipment_id?.message ?? getFieldError('shipment_id')}
                label={t('Shipment')}
                value={field.value}
                placeholder="No shipment"
                searchPlaceholder="Search shipments..."
                options={[
                  { label: 'No shipment', value: '' },
                  ...shipments.map((item) => ({
                    label: item.shipment_number,
                    value: String(item.id),
                    keywords: [item.customer_name, item.merchant_name ?? '', String(item.id)],
                  })),
                ]}
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
              />
            )}
          />
          <Controller
            name="warehouse_product_id"
            control={form.control}
            render={({ field }) => (
              <SearchField
                error={errors.warehouse_product_id?.message ?? getFieldError('warehouse_product_id')}
                label={t('Product')}
                value={field.value}
                placeholder="Select product"
                searchPlaceholder="Search products..."
                options={[
                  { label: 'Select product', value: '' },
                  ...products.map((item) => ({
                    label: item.name,
                    value: String(item.id),
                    keywords: [item.sku, item.barcode ?? '', String(item.id)],
                  })),
                ]}
                onChange={(value) => field.onChange(value ? Number(value) : 0)}
              />
            )}
          />
          <Field
            error={errors.type?.message ?? getFieldError('type')}
            label={t('Type')}
          >
            <Input {...form.register('type')} />
          </Field>
          <Field
            error={errors.description?.message ?? getFieldError('description')}
            label={t('Description')}
          >
            <Input {...form.register('description')} />
          </Field>
          <Field
            error={errors.quantity?.message ?? getFieldError('quantity')}
            label={t('Quantity', { defaultValue: 'Quantity' })}
          >
            <Input type="number" step="0.01" {...form.register('quantity', { valueAsNumber: true })} />
          </Field>
          <Field
            error={errors.unit_price?.message ?? getFieldError('unit_price')}
            label={t('Unit Price', { defaultValue: 'Unit Price' })}
          >
            <Input type="number" step="0.01" {...form.register('unit_price', { valueAsNumber: true })} />
          </Field>
          <Status
            error={errors.status?.message ?? getFieldError('status')}
            register={form.register('status')}
          />
          <Field
            error={errors.charge_date?.message ?? getFieldError('charge_date')}
            label={t('Charge Date', { defaultValue: 'Charge Date' })}
          >
            <Input type="date" {...form.register('charge_date')} />
          </Field>
          <Field
            error={errors.notes?.message ?? getFieldError('notes')}
            label={t('Notes')}
          >
            <Input {...form.register('notes')} />
          </Field>
        </>
      ) : null}

      {formError ? <div className="form-error">{formError}</div> : null}
      <FormActionsBar
        isSubmitting={isSubmitting}
        secondaryAction={secondaryAction}
        submitLabel={submitLabel}
      />
    </form>
  )
}

function defaults(kind: WarehouseFormKind, value?: any) {
  if (kind === 'warehouse') {
    return {
      name: value?.name ?? '',
      code: value?.code ?? '',
      address: value?.address ?? '',
      governorate_id: value?.governorate_id ?? 0,
      area_id: value?.area_id ?? null,
      status: value?.status ?? 'active',
      notes: value?.notes ?? '',
    }
  }

  if (kind === 'product') {
    return {
      merchant_id: value?.merchant_id ?? 0,
      name: value?.name ?? '',
      sku: value?.sku ?? '',
      barcode: value?.barcode ?? '',
      description: value?.description ?? '',
      unit_weight: Number(value?.unit_weight ?? 0),
      is_fragile: value?.is_fragile ?? false,
      requires_packaging: value?.requires_packaging ?? false,
      status: value?.status ?? 'active',
    }
  }

  if (kind === 'adjust') {
    return { warehouse_id: 0, warehouse_product_id: 0, type: 'in', quantity: 1, notes: '' }
  }

  if (kind === 'return') {
    return {
      shipment_id: 0,
      order_id: 0,
      warehouse_id: 0,
      warehouse_product_id: 0,
      quantity: 1,
      condition: 'sellable',
      notes: '',
    }
  }

  return {
    merchant_id: value?.merchant_id ?? 0,
    warehouse_id: value?.warehouse_id ?? 0,
    order_id: value?.order_id ?? null,
    shipment_id: value?.shipment_id ?? null,
    warehouse_product_id: value?.warehouse_product_id ?? null,
    type: value?.type ?? '',
    description: value?.description ?? '',
    quantity: Number(value?.quantity ?? 1),
    unit_price: Number(value?.unit_price ?? 0),
    status: value?.status ?? 'pending',
    charge_date: value?.charge_date?.slice(0, 10) ?? '',
    notes: value?.notes ?? '',
  }
}

function SearchField({
  error,
  label,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  value,
}: {
  error?: unknown
  label: string
  onChange: (value: string) => void
  options: Array<{ label: string; value: string; keywords?: string[] }>
  placeholder: string
  searchPlaceholder: string
  value?: number | string | null
}) {
  return (
    <Field error={error} label={label}>
      <SearchableSelect
        value={typeof value === 'number' && value > 0 ? String(value) : String(value ?? '')}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        options={options}
        onChange={onChange}
      />
    </Field>
  )
}

function Field({
  children,
  error,
  label,
}: {
  children: ReactNode
  error?: unknown
  label: string
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      <FieldError error={normalizeFieldError(error)} />
    </label>
  )
}

function Status({ error, register }: { error?: unknown; register: any }) {
  const { t } = useTranslation()

  return (
    <Field error={error} label={t('Status')}>
      <Select {...register}>
        <option value="active">active</option>
        <option value="inactive">inactive</option>
        <option value="pending">pending</option>
        <option value="completed">completed</option>
        <option value="cancelled">cancelled</option>
      </Select>
    </Field>
  )
}

function normalizeFieldError(error?: unknown) {
  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    return typeof message === 'string' ? message : null
  }

  return null
}

function clean<T extends Record<string, unknown>>(values: T) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      value === '' || Number.isNaN(value) || (value === 0 && key.endsWith('_id')) ? undefined : value,
    ]),
  ) as T
}
