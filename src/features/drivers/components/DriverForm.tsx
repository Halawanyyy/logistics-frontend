import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { getApiErrorMessage, getApiValidationErrors } from '../../../shared/api/api-error'
import { Button } from '../../../shared/components/ui/Button'
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
  submitLabel: string
  onSubmit: (values: DriverFormValues) => void
}

export function DriverForm({
  defaultValues,
  error,
  isSubmitting = false,
  onSubmit,
  submitLabel,
}: DriverFormProps) {
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
      <div className="form-grid form-grid--two">
        <label className="field"><span>Name</span><Input {...register('name')} />{fieldError('name') ? <small>{fieldError('name')}</small> : null}</label>
        <label className="field"><span>Phone</span><Input {...register('phone')} />{fieldError('phone') ? <small>{fieldError('phone')}</small> : null}</label>
        <label className="field"><span>National ID</span><Input {...register('national_id')} />{fieldError('national_id') ? <small>{fieldError('national_id')}</small> : null}</label>
        <label className="field"><span>Vehicle Type</span><Input {...register('vehicle_type')} />{fieldError('vehicle_type') ? <small>{fieldError('vehicle_type')}</small> : null}</label>
        <label className="field"><span>Vehicle Plate</span><Input {...register('vehicle_plate')} />{fieldError('vehicle_plate') ? <small>{fieldError('vehicle_plate')}</small> : null}</label>
        <label className="field"><span>Status</span><Select {...register('status')}><option value="active">active</option><option value="inactive">inactive</option></Select></label>
      </div>
      <label className="field"><span>Notes</span><Input {...register('notes')} /></label>
      {error ? <div className="form-error">{getApiErrorMessage(error)}</div> : null}
      <div className="form-actions"><Button type="submit" loading={isSubmitting}>{submitLabel}</Button></div>
    </form>
  )
}
