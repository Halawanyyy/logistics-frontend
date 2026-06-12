import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Landmark } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import {
  createTreasuryAccount,
  getTreasuryAccount,
  updateTreasuryAccount,
} from '../api/finance.api'
import type { CreateTreasuryAccountRequest } from '../types/finance.types'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { FormActionsBar } from '../../../shared/components/forms/FormActionsBar'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { FormPageLayout } from '../../../shared/components/forms/FormPageLayout'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Input } from '../../../shared/components/ui/Input'
import { Select } from '../../../shared/components/ui/Select'
import { useFormApiErrors } from '../../../shared/hooks/useFormApiErrors'
import { adminPath } from '../../../shared/routing/paths'

type TreasuryAccountFormValues = {
  name: string
  code: string
  type: string
  opening_balance: number
  status: string
  notes: string
}

export function TreasuryAccountFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { t } = useTranslation()
  const { accountId } = useParams()
  const isEdit = mode === 'edit'
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const treasuryAccountQuery = useQuery({
    queryKey: ['treasury-accounts', accountId],
    queryFn: () => getTreasuryAccount(accountId!),
    enabled: isEdit && Boolean(accountId),
  })
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TreasuryAccountFormValues>({
    defaultValues: {
      name: '',
      code: '',
      type: 'cash',
      opening_balance: 0,
      status: 'active',
      notes: '',
    },
  })
  const mutation = useMutation({
    mutationFn: (values: TreasuryAccountFormValues) => {
      const payload: CreateTreasuryAccountRequest = {
        name: values.name,
        code: values.code,
        type: values.type,
        opening_balance: values.opening_balance,
        status: values.status,
        notes: values.notes || undefined,
      }
      return isEdit ? updateTreasuryAccount(accountId!, payload) : createTreasuryAccount(payload)
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['treasury-accounts'] })
      navigate(adminPath(`/finance/treasury/accounts/${response.data.id}`))
    },
  })
  const { formError, getFieldError } = useFormApiErrors(mutation.error)

  if (treasuryAccountQuery.isLoading) {
    return <LoadingState title={t('Loading treasury account', { defaultValue: 'Loading treasury account' })} />
  }

  if (treasuryAccountQuery.isError) {
    return <ErrorState message={getApiErrorMessage(treasuryAccountQuery.error)} />
  }

  useEffect(() => {
    if (!treasuryAccountQuery.data) {
      return
    }

    const account = treasuryAccountQuery.data.data
    reset({
      name: account.name,
      code: account.code,
      type: account.type,
      opening_balance: Number(account.opening_balance ?? 0),
      status: account.status,
      notes: account.notes ?? '',
    })
  }, [reset, treasuryAccountQuery.data])

  return (
    <FormPageLayout
      backTo={adminPath('/finance/treasury/accounts')}
      description={t('Create or update treasury accounts used by payouts and expense payments.', {
        defaultValue: 'Create or update treasury accounts used by payouts and expense payments.',
      })}
      eyebrow={t('Finance', { defaultValue: 'Finance' })}
      sectionIcon={<Landmark size={18} />}
      sectionDescription={t('Define the treasury account identity, opening balance, and operational status before saving.', {
        defaultValue: 'Define the treasury account identity, opening balance, and operational status before saving.',
      })}
      sectionTitle={t('Treasury Account Details', { defaultValue: 'Treasury Account Details' })}
      title={t(isEdit ? 'Edit Treasury Account' : 'Create Treasury Account', {
        defaultValue: isEdit ? 'Edit Treasury Account' : 'Create Treasury Account',
      })}
    >
      <form className="form-grid" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <label className="field">
          <span>{t('Name')}</span>
          <Input {...register('name', { required: 'Name is required.' })} />
          <FieldError error={errors.name?.message ?? getFieldError('name')} />
        </label>
        <label className="field">
          <span>{t('Code')}</span>
          <Input {...register('code', { required: 'Code is required.' })} />
          <FieldError error={errors.code?.message ?? getFieldError('code')} />
        </label>
        <label className="field">
          <span>{t('Type')}</span>
          <Select {...register('type', { required: 'Type is required.' })}>
            <option value="cash">cash</option>
            <option value="bank">bank</option>
            <option value="wallet">wallet</option>
          </Select>
          <FieldError error={errors.type?.message ?? getFieldError('type')} />
        </label>
        <label className="field">
          <span>{t('Opening Balance', { defaultValue: 'Opening Balance' })}</span>
          <Input
            type="number"
            step="0.01"
            {...register('opening_balance', { valueAsNumber: true, required: 'Opening balance is required.' })}
          />
          <FieldError error={errors.opening_balance?.message ?? getFieldError('opening_balance')} />
        </label>
        <label className="field">
          <span>{t('Status')}</span>
          <Select {...register('status', { required: 'Status is required.' })}>
            <option value="active">{t('Active')}</option>
            <option value="inactive">{t('Inactive')}</option>
          </Select>
          <FieldError error={errors.status?.message ?? getFieldError('status')} />
        </label>
        <label className="field">
          <span>{t('Notes')}</span>
          <Input {...register('notes')} />
          <FieldError error={errors.notes?.message ?? getFieldError('notes')} />
        </label>
        {formError ? <div className="form-error">{formError}</div> : null}
        <FormActionsBar
          isSubmitting={mutation.isPending}
          secondaryAction={(
            <Link className="ui-link-reset" to={adminPath('/finance/treasury/accounts')}>
              <Button variant="secondary">{t('Cancel', { defaultValue: 'Cancel' })}</Button>
            </Link>
          )}
          submitLabel={t(isEdit ? 'Save Treasury Account' : 'Create Treasury Account', {
            defaultValue: isEdit ? 'Save Treasury Account' : 'Create Treasury Account',
          })}
        />
      </form>
    </FormPageLayout>
  )
}
