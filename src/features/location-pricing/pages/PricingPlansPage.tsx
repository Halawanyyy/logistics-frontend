import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { deletePricingPlan, deletePricingPlanRate, listPricingPlanRates, listPricingPlans } from '../api/location-pricing.api'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { EmptyState } from '../../../shared/components/feedback/EmptyState'
import { ErrorState } from '../../../shared/components/feedback/ErrorState'
import { LoadingState } from '../../../shared/components/feedback/LoadingState'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { GovernorateAreaSelector } from '../../../shared/components/selectors/GovernorateAreaSelector'
import { SearchableSelect } from '../../../shared/components/ui/SearchableSelect'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { formatMoney } from '../../../shared/utils/formatters'

export function PricingPlansPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const plansQuery = useQuery({ queryKey: ['pricing-plans'], queryFn: () => listPricingPlans() })
  const deleteMutation = useMutation({
    mutationFn: deletePricingPlan,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pricing-plans'] }),
  })

  if (plansQuery.isLoading) {
    return <LoadingState title={t('Loading pricing plans', { defaultValue: 'Loading pricing plans' })} />
  }

  if (plansQuery.isError || !plansQuery.data) {
    return <ErrorState message={getApiErrorMessage(plansQuery.error)} onRetry={() => void plansQuery.refetch()} />
  }

  return (
    <section className="page-section">
      <PageHeader
        title={t('Pricing Plans')}
        description={t('Merchant pricing tiers and assignment ranges.', {
          defaultValue: 'Merchant pricing tiers and assignment ranges.',
        })}
        actions={
          <Can permission={PERMISSIONS.PRICING_PLANS_CREATE}>
            <Link className="ui-link-reset" to="/admin/pricing-plans/create">
              <Button>{t('Create Pricing Plan', { defaultValue: 'Create Pricing Plan' })}</Button>
            </Link>
          </Can>
        }
      />
      <Card className="table-card">
        <CardHeader className="table-card__header">
          <CardTitle>{t('Pricing Plans')}</CardTitle>
          <CardDescription>{t('Used by merchants and order shipping fee lookup priority.', {
            defaultValue: 'Used by merchants and order shipping fee lookup priority.',
          })}</CardDescription>
        </CardHeader>
        <CardContent>
          {!plansQuery.data.data.length ? (
            <EmptyState
              title={t('No pricing plans found', { defaultValue: 'No pricing plans found' })}
              description={t('The API returned no pricing plans.', { defaultValue: 'The API returned no pricing plans.' })}
            />
          ) : null}
          {deleteMutation.error ? <div className="form-error">{getApiErrorMessage(deleteMutation.error)}</div> : null}
          {plansQuery.data.data.length ? (
            <TableContainer>
              <Table>
                <thead>
                  <tr>
                    <TableHead>{t('Name')}</TableHead>
                    <TableHead>{t('Code')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Merchants')}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {plansQuery.data.data.map((plan) => (
                    <tr key={plan.id}>
                      <TableCell><Link className="table-link" to={`/admin/pricing-plans/${plan.id}`}>{plan.name}</Link></TableCell>
                      <TableCell>{plan.code}</TableCell>
                      <TableCell><StatusBadge value={plan.status} /></TableCell>
                      <TableCell>{plan.merchants_count ?? '-'}</TableCell>
                      <TableCell>
                        <div className="page-header__button-row">
                          <Can permission={PERMISSIONS.PRICING_PLANS_UPDATE}>
                            <Link className="ui-link-reset" to={`/admin/pricing-plans/${plan.id}/edit`}>
                              <Button size="sm" variant="secondary">{t('Edit')}</Button>
                            </Link>
                          </Can>
                          <Can permission={PERMISSIONS.PRICING_PLANS_DELETE}>
                            <Button
                              size="sm"
                              type="button"
                              variant="danger"
                              onClick={() => {
                                if (window.confirm(t('Delete pricing plan {{name}}?', {
                                  name: plan.name,
                                  defaultValue: `Delete pricing plan ${plan.name}?`,
                                }))) {
                                  deleteMutation.mutate(plan.id)
                                }
                              }}
                            >
                              {t('Delete')}
                            </Button>
                          </Can>
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}

export function PricingPlanRatesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({
    pricing_plan_id: '',
    governorate_id: '',
    area_id: '',
  })
  const params = useMemo(
    () => ({
      ...(filters.pricing_plan_id ? { pricing_plan_id: filters.pricing_plan_id } : {}),
      ...(filters.governorate_id ? { governorate_id: filters.governorate_id } : {}),
      ...(filters.area_id ? { area_id: filters.area_id } : {}),
    }),
    [filters],
  )
  const plansQuery = useQuery({ queryKey: ['pricing-plans', 'selector'], queryFn: () => listPricingPlans() })
  const deleteMutation = useMutation({
    mutationFn: deletePricingPlanRate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pricing-plan-rates'] }),
  })
  const filteredRatesQuery = useQuery({
    queryKey: ['pricing-plan-rates', params],
    queryFn: () => listPricingPlanRates(params),
  })

  if (filteredRatesQuery.isLoading) {
    return <LoadingState title={t('Loading pricing plan rates', { defaultValue: 'Loading pricing plan rates' })} />
  }

  if (filteredRatesQuery.isError || !filteredRatesQuery.data) {
    return <ErrorState message={getApiErrorMessage(filteredRatesQuery.error)} onRetry={() => void filteredRatesQuery.refetch()} />
  }

  const rates = filteredRatesQuery.data.data

  return (
    <section className="page-section">
      <PageHeader
        title={t('Pricing Plan Rates')}
        description={t('Area and governorate pricing rules for merchant plans.', {
          defaultValue: 'Area and governorate pricing rules for merchant plans.',
        })}
        actions={
          <Can permission={PERMISSIONS.PRICING_PLAN_RATES_CREATE}>
            <Link className="ui-link-reset" to="/admin/pricing-plan-rates/create">
              <Button>{t('Create Rate', { defaultValue: 'Create Rate' })}</Button>
            </Link>
          </Can>
        }
      />
      <Card variant="flat" className="dashboard-filter-card">
        <CardContent className="dashboard-filters">
          <label className="field">
            <span>{t('Pricing Plan')}</span>
            <SearchableSelect
              value={filters.pricing_plan_id}
              placeholder={t('All pricing plans', { defaultValue: 'All pricing plans' })}
              searchPlaceholder={t('Search pricing plans...', { defaultValue: 'Search pricing plans...' })}
              onChange={(pricing_plan_id) => setFilters((current) => ({ ...current, pricing_plan_id }))}
              options={[
                { label: t('All pricing plans', { defaultValue: 'All pricing plans' }), value: '' },
                ...((plansQuery.data?.data ?? []).map((plan) => ({
                  label: plan.name,
                  value: String(plan.id),
                  keywords: [plan.code ?? ''],
                }))),
              ]}
            />
          </label>
          <GovernorateAreaSelector
            governorateId={filters.governorate_id}
            areaId={filters.area_id}
            includeAllOption
            governorateLabel={t('Governorate')}
            areaLabel={t('Area')}
            onChange={({ governorate_id, area_id }) =>
              setFilters((current) => ({
                ...current,
                governorate_id,
                area_id,
              }))
            }
          />
        </CardContent>
        <CardContent>
          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFilters({ pricing_plan_id: '', governorate_id: '', area_id: '' })}
            >
              {t('Reset filters')}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="table-card">
        <CardHeader className="table-card__header">
          <CardTitle>{t('Pricing Plan Rates')}</CardTitle>
          <CardDescription>{t('Governorate defaults and area overrides for each pricing plan.', {
            defaultValue: 'Governorate defaults and area overrides for each pricing plan.',
          })}</CardDescription>
        </CardHeader>
        <CardContent>
          {!rates.length ? (
            <EmptyState
              title={t('No plan rates found', { defaultValue: 'No plan rates found' })}
              description={t('No pricing plan rates matched the selected filters.', {
                defaultValue: 'No pricing plan rates matched the selected filters.',
              })}
            />
          ) : null}
          {deleteMutation.error ? <div className="form-error">{getApiErrorMessage(deleteMutation.error)}</div> : null}
          {rates.length ? (
            <TableContainer>
              <Table>
                <thead>
                  <tr>
                    <TableHead>{t('Plan', { defaultValue: 'Plan' })}</TableHead>
                    <TableHead>{t('Location', { defaultValue: 'Location' })}</TableHead>
                    <TableHead>{t('Delivery', { defaultValue: 'Delivery' })}</TableHead>
                    <TableHead>{t('Swap', { defaultValue: 'Swap' })}</TableHead>
                    <TableHead>{t('Return', { defaultValue: 'Return' })}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {rates.map((rate) => (
                    <tr key={rate.id}>
                      <TableCell><Link className="table-link" to={`/admin/pricing-plan-rates/${rate.id}`}>{rate.pricing_plan_name}</Link></TableCell>
                      <TableCell>{rate.area_name ? `${rate.governorate_name} / ${rate.area_name}` : `${rate.governorate_name} / ${t('default', { defaultValue: 'default' })}`}</TableCell>
                      <TableCell>{formatMoney(rate.delivery_fee)}</TableCell>
                      <TableCell>{formatMoney(rate.swap_fee)}</TableCell>
                      <TableCell>{formatMoney(rate.return_fee)}</TableCell>
                      <TableCell>
                        <div className="page-header__button-row">
                          <Can permission={PERMISSIONS.PRICING_PLAN_RATES_UPDATE}>
                            <Link className="ui-link-reset" to={`/admin/pricing-plan-rates/${rate.id}/edit`}>
                              <Button size="sm" variant="secondary">{t('Edit')}</Button>
                            </Link>
                          </Can>
                          <Can permission={PERMISSIONS.PRICING_PLAN_RATES_DELETE}>
                            <Button
                              size="sm"
                              type="button"
                              variant="danger"
                              onClick={() => {
                                if (window.confirm(t('Delete this pricing plan rate?', {
                                  defaultValue: 'Delete this pricing plan rate?',
                                }))) {
                                  deleteMutation.mutate(rate.id)
                                }
                              }}
                            >
                              {t('Delete')}
                            </Button>
                          </Can>
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}
