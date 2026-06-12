import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { getApiErrorMessage, getApiValidationErrors } from '../../../shared/api/api-error'
import { FormActionsBar } from '../../../shared/components/forms/FormActionsBar'
import { Input } from '../../../shared/components/ui/Input'
import { SearchableSelect } from '../../../shared/components/ui/SearchableSelect'
import type { Area, Governorate } from '../types/location-pricing.types'

const areaSchema = z.object({
  governorate_id: z.number().min(1, 'Governorate is required.'),
  name: z.string().min(1, 'Name is required.'),
  is_active: z.boolean(),
})

export type AreaFormValues = z.infer<typeof areaSchema>

type AreaFormProps = {
  defaultValues?: Area
  error?: unknown
  governorates: Governorate[]
  isSubmitting?: boolean
  secondaryAction?: ReactNode
  submitLabel: string
  onSubmit: (values: AreaFormValues) => void
}

export function AreaForm({
  defaultValues,
  error,
  governorates,
  isSubmitting = false,
  secondaryAction,
  onSubmit,
  submitLabel,
}: AreaFormProps) {
  const { t } = useTranslation()
  const validationErrors = getApiValidationErrors(error)
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AreaFormValues>({
    resolver: zodResolver(areaSchema),
    defaultValues: {
      governorate_id: defaultValues?.governorate_id ?? 0,
      name: defaultValues?.name ?? '',
      is_active: defaultValues?.is_active ?? true,
    },
  })

  return (
    <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
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
        <span>{t('Name')}</span>
        <Input {...register('name')} />
        {errors.name?.message || validationErrors.name?.[0] ? (
          <small>{errors.name?.message ? t(errors.name.message) : validationErrors.name?.[0]}</small>
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
