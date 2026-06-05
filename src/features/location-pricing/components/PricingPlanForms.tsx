import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { getApiErrorMessage, getApiValidationErrors } from '../../../shared/api/api-error'
import { Button } from '../../../shared/components/ui/Button'
import { Input } from '../../../shared/components/ui/Input'
import { SearchableSelect } from '../../../shared/components/ui/SearchableSelect'
import { Select } from '../../../shared/components/ui/Select'
import type {
  Area,
  Governorate,
  PricingPlan,
  PricingPlanRate,
} from '../types/location-pricing.types'

const pricingPlanSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  code: z.string().min(1, 'Code is required.'),
  description: z.string().optional(),
  monthly_orders_from: z.number().nullable().optional(),
  monthly_orders_to: z.number().nullable().optional(),
  status: z.string().min(1, 'Status is required.'),
})

const pricingPlanRateSchema = z.object({
  pricing_plan_id: z.number().min(1, 'Pricing plan is required.'),
  governorate_id: z.number().min(1, 'Governorate is required.'),
  area_id: z.number().nullable().optional(),
  delivery_fee: z.number().min(0, 'Delivery fee must be zero or more.'),
  swap_fee: z.number().min(0, 'Swap fee must be zero or more.'),
  return_fee: z.number().min(0, 'Return fee must be zero or more.'),
  is_active: z.boolean(),
})

export type PricingPlanFormValues = z.infer<typeof pricingPlanSchema>
export type PricingPlanRateFormValues = z.infer<typeof pricingPlanRateSchema>

export function PricingPlanForm({
  defaultValues,
  error,
  isSubmitting,
  submitLabel,
  onSubmit,
}: {
  defaultValues?: PricingPlan
  error?: unknown
  isSubmitting?: boolean
  submitLabel: string
  onSubmit: (values: PricingPlanFormValues) => void
}) {
  const { t } = useTranslation()
  const validationErrors = getApiValidationErrors(error)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PricingPlanFormValues>({
    resolver: zodResolver(pricingPlanSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      code: defaultValues?.code ?? '',
      description: defaultValues?.description ?? '',
      monthly_orders_from: defaultValues?.monthly_orders_from ?? null,
      monthly_orders_to: defaultValues?.monthly_orders_to ?? null,
      status: defaultValues?.status ?? 'active',
    },
  })

  function fieldError(name: keyof PricingPlanFormValues) {
    return errors[name]?.message ?? validationErrors[name]?.[0]
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
      <label className="field">
        <span>{t('Name')}</span>
        <Input {...register('name')} />
        {fieldError('name') ? <small>{fieldError('name')}</small> : null}
      </label>
      <label className="field">
        <span>{t('Code')}</span>
        <Input {...register('code')} />
        {fieldError('code') ? <small>{fieldError('code')}</small> : null}
      </label>
      <label className="field">
        <span>{t('Description')}</span>
        <Input {...register('description')} />
      </label>
      <label className="field">
        <span>{t('Monthly Orders From')}</span>
        <Input type="number" {...register('monthly_orders_from', { setValueAs: (value) => (value === '' ? null : Number(value)) })} />
      </label>
      <label className="field">
        <span>{t('Monthly Orders To')}</span>
        <Input type="number" {...register('monthly_orders_to', { setValueAs: (value) => (value === '' ? null : Number(value)) })} />
      </label>
      <label className="field">
        <span>{t('Status')}</span>
        <Select {...register('status')}>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </Select>
      </label>
      {error ? <div className="form-error">{getApiErrorMessage(error)}</div> : null}
      <div className="form-actions">
        <Button type="submit" loading={isSubmitting}>
          {t(submitLabel, { defaultValue: submitLabel })}
        </Button>
      </div>
    </form>
  )
}

export function PricingPlanRateForm({
  areas,
  defaultValues,
  error,
  governorates,
  isSubmitting,
  pricingPlans,
  submitLabel,
  onSubmit,
}: {
  areas: Area[]
  defaultValues?: PricingPlanRate
  error?: unknown
  governorates: Governorate[]
  isSubmitting?: boolean
  pricingPlans: PricingPlan[]
  submitLabel: string
  onSubmit: (values: PricingPlanRateFormValues) => void
}) {
  const { t } = useTranslation()
  const validationErrors = getApiValidationErrors(error)
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PricingPlanRateFormValues>({
    resolver: zodResolver(pricingPlanRateSchema),
    defaultValues: {
      pricing_plan_id: defaultValues?.pricing_plan_id ?? 0,
      governorate_id: defaultValues?.governorate_id ?? 0,
      area_id: defaultValues?.area_id ?? null,
      delivery_fee: Number(defaultValues?.delivery_fee ?? 0),
      swap_fee: Number(defaultValues?.swap_fee ?? 0),
      return_fee: Number(defaultValues?.return_fee ?? 0),
      is_active: defaultValues?.is_active ?? true,
    },
  })
  const governorateId = useWatch({ control, name: 'governorate_id' })
  const filteredAreas = governorateId ? areas.filter((area) => area.governorate_id === governorateId) : areas

  function fieldError(name: keyof PricingPlanRateFormValues) {
    return errors[name]?.message ?? validationErrors[name]?.[0]
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
      <label className="field">
        <span>{t('Pricing Plan')}</span>
        <Controller
          name="pricing_plan_id"
          control={control}
          render={({ field }) => (
            <SearchableSelect
              value={field.value ? String(field.value) : ''}
              placeholder={t('Select pricing plan', { defaultValue: 'Select pricing plan' })}
              searchPlaceholder={t('Search pricing plans...', { defaultValue: 'Search pricing plans...' })}
              onChange={(value) => field.onChange(value ? Number(value) : 0)}
              options={[
                { label: t('Select pricing plan', { defaultValue: 'Select pricing plan' }), value: '' },
                ...pricingPlans.map((plan) => ({
                  label: plan.name,
                  value: String(plan.id),
                  keywords: [plan.code, plan.description ?? ''],
                })),
              ]}
            />
          )}
        />
        {fieldError('pricing_plan_id') ? <small>{fieldError('pricing_plan_id')}</small> : null}
      </label>
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
        {fieldError('governorate_id') ? <small>{fieldError('governorate_id')}</small> : null}
      </label>
      <label className="field">
        <span>{t('Area')}</span>
        <Controller
          name="area_id"
          control={control}
          render={({ field }) => (
            <SearchableSelect
              value={field.value ? String(field.value) : ''}
              placeholder={t('Governorate default', { defaultValue: 'Governorate default' })}
              searchPlaceholder={t('Search areas...', { defaultValue: 'Search areas...' })}
              onChange={(value) => field.onChange(value ? Number(value) : null)}
              options={[
                { label: t('Governorate default', { defaultValue: 'Governorate default' }), value: '' },
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
        {fieldError('delivery_fee') ? <small>{fieldError('delivery_fee')}</small> : null}
      </label>
      <label className="field">
        <span>{t('Swap Fee')}</span>
        <Input type="number" step="0.01" {...register('swap_fee', { valueAsNumber: true })} />
        {fieldError('swap_fee') ? <small>{fieldError('swap_fee')}</small> : null}
      </label>
      <label className="field">
        <span>{t('Return Fee')}</span>
        <Input type="number" step="0.01" {...register('return_fee', { valueAsNumber: true })} />
        {fieldError('return_fee') ? <small>{fieldError('return_fee')}</small> : null}
      </label>
      <label className="field field--inline">
        <input type="checkbox" {...register('is_active')} />
        <span>{t('Active')}</span>
      </label>
      {error ? <div className="form-error">{getApiErrorMessage(error)}</div> : null}
      <div className="form-actions">
        <Button type="submit" loading={isSubmitting}>
          {t(submitLabel, { defaultValue: submitLabel })}
        </Button>
      </div>
    </form>
  )
}
