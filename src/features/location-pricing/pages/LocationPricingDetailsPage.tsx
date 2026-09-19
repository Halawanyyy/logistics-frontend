import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  ListChecks,
  Package,
  Pencil,
  Store,
  XCircle,
} from 'lucide-react'
import { getArea, getGovernorate, getPricingPlan, getPricingPlanRate, getShippingRate } from '../api/location-pricing.api'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { Skeleton } from '../../../shared/components/ui/Skeleton'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { formatDate, formatMoney } from '../../../shared/utils/formatters'
import type { ReactNode } from 'react'

export function GovernorateDetailsPage() {
  const { t } = useTranslation()
  const { governorateId } = useParams()
  const query = useQuery({
    queryKey: ['governorates', governorateId],
    queryFn: () => getGovernorate(governorateId!),
    enabled: Boolean(governorateId),
  })

  if (query.isLoading) return <LoadingState title={t('Loading governorate', { defaultValue: 'Loading governorate' })} />
  if (query.isError || !query.data) return <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />

  const governorate = query.data.data
  return (
    <section className="page-section">
      <PageHeader title={governorate.name} description={t('Governorate pricing coverage details.', { defaultValue: 'Governorate pricing coverage details.' })} actions={<Link className="ui-link-reset" to="/governorates"><Button variant="secondary">{t('Back')}</Button></Link>} />
      <Card>
        <CardHeader><CardTitle>{t('Governorate')}</CardTitle><CardDescription>{t('Read-only location record from the API.', { defaultValue: 'Read-only location record from the API.' })}</CardDescription></CardHeader>
        <CardContent>
          <dl className="detail-list">
            <div><dt>{t('ID')}</dt><dd>{governorate.id}</dd></div>
            <div><dt>{t('Status')}</dt><dd><StatusBadge value={governorate.is_active} /></dd></div>
            <div><dt>{t('Created')}</dt><dd>{formatDate(governorate.created_at)}</dd></div>
          </dl>
        </CardContent>
      </Card>
    </section>
  )
}

export function AreaDetailsPage() {
  const { t } = useTranslation()
  const { areaId } = useParams()
  const query = useQuery({
    queryKey: ['areas', areaId],
    queryFn: () => getArea(areaId!),
    enabled: Boolean(areaId),
  })

  if (query.isLoading) return <LoadingState title={t('Loading area', { defaultValue: 'Loading area' })} />
  if (query.isError || !query.data) return <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />

  const area = query.data.data
  return (
    <section className="page-section">
      <PageHeader title={area.name} description={t('Area pricing coverage details.', { defaultValue: 'Area pricing coverage details.' })} actions={<Link className="ui-link-reset" to="/areas"><Button variant="secondary">{t('Back')}</Button></Link>} />
      <Card>
        <CardHeader><CardTitle>{t('Area')}</CardTitle><CardDescription>{t('Read-only area record from the API.', { defaultValue: 'Read-only area record from the API.' })}</CardDescription></CardHeader>
        <CardContent>
          <dl className="detail-list">
            <div><dt>{t('ID')}</dt><dd>{area.id}</dd></div>
            <div><dt>{t('Governorate')}</dt><dd>{area.governorate_name}</dd></div>
            <div><dt>{t('Status')}</dt><dd><StatusBadge value={area.is_active} /></dd></div>
            <div><dt>{t('Created')}</dt><dd>{formatDate(area.created_at)}</dd></div>
          </dl>
        </CardContent>
      </Card>
    </section>
  )
}

export function ShippingRateDetailsPage() {
  const { t } = useTranslation()
  const { shippingRateId } = useParams()
  const query = useQuery({
    queryKey: ['shipping-rates', shippingRateId],
    queryFn: () => getShippingRate(shippingRateId!),
    enabled: Boolean(shippingRateId),
  })

  if (query.isLoading) return <LoadingState title={t('Loading shipping rate', { defaultValue: 'Loading shipping rate' })} />
  if (query.isError || !query.data) return <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />

  const rate = query.data.data
  return (
    <section className="page-section">
      <PageHeader
        title={t('{{name}} shipping rate', {
          name: rate.governorate_name,
          defaultValue: `${rate.governorate_name} shipping rate`,
        })}
        description={t('Read-only shipping fee rule.', { defaultValue: 'Read-only shipping fee rule.' })}
        actions={<Link className="ui-link-reset" to="/shipping-rates"><Button variant="secondary">{t('Back')}</Button></Link>}
      />
      <Card>
        <CardHeader><CardTitle>{t('Shipping Rate')}</CardTitle><CardDescription>{t('Read-only rate record from the API.', { defaultValue: 'Read-only rate record from the API.' })}</CardDescription></CardHeader>
        <CardContent>
          <dl className="detail-list">
            <div><dt>{t('ID')}</dt><dd>{rate.id}</dd></div>
            <div><dt>{t('Governorate')}</dt><dd>{rate.governorate_name}</dd></div>
            <div><dt>{t('Area')}</dt><dd>{rate.area_name ?? t('All areas', { defaultValue: 'All areas' })}</dd></div>
            <div><dt>{t('Delivery Fee')}</dt><dd>{formatMoney(rate.delivery_fee)}</dd></div>
            <div><dt>{t('Swap Fee')}</dt><dd>{formatMoney(rate.swap_fee)}</dd></div>
            <div><dt>{t('Return Fee')}</dt><dd>{formatMoney(rate.return_fee)}</dd></div>
            <div><dt>{t('Status')}</dt><dd><StatusBadge value={rate.is_active} /></dd></div>
            <div><dt>{t('Created')}</dt><dd>{formatDate(rate.created_at)}</dd></div>
          </dl>
        </CardContent>
      </Card>
    </section>
  )
}

type PricingPlanSummaryCardProps = {
  accent: 'blue' | 'cyan' | 'amber' | 'green' | 'red'
  helper?: ReactNode
  icon: ReactNode
  label: string
  value: ReactNode
}

function PricingPlanSummaryCard({ accent, helper, icon, label, value }: PricingPlanSummaryCardProps) {
  return (
    <Card className="pricing-plan-details__summary-card" data-plan-accent={accent}>
      <div className="pricing-plan-details__summary-icon" aria-hidden="true">{icon}</div>
      <div className="pricing-plan-details__summary-copy">
        <span className="pricing-plan-details__summary-label">{label}</span>
        <strong className="pricing-plan-details__summary-value">{value}</strong>
        {helper ? <span className="pricing-plan-details__summary-helper">{helper}</span> : null}
      </div>
    </Card>
  )
}

function PricingPlanDetailsSkeleton() {
  return (
    <section className="page-section pricing-plan-details-page" aria-busy="true" aria-label="Loading pricing plan">
      <div className="pricing-plan-details__header pricing-plan-details__header--loading">
        <div className="pricing-plan-details__header-copy">
          <Skeleton className="pricing-plan-details__skeleton-breadcrumb" />
          <Skeleton className="pricing-plan-details__skeleton-title" />
          <Skeleton className="pricing-plan-details__skeleton-description" />
        </div>
        <div className="pricing-plan-details__header-actions">
          <Skeleton className="pricing-plan-details__skeleton-button" />
          <Skeleton className="pricing-plan-details__skeleton-button" />
        </div>
      </div>

      <div className="pricing-plan-details__summary-grid">
        {[0, 1, 2, 3].map((item) => (
          <Card className="pricing-plan-details__summary-card pricing-plan-details__summary-card--loading" key={item}>
            <Skeleton className="pricing-plan-details__skeleton-icon" />
            <div className="pricing-plan-details__summary-copy">
              <Skeleton className="pricing-plan-details__skeleton-label" />
              <Skeleton className="pricing-plan-details__skeleton-value" />
            </div>
          </Card>
        ))}
      </div>

      {[0, 1].map((item) => (
        <Card className="pricing-plan-details__content-card pricing-plan-details__content-card--loading" key={item}>
          <CardHeader className="pricing-plan-details__card-header">
            <Skeleton className="pricing-plan-details__skeleton-section-title" />
          </CardHeader>
          <CardContent className="pricing-plan-details__skeleton-content">
            <Skeleton />
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </CardContent>
        </Card>
      ))}
    </section>
  )
}

function humanizePricingPlanStatus(status: string) {
  return status
    .replaceAll(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function PricingPlanDetailsPage() {
  const { t } = useTranslation()
  const { pricingPlanId } = useParams()
  const query = useQuery({
    queryKey: ['pricing-plans', pricingPlanId],
    queryFn: () => getPricingPlan(pricingPlanId!),
    enabled: Boolean(pricingPlanId),
  })

  const backToPlansAction = (
    <Link className="ui-link-reset" to="/admin/pricing-plans">
      <Button variant="secondary">
        <ArrowLeft size={17} aria-hidden="true" />
        {t('Back to Plans', { defaultValue: 'Back to Plans' })}
      </Button>
    </Link>
  )

  if (!pricingPlanId) {
    return (
      <ErrorState
        title={t('Pricing plan not found', { defaultValue: 'Pricing plan not found' })}
        message={t('The requested pricing plan could not be identified.', { defaultValue: 'The requested pricing plan could not be identified.' })}
        actions={backToPlansAction}
      />
    )
  }

  if (query.isLoading) return <PricingPlanDetailsSkeleton />
  if (query.isError || !query.data) {
    return (
      <ErrorState
        title={t('Unable to load pricing plan', { defaultValue: 'Unable to load pricing plan' })}
        message={getApiErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
        actions={backToPlansAction}
      />
    )
  }

  const plan = query.data.data
  const isCustomPricing = Boolean(plan.requires_contact || plan.is_custom_pricing)
  const planStatus = plan.status || (plan.is_active ? 'active' : 'inactive')
  const normalizedStatus = planStatus.trim().toLowerCase()
  const statusAccent = normalizedStatus === 'active' ? 'green' : normalizedStatus === 'inactive' ? 'red' : 'amber'
  const hasMonthlyPrice = plan.monthly_price !== null && plan.monthly_price !== undefined && plan.monthly_price !== ''
  const hasYearlyPrice = plan.yearly_price !== null && plan.yearly_price !== undefined && plan.yearly_price !== ''
  const orderRange = plan.monthly_orders_from !== null && plan.monthly_orders_to !== null
    ? `${plan.monthly_orders_from.toLocaleString()} – ${plan.monthly_orders_to.toLocaleString()}`
    : plan.monthly_orders_from !== null
      ? t('From {{count}}', { count: plan.monthly_orders_from.toLocaleString(), defaultValue: `From ${plan.monthly_orders_from.toLocaleString()}` })
      : plan.monthly_orders_to !== null
        ? t('Up to {{count}}', { count: plan.monthly_orders_to.toLocaleString(), defaultValue: `Up to ${plan.monthly_orders_to.toLocaleString()}` })
        : '—'
  const sortedFeatures = [...(plan.features ?? [])].sort((first, second) => first.sort_order - second.sort_order)
  const includedFeatures = sortedFeatures.filter((feature) => feature.is_included)
  const excludedFeatures = sortedFeatures.filter((feature) => !feature.is_included)

  return (
    <section className="page-section pricing-plan-details-page">
      <header className="pricing-plan-details__header">
        <div className="pricing-plan-details__header-copy">
          <nav className="pricing-plan-details__breadcrumb" aria-label={t('Breadcrumb', { defaultValue: 'Breadcrumb' })}>
            <Link to="/admin/pricing-plans">{t('Pricing Plans', { defaultValue: 'Pricing Plans' })}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{plan.name}</span>
          </nav>
          <span className="pricing-plan-details__eyebrow">{t('Pricing Plan', { defaultValue: 'Pricing Plan' })}</span>
          <div className="pricing-plan-details__title-row">
            <h1>{plan.name}</h1>
            <StatusBadge value={planStatus} />
            <code className="pricing-plan-details__code-pill">{plan.code || '—'}</code>
          </div>
          <p>{plan.description || t('No description provided.', { defaultValue: 'No description provided.' })}</p>
        </div>

        <div className="pricing-plan-details__header-actions">
          {backToPlansAction}
          <Can permission={PERMISSIONS.PRICING_PLANS_UPDATE}>
            <Link className="ui-link-reset" to={`/admin/pricing-plans/${pricingPlanId}/edit`}>
              <Button className="pricing-plan-details__edit-button">
                <Pencil size={17} aria-hidden="true" />
                {t('Edit Plan', { defaultValue: 'Edit Plan' })}
              </Button>
            </Link>
          </Can>
        </div>
      </header>

      <div className="pricing-plan-details__summary-grid">
        <PricingPlanSummaryCard
          accent="blue"
          icon={<CircleDollarSign size={25} />}
          label={t('Monthly Price', { defaultValue: 'Monthly Price' })}
          value={isCustomPricing
            ? t('Custom pricing', { defaultValue: 'Custom pricing' })
            : hasMonthlyPrice
              ? <MoneyDisplay value={plan.monthly_price} currency={plan.currency ?? 'EGP'} fallback="—" />
              : '—'}
          helper={!isCustomPricing && hasMonthlyPrice ? t('per month', { defaultValue: 'per month' }) : undefined}
        />
        <PricingPlanSummaryCard
          accent="cyan"
          icon={<Package size={25} />}
          label={t('Order Range', { defaultValue: 'Order Range' })}
          value={orderRange}
          helper={orderRange !== '—' ? t('orders / month', { defaultValue: 'orders / month' }) : undefined}
        />
        <PricingPlanSummaryCard
          accent="amber"
          icon={<Store size={25} />}
          label={t('Assigned Merchants', { defaultValue: 'Assigned Merchants' })}
          value={plan.merchants_count ?? '—'}
        />
        <PricingPlanSummaryCard
          accent={statusAccent}
          icon={<CheckCircle2 size={25} />}
          label={t('Plan Status', { defaultValue: 'Plan Status' })}
          value={humanizePricingPlanStatus(planStatus)}
        />
      </div>

      <Card className="pricing-plan-details__content-card">
        <CardHeader className="pricing-plan-details__card-header">
          <div className="pricing-plan-details__section-heading">
            <span className="pricing-plan-details__section-icon" aria-hidden="true"><FileText size={22} /></span>
            <div>
              <CardTitle>{t('Plan Overview', { defaultValue: 'Plan Overview' })}</CardTitle>
              <CardDescription>{t('Configuration and visibility details.', { defaultValue: 'Configuration and visibility details.' })}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pricing-plan-details__overview-content">
          <dl className="pricing-plan-details__overview-grid">
            <div><dt>{t('Code')}</dt><dd><code className="pricing-plan-details__value-pill">{plan.code || '—'}</code></dd></div>
            <div><dt>{t('Currency')}</dt><dd>{plan.currency || '—'}</dd></div>
            <div>
              <dt>{t('Yearly Price', { defaultValue: 'Yearly Price' })}</dt>
              <dd>{isCustomPricing
                ? t('Custom pricing', { defaultValue: 'Custom pricing' })
                : hasYearlyPrice
                  ? <MoneyDisplay value={plan.yearly_price} currency={plan.currency ?? 'EGP'} fallback="—" />
                  : '—'}</dd>
            </div>
            <div>
              <dt>{t('Custom Pricing', { defaultValue: 'Custom Pricing' })}</dt>
              <dd><span className={`pricing-plan-details__boolean-pill pricing-plan-details__boolean-pill--${isCustomPricing ? 'yes' : 'no'}`}>{isCustomPricing ? t('Yes') : t('No')}</span></dd>
            </div>
            <div>
              <dt>{t('Popular Plan', { defaultValue: 'Popular Plan' })}</dt>
              <dd><span className={`pricing-plan-details__boolean-pill pricing-plan-details__boolean-pill--${plan.is_popular ? 'yes' : 'no'}`}>{plan.is_popular ? t('Yes') : t('No')}</span></dd>
            </div>
            <div><dt>{t('Display Order', { defaultValue: 'Display Order' })}</dt><dd>{plan.display_order ?? plan.sort_order ?? '—'}</dd></div>
            <div><dt>{t('Created')}</dt><dd>{formatDate(plan.created_at)}</dd></div>
          </dl>
        </CardContent>
      </Card>

      <Card className="pricing-plan-details__content-card pricing-plan-details__features-card">
        <CardHeader className="pricing-plan-details__card-header pricing-plan-details__features-header">
          <div className="pricing-plan-details__section-heading">
            <span className="pricing-plan-details__section-icon" aria-hidden="true"><ListChecks size={22} /></span>
            <div>
              <CardTitle>{t('Plan Features', { defaultValue: 'Plan Features' })}</CardTitle>
              <CardDescription>{t('Benefits and limitations shown to merchants.', { defaultValue: 'Benefits and limitations shown to merchants.' })}</CardDescription>
            </div>
          </div>
          {sortedFeatures.length > 0 ? (
            <div className="pricing-plan-details__feature-counts" aria-label={t('Feature counts', { defaultValue: 'Feature counts' })}>
              <span className="pricing-plan-details__feature-count pricing-plan-details__feature-count--included"><CheckCircle2 size={15} aria-hidden="true" />{includedFeatures.length} {t('Included', { defaultValue: 'Included' })}</span>
              <span className="pricing-plan-details__feature-count pricing-plan-details__feature-count--excluded"><XCircle size={15} aria-hidden="true" />{excludedFeatures.length} {t('Not included', { defaultValue: 'Not included' })}</span>
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="pricing-plan-details__features-content">
          {sortedFeatures.length === 0 ? (
            <div className="pricing-plan-details__features-empty">
              <ListChecks size={24} aria-hidden="true" />
              <div>
                <strong>{t('No features configured', { defaultValue: 'No features configured' })}</strong>
                <p>{t('Features added to this plan will appear here.', { defaultValue: 'Features added to this plan will appear here.' })}</p>
              </div>
            </div>
          ) : (
            <div className="pricing-plan-details__feature-panels">
              <section className="pricing-plan-details__feature-panel pricing-plan-details__feature-panel--included" aria-labelledby="included-features-title">
                <h3 id="included-features-title"><CheckCircle2 size={20} aria-hidden="true" />{t('Included Features', { defaultValue: 'Included Features' })}</h3>
                {includedFeatures.length > 0 ? (
                  <ol>
                    {includedFeatures.map((feature, index) => (
                      <li key={feature.id ?? `${feature.label}-${index}`}>
                        <span className="pricing-plan-details__feature-order">{index + 1}</span>
                        <span>{feature.label}</span>
                        <CheckCircle2 className="pricing-plan-details__feature-state-icon" size={19} aria-label={t('Included', { defaultValue: 'Included' })} />
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="pricing-plan-details__panel-empty">{t('No included features.', { defaultValue: 'No included features.' })}</p>
                )}
              </section>

              <section className="pricing-plan-details__feature-panel pricing-plan-details__feature-panel--excluded" aria-labelledby="excluded-features-title">
                <h3 id="excluded-features-title"><XCircle size={20} aria-hidden="true" />{t('Not Included', { defaultValue: 'Not Included' })}</h3>
                {excludedFeatures.length > 0 ? (
                  <ol>
                    {excludedFeatures.map((feature, index) => (
                      <li key={feature.id ?? `${feature.label}-${index}`}>
                        <span className="pricing-plan-details__feature-order">{index + 1}</span>
                        <span>{feature.label}</span>
                        <XCircle className="pricing-plan-details__feature-state-icon" size={19} aria-label={t('Not included', { defaultValue: 'Not included' })} />
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="pricing-plan-details__panel-empty">{t('No excluded features.', { defaultValue: 'No excluded features.' })}</p>
                )}
              </section>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export function PricingPlanRateDetailsPage() {
  const { t } = useTranslation()
  const { pricingPlanRateId } = useParams()
  const query = useQuery({
    queryKey: ['pricing-plan-rates', pricingPlanRateId],
    queryFn: () => getPricingPlanRate(pricingPlanRateId!),
    enabled: Boolean(pricingPlanRateId),
  })

  if (query.isLoading) return <LoadingState title={t('Loading pricing plan rate', { defaultValue: 'Loading pricing plan rate' })} />
  if (query.isError || !query.data) return <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />

  const rate = query.data.data
  return (
    <section className="page-section">
      <PageHeader title={rate.pricing_plan_name} description={t('Pricing plan rate details.', { defaultValue: 'Pricing plan rate details.' })} actions={<Link className="ui-link-reset" to="/admin/pricing-plan-rates"><Button variant="secondary">{t('Back')}</Button></Link>} />
      <Card>
        <CardHeader><CardTitle>{t('Pricing Plan Rate')}</CardTitle><CardDescription>{t('Read-only location price record.', { defaultValue: 'Read-only location price record.' })}</CardDescription></CardHeader>
        <CardContent>
          <dl className="detail-list">
            <div><dt>{t('Governorate')}</dt><dd>{rate.governorate_name}</dd></div>
            <div><dt>{t('Area')}</dt><dd>{rate.area_name ?? t('Governorate default', { defaultValue: 'Governorate default' })}</dd></div>
            <div><dt>{t('Delivery Fee')}</dt><dd>{formatMoney(rate.delivery_fee)}</dd></div>
            <div><dt>{t('Swap Fee')}</dt><dd>{formatMoney(rate.swap_fee)}</dd></div>
            <div><dt>{t('Return Fee')}</dt><dd>{formatMoney(rate.return_fee)}</dd></div>
            <div><dt>{t('Active')}</dt><dd><StatusBadge value={rate.is_active} /></dd></div>
          </dl>
        </CardContent>
      </Card>
    </section>
  )
}
