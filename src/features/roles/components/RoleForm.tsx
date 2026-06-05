import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { getApiErrorMessage, getApiValidationErrors } from '../../../shared/api/api-error'
import { Button } from '../../../shared/components/ui/Button'
import { Input } from '../../../shared/components/ui/Input'
import { Select } from '../../../shared/components/ui/Select'
import { PermissionMultiSelect } from './PermissionMultiSelect'
import type { GroupedPermissionsEntry, Role } from '../types/role.types'

const roleSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  slug: z.string().min(1, 'Slug is required.'),
  description: z.string().optional(),
  status: z.string().min(1, 'Status is required.'),
  permissions: z.array(z.number()).default([]),
})

export type RoleFormValues = z.infer<typeof roleSchema>

type RoleFormProps = {
  defaultValues?: Role
  error?: unknown
  groupedPermissions: GroupedPermissionsEntry[]
  isEdit?: boolean
  isSubmitting?: boolean
  submitLabel: string
  onSubmit: (values: RoleFormValues) => void
}

function flattenSelectedPermissions(role?: Role) {
  if (!role) {
    return []
  }

  return Object.values(role.permissions)
    .flat()
    .map((permission) => permission.id)
}

export function RoleForm({
  defaultValues,
  error,
  groupedPermissions,
  isEdit = false,
  isSubmitting = false,
  submitLabel,
  onSubmit,
}: RoleFormProps) {
  const { t } = useTranslation()
  const validationErrors = getApiValidationErrors(error)
  const {
    handleSubmit,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema) as never,
    defaultValues: {
      name: defaultValues?.name ?? '',
      slug: defaultValues?.slug ?? '',
      description: defaultValues?.description ?? '',
      status: defaultValues?.status ?? 'active',
      permissions: flattenSelectedPermissions(defaultValues),
    },
  })

  const selectedPermissions = watch('permissions') ?? []

  function fieldError(name: keyof RoleFormValues) {
    return errors[name]?.message ?? validationErrors[name]?.[0]
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit((values) => onSubmit(values))}>
      <div className="form-grid form-grid--two">
        <label className="field">
          <span>{t('Name')}</span>
          <Input {...register('name')} />
          {fieldError('name') ? <small>{fieldError('name')}</small> : null}
        </label>
        <label className="field">
          <span>{t('Slug')}</span>
          <Input {...register('slug')} disabled={isEdit && defaultValues?.is_system} />
          {fieldError('slug') ? <small>{fieldError('slug')}</small> : null}
        </label>
        <label className="field">
          <span>{t('Description')}</span>
          <Input {...register('description')} />
        </label>
        <label className="field">
          <span>{t('Status')}</span>
          <Select {...register('status')} disabled={defaultValues?.slug === 'super_admin'}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </Select>
          {fieldError('status') ? <small>{fieldError('status')}</small> : null}
        </label>
      </div>

      <div className="form-section">
        <div className="section-title-row">
          <h3>{t('Permissions')}</h3>
          <p className="table-meta">
            {t('Search and assign permissions grouped by backend module.', {
              defaultValue: 'Search and assign permissions grouped by backend module.',
            })}
          </p>
        </div>
        <PermissionMultiSelect
          disabled={defaultValues?.slug === 'super_admin'}
          groups={groupedPermissions}
          value={selectedPermissions}
          onChange={(permissions) => {
            setValue('permissions', permissions, { shouldValidate: true })
          }}
        />
        <p className="table-meta">
          {t('{{count}} permissions selected', {
            count: selectedPermissions.length,
            defaultValue: `${selectedPermissions.length} permissions selected`,
          })}
        </p>
      </div>

      {error ? <div className="form-error">{getApiErrorMessage(error)}</div> : null}

      <div className="form-actions">
        <Button type="submit" loading={isSubmitting}>
          {t(submitLabel, { defaultValue: submitLabel })}
        </Button>
      </div>
    </form>
  )
}
