import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getArea, getGovernorate, getPricingPlan, getPricingPlanRate, getShippingRate } from '../api/location-pricing.api'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { formatDate, formatMoney } from '../../../shared/utils/formatters'

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

export function PricingPlanDetailsPage() {
  const { t } = useTranslation()
  const { pricingPlanId } = useParams()
  const query = useQuery({
    queryKey: ['pricing-plans', pricingPlanId],
    queryFn: () => getPricingPlan(pricingPlanId!),
    enabled: Boolean(pricingPlanId),
  })

  if (query.isLoading) return <LoadingState title={t('Loading pricing plan', { defaultValue: 'Loading pricing plan' })} />
  if (query.isError || !query.data) return <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} />

  const plan = query.data.data
  return (
    <section className="page-section">
      <PageHeader title={plan.name} description={plan.code} actions={<Link className="ui-link-reset" to="/admin/pricing-plans"><Button variant="secondary">{t('Back')}</Button></Link>} />
      <Card>
        <CardHeader><CardTitle>{t('Pricing Plan')}</CardTitle><CardDescription>{t('Read-only pricing plan record.', { defaultValue: 'Read-only pricing plan record.' })}</CardDescription></CardHeader>
        <CardContent>
          <dl className="detail-list">
            <div><dt>{t('Description')}</dt><dd>{plan.description ?? '-'}</dd></div>
            <div><dt>{t('Status')}</dt><dd><StatusBadge value={plan.status} /></dd></div>
            <div><dt>{t('Monthly Orders From')}</dt><dd>{plan.monthly_orders_from ?? '-'}</dd></div>
            <div><dt>{t('Monthly Orders To')}</dt><dd>{plan.monthly_orders_to ?? '-'}</dd></div>
            <div><dt>{t('Merchants')}</dt><dd>{plan.merchants_count ?? '-'}</dd></div>
            <div><dt>{t('Created')}</dt><dd>{formatDate(plan.created_at)}</dd></div>
          </dl>
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
