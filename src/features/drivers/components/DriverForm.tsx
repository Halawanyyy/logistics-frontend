import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { getApiErrorMessage, getApiValidationErrors } from '../../../shared/api/api-error'
import { FormActionsBar } from '../../../shared/components/forms/FormActionsBar'
import { Input } from '../../../shared/components/ui/Input'
import { Select } from '../../../shared/components/ui/Select'
import type { Driver } from '../types/driver.types'

const driverSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  phone: z.string().min(1, 'Phone is required.'),
  national_id: z.string().min(1, 'National ID is required.'),
  vehicle_type: z.string().min(1, 'Vehicle type is required.'),
  vehicle_plate: z.string().min(1, 'Vehicle plate is required.'),
  status: z.string().min(1, 'Status is required.'),
  notes: z.string().optional(),
})

export type DriverFormValues = z.infer<typeof driverSchema>

type DriverFormProps = {
  defaultValues?: Driver
  error?: unknown
  isSubmitting?: boolean
  secondaryAction?: ReactNode
  submitLabel: string
  onSubmit: (values: DriverFormValues) => void
}

export function DriverForm({
  defaultValues,
  error,
  isSubmitting = false,
  secondaryAction,
  onSubmit,
  submitLabel,
}: DriverFormProps) {
  const { t } = useTranslation()
  const validationErrors = getApiValidationErrors(error)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      phone: defaultValues?.phone ?? '',
      national_id: defaultValues?.national_id ?? '',
      vehicle_type: defaultValues?.vehicle_type ?? '',
      vehicle_plate: defaultValues?.vehicle_plate ?? '',
      status: defaultValues?.status ?? 'active',
      notes: defaultValues?.notes ?? '',
    },
  })

  function fieldError(name: keyof DriverFormValues) {
    return errors[name]?.message ?? validationErrors[name]?.[0]
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit((values) => onSubmit({ ...values, notes: values.notes || undefined }))}>
      <label className="field"><span>{t('Name')}</span><Input {...register('name')} />{fieldError('name') ? <small>{fieldError('name')}</small> : null}</label>
      <label className="field"><span>{t('Phone')}</span><Input {...register('phone')} />{fieldError('phone') ? <small>{fieldError('phone')}</small> : null}</label>
      <label className="field"><span>{t('National ID', { defaultValue: 'National ID' })}</span><Input {...register('national_id')} />{fieldError('national_id') ? <small>{fieldError('national_id')}</small> : null}</label>
      <label className="field"><span>{t('Vehicle Type', { defaultValue: 'Vehicle Type' })}</span><Input {...register('vehicle_type')} />{fieldError('vehicle_type') ? <small>{fieldError('vehicle_type')}</small> : null}</label>
      <label className="field"><span>{t('Vehicle Plate', { defaultValue: 'Vehicle Plate' })}</span><Input {...register('vehicle_plate')} />{fieldError('vehicle_plate') ? <small>{fieldError('vehicle_plate')}</small> : null}</label>
      <label className="field"><span>{t('Status')}</span><Select {...register('status')}><option value="active">{t('active', { defaultValue: 'active' })}</option><option value="inactive">{t('inactive', { defaultValue: 'inactive' })}</option></Select></label>
      <label className="field"><span>{t('Notes')}</span><Input {...register('notes')} /></label>
      {error ? <div className="form-error">{getApiErrorMessage(error)}</div> : null}
      <FormActionsBar
        isSubmitting={isSubmitting}
        secondaryAction={secondaryAction}
        submitLabel={submitLabel}
      />
    </form>
  )
}
