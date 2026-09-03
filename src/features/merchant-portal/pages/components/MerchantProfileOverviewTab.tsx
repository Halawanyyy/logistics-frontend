import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Landmark, Package, Wallet } from 'lucide-react'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { FieldError } from '../../../../shared/components/forms/FieldError'
import { FormActionsBar } from '../../../../shared/components/forms/FormActionsBar'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../shared/components/ui/Card'
import { Input } from '../../../../shared/components/ui/Input'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'
import { Button } from '../../../../shared/components/ui/Button'
import { DateRangeFilter } from '../../../../shared/components/filters/DateRangeFilter'

import { MoneyDisplay } from '../../../../shared/components/display/MoneyDisplay'
import { formatDate } from '../../../../shared/utils/formatters'
import { getMerchantPortalProfile, updateMerchantPortalProfile, getMerchantPortalDashboardSummary } from '../../api/merchantPortal.api'
import { useMerchantPortalContext } from '../../context/merchantPortal.context'
import type { UpdateMerchantPortalProfilePayload, MerchantPortalProfileResponse, MerchantPortalDashboardSummaryResponse } from '../../types/merchantPortal.types'
import { StatCard } from '../../../dashboard/components/StatCard'

export function MerchantProfileOverviewTab() {
  const { t } = useTranslation()
  const { hasMerchantCapability, user, portalRole, portalStatus } = useMerchantPortalContext()
  const queryClient = useQueryClient()
  const [successMessage, setSuccessMessage] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  // Filters state just for UI parity (no functional backend impact yet)
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    assigned_driver_id: ''
  })

  const canEdit = hasMerchantCapability('profile.update')
  
  const profileQuery = useQuery<{ data: MerchantPortalProfileResponse }>({
    queryKey: ['merchant-portal-profile'],
    queryFn: getMerchantPortalProfile,
  })

  const dashboardQuery = useQuery<{ data: MerchantPortalDashboardSummaryResponse }>({
    queryKey: ['merchant-portal-dashboard-summary'],
    queryFn: () => getMerchantPortalDashboardSummary(),
  })

  const mutation = useMutation({
    mutationFn: updateMerchantPortalProfile,
    onSuccess: async () => {
      setSuccessMessage(t('Profile updated successfully.', { defaultValue: 'Profile updated successfully.' }))
      await queryClient.invalidateQueries({ queryKey: ['merchant-portal-profile'] })
      setIsEditing(false)
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

  if (profileQuery.isLoading || dashboardQuery.isLoading) {
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

  const profile = profileQuery.data?.data
  const dashboard = dashboardQuery.data?.data

  return (
    <div className="page-stack">
      <div className="flex justify-end gap-2 mb-4">
          {isEditing ? (
            <Button variant="secondary" onClick={() => setIsEditing(false)}>
              {t('Back', { defaultValue: 'Back' })}
            </Button>
          ) : canEdit ? (
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              {t('Edit', { defaultValue: 'Edit' })}
            </Button>
          ) : null}
        </div>


      {/* Top Summary Cards */}
      <div className="stats-grid stats-grid--top">
        <Card className="stat-card" data-accent="finance">
          <CardContent>
            <div className="stat-card__eyebrow">{t('Pricing Plan', { defaultValue: 'Pricing Plan' })}</div>
            <div className="stat-card__value">Enterprise</div>
          </CardContent>
        </Card>
        <Card className="stat-card" data-accent="success">
          <CardContent>
            <div className="stat-card__eyebrow">{t('Status', { defaultValue: 'Status' })}</div>
            <div className="stat-card__value">
              <StatusBadge value={profile.status}>{profile.status ?? '-'}</StatusBadge>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card" data-accent="finance">
          <CardContent>
            <div className="stat-card__eyebrow">{t('Wallet Available Balance', { defaultValue: 'Wallet Available Balance' })}</div>
            <div className="stat-card__value">
              <MoneyDisplay value={dashboard?.finance?.available_balance ?? 0} />
            </div>
          </CardContent>
        </Card>
      </div>

      {!isEditing ? (
        <div className="page-stack">


          <Card variant="flat" className="dashboard-filter-card">
            <CardContent className="dashboard-filters">
              <DateRangeFilter
                dateFrom={filters.date_from}
                dateTo={filters.date_to}
                onChange={({ date_from, date_to }: { date_from: string; date_to: string }) =>
                  setFilters((current) => ({ ...current, date_from, date_to }))
                }
              />

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('Merchant Profile', { defaultValue: 'Merchant Profile' })}</CardTitle>
              <CardDescription>{t('Contact details and operational summary.', { defaultValue: 'Contact details and operational summary.' })}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="detail-list">
                <div><dt>{t('Company', { defaultValue: 'Company' })}</dt><dd>{profile.company_name}</dd></div>
                <div><dt>{t('Phone')}</dt><dd>{profile.phone}</dd></div>
                <div><dt>{t('Email', { defaultValue: 'Email' })}</dt><dd>{profile.email}</dd></div>
                <div><dt>{t('Address', { defaultValue: 'Address' })}</dt><dd>{profile.address}</dd></div>
                <div><dt>{t('Pricing Plan', { defaultValue: 'Pricing Plan' })}</dt><dd>Enterprise</dd></div>
                <div><dt>{t('Status')}</dt><dd><StatusBadge value={profile.status} /></dd></div>
                <div><dt>{t('Created', { defaultValue: 'Created' })}</dt><dd>{profile.created_at ? formatDate(profile.created_at) : '-'}</dd></div>
              </dl>
            </CardContent>
          </Card>

          {dashboard ? (
            <>
              <div className="stats-grid">
                <StatCard accent="shipments" title={t('Shipments')} value={dashboard.shipments?.total_shipments ?? 0} tone="info" icon={<Package size={19} />} />
                <StatCard accent="success" title={t('Delivered', { defaultValue: 'Delivered' })} value={dashboard.shipments?.delivered_shipments ?? 0} tone="success" icon={<Package size={19} />} />
                <StatCard accent="success" title={t('Company Profit', { defaultValue: 'Company Profit' })} value={<MoneyDisplay value={0} />} tone="success" icon={<Landmark size={19} />} />
                <StatCard accent="warning" title={t('Merchant Payables', { defaultValue: 'Merchant Payables' })} value={<MoneyDisplay value={dashboard.finance?.pending_balance ?? 0} />} tone="warning" icon={<Wallet size={19} />} />
              </div>

              <div className="stats-grid">
                <StatCard accent="finance" title={t('COD Collected', { defaultValue: 'COD Collected' })} value={<MoneyDisplay value={dashboard.finance?.total_cod_collected ?? 0} />} tone="info" />
                <StatCard accent="success" title={t('Shipping Fees', { defaultValue: 'Shipping Fees' })} value={<MoneyDisplay value={dashboard.finance?.total_shipping_fees ?? 0} />} tone="success" />
                <StatCard accent="finance" title={t('Warehouse Charges', { defaultValue: 'Warehouse Charges' })} value={<MoneyDisplay value={dashboard.finance?.total_warehouse_charges ?? 0} />} tone="warning" />
                <StatCard accent="finance" title={t('Remaining Balance', { defaultValue: 'Remaining Balance' })} value={<MoneyDisplay value={dashboard.finance?.available_balance ?? 0} />} tone="neutral" />
              </div>
            </>
          ) : null}
        </div>
      ) : (
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
                      <h3 className="form-section__title">{t('Company Logo', { defaultValue: 'Company Logo' })}</h3>
                      <p className="form-section__description">
                        {t('Merchant company logo display. Upload requires separate backend image API approval.', {
                          defaultValue: 'Merchant company logo display. Upload requires separate backend image API approval.',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="form-section__body flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-lg text-violet-400">
                      {profile.company_name?.[0]?.toUpperCase() || 'C'}
                    </div>
                    <span className="text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                      {t('Logo upload blocked — Separate backend API approval required', { defaultValue: 'Logo upload blocked — Separate backend API approval required' })}
                    </span>
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
      )}
    </div>
  )
}
