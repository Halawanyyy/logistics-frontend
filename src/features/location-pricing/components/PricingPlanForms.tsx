import { zodResolver } from '@hookform/resolvers/zod'
import { Check, DollarSign, FileBadge, Loader2, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { getApiErrorMessage, getApiValidationErrors } from '../../../shared/api/api-error'
import { FormActionsBar } from '../../../shared/components/forms/FormActionsBar'
import { Input } from '../../../shared/components/ui/Input'
import { SearchableSelect } from '../../../shared/components/ui/SearchableSelect'
import { Select } from '../../../shared/components/ui/Select'
import { PlanFeaturesEditor } from './PlanFeaturesEditor'
import { PricingPlanPreview } from './PricingPlanPreview'
import type {
  Area,
  Governorate,
  PricingPlan,
  PricingPlanFeatureFormValue,
  PricingPlanRate,
} from '../types/location-pricing.types'

const pricingPlanSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  code: z.string().min(1, 'Code is required.'),
  description: z.string().max(1000, 'Description must not exceed 1000 characters.').optional().nullable(),
  monthly_orders_from: z.number().min(0, 'Must be 0 or greater').nullable().optional(),
  monthly_orders_to: z.number().min(0, 'Must be 0 or greater').nullable().optional(),
  monthly_price: z.number().min(0, 'Price must be 0 or greater').nullable().optional(),
  yearly_price: z.number().min(0, 'Price must be 0 or greater').nullable().optional(),
  currency: z.string().min(1, 'Currency is required.'),
  is_popular: z.boolean(),
  requires_contact: z.boolean(),
  display_order: z.number().min(0, 'Must be 0 or greater'),
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

function ToggleSwitch({
  checked,
  onChange,
  disabled,
  label,
  description,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label: string
  description?: string
}) {
  return (
    <div
      className={`pricing-plan-switch ${disabled ? 'pricing-plan-switch--disabled' : ''}`}
      onClick={() => !disabled && onChange(!checked)}
      role="switch"
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
          e.preventDefault()
          onChange(!checked)
        }
      }}
    >
      <div className={`pricing-plan-switch__track ${checked ? 'pricing-plan-switch__track--active' : ''}`}>
        <div className="pricing-plan-switch__thumb" />
      </div>
      <div className="pricing-plan-switch__copy">
        <span className="pricing-plan-switch__label">{label}</span>
        {description ? <span className="pricing-plan-switch__desc">{description}</span> : null}
      </div>
    </div>
  )
}

export function PricingPlanForm({
  defaultValues,
  error,
  isSubmitting,
  secondaryAction,
  submitLabel,
  onSubmit,
}: {
  defaultValues?: PricingPlan
  error?: unknown
  isSubmitting?: boolean
  secondaryAction?: ReactNode
  submitLabel: string
  onSubmit: (values: Record<string, unknown>) => void
}) {
  const { t } = useTranslation()
  const validationErrors = getApiValidationErrors(error)

  const [features, setFeatures] = useState<PricingPlanFeatureFormValue[]>(() => {
    if (defaultValues?.features && defaultValues.features.length > 0) {
      return defaultValues.features.map((f, i) => ({
        clientKey: f.id ? `feat-${f.id}` : `temp-${i}`,
        id: f.id,
        label: f.label,
        is_included: f.is_included,
        sort_order: f.sort_order ?? i,
      }))
    }
    return []
  })

  const [initialFeaturesSnapshot] = useState(() => JSON.stringify(features.map((f) => ({ l: f.label, inc: f.is_included }))))

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm<PricingPlanFormValues>({
    resolver: zodResolver(pricingPlanSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      code: defaultValues?.code ?? '',
      description: defaultValues?.description ?? '',
      monthly_orders_from: defaultValues?.monthly_orders_from ?? null,
      monthly_orders_to: defaultValues?.monthly_orders_to ?? null,
      monthly_price: defaultValues?.monthly_price !== null && defaultValues?.monthly_price !== undefined ? Number(defaultValues.monthly_price) : null,
      yearly_price: defaultValues?.yearly_price !== null && defaultValues?.yearly_price !== undefined ? Number(defaultValues.yearly_price) : null,
      currency: defaultValues?.currency ?? 'EGP',
      is_popular: defaultValues?.is_popular ?? false,
      requires_contact: defaultValues?.requires_contact ?? defaultValues?.is_custom_pricing ?? false,
      display_order: defaultValues?.display_order ?? defaultValues?.sort_order ?? 0,
      status: defaultValues?.status ?? 'active',
    },
  })

  // Live watch values for instant Live Preview updates
  const watchName = useWatch({ control, name: 'name' })
  const watchDescription = useWatch({ control, name: 'description' })
  const watchMonthlyPrice = useWatch({ control, name: 'monthly_price' })
  const watchYearlyPrice = useWatch({ control, name: 'yearly_price' })
  const watchCurrency = useWatch({ control, name: 'currency' })
  const watchMonthlyOrdersFrom = useWatch({ control, name: 'monthly_orders_from' })
  const watchMonthlyOrdersTo = useWatch({ control, name: 'monthly_orders_to' })
  const watchRequiresContact = useWatch({ control, name: 'requires_contact' })
  const watchIsPopular = useWatch({ control, name: 'is_popular' })

  // Dirty detection across form fields + features list
  const currentFeaturesSnapshot = JSON.stringify(features.map((f) => ({ l: f.label, inc: f.is_included })))
  const isFormDirty = isDirty || currentFeaturesSnapshot !== initialFeaturesSnapshot

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isFormDirty])

  function fieldError(name: keyof PricingPlanFormValues) {
    const errorMsg = errors[name]?.message ?? validationErrors[name]?.[0]
    return errorMsg ? t(errorMsg) : undefined
  }

  function handleFormSubmit(values: PricingPlanFormValues) {
    onSubmit({
      ...values,
      is_custom_pricing: values.requires_contact,
      features: features.map((f, i) => ({
        id: f.id,
        label: f.label.trim(),
        is_included: f.is_included,
        sort_order: f.sort_order ?? i,
      })),
    })
  }

  return (
    <form className="pricing-plan-editor" onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="pricing-plan-editor__layout">
        {/* Main Form Column (approx 68%) */}
        <div className="pricing-plan-editor__cards">
          {/* Section 1: Basic Information */}
          <section className="pricing-plan-editor__card" aria-labelledby="basic-info-heading">
            <div className="pricing-plan-editor__card-header">
              <div className="pricing-plan-editor__icon-box" aria-hidden="true">
                <FileBadge size={18} />
              </div>
              <div>
                <h3 id="basic-info-heading" className="pricing-plan-editor__card-title">
                  {t('Basic Information', { defaultValue: 'Basic Information' })}
                </h3>
              </div>
            </div>

            <div className="pricing-plan-editor__grid pricing-plan-editor__grid--3">
              <label className="pricing-plan-editor__field">
                <span className="pricing-plan-editor__field-label">{t('Name')}</span>
                <Input
                  {...register('name')}
                  placeholder={t('e.g. Starter', { defaultValue: 'e.g. Starter' })}
                  disabled={isSubmitting}
                />
                {fieldError('name') ? (
                  <small className="pricing-plan-editor__field-error">{fieldError('name')}</small>
                ) : null}
              </label>

              <label className="pricing-plan-editor__field">
                <span className="pricing-plan-editor__field-label">{t('Code')}</span>
                <Input
                  {...register('code')}
                  placeholder={t('e.g. starter', { defaultValue: 'e.g. starter' })}
                  disabled={isSubmitting}
                />
                <small className="pricing-plan-editor__field-helper">
                  {t('A short code to identify this plan (e.g. basic, pro).', {
                    defaultValue: 'A short code to identify this plan (e.g. basic, pro).',
                  })}
                </small>
                {fieldError('code') ? (
                  <small className="pricing-plan-editor__field-error">{fieldError('code')}</small>
                ) : null}
              </label>

              <label className="pricing-plan-editor__field">
                <span className="pricing-plan-editor__field-label">{t('Status')}</span>
                <Select disabled={isSubmitting} {...register('status')}>
                  <option value="active">{t('Active', { defaultValue: 'Active' })}</option>
                  <option value="inactive">{t('Inactive', { defaultValue: 'Inactive' })}</option>
                </Select>
                {fieldError('status') ? (
                  <small className="pricing-plan-editor__field-error">{fieldError('status')}</small>
                ) : null}
              </label>
            </div>

            <label className="pricing-plan-editor__field pricing-plan-editor__field--full">
              <span className="pricing-plan-editor__field-label">
                {t('Plan Description', { defaultValue: 'Plan Description' })}
              </span>
              <textarea
                className={`pricing-plan-editor__textarea ${
                  fieldError('description') ? 'pricing-plan-editor__textarea--error' : ''
                }`}
                placeholder={t('Describe who this plan is designed for...', {
                  defaultValue: 'Describe who this plan is designed for...',
                })}
                maxLength={1000}
                rows={3}
                disabled={isSubmitting}
                {...register('description')}
              />
              <small className="pricing-plan-editor__field-helper">
                {t('This will be shown on the merchant pricing card.', {
                  defaultValue: 'This will be shown on the merchant pricing card.',
                })}
              </small>
              {fieldError('description') ? (
                <small className="pricing-plan-editor__field-error">{fieldError('description')}</small>
              ) : null}
            </label>
          </section>

          {/* Section 2: Pricing & Order Limits */}
          <section className="pricing-plan-editor__card" aria-labelledby="pricing-limits-heading">
            <div className="pricing-plan-editor__card-header">
              <div className="pricing-plan-editor__icon-box" aria-hidden="true">
                <DollarSign size={18} />
              </div>
              <div>
                <h3 id="pricing-limits-heading" className="pricing-plan-editor__card-title">
                  {t('Pricing & Order Limits', { defaultValue: 'Pricing & Order Limits' })}
                </h3>
              </div>
            </div>

            <div className="pricing-plan-editor__grid pricing-plan-editor__grid--3">
              <label className="pricing-plan-editor__field">
                <span className="pricing-plan-editor__field-label">
                  {t('Monthly Price', { defaultValue: 'Monthly Price' })}
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  disabled={isSubmitting}
                  placeholder="0.00"
                  {...register('monthly_price', {
                    setValueAs: (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
                  })}
                />
                {fieldError('monthly_price') ? (
                  <small className="pricing-plan-editor__field-error">{fieldError('monthly_price')}</small>
                ) : null}
              </label>

              <label className="pricing-plan-editor__field">
                <span className="pricing-plan-editor__field-label">
                  {t('Yearly Price', { defaultValue: 'Yearly Price' })}
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  disabled={isSubmitting}
                  placeholder="0.00"
                  {...register('yearly_price', {
                    setValueAs: (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
                  })}
                />
                {fieldError('yearly_price') ? (
                  <small className="pricing-plan-editor__field-error">{fieldError('yearly_price')}</small>
                ) : null}
              </label>

              <label className="pricing-plan-editor__field">
                <span className="pricing-plan-editor__field-label">
                  {t('Currency', { defaultValue: 'Currency' })}
                </span>
                <Input maxLength={3} disabled={isSubmitting} placeholder="EGP" {...register('currency')} />
                {fieldError('currency') ? (
                  <small className="pricing-plan-editor__field-error">{fieldError('currency')}</small>
                ) : null}
              </label>

              <label className="pricing-plan-editor__field">
                <span className="pricing-plan-editor__field-label">
                  {t('Monthly Orders From', { defaultValue: 'Monthly Orders From' })}
                </span>
                <Input
                  type="number"
                  min={0}
                  disabled={isSubmitting}
                  placeholder="0"
                  {...register('monthly_orders_from', {
                    setValueAs: (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
                  })}
                />
                {fieldError('monthly_orders_from') ? (
                  <small className="pricing-plan-editor__field-error">{fieldError('monthly_orders_from')}</small>
                ) : null}
              </label>

              <label className="pricing-plan-editor__field">
                <span className="pricing-plan-editor__field-label">
                  {t('Monthly Orders To', { defaultValue: 'Monthly Orders To' })}
                </span>
                <Input
                  type="number"
                  min={0}
                  disabled={isSubmitting}
                  placeholder="0"
                  {...register('monthly_orders_to', {
                    setValueAs: (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
                  })}
                />
                {fieldError('monthly_orders_to') ? (
                  <small className="pricing-plan-editor__field-error">{fieldError('monthly_orders_to')}</small>
                ) : null}
              </label>

              <label className="pricing-plan-editor__field">
                <span className="pricing-plan-editor__field-label">
                  {t('Display Order', { defaultValue: 'Display Order' })}
                </span>
                <Input
                  type="number"
                  min={0}
                  disabled={isSubmitting}
                  placeholder="0"
                  {...register('display_order', {
                    setValueAs: (v) => (v === '' || v === null || v === undefined ? 0 : Number(v)),
                  })}
                />
                {fieldError('display_order') ? (
                  <small className="pricing-plan-editor__field-error">{fieldError('display_order')}</small>
                ) : null}
              </label>
            </div>
          </section>

          {/* Section 3: Plan Settings */}
          <section className="pricing-plan-editor__card" aria-labelledby="plan-settings-heading">
            <div className="pricing-plan-editor__card-header">
              <div className="pricing-plan-editor__icon-box" aria-hidden="true">
                <Settings size={18} />
              </div>
              <div>
                <h3 id="plan-settings-heading" className="pricing-plan-editor__card-title">
                  {t('Plan Settings', { defaultValue: 'Plan Settings' })}
                </h3>
              </div>
            </div>

            <div className="pricing-plan-editor__switches-row">
              <ToggleSwitch
                checked={Boolean(watchRequiresContact)}
                onChange={(val) => setValue('requires_contact', val, { shouldDirty: true })}
                disabled={isSubmitting}
                label={t('Custom Pricing / Requires Contact', {
                  defaultValue: 'Custom Pricing / Requires Contact',
                })}
                description={t('Show Contact Us instead of Subscribe.', {
                  defaultValue: 'Show Contact Us instead of Subscribe.',
                })}
              />

              <ToggleSwitch
                checked={Boolean(watchIsPopular)}
                onChange={(val) => setValue('is_popular', val, { shouldDirty: true })}
                disabled={isSubmitting}
                label={t('Popular Plan Badge', { defaultValue: 'Popular Plan Badge' })}
                description={t('Highlight this plan in the merchant portal.', {
                  defaultValue: 'Highlight this plan in the merchant portal.',
                })}
              />
            </div>
          </section>

          {/* Section 4: Plan Features */}
          <section className="pricing-plan-editor__card" aria-label={t('Plan Features')}>
            <PlanFeaturesEditor
              value={features}
              onChange={setFeatures}
              errors={validationErrors}
              disabled={isSubmitting}
            />
          </section>
        </div>

        {/* Live Preview Column (approx 32%) */}
        <div className="pricing-plan-editor__preview-col">
          <PricingPlanPreview
            name={watchName}
            description={watchDescription}
            monthlyPrice={watchMonthlyPrice}
            yearlyPrice={watchYearlyPrice}
            currency={watchCurrency}
            monthlyOrdersFrom={watchMonthlyOrdersFrom}
            monthlyOrdersTo={watchMonthlyOrdersTo}
            requiresContact={Boolean(watchRequiresContact)}
            isPopular={Boolean(watchIsPopular)}
            features={features}
          />
        </div>
      </div>

      {error ? <div className="pricing-plan-editor__error-banner">{getApiErrorMessage(error)}</div> : null}

      {/* Action Footer */}
      <footer className="pricing-plan-editor__footer">
        <div className="pricing-plan-editor__dirty-indicator">
          {isFormDirty ? (
            <span className="pricing-plan-editor__dirty-badge">
              {t('Unsaved changes', { defaultValue: 'Unsaved changes' })}
            </span>
          ) : (
            <span className="pricing-plan-editor__saved-badge">
              {t('All changes saved', { defaultValue: 'All changes saved' })}
            </span>
          )}
        </div>

        <div className="pricing-plan-editor__actions">
          {secondaryAction}
          <button
            type="submit"
            className="pricing-plan-editor__save-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                <span>{t('Saving...', { defaultValue: 'Saving...' })}</span>
              </>
            ) : (
              <>
                <Check size={16} strokeWidth={2.5} aria-hidden="true" />
                <span>{submitLabel}</span>
              </>
            )}
          </button>
        </div>
      </footer>
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
  secondaryAction,
  submitLabel,
  onSubmit,
}: {
  areas: Area[]
  defaultValues?: PricingPlanRate
  error?: unknown
  governorates: Governorate[]
  isSubmitting?: boolean
  pricingPlans: PricingPlan[]
  secondaryAction?: ReactNode
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
    const errorMsg = errors[name]?.message ?? validationErrors[name]?.[0]
    return errorMsg ? t(errorMsg) : undefined
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
      <FormActionsBar
        isSubmitting={isSubmitting}
        secondaryAction={secondaryAction}
        submitLabel={submitLabel}
      />
    </form>
  )
}
