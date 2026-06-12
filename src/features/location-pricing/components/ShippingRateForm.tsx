import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { getApiErrorMessage, getApiValidationErrors } from '../../../shared/api/api-error'
import { FormActionsBar } from '../../../shared/components/forms/FormActionsBar'
import { Input } from '../../../shared/components/ui/Input'
import { SearchableSelect } from '../../../shared/components/ui/SearchableSelect'
import type { Area, Governorate, ShippingRate } from '../types/location-pricing.types'

const shippingRateSchema = z.object({
  governorate_id: z.number().min(1, 'Governorate is required.'),
  area_id: z.number().or(z.nan()).nullable(),
  delivery_fee: z.number().min(0, 'Delivery fee must be zero or more.'),
  swap_fee: z.number().min(0, 'Swap fee must be zero or more.'),
  return_fee: z.number().min(0, 'Return fee must be zero or more.'),
  is_active: z.boolean(),
})

export type ShippingRateFormValues = z.infer<typeof shippingRateSchema>

type ShippingRateFormProps = {
  areas: Area[]
  defaultValues?: ShippingRate
  error?: unknown
  governorates: Governorate[]
  isSubmitting?: boolean
  secondaryAction?: ReactNode
  submitLabel: string
  onSubmit: (values: ShippingRateFormValues) => void
}

export function ShippingRateForm({
  areas,
  defaultValues,
  error,
  governorates,
  isSubmitting = false,
  secondaryAction,
  onSubmit,
  submitLabel,
}: ShippingRateFormProps) {
  const { t } = useTranslation()
  const validationErrors = getApiValidationErrors(error)
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingRateFormValues>({
    resolver: zodResolver(shippingRateSchema),
    defaultValues: {
      governorate_id: defaultValues?.governorate_id ?? 0,
      area_id: defaultValues?.area_id ?? null,
      delivery_fee: Number(defaultValues?.delivery_fee ?? 0),
      swap_fee: Number(defaultValues?.swap_fee ?? 0),
      return_fee: Number(defaultValues?.return_fee ?? 0),
      is_active: defaultValues?.is_active ?? true,
    },
  })
  const governorateId = useWatch({ control, name: 'governorate_id' })
  const filteredAreas = governorateId
    ? areas.filter((area) => area.governorate_id === governorateId)
    : areas

  function handleValidSubmit(values: ShippingRateFormValues) {
    onSubmit({
      ...values,
      area_id: Number.isFinite(values.area_id) && values.area_id ? values.area_id : null,
    })
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit(handleValidSubmit)}>
      <label className="field">
        <span>{t('Governorate')}</span>
        <Controller
          name="governorate_id"
          control={control}
          render={({ field }) => (
            <SearchableSelect
              value={field.value ? String(field.value) : ''}
              placeholder={t('Select governorate')}
              searchPlaceholder={t('Search governorates...', { defaultValue: 'Search governorates...' })}
              onChange={(value) => field.onChange(value ? Number(value) : 0)}
              options={[
                { label: t('Select governorate'), value: '' },
                ...governorates.map((governorate) => ({
                  label: governorate.name,
                  value: String(governorate.id),
                })),
              ]}
            />
          )}
        />
        {errors.governorate_id?.message || validationErrors.governorate_id?.[0] ? (
          <small>{errors.governorate_id?.message ? t(errors.governorate_id.message) : validationErrors.governorate_id?.[0]}</small>
        ) : null}
      </label>
      <label className="field">
        <span>{t('Area')}</span>
        <Controller
          name="area_id"
          control={control}
          render={({ field }) => (
            <SearchableSelect
              value={field.value ? String(field.value) : ''}
              placeholder={t('All governorate areas', { defaultValue: 'All governorate areas' })}
              searchPlaceholder={t('Search areas...', { defaultValue: 'Search areas...' })}
              onChange={(value) => field.onChange(value ? Number(value) : 0)}
              options={[
                { label: t('All governorate areas', { defaultValue: 'All governorate areas' }), value: '' },
                ...filteredAreas.map((area) => ({
                  label: area.name,
                  value: String(area.id),
                })),
              ]}
            />
          )}
        />
      </label>
      <label className="field">
        <span>{t('Delivery Fee')}</span>
        <Input type="number" step="0.01" {...register('delivery_fee', { valueAsNumber: true })} />
        {errors.delivery_fee?.message || validationErrors.delivery_fee?.[0] ? (
          <small>{errors.delivery_fee?.message ? t(errors.delivery_fee.message) : validationErrors.delivery_fee?.[0]}</small>
        ) : null}
      </label>
      <label className="field">
        <span>{t('Swap Fee')}</span>
        <Input type="number" step="0.01" {...register('swap_fee', { valueAsNumber: true })} />
        {errors.swap_fee?.message || validationErrors.swap_fee?.[0] ? (
          <small>{errors.swap_fee?.message ? t(errors.swap_fee.message) : validationErrors.swap_fee?.[0]}</small>
        ) : null}
      </label>
      <label className="field">
        <span>{t('Return Fee')}</span>
        <Input type="number" step="0.01" {...register('return_fee', { valueAsNumber: true })} />
        {errors.return_fee?.message || validationErrors.return_fee?.[0] ? (
          <small>{errors.return_fee?.message ? t(errors.return_fee.message) : validationErrors.return_fee?.[0]}</small>
        ) : null}
      </label>
      <label className="field field--inline">
        <input type="checkbox" {...register('is_active')} />
        <span>{t('Active')}</span>
      </label>
      {error ? <div className="form-error">{getApiErrorMessage(error)}</div> : null}
      <FormActionsBar
        isSubmitting={isSubmitting}
        secondaryAction={secondaryAction}
        submitLabel={submitLabel}
      />
    </form>
  )
}
