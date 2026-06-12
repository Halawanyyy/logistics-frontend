import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { listPricingPlans } from '../../location-pricing/api/location-pricing.api'
import type { PricingPlan } from '../../location-pricing/types/location-pricing.types'
import { listOrders } from '../../orders/api/orders.api'
import type { Order } from '../../orders/types/order.types'
import { createPickPackFeeRule, generatePickPackFees, listPickPackFeeRules } from '../api/warehouse.api'
import type {
  CreatePickPackFeeRuleRequest,
  GeneratePickPackFeesRequest,
  PickPackFeeRule,
  WarehouseFilters,
  WarehouseLocationStatus,
} from '../types/warehouse.types'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { FieldError } from '../../../shared/components/forms/FieldError'
import { MerchantSelector } from '../../../shared/components/selectors/MerchantSelector'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { LoadingState } from '../../../shared/components/states/LoadingState'
import { Button } from '../../../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Dialog } from '../../../shared/components/ui/Dialog'
import { Input } from '../../../shared/components/ui/Input'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { SearchableSelect } from '../../../shared/components/ui/SearchableSelect'
import { Select } from '../../../shared/components/ui/Select'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { useFormApiErrors } from '../../../shared/hooks/useFormApiErrors'
import { formatDate } from '../../../shared/utils/formatters'
import { useTranslation } from 'react-i18next'

type RuleFiltersState = {
  merchant_id: string
  pricing_plan_id: string
  status: string
}

type PickPackFeeRuleFormValues = {
  name: string
  merchant_id: string
  pricing_plan_id: string
  pick_fee_first_item: number
  pick_fee_additional_item: number
  packing_fee_base: number
  fragile_extra_fee: number
  status: WarehouseLocationStatus
  notes: string
}

type GeneratePickPackFeesFormValues = {
  order_id: number
}

const initialFilters: RuleFiltersState = {
  merchant_id: '',
  pricing_plan_id: '',
  status: '',
}

function CreatePickPackFeeRuleDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
}: {
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: PickPackFeeRuleFormValues) => void
  open: boolean
}) {
  const { t } = useTranslation()
  const pricingPlansQuery = useQuery({
    queryKey: ['pricing-plans', 'pick-pack-rule'],
    queryFn: () => listPricingPlans(),
    enabled: open,
  })
  const {
    control,
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<PickPackFeeRuleFormValues>({
    defaultValues: {
      name: '',
      merchant_id: '',
      pricing_plan_id: '',
      pick_fee_first_item: 0,
      pick_fee_additional_item: 0,
      packing_fee_base: 0,
      fragile_extra_fee: 0,
      status: 'active',
      notes: '',
    },
  })
  const { formError, getFieldError } = useFormApiErrors(error)

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>{t('Create Pick & Pack Fee Rule')}</CardTitle>}>
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>{t('Name')}</span>
          <Input {...register('name', { required: t('Name is required.') })} />
          <FieldError error={errors.name?.message ?? getFieldError('name')} />
        </label>
        <label className="field">
          <span>{t('Merchant')}</span>
          <MerchantSelector
            value={watch('merchant_id')}
            includeAllOption
            onChange={(merchant_id) => setValue('merchant_id', merchant_id)}
          />
        </label>
        <label className="field">
          <span>{t('Pricing Plan')}</span>
          <Controller
            control={control}
            name="pricing_plan_id"
            render={({ field }) => (
              <SearchableSelect
                value={field.value}
                placeholder={t('Optional pricing plan')}
                searchPlaceholder={t('Search pricing plans...')}
                onChange={field.onChange}
                options={[
                  { label: t('Optional pricing plan'), value: '' },
                  ...((pricingPlansQuery.data?.data ?? []).map((plan: PricingPlan) => ({
                    label: plan.name,
                    value: String(plan.id),
                    keywords: [plan.code ?? '', plan.description ?? ''],
                  }))),
                ]}
              />
            )}
          />
        </label>
        <label className="field">
          <span>{t('First Item Fee')}</span>
          <Input type="number" min="0" step="0.01" {...register('pick_fee_first_item', { valueAsNumber: true, min: 0 })} />
          <FieldError error={errors.pick_fee_first_item?.message ?? getFieldError('pick_fee_first_item')} />
        </label>
        <label className="field">
          <span>{t('Additional Item Fee')}</span>
          <Input type="number" min="0" step="0.01" {...register('pick_fee_additional_item', { valueAsNumber: true, min: 0 })} />
          <FieldError error={errors.pick_fee_additional_item?.message ?? getFieldError('pick_fee_additional_item')} />
        </label>
        <label className="field">
          <span>{t('Packing Fee Base')}</span>
          <Input type="number" min="0" step="0.01" {...register('packing_fee_base', { valueAsNumber: true, min: 0 })} />
          <FieldError error={errors.packing_fee_base?.message ?? getFieldError('packing_fee_base')} />
        </label>
        <label className="field">
          <span>{t('Fragile Extra Fee')}</span>
          <Input type="number" min="0" step="0.01" {...register('fragile_extra_fee', { valueAsNumber: true, min: 0 })} />
          <FieldError error={errors.fragile_extra_fee?.message ?? getFieldError('fragile_extra_fee')} />
        </label>
        <label className="field">
          <span>{t('Status')}</span>
          <Select {...register('status')}>
            <option value="active">{t('active')}</option>
            <option value="inactive">{t('inactive')}</option>
          </Select>
        </label>
        <label className="field">
          <span>{t('Notes')}</span>
          <Input {...register('notes')} />
        </label>
        <p className="table-meta">{t('Rule can be merchant-specific, pricing-plan-specific, both, or global depending on backend configuration.')}</p>
        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>{t('Cancel')}</Button>
          <Button type="submit" loading={isSubmitting}>{t('Create Rule')}</Button>
        </div>
      </form>
    </Dialog>
  )
}

function GeneratePickPackFeesDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
}: {
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: GeneratePickPackFeesFormValues) => void
  open: boolean
}) {
  const { t } = useTranslation()
  const ordersQuery = useQuery({
    queryKey: ['orders', 'pick-pack-generate'],
    queryFn: () => listOrders(),
    enabled: open,
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GeneratePickPackFeesFormValues>({
    defaultValues: {
      order_id: 0,
    },
  })
  const { formError, getFieldError } = useFormApiErrors(error)

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>{t('Generate Pick & Pack Fees')}</CardTitle>} variant="small">
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>{t('Order')}</span>
          <Select {...register('order_id', { valueAsNumber: true })}>
            <option value={0}>{t('Select order')}</option>
            {(ordersQuery.data?.data ?? []).map((order: Order) => (
              <option key={order.id} value={order.id}>{order.order_number}</option>
            ))}
          </Select>
          <FieldError error={errors.order_id?.message ?? getFieldError('order_id')} />
        </label>
        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>{t('Cancel')}</Button>
          <Button type="submit" loading={isSubmitting}>{t('Generate Fees')}</Button>
        </div>
      </form>
    </Dialog>
  )
}

export function PickPackFeeRulesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<RuleFiltersState>(initialFilters)
  const [createOpen, setCreateOpen] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)
  const params: WarehouseFilters = useMemo(
    () => ({
      ...(filters.merchant_id ? { merchant_id: filters.merchant_id } : {}),
      ...(filters.pricing_plan_id ? { pricing_plan_id: filters.pricing_plan_id } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    }),
    [filters],
  )
  const pricingPlansQuery = useQuery({
    queryKey: ['pricing-plans', 'pick-pack-filter'],
    queryFn: () => listPricingPlans(),
  })
  const rulesQuery = useQuery({
    queryKey: ['pick-pack-fee-rules', params],
    queryFn: () => listPickPackFeeRules(params),
  })
  const createMutation = useMutation({
    mutationFn: (values: PickPackFeeRuleFormValues) => {
      const payload: CreatePickPackFeeRuleRequest = {
        name: values.name,
        merchant_id: values.merchant_id ? Number(values.merchant_id) : undefined,
        pricing_plan_id: values.pricing_plan_id ? Number(values.pricing_plan_id) : undefined,
        pick_fee_first_item: Number.isFinite(values.pick_fee_first_item) ? values.pick_fee_first_item : 0,
        pick_fee_additional_item: Number.isFinite(values.pick_fee_additional_item) ? values.pick_fee_additional_item : 0,
        packing_fee_base: Number.isFinite(values.packing_fee_base) ? values.packing_fee_base : 0,
        fragile_extra_fee: Number.isFinite(values.fragile_extra_fee) ? values.fragile_extra_fee : 0,
        status: values.status,
        notes: values.notes || undefined,
      }
      return createPickPackFeeRule(payload)
    },
    onSuccess: async () => {
      setCreateOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['pick-pack-fee-rules'] })
    },
  })
  const generateMutation = useMutation({
    mutationFn: (values: GeneratePickPackFeesFormValues) => {
      const payload: GeneratePickPackFeesRequest = {
        order_id: values.order_id,
      }
      return generatePickPackFees(payload)
    },
    onSuccess: async () => {
      setGenerateOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['warehouse-charges'] })
    },
  })
  const rules = rulesQuery.data?.data ?? []

  return (
    <section className="page-section">
      <PageHeader
        title={t('Pick & Pack Fee Rules')}
        description={t('Backend fee rules and one-order pick/pack fee generation.')}
        actions={(
          <div className="page-header__button-row">
            <Can permission={PERMISSIONS.PICK_PACK_FEE_RULES_CREATE}>
              <Button type="button" onClick={() => setCreateOpen(true)}>{t('Create Rule')}</Button>
            </Can>
            <Can permission={PERMISSIONS.PICK_PACK_FEES_GENERATE}>
              <Button type="button" variant="secondary" onClick={() => setGenerateOpen(true)}>{t('Generate Fees')}</Button>
            </Can>
          </div>
        )}
      />

      <Card variant="flat" className="dashboard-filter-card">
        <CardContent className="dashboard-filters">
          <label className="field">
            <span>{t('Merchant')}</span>
            <MerchantSelector
              value={filters.merchant_id}
              includeAllOption
              onChange={(merchant_id) => setFilters((current) => ({ ...current, merchant_id }))}
            />
          </label>
          <label className="field">
            <span>{t('Pricing Plan')}</span>
            <SearchableSelect
              value={filters.pricing_plan_id}
              placeholder={t('All pricing plans')}
              searchPlaceholder={t('Search pricing plans...')}
              onChange={(pricing_plan_id) => setFilters((current) => ({ ...current, pricing_plan_id }))}
              options={[
                { label: t('All pricing plans'), value: '' },
                ...((pricingPlansQuery.data?.data ?? []).map((plan: PricingPlan) => ({
                  label: plan.name,
                  value: String(plan.id),
                  keywords: [plan.code ?? '', plan.description ?? ''],
                }))),
              ]}
            />
          </label>
          <label className="field">
            <span>{t('Status')}</span>
            <Select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="">{t('All statuses')}</option>
              <option value="active">{t('active')}</option>
              <option value="inactive">{t('inactive')}</option>
            </Select>
          </label>
        </CardContent>
      </Card>

      <Card className="table-card">
        <CardHeader>
          <CardTitle>{t('Pick & Pack Fee Rules')}</CardTitle>
          <CardDescription>{t('Rates used by backend pick and pack charge generation.')}</CardDescription>
        </CardHeader>
        <CardContent>
          {rulesQuery.isLoading ? <LoadingState title={t('Loading pick & pack fee rules')} /> : null}
          {rulesQuery.isError ? (
            <ErrorState
              title={t('Unable to load pick & pack fee rules')}
              message={getApiErrorMessage(rulesQuery.error)}
              onRetry={() => void rulesQuery.refetch()}
            />
          ) : null}
          {!rulesQuery.isLoading && !rulesQuery.isError && !rules.length ? (
            <EmptyState title={t('No pick & pack fee rules')} description={t('No rules matched the selected filters.')} />
          ) : null}
          {rules.length ? (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>{t('Name')}</TableHead>
                    <TableHead>{t('Merchant')}</TableHead>
                    <TableHead>{t('Pricing Plan')}</TableHead>
                    <TableHead>{t('First Item Fee')}</TableHead>
                    <TableHead>{t('Additional Item Fee')}</TableHead>
                    <TableHead>{t('Packing Base')}</TableHead>
                    <TableHead>{t('Fragile Extra')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Created')}</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule: PickPackFeeRule) => (
                    <tr key={rule.id}>
                      <TableCell>{rule.name}</TableCell>
                      <TableCell>{rule.merchant_name ?? '-'}</TableCell>
                      <TableCell>{rule.pricing_plan_name ?? '-'}</TableCell>
                      <TableCell>{rule.pick_fee_first_item ?? rule.first_item_fee ?? '-'}</TableCell>
                      <TableCell>{rule.pick_fee_additional_item ?? rule.additional_item_fee ?? '-'}</TableCell>
                      <TableCell>{rule.packing_fee_base ?? '-'}</TableCell>
                      <TableCell>{rule.fragile_extra_fee ?? '-'}</TableCell>
                      <TableCell><StatusBadge value={rule.status} /></TableCell>
                      <TableCell>{formatDate(rule.created_at)}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          ) : null}
        </CardContent>
      </Card>

      <CreatePickPackFeeRuleDialog
        error={createMutation.error}
        isSubmitting={createMutation.isPending}
        onClose={() => setCreateOpen(false)}
        onSubmit={(values) => createMutation.mutate(values)}
        open={createOpen}
      />
      <GeneratePickPackFeesDialog
        error={generateMutation.error}
        isSubmitting={generateMutation.isPending}
        onClose={() => setGenerateOpen(false)}
        onSubmit={(values) => generateMutation.mutate(values)}
        open={generateOpen}
      />
    </section>
  )
}
