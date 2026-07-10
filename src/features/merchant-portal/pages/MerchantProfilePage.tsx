import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { FormActionsBar } from '../../../shared/components/forms/FormActionsBar'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Input } from '../../../shared/components/ui/Input'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { formatDate } from '../../../shared/utils/formatters'
import { getMerchantPortalProfile, updateMerchantPortalProfile } from '../api/merchantPortal.api'
import { useMerchantPortalContext } from '../context/merchantPortal.context'
import type { UpdateMerchantPortalProfilePayload } from '../types/merchantPortal.types'

export function MerchantProfilePage() {
  const { t } = useTranslation()
  const { hasMerchantCapability, user, portalRole, portalStatus } = useMerchantPortalContext()
  const queryClient = useQueryClient()
  const [successMessage, setSuccessMessage] = useState('')

  const canEdit = hasMerchantCapability('profile.update')
  const profileQuery = useQuery({
    queryKey: ['merchant-portal-profile'],
    queryFn: getMerchantPortalProfile,
  })

  const mutation = useMutation({
    mutationFn: updateMerchantPortalProfile,
    onSuccess: async () => {
      setSuccessMessage(t('Profile updated successfully.', { defaultValue: 'Profile updated successfully.' }))
      await queryClient.invalidateQueries({ queryKey: ['merchant-portal-profile'] })
    },
    onError: (error: any) => {
      if (error.response?.status === 422) {
        const errors = error.response.data.errors ?? {}
        Object.keys(errors).forEach((key) => {
          setError(key as keyof UpdateMerchantPortalProfilePayload, {
            type: 'manual',
            message: errors[key]?.[0],
          })
        })
      }
    },
  })

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<UpdateMerchantPortalProfilePayload>({
    defaultValues: {
      name: '',
      company_name: '',
      phone: '',
      email: '',
      address: '',
    },
  })

  useEffect(() => {
    if (!profileQuery.data?.data) {
      return
    }

    reset({
      name: profileQuery.data.data.name ?? '',
      company_name: profileQuery.data.data.company_name ?? '',
      phone: profileQuery.data.data.phone ?? '',
      email: profileQuery.data.data.email ?? '',
      address: profileQuery.data.data.address ?? '',
    })
  }, [profileQuery.data, reset])

  if (profileQuery.isLoading) {
    return <LoadingState title={t('Loading profile', { defaultValue: 'Loading profile' })} />
  }

  if (profileQuery.isError || !profileQuery.data?.data) {
    return (
      <ErrorState
        title={t('Failed to load profile.', { defaultValue: 'Failed to load profile.' })}
        message={getApiErrorMessage(profileQuery.error)}
        onRetry={() => void profileQuery.refetch()}
      />
    )
  }

  const profile = profileQuery.data.data

  return (
    <section className="page-section">
      <PageHeader
        eyebrow={t('Merchant Portal', { defaultValue: 'Merchant Portal' })}
        title={t('Merchant Profile', { defaultValue: 'Merchant Profile' })}
        description={t('Keep your merchant identity, contacts, and address information up to date.', {
          defaultValue: 'Keep your merchant identity, contacts, and address information up to date.',
        })}
      />

      <div className="details-grid">
        <Card className="detail-card">
          <CardHeader>
            <CardTitle>{t('Account Summary', { defaultValue: 'Account Summary' })}</CardTitle>
            <CardDescription>
              {t('Live membership and merchant account information from the merchant portal context.', {
                defaultValue: 'Live membership and merchant account information from the merchant portal context.',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="detail-list">
              <div>
                <dt>{t('Portal User Name', { defaultValue: 'Portal User Name' })}</dt>
                <dd>{user?.name ?? '-'}</dd>
              </div>
              <div>
                <dt>{t('Portal Role', { defaultValue: 'Portal Role' })}</dt>
                <dd>{portalRole ?? '-'}</dd>
              </div>
              <div>
                <dt>{t('Membership Status', { defaultValue: 'Membership Status' })}</dt>
                <dd><StatusBadge value={portalStatus}>{portalStatus ?? '-'}</StatusBadge></dd>
              </div>
              <div>
                <dt>{t('Merchant Status', { defaultValue: 'Merchant Status' })}</dt>
                <dd><StatusBadge value={profile.status}>{profile.status ?? '-'}</StatusBadge></dd>
              </div>
              <div>
                <dt>{t('Registered At', { defaultValue: 'Registered At' })}</dt>
                <dd>{profile.created_at ? formatDate(profile.created_at) : '-'}</dd>
              </div>
              <div>
                <dt>{t('Profile Access', { defaultValue: 'Profile Access' })}</dt>
                <dd>{canEdit ? t('Editable', { defaultValue: 'Editable' }) : t('Read Only', { defaultValue: 'Read Only' })}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="table-card settings-editor-card">
          <CardHeader className="table-card__header">
            <div>
              <CardTitle>{t('Company Information', { defaultValue: 'Company Information' })}</CardTitle>
              <CardDescription>
                {t('Profile updates stay merchant-scoped and use only the merchant portal profile endpoint.', {
                  defaultValue: 'Profile updates stay merchant-scoped and use only the merchant portal profile endpoint.',
                })}
              </CardDescription>
            </div>
            <StatusBadge value={canEdit ? 'active' : 'read_only'}>
              {canEdit ? t('Editable', { defaultValue: 'Editable' }) : t('Read Only', { defaultValue: 'Read Only' })}
            </StatusBadge>
          </CardHeader>
          <CardContent>
            {!canEdit ? (
              <div className="table-meta">
                {t('You do not have permission to edit this profile.', {
                  defaultValue: 'You do not have permission to edit this profile.',
                })}
              </div>
            ) : null}
            {successMessage ? <div className="form-success">{successMessage}</div> : null}
            {mutation.error && !errors.name && !errors.company_name && !errors.phone && !errors.email && !errors.address ? (
              <div className="form-error">{getApiErrorMessage(mutation.error)}</div>
            ) : null}
            <form onSubmit={handleSubmit((values) => mutation.mutate(values))}>
              <div className="form-section form-section--panel">
                <div className="form-section__header">
                  <div className="form-section__header-copy">
                    <h3 className="form-section__title">{t('Company Information', { defaultValue: 'Company Information' })}</h3>
                    <p className="form-section__description">
                      {t('Merchant identity fields used across the merchant portal shell and order flows.', {
                        defaultValue: 'Merchant identity fields used across the merchant portal shell and order flows.',
                      })}
                    </p>
                  </div>
                </div>
                <div className="form-section__body form-grid">
                  <label className="field">
                    <span>{t('Merchant Name', { defaultValue: 'Merchant Name' })}</span>
                    <Input disabled={!canEdit} {...register('name')} />
                    <FieldError error={errors.name?.message} />
                  </label>

                  <label className="field">
                    <span>{t('Company Name', { defaultValue: 'Company Name' })}</span>
                    <Input disabled={!canEdit} {...register('company_name')} />
                    <FieldError error={errors.company_name?.message} />
                  </label>
                </div>
              </div>

              <div className="form-section form-section--panel">
                <div className="form-section__header">
                  <div className="form-section__header-copy">
                    <h3 className="form-section__title">{t('Contact Information', { defaultValue: 'Contact Information' })}</h3>
                  </div>
                </div>
                <div className="form-section__body form-grid">
                  <label className="field">
                    <span>{t('Email Address', { defaultValue: 'Email Address' })}</span>
                    <Input disabled={!canEdit} type="email" {...register('email')} />
                    <FieldError error={errors.email?.message} />
                  </label>

                  <label className="field">
                    <span>{t('Phone Number', { defaultValue: 'Phone Number' })}</span>
                    <Input disabled={!canEdit} {...register('phone')} />
                    <FieldError error={errors.phone?.message} />
                  </label>
                </div>
              </div>

              <div className="form-section form-section--panel">
                <div className="form-section__header">
                  <div className="form-section__header-copy">
                    <h3 className="form-section__title">{t('Address Information', { defaultValue: 'Address Information' })}</h3>
                  </div>
                </div>
                <div className="form-section__body form-grid">
                  <label className="field field--full">
                    <span>{t('Address', { defaultValue: 'Address' })}</span>
                    <textarea className="ui-input" disabled={!canEdit} rows={4} {...register('address')} />
                    <FieldError error={errors.address?.message} />
                  </label>
                </div>
              </div>

              {canEdit ? (
                <FormActionsBar
                  isSubmitting={mutation.isPending}
                  submitLabel={t('Save Changes', { defaultValue: 'Save Changes' })}
                />
              ) : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
