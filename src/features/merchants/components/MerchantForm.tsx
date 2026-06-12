import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { FormActionsBar } from '../../../shared/components/forms/FormActionsBar'
import { Input } from '../../../shared/components/ui/Input'
import { SearchableSelect } from '../../../shared/components/ui/SearchableSelect'
import { Select } from '../../../shared/components/ui/Select'
import type { Merchant } from '../types/merchant.types'
import type { PricingPlan } from '../../location-pricing/types/location-pricing.types'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { useFormApiErrors } from '../../../shared/hooks/useFormApiErrors'

const merchantSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  company_name: z.string().min(1, 'Company name is required.'),
  phone: z.string().min(1, 'Phone is required.'),
  email: z.string().email('Enter a valid email.'),
  address: z.string().min(1, 'Address is required.'),
  status: z.string().min(1, 'Status is required.'),
  pricing_plan_id: z.number().nullable().optional(),
})

export type MerchantFormValues = z.infer<typeof merchantSchema>

type MerchantFormProps = {
  defaultValues?: Merchant
  error?: unknown
  isSubmitting?: boolean
  pricingPlans?: PricingPlan[]
  secondaryAction?: ReactNode
  submitLabel: string
  onSubmit: (values: MerchantFormValues) => void
}

export function MerchantForm({
  defaultValues,
  error,
  isSubmitting = false,
  pricingPlans = [],
  secondaryAction,
  onSubmit,
  submitLabel,
}: MerchantFormProps) {
  const { t } = useTranslation()
  const { formError, getFieldError } = useFormApiErrors(error)
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MerchantFormValues>({
    resolver: zodResolver(merchantSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      company_name: defaultValues?.company_name ?? '',
      phone: defaultValues?.phone ?? '',
      email: defaultValues?.email ?? '',
      address: defaultValues?.address ?? '',
      status: defaultValues?.status ?? 'active',
      pricing_plan_id: defaultValues?.pricing_plan_id ?? null,
    },
  })

  return (
    <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
      <label className="field">
        <span>{t('Name')}</span>
        <Input {...register('name')} />
        <FieldError error={errors.name?.message ?? getFieldError('name')} />
      </label>
      <label className="field">
        <span>{t('Company')}</span>
        <Input {...register('company_name')} />
        <FieldError error={errors.company_name?.message ?? getFieldError('company_name')} />
      </label>
      <label className="field">
        <span>{t('Phone')}</span>
        <Input {...register('phone')} />
        <FieldError error={errors.phone?.message ?? getFieldError('phone')} />
      </label>
      <label className="field">
        <span>{t('Email')}</span>
        <Input type="email" {...register('email')} />
        <FieldError error={errors.email?.message ?? getFieldError('email')} />
      </label>
      <label className="field">
        <span>{t('Address')}</span>
        <Input {...register('address')} />
        <FieldError error={errors.address?.message ?? getFieldError('address')} />
      </label>
      <label className="field">
        <span>{t('Status')}</span>
        <Select {...register('status')}>
          <option value="active">{t('active')}</option>
          <option value="inactive">{t('inactive')}</option>
        </Select>
        <FieldError error={errors.status?.message ?? getFieldError('status')} />
      </label>
      <label className="field">
        <span>{t('Pricing Plan')}</span>
        <Controller
          name="pricing_plan_id"
          control={control}
          render={({ field }) => (
            <SearchableSelect
              value={field.value ? String(field.value) : ''}
              placeholder={t('No pricing plan', { defaultValue: 'No pricing plan' })}
              searchPlaceholder={t('Search pricing plans...', { defaultValue: 'Search pricing plans...' })}
              onChange={(value) => field.onChange(value ? Number(value) : null)}
              options={[
                { label: t('No pricing plan', { defaultValue: 'No pricing plan' }), value: '' },
                ...pricingPlans.map((plan) => ({
                  label: plan.name,
                  value: String(plan.id),
                  keywords: [plan.code ?? '', plan.description ?? ''],
                })),
              ]}
            />
          )}
        />
        <FieldError error={errors.pricing_plan_id?.message ?? getFieldError('pricing_plan_id')} />
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
