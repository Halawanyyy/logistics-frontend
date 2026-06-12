import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { FormActionsBar } from '../../../shared/components/forms/FormActionsBar'
import { Input } from '../../../shared/components/ui/Input'
import { SearchableSelect } from '../../../shared/components/ui/SearchableSelect'
import type { User } from '../types/user.types'
import type { Role } from '../../roles/types/role.types'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { useFormApiErrors } from '../../../shared/hooks/useFormApiErrors'

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Enter a valid email.'),
  password: z.string().min(1, 'Password is required.'),
  role: z.string().optional(),
  role_id: z.number().nullable().optional(),
})

const editUserSchema = createUserSchema.extend({
  password: z.string().optional(),
})

export type UserFormValues = z.infer<typeof editUserSchema>

type UserFormProps = {
  defaultValues?: User
  error?: unknown
  isEdit?: boolean
  isSubmitting?: boolean
  roles?: Role[]
  secondaryAction?: ReactNode
  submitLabel: string
  onSubmit: (values: UserFormValues) => void
}

export function UserForm({
  defaultValues,
  error,
  isEdit = false,
  isSubmitting = false,
  roles = [],
  secondaryAction,
  onSubmit,
  submitLabel,
}: UserFormProps) {
  const { t } = useTranslation()
  const { formError, getFieldError } = useFormApiErrors(error)
  const schema = isEdit ? editUserSchema : createUserSchema
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      email: defaultValues?.email ?? '',
      password: '',
      role: defaultValues?.role ?? '',
      role_id: defaultValues?.role_id ?? null,
    },
  })

  function handleValidSubmit(values: UserFormValues) {
    onSubmit({
      ...values,
      password: values.password || undefined,
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
        <span>{t('Email')}</span>
        <Input type="email" {...register('email')} />
        <FieldError error={errors.email?.message ?? getFieldError('email')} />
      </label>
      <label className="field">
        <span>{t('Password')}</span>
        <Input type="password" {...register('password')} />
        <FieldError error={errors.password?.message ?? getFieldError('password')} />
      </label>
      <label className="field">
        <span>{t('Role')}</span>
        <Controller
          name="role_id"
          control={control}
          render={({ field }) => (
            <SearchableSelect
              value={field.value ? String(field.value) : ''}
              placeholder={t('Select role', { defaultValue: 'Select role' })}
              searchPlaceholder={t('Search roles...', { defaultValue: 'Search roles...' })}
              onChange={(value) => field.onChange(value ? Number(value) : null)}
              options={[
                { label: t('Select role', { defaultValue: 'Select role' }), value: '' },
                ...roles.map((role) => ({
                  label: role.name,
                  value: String(role.id),
                })),
              ]}
            />
          )}
        />
        <FieldError error={errors.role_id?.message ?? getFieldError('role_id')} />
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
