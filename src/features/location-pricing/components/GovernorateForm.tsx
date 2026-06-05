import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { getApiErrorMessage, getApiValidationErrors } from '../../../shared/api/api-error'
import { Button } from '../../../shared/components/ui/Button'
import { Input } from '../../../shared/components/ui/Input'
import type { Governorate } from '../types/location-pricing.types'

const governorateSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  is_active: z.boolean(),
})

export type GovernorateFormValues = z.infer<typeof governorateSchema>

type GovernorateFormProps = {
  defaultValues?: Governorate
  error?: unknown
  isSubmitting?: boolean
  submitLabel: string
  onSubmit: (values: GovernorateFormValues) => void
}

export function GovernorateForm({
  defaultValues,
  error,
  isSubmitting = false,
  onSubmit,
  submitLabel,
}: GovernorateFormProps) {
  const { t } = useTranslation()
  const validationErrors = getApiValidationErrors(error)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GovernorateFormValues>({
    resolver: zodResolver(governorateSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      is_active: defaultValues?.is_active ?? true,
    },
  })

  return (
    <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
      <label className="field">
        <span>{t('Name')}</span>
        <Input {...register('name')} />
        {errors.name?.message || validationErrors.name?.[0] ? (
          <small>{errors.name?.message ?? validationErrors.name?.[0]}</small>
        ) : null}
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
