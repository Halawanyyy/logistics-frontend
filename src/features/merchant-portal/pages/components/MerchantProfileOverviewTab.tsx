import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Coins,
  Landmark,
  Package,
  PackageCheck,
  Truck,
  Wallet,
  Warehouse,
} from 'lucide-react'
import { getApiErrorMessage } from '../../../../shared/api/api-error'
import { FieldError } from '../../../../shared/components/forms/FieldError'
import { FormActionsBar } from '../../../../shared/components/forms/FormActionsBar'
import { LoadingState } from '../../../../shared/components/states/LoadingState'
import { ErrorState } from '../../../../shared/components/states/ErrorState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../shared/components/ui/Card'
import { Input } from '../../../../shared/components/ui/Input'
import { StatusBadge } from '../../../../shared/components/ui/StatusBadge'
import { Button } from '../../../../shared/components/ui/Button'
import { MoneyDisplay } from '../../../../shared/components/display/MoneyDisplay'
import { formatDate } from '../../../../shared/utils/formatters'
import { subscriptionApi } from '../../subscription/api/subscription.api'
import {
  getMerchantPortalDashboardSummary,
  getMerchantPortalProfile,
  updateMerchantPortalProfile,
} from '../../api/merchantPortal.api'
import { useMerchantPortalContext } from '../../context/merchantPortal.context'
import type {
  MerchantPortalDashboardSummaryResponse,
  MerchantPortalProfileResponse,
  UpdateMerchantPortalProfilePayload,
} from '../../types/merchantPortal.types'

type MerchantProfileOverviewTabProps = {
  isEditing: boolean
  onEditingChange: (isEditing: boolean) => void
}

type DateRange = {
  date_from: string
  date_to: string
}

type ProfileTone = 'amber' | 'blue' | 'cyan' | 'emerald' | 'green' | 'orange' | 'sky' | 'teal' | 'red'

type ProfileCardProps = {
  icon: ReactNode
  label: string
  tone: ProfileTone
  value: ReactNode
}

type ValidationErrorResponse = {
  response?: {
    status?: number
    data?: {
      errors?: Record<string, string[]>
    }
  }
}

const EMPTY_DATE_RANGE: DateRange = {
  date_from: '',
  date_to: '',
}

function ProfileSummaryCard({ icon, label, tone, value }: ProfileCardProps) {
  return (
    <Card className="merchant-profile-summary-card" data-tone={tone}>
      <CardContent className="merchant-profile-summary-card__content">
        <span className="merchant-profile-card-icon" aria-hidden="true">{icon}</span>
        <span className="merchant-profile-summary-card__copy">
          <span className="merchant-profile-card-label">{label}</span>
          <strong className="merchant-profile-summary-card__value">{value}</strong>
        </span>
      </CardContent>
    </Card>
  )
}

function ProfileMetricCard({ icon, label, tone, value }: ProfileCardProps) {
  return (
    <Card className="merchant-profile-metric-card" data-tone={tone}>
      <CardContent className="merchant-profile-metric-card__content">
        <span className="merchant-profile-card-icon" aria-hidden="true">{icon}</span>
        <span className="merchant-profile-metric-card__copy">
          <span className="merchant-profile-card-label">{label}</span>
          <strong className="merchant-profile-metric-card__value">{value}</strong>
        </span>
      </CardContent>
    </Card>
  )
}

function humanizeStatus(value?: string) {
  if (!value) {
    return '—'
  }

  return value
    .replaceAll(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function getStatusTone(value?: string): ProfileTone {
  const normalized = value?.toLowerCase()

  if (normalized === 'active') {
    return 'green'
  }

  if (normalized === 'pending' || normalized === 'under_review') {
    return 'amber'
  }

  return 'red'
}

function formatDateFilterLabel(range: DateRange, allTimeLabel: string) {
  if (!range.date_from && !range.date_to) {
    return allTimeLabel
  }

  const formatter = new Intl.DateTimeFormat(document.documentElement.lang || undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const formatValue = (value: string) => formatter.format(new Date(`${value}T00:00:00`))

  if (range.date_from && range.date_to) {
    return `${formatValue(range.date_from)} – ${formatValue(range.date_to)}`
  }

  return formatValue(range.date_from || range.date_to)
}

export function MerchantProfileOverviewTab({
  isEditing,
  onEditingChange,
}: MerchantProfileOverviewTabProps) {
  const { t } = useTranslation()
  const { hasMerchantCapability, user, portalRole, portalStatus } = useMerchantPortalContext()
  const queryClient = useQueryClient()
  const [successMessage, setSuccessMessage] = useState('')
  const [isDateFilterOpen, setDateFilterOpen] = useState(false)
  const [draftRange, setDraftRange] = useState<DateRange>(EMPTY_DATE_RANGE)
  const [appliedRange, setAppliedRange] = useState<DateRange>(EMPTY_DATE_RANGE)
  const [dateRangeError, setDateRangeError] = useState('')
  const dateFilterRef = useRef<HTMLDivElement>(null)
  const dateFilterTriggerRef = useRef<HTMLButtonElement>(null)
  const dateFromRef = useRef<HTMLInputElement>(null)

  const canEdit = hasMerchantCapability('profile.update')

  const profileQuery = useQuery<{ data: MerchantPortalProfileResponse }>({
    queryKey: ['merchant-portal-profile'],
    queryFn: getMerchantPortalProfile,
  })

  const dashboardQuery = useQuery<{ data: MerchantPortalDashboardSummaryResponse }>({
    queryKey: ['merchant-portal-dashboard-summary', appliedRange.date_from, appliedRange.date_to],
    queryFn: () => getMerchantPortalDashboardSummary({
      ...(appliedRange.date_from ? { date_from: appliedRange.date_from } : {}),
      ...(appliedRange.date_to ? { date_to: appliedRange.date_to } : {}),
    }),
  })

  const plansQuery = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: subscriptionApi.getPlans,
  })

  const mutation = useMutation({
    mutationFn: updateMerchantPortalProfile,
    onSuccess: async () => {
      setSuccessMessage(t('Profile updated successfully.', { defaultValue: 'Profile updated successfully.' }))
      await queryClient.invalidateQueries({ queryKey: ['merchant-portal-profile'] })
      onEditingChange(false)
    },
    onError: (error: unknown) => {
      const validationError = error as ValidationErrorResponse

      if (validationError.response?.status === 422) {
        const responseErrors = validationError.response.data?.errors ?? {}
        Object.keys(responseErrors).forEach((key) => {
          setError(key as keyof UpdateMerchantPortalProfilePayload, {
            type: 'manual',
            message: responseErrors[key]?.[0],
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

  useEffect(() => {
    if (!isDateFilterOpen) {
      return
    }

    const focusFrame = requestAnimationFrame(() => dateFromRef.current?.focus())

    function handlePointerDown(event: PointerEvent) {
      if (dateFilterRef.current && !dateFilterRef.current.contains(event.target as Node)) {
        setDateFilterOpen(false)
        setDateRangeError('')
      }
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setDateFilterOpen(false)
        setDateRangeError('')
        dateFilterTriggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      cancelAnimationFrame(focusFrame)
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDateFilterOpen])

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
  const dashboard = dashboardQuery.data?.data
  const plans = plansQuery.data?.data.plans ?? []
  const currentPlanId = plansQuery.data?.data.current_plan_id ?? null
  const currentPlan = plans.find((plan) => plan.id === currentPlanId)
  const planName = plansQuery.isLoading
    ? t('Loading...', { defaultValue: 'Loading...' })
    : currentPlan?.name ?? '—'
  const currency = dashboard?.finance?.currency ?? 'EGP'
  const statusTone = getStatusTone(profile.status)
  const allTimeLabel = t('All time', { defaultValue: 'All time' })
  const dateRangeLabel = formatDateFilterLabel(appliedRange, allTimeLabel)

  function toggleDateFilter() {
    if (isDateFilterOpen) {
      setDateFilterOpen(false)
      setDateRangeError('')
      return
    }

    setDraftRange(appliedRange)
    setDateRangeError('')
    setDateFilterOpen(true)
  }

  function handleApplyDateRange() {
    if (draftRange.date_from && draftRange.date_to && draftRange.date_from > draftRange.date_to) {
      setDateRangeError(t('From date must be before or equal to To date.', {
        defaultValue: 'From date must be before or equal to To date.',
      }))
      return
    }

    setAppliedRange(draftRange)
    setDateRangeError('')
    setDateFilterOpen(false)
    requestAnimationFrame(() => dateFilterTriggerRef.current?.focus())
  }

  function handleResetDateRange() {
    setDraftRange(EMPTY_DATE_RANGE)
    setAppliedRange(EMPTY_DATE_RANGE)
    setDateRangeError('')
    setDateFilterOpen(false)
    requestAnimationFrame(() => dateFilterTriggerRef.current?.focus())
  }

  if (isEditing) {
    return (
      <div className="details-grid merchant-profile-editor">
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
                <dd>{user?.name ?? '—'}</dd>
              </div>
              <div>
                <dt>{t('Portal Role', { defaultValue: 'Portal Role' })}</dt>
                <dd>{portalRole ?? '—'}</dd>
              </div>
              <div>
                <dt>{t('Membership Status', { defaultValue: 'Membership Status' })}</dt>
                <dd><StatusBadge value={portalStatus}>{portalStatus ?? '—'}</StatusBadge></dd>
              </div>
              <div>
                <dt>{t('Merchant Status', { defaultValue: 'Merchant Status' })}</dt>
                <dd>{profile.status ? <StatusBadge value={profile.status} /> : '—'}</dd>
              </div>
              <div>
                <dt>{t('Registered At', { defaultValue: 'Registered At' })}</dt>
                <dd>{profile.created_at ? formatDate(profile.created_at) : '—'}</dd>
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
                <div className="form-section__body merchant-profile-editor-logo-row">
                  <div className="merchant-profile-editor-avatar">
                    {profile.company_name?.[0]?.toUpperCase() || 'C'}
                  </div>
                  <span className="merchant-profile-editor-notice">
                    {t('Logo upload blocked — Separate backend API approval required', {
                      defaultValue: 'Logo upload blocked — Separate backend API approval required',
                    })}
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
    )
  }

  return (
    <div className="merchant-profile-overview">
      <div className="merchant-profile-summary-grid">
        <ProfileSummaryCard
          icon={<ClipboardList size={24} />}
          label={t('Pricing Plan', { defaultValue: 'Pricing Plan' })}
          tone="blue"
          value={planName}
        />
        <ProfileSummaryCard
          icon={<CheckCircle2 size={25} />}
          label={t('Account Status', { defaultValue: 'Account Status' })}
          tone={statusTone}
          value={humanizeStatus(profile.status)}
        />
        <ProfileSummaryCard
          icon={<Wallet size={24} />}
          label={t('Wallet Available Balance', { defaultValue: 'Wallet Available Balance' })}
          tone="cyan"
          value={dashboardQuery.isLoading
            ? <span className="merchant-profile-value-skeleton" aria-label={t('Loading...', { defaultValue: 'Loading...' })} />
            : <MoneyDisplay value={dashboard?.finance?.available_balance} currency={currency} fallback="—" />}
        />
      </div>

      <Card className="merchant-profile-details-card">
        <CardHeader>
          <CardTitle>{t('Merchant Profile', { defaultValue: 'Merchant Profile' })}</CardTitle>
          <CardDescription>{t('Contact details and operational summary.', { defaultValue: 'Contact details and operational summary.' })}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="merchant-profile-details-grid">
            <div><dt>{t('Company', { defaultValue: 'Company' })}</dt><dd>{profile.company_name || '—'}</dd></div>
            <div><dt>{t('Phone', { defaultValue: 'Phone' })}</dt><dd>{profile.phone || '—'}</dd></div>
            <div><dt>{t('Email', { defaultValue: 'Email' })}</dt><dd>{profile.email || '—'}</dd></div>
            <div><dt>{t('Address', { defaultValue: 'Address' })}</dt><dd>{profile.address || '—'}</dd></div>
            <div><dt>{t('Pricing Plan', { defaultValue: 'Pricing Plan' })}</dt><dd>{planName}</dd></div>
            <div><dt>{t('Status', { defaultValue: 'Status' })}</dt><dd>{profile.status ? <StatusBadge value={profile.status} /> : '—'}</dd></div>
            <div><dt>{t('Created', { defaultValue: 'Created' })}</dt><dd>{profile.created_at ? formatDate(profile.created_at) : '—'}</dd></div>
          </dl>
        </CardContent>
      </Card>

      <section
        className={`merchant-profile-metrics-section${isDateFilterOpen ? ' merchant-profile-metrics-section--filter-open' : ''}`}
        aria-labelledby="merchant-profile-metrics-title"
      >
        <div className="merchant-profile-section-heading">
          <div>
            <h2 id="merchant-profile-metrics-title">
              {t('Operational & Financial Summary', { defaultValue: 'Operational & Financial Summary' })}
            </h2>
            <p>{t('Key metrics for your logistics operations.', { defaultValue: 'Key metrics for your logistics operations.' })}</p>
          </div>

          <div className="merchant-profile-date-filter" ref={dateFilterRef}>
            <button
              aria-expanded={isDateFilterOpen}
              aria-haspopup="dialog"
              className="ui-button ui-button--secondary ui-button--md merchant-profile-date-filter__trigger"
              ref={dateFilterTriggerRef}
              type="button"
              onClick={toggleDateFilter}
            >
              <CalendarDays size={17} aria-hidden="true" />
              <span>{dateRangeLabel}</span>
              <ChevronDown className={isDateFilterOpen ? 'is-open' : ''} size={16} aria-hidden="true" />
            </button>

            {isDateFilterOpen ? (
              <div
                aria-labelledby="merchant-profile-date-filter-title"
                className="merchant-profile-date-filter__popup"
                role="dialog"
              >
                <h3 id="merchant-profile-date-filter-title">
                  {t('Date range', { defaultValue: 'Date range' })}
                </h3>
                <div className="merchant-profile-date-filter__fields">
                  <label className="field">
                    <span>{t('From', { defaultValue: 'From' })}</span>
                    <Input
                      aria-invalid={Boolean(dateRangeError)}
                      ref={dateFromRef}
                      type="date"
                      value={draftRange.date_from}
                      onChange={(event) => {
                        setDraftRange((current) => ({ ...current, date_from: event.target.value }))
                        setDateRangeError('')
                      }}
                    />
                  </label>
                  <label className="field">
                    <span>{t('To', { defaultValue: 'To' })}</span>
                    <Input
                      aria-invalid={Boolean(dateRangeError)}
                      type="date"
                      value={draftRange.date_to}
                      onChange={(event) => {
                        setDraftRange((current) => ({ ...current, date_to: event.target.value }))
                        setDateRangeError('')
                      }}
                    />
                  </label>
                </div>
                {dateRangeError ? (
                  <p className="merchant-profile-date-filter__error" role="alert">{dateRangeError}</p>
                ) : null}
                <div className="merchant-profile-date-filter__actions">
                  <Button variant="secondary" onClick={handleResetDateRange}>
                    {t('Reset', { defaultValue: 'Reset' })}
                  </Button>
                  <Button onClick={handleApplyDateRange}>
                    {t('Apply', { defaultValue: 'Apply' })}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {dashboardQuery.isLoading ? (
          <div className="merchant-profile-metrics-grid" aria-busy="true" aria-label={t('Loading summary', { defaultValue: 'Loading summary' })}>
            {Array.from({ length: 8 }, (_, index) => (
              <div className="merchant-profile-metric-skeleton" key={index} />
            ))}
          </div>
        ) : dashboardQuery.isError ? (
          <ErrorState
            title={t('Failed to load summary.', { defaultValue: 'Failed to load summary.' })}
            message={getApiErrorMessage(dashboardQuery.error)}
            onRetry={() => void dashboardQuery.refetch()}
          />
        ) : dashboard ? (
          <div className="merchant-profile-metrics-grid">
            <ProfileMetricCard
              icon={<Package size={22} />}
              label={t('Shipments', { defaultValue: 'Shipments' })}
              tone="sky"
              value={dashboard.shipments?.total_shipments ?? 0}
            />
            <ProfileMetricCard
              icon={<PackageCheck size={22} />}
              label={t('Delivered', { defaultValue: 'Delivered' })}
              tone="green"
              value={dashboard.shipments?.delivered_shipments ?? 0}
            />
            <ProfileMetricCard
              icon={<Landmark size={22} />}
              label={t('Company Profit', { defaultValue: 'Company Profit' })}
              tone="emerald"
              value={<MoneyDisplay value={undefined} currency={currency} fallback="—" />}
            />
            <ProfileMetricCard
              icon={<Wallet size={22} />}
              label={t('Merchant Payables', { defaultValue: 'Merchant Payables' })}
              tone="amber"
              value={<MoneyDisplay value={dashboard.finance?.pending_balance} currency={currency} fallback="—" />}
            />
            <ProfileMetricCard
              icon={<Banknote size={22} />}
              label={t('COD Collected', { defaultValue: 'COD Collected' })}
              tone="cyan"
              value={<MoneyDisplay value={dashboard.finance?.total_cod_collected} currency={currency} fallback="—" />}
            />
            <ProfileMetricCard
              icon={<Truck size={22} />}
              label={t('Shipping Fees', { defaultValue: 'Shipping Fees' })}
              tone="blue"
              value={<MoneyDisplay value={dashboard.finance?.total_shipping_fees} currency={currency} fallback="—" />}
            />
            <ProfileMetricCard
              icon={<Warehouse size={22} />}
              label={t('Warehouse Charges', { defaultValue: 'Warehouse Charges' })}
              tone="orange"
              value={<MoneyDisplay value={dashboard.finance?.total_warehouse_charges} currency={currency} fallback="—" />}
            />
            <ProfileMetricCard
              icon={<Coins size={22} />}
              label={t('Remaining Balance', { defaultValue: 'Remaining Balance' })}
              tone="teal"
              value={<MoneyDisplay value={dashboard.finance?.available_balance} currency={currency} fallback="—" />}
            />
          </div>
        ) : null}
      </section>
    </div>
  )
}
