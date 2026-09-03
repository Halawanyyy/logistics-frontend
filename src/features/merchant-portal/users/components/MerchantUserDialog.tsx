import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type {
  MerchantPortalUser,
} from '../../../merchants/types/merchant.types'
import { FieldError } from '../../../../shared/components/forms/FieldError'
import { Button } from '../../../../shared/components/ui/Button'
import { CardTitle } from '../../../../shared/components/ui/Card'
import { Dialog } from '../../../../shared/components/ui/Dialog'
import { Input } from '../../../../shared/components/ui/Input'
import { Select } from '../../../../shared/components/ui/Select'
import { useFormApiErrors } from '../../../../shared/hooks/useFormApiErrors'

type PortalUserFormValues = {
  mode: 'existing' | 'new'
  user_id: number
  name: string
  email: string
  password: string
  password_confirmation: string
  role: string
  status: string
}

function mapPortalUserToValues(user?: MerchantPortalUser | null): PortalUserFormValues {
  return {
    mode: user?.user_id ? 'existing' : 'new',
    user_id: user?.user_id ?? 0,
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    password_confirmation: '',
    role: user?.role ?? 'staff',
    status: user?.status ?? 'active',
  }
}

export function MerchantUserDialog({
  currentUser,
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
}: {
  currentUser?: MerchantPortalUser | null
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: PortalUserFormValues) => void
  open: boolean
}) {
  const { t } = useTranslation()
  const { formError, getFieldError } = useFormApiErrors(error)
  const {
    handleSubmit,
    register,
    reset,
    watch,
    formState: { errors },
  } = useForm<PortalUserFormValues>({
    defaultValues: mapPortalUserToValues(currentUser),
  })
  const mode = watch('mode')

  useEffect(() => {
    if (open) {
      reset(mapPortalUserToValues(currentUser))
    }
  }, [currentUser, open, reset])

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>{currentUser ? t('Edit User', { defaultValue: 'Edit User' }) : t('Create User', { defaultValue: 'Create User' })}</CardTitle>}>
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        {!currentUser ? (
          <label className="field">
            <span>{t('User Source', { defaultValue: 'User Source' })}</span>
            <Select {...register('mode')}>
              <option value="new">{t('Create new user', { defaultValue: 'Create new user' })}</option>
              <option value="existing">{t('Link existing user', { defaultValue: 'Link existing user' })}</option>
            </Select>
          </label>
        ) : null}

        {mode === 'existing' && !currentUser ? (
          <label className="field">
            <span>{t('Existing User ID', { defaultValue: 'Existing User ID' })}</span>
            <Input type="number" placeholder={t('User ID', { defaultValue: 'User ID' })} {...register('user_id', { required: true, valueAsNumber: true })} />
            <FieldError error={errors.user_id?.message ?? getFieldError('user_id')} />
          </label>
        ) : null}

        {mode === 'new' || currentUser ? (
          <>
            <label className="field">
              <span>{t('Name', { defaultValue: 'Name' })}</span>
              <Input placeholder={t('Full Name', { defaultValue: 'Full Name' })} {...register('name')} />
              <FieldError error={errors.name?.message ?? getFieldError('name')} />
            </label>
            <label className="field">
              <span>{t('Email', { defaultValue: 'Email' })}</span>
              <Input type="email" placeholder={t('Email Address', { defaultValue: 'Email Address' })} {...register('email')} />
              <FieldError error={errors.email?.message ?? getFieldError('email')} />
            </label>
          </>
        ) : null}

        {mode === 'new' && !currentUser ? (
          <>
            <label className="field">
              <span>{t('Password', { defaultValue: 'Password' })}</span>
              <Input type="password" {...register('password', { required: true })} />
              <FieldError error={errors.password?.message ?? getFieldError('password')} />
            </label>
            <label className="field">
              <span>{t('Confirm Password', { defaultValue: 'Confirm Password' })}</span>
              <Input type="password" {...register('password_confirmation', { required: true })} />
              <FieldError error={errors.password_confirmation?.message ?? getFieldError('password_confirmation')} />
            </label>
          </>
        ) : null}

        <label className="field">
          <span>{t('Role', { defaultValue: 'Role' })}</span>
          <Select {...register('role')}>
            <option value="owner">{t('Owner', { defaultValue: 'Owner' })}</option>
            <option value="admin">{t('Admin', { defaultValue: 'Admin' })}</option>
            <option value="staff">{t('Staff', { defaultValue: 'Staff' })}</option>
            <option value="accountant">{t('Accountant', { defaultValue: 'Accountant' })}</option>
            <option value="warehouse_viewer">{t('Warehouse Viewer', { defaultValue: 'Warehouse Viewer' })}</option>
            <option value="viewer">{t('Viewer', { defaultValue: 'Viewer' })}</option>
          </Select>
          <FieldError error={errors.role?.message ?? getFieldError('role')} />
        </label>

        <label className="field">
          <span>{t('Status', { defaultValue: 'Status' })}</span>
          <Select {...register('status')}>
            <option value="active">{t('Active', { defaultValue: 'Active' })}</option>
            <option value="suspended">{t('Suspended', { defaultValue: 'Suspended' })}</option>
          </Select>
          <FieldError error={errors.status?.message ?? getFieldError('status')} />
        </label>

        {formError ? (
          <div className="rounded bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/50 dark:text-red-200 mb-4">
            {formError}
          </div>
        ) : null}

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('Cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {currentUser ? t('Save User', { defaultValue: 'Save User' }) : t('Create User', { defaultValue: 'Create User' })}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
