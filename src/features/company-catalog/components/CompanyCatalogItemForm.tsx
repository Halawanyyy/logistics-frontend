import { zodResolver } from '@hookform/resolvers/zod'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { FormActionsBar } from '../../../shared/components/forms/FormActionsBar'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { Input } from '../../../shared/components/ui/Input'
import { Select } from '../../../shared/components/ui/Select'
import { useFormApiErrors } from '../../../shared/hooks/useFormApiErrors'
import type {
  CompanyCatalogItem,
  CreateCompanyCatalogItemRequest,
} from '../types/companyCatalog.types'

const companyCatalogSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  sku: z.string().optional(),
  type: z.enum(['packaging_product', 'storage_service', 'fulfillment_service', 'other_service']),
  category: z.string().optional(),
  unit_price: z.number().min(0, 'Unit price must be zero or more.'),
  currency: z.string().min(1, 'Currency is required.'),
  size_label: z.string().optional(),
  length: z.number().or(z.nan()).optional(),
  width: z.number().or(z.nan()).optional(),
  unit: z.string().optional(),
  sort_order: z.number().int().min(0, 'Sort order must be zero or more.'),
  status: z.enum(['active', 'inactive']),
  is_visible_to_merchants: z.boolean(),
  description: z.string().optional(),
})

export type CompanyCatalogItemFormValues = z.infer<typeof companyCatalogSchema>

type CompanyCatalogItemFormProps = {
  defaultValues?: CompanyCatalogItem
  error?: unknown
  isSubmitting?: boolean
  secondaryAction?: ReactNode
  submitLabel: string
  onSubmit: (values: CreateCompanyCatalogItemRequest) => void
}

function optionalNumber(value: number | undefined) {
  return Number.isFinite(value) ? value : undefined
}

export function CompanyCatalogItemForm({
  defaultValues,
  error,
  isSubmitting = false,
  secondaryAction,
  submitLabel,
  onSubmit,
}: CompanyCatalogItemFormProps) {
  const { t } = useTranslation()
  const { formError, getFieldError } = useFormApiErrors(error)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyCatalogItemFormValues>({
    resolver: zodResolver(companyCatalogSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      sku: defaultValues?.sku ?? '',
      type: defaultValues?.type ?? 'packaging_product',
      category: defaultValues?.category ?? '',
      unit_price: Number(defaultValues?.unit_price ?? 0),
      currency: defaultValues?.currency ?? 'EGP',
      size_label: defaultValues?.size_label ?? '',
      length: defaultValues?.length != null ? Number(defaultValues.length) : undefined,
      width: defaultValues?.width != null ? Number(defaultValues.width) : undefined,
      unit: defaultValues?.unit ?? '',
      sort_order: defaultValues?.sort_order ?? 0,
      status: (defaultValues?.status ?? 'active') as 'active' | 'inactive',
      is_visible_to_merchants: defaultValues?.is_visible_to_merchants ?? true,
      description: defaultValues?.description ?? '',
    },
  })

  function handleValidSubmit(values: CompanyCatalogItemFormValues) {
    onSubmit({
      ...values,
      category: values.category || undefined,
      currency: values.currency || undefined,
      description: values.description || undefined,
      length: optionalNumber(values.length),
      size_label: values.size_label || undefined,
      sku: values.sku || undefined,
      unit: values.unit || undefined,
      width: optionalNumber(values.width),
    })
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit(handleValidSubmit)}>
      <label className="field">
        <span>{t('Name')}</span>
        <Input {...register('name')} />
        <FieldError error={errors.name?.message ?? getFieldError('name')} />
      </label>
      <label className="field">
        <span>{t('SKU', { defaultValue: 'SKU' })}</span>
        <Input {...register('sku')} />
        <FieldError error={errors.sku?.message ?? getFieldError('sku')} />
      </label>
      <label className="field">
        <span>{t('Type')}</span>
        <Select {...register('type')}>
          <option value="packaging_product">{t('Packaging Products', { defaultValue: 'Packaging Products' })}</option>
          <option value="storage_service">{t('Storage Services', { defaultValue: 'Storage Services' })}</option>
          <option value="fulfillment_service">{t('Fulfillment Services', { defaultValue: 'Fulfillment Services' })}</option>
          <option value="other_service">{t('Other Services', { defaultValue: 'Other Services' })}</option>
        </Select>
        <FieldError error={errors.type?.message ?? getFieldError('type')} />
      </label>
      <label className="field">
        <span>{t('Category', { defaultValue: 'Category' })}</span>
        <Input {...register('category')} />
        <FieldError error={errors.category?.message ?? getFieldError('category')} />
      </label>
      <label className="field">
        <span>{t('Unit Price', { defaultValue: 'Unit Price' })}</span>
        <Input type="number" step="0.01" {...register('unit_price', { valueAsNumber: true })} />
        <FieldError error={errors.unit_price?.message ?? getFieldError('unit_price')} />
      </label>
      <label className="field">
        <span>{t('Currency', { defaultValue: 'Currency' })}</span>
        <Input {...register('currency')} />
        <FieldError error={errors.currency?.message ?? getFieldError('currency')} />
      </label>
      <label className="field">
        <span>{t('Size Label', { defaultValue: 'Size Label' })}</span>
        <Input {...register('size_label')} />
        <FieldError error={errors.size_label?.message ?? getFieldError('size_label')} />
      </label>
      <label className="field">
        <span>{t('Length', { defaultValue: 'Length' })}</span>
        <Input type="number" step="0.01" {...register('length', { valueAsNumber: true })} />
        <FieldError error={errors.length?.message ?? getFieldError('length')} />
      </label>
      <label className="field">
        <span>{t('Width', { defaultValue: 'Width' })}</span>
        <Input type="number" step="0.01" {...register('width', { valueAsNumber: true })} />
        <FieldError error={errors.width?.message ?? getFieldError('width')} />
      </label>
      <label className="field">
        <span>{t('Unit', { defaultValue: 'Unit' })}</span>
        <Input {...register('unit')} />
        <FieldError error={errors.unit?.message ?? getFieldError('unit')} />
      </label>
      <label className="field">
        <span>{t('Sort Order', { defaultValue: 'Sort Order' })}</span>
        <Input type="number" {...register('sort_order', { valueAsNumber: true })} />
        <FieldError error={errors.sort_order?.message ?? getFieldError('sort_order')} />
      </label>
      <label className="field">
        <span>{t('Status')}</span>
        <Select {...register('status')}>
          <option value="active">{t('active', { defaultValue: 'active' })}</option>
          <option value="inactive">{t('inactive', { defaultValue: 'inactive' })}</option>
        </Select>
        <FieldError error={errors.status?.message ?? getFieldError('status')} />
      </label>
      <label className="field field--full">
        <span>{t('Description')}</span>
        <Input {...register('description')} />
        <FieldError error={errors.description?.message ?? getFieldError('description')} />
      </label>
      <label className="field field--inline field--full">
        <input type="checkbox" {...register('is_visible_to_merchants')} />
        <span>{t('Merchant Visible', { defaultValue: 'Merchant Visible' })}</span>
      </label>

      {formError ? <div className="form-error">{formError}</div> : null}

      <FormActionsBar
        isSubmitting={isSubmitting}
        secondaryAction={secondaryAction}
        submitLabel={submitLabel}
      />
    </form>
  )
}
