import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { listPricingPlans } from '../../location-pricing/api/location-pricing.api'
import type { PricingPlan } from '../../location-pricing/types/location-pricing.types'
import { createStorageFeeRule, generateStorageFees, listStorageFeeRules } from '../api/warehouse.api'
import type {
  CreateStorageFeeRuleRequest,
  GenerateStorageFeesRequest,
  StorageFeeRule,
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

type RuleFiltersState = {
  merchant_id: string
  pricing_plan_id: string
  status: string
}

type StorageFeeRuleFormValues = {
  name: string
  merchant_id: string
  pricing_plan_id: string
  calculation_type: 'per_item_per_month' | 'per_sku_per_month'
  unit_price: number
  free_units: number
  status: WarehouseLocationStatus
  notes: string
}

type GenerateStorageFeesFormValues = {
  merchant_id: string
  period_start: string
  period_end: string
}

const initialFilters: RuleFiltersState = {
  merchant_id: '',
  pricing_plan_id: '',
  status: '',
}

function CreateStorageFeeRuleDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
}: {
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: StorageFeeRuleFormValues) => void
  open: boolean
}) {
  const pricingPlansQuery = useQuery({
    queryKey: ['pricing-plans', 'storage-rule'],
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
  } = useForm<StorageFeeRuleFormValues>({
    defaultValues: {
      name: '',
      merchant_id: '',
      pricing_plan_id: '',
      calculation_type: 'per_item_per_month',
      unit_price: 0,
      free_units: 0,
      status: 'active',
      notes: '',
    },
  })
  const { formError, getFieldError } = useFormApiErrors(error)

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>Create Storage Fee Rule</CardTitle>}>
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>Name</span>
          <Input {...register('name', { required: 'Name is required.' })} />
          <FieldError error={errors.name?.message ?? getFieldError('name')} />
        </label>
        <label className="field">
          <span>Merchant</span>
          <MerchantSelector
            value={watch('merchant_id')}
            includeAllOption
            onChange={(merchant_id) => setValue('merchant_id', merchant_id)}
          />
        </label>
        <label className="field">
          <span>Pricing Plan</span>
          <Controller
            control={control}
            name="pricing_plan_id"
            render={({ field }) => (
              <SearchableSelect
                value={field.value}
                placeholder="Optional pricing plan"
                searchPlaceholder="Search pricing plans..."
                onChange={field.onChange}
                options={[
                  { label: 'Optional pricing plan', value: '' },
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
          <span>Calculation Type</span>
          <Select {...register('calculation_type', { required: 'Calculation type is required.' })}>
            <option value="per_item_per_month">per_item_per_month</option>
            <option value="per_sku_per_month">per_sku_per_month</option>
          </Select>
          <FieldError error={errors.calculation_type?.message ?? getFieldError('calculation_type')} />
        </label>
        <label className="field">
          <span>Unit Price</span>
          <Input type="number" min="0" step="0.01" {...register('unit_price', { valueAsNumber: true, min: 0 })} />
          <FieldError error={errors.unit_price?.message ?? getFieldError('unit_price')} />
        </label>
        <label className="field">
          <span>Free Units</span>
          <Input type="number" min="0" {...register('free_units', { valueAsNumber: true, min: 0 })} />
          <FieldError error={errors.free_units?.message ?? getFieldError('free_units')} />
        </label>
        <label className="field">
          <span>Status</span>
          <Select {...register('status')}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </Select>
        </label>
        <label className="field">
          <span>Notes</span>
          <Input {...register('notes')} />
        </label>
        <p className="table-meta">Rule can be merchant-specific, pricing-plan-specific, both, or global depending on backend configuration.</p>
        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>Create Rule</Button>
        </div>
      </form>
    </Dialog>
  )
}

function GenerateStorageFeesDialog({
  error,
  isSubmitting,
  onClose,
  onSubmit,
  open,
}: {
  error?: unknown
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: GenerateStorageFeesFormValues) => void
  open: boolean
}) {
  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<GenerateStorageFeesFormValues>({
    defaultValues: {
      merchant_id: '',
      period_start: '',
      period_end: '',
    },
  })
  const { formError, getFieldError } = useFormApiErrors(error)

  return (
    <Dialog open={open} onClose={onClose} title={<CardTitle>Generate Storage Fees</CardTitle>} variant="small">
      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>Merchant</span>
          <MerchantSelector
            value={watch('merchant_id')}
            onChange={(merchant_id) => setValue('merchant_id', merchant_id)}
          />
          <FieldError error={errors.merchant_id?.message ?? getFieldError('merchant_id')} />
        </label>
        <label className="field">
          <span>Period Start</span>
          <Input type="date" {...register('period_start', { required: 'Period start is required.' })} />
          <FieldError error={errors.period_start?.message ?? getFieldError('period_start')} />
        </label>
        <label className="field">
          <span>Period End</span>
          <Input type="date" {...register('period_end', { required: 'Period end is required.' })} />
          <FieldError error={errors.period_end?.message ?? getFieldError('period_end')} />
        </label>
        {formError ? <div className="form-error">{formError}</div> : null}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>Generate Fees</Button>
        </div>
      </form>
    </Dialog>
  )
}

export function StorageFeeRulesPage() {
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
    queryKey: ['pricing-plans', 'storage-rules-filter'],
    queryFn: () => listPricingPlans(),
  })
  const rulesQuery = useQuery({
    queryKey: ['storage-fee-rules', params],
    queryFn: () => listStorageFeeRules(params),
  })
  const createMutation = useMutation({
    mutationFn: (values: StorageFeeRuleFormValues) => {
      const payload: CreateStorageFeeRuleRequest = {
        name: values.name,
        merchant_id: values.merchant_id ? Number(values.merchant_id) : undefined,
        pricing_plan_id: values.pricing_plan_id ? Number(values.pricing_plan_id) : undefined,
        calculation_type: values.calculation_type,
        free_units: Number.isFinite(values.free_units) ? values.free_units : 0,
        unit_price: Number.isFinite(values.unit_price) ? values.unit_price : 0,
        status: values.status,
        notes: values.notes || undefined,
      }
      return createStorageFeeRule(payload)
    },
    onSuccess: async () => {
      setCreateOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['storage-fee-rules'] })
    },
  })
  const generateMutation = useMutation({
    mutationFn: (values: GenerateStorageFeesFormValues) => {
      const payload: GenerateStorageFeesRequest = {
        merchant_id: Number(values.merchant_id),
        period_start: values.period_start,
        period_end: values.period_end,
      }
      return generateStorageFees(payload)
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
        title="Storage Fee Rules"
        description="Merchant and pricing-plan storage billing rules plus storage fee generation."
        actions={(
          <div className="page-header__button-row">
            <Can permission={PERMISSIONS.STORAGE_FEE_RULES_CREATE}>
              <Button type="button" onClick={() => setCreateOpen(true)}>Create Rule</Button>
            </Can>
            <Can permission={PERMISSIONS.STORAGE_FEES_GENERATE}>
              <Button type="button" variant="secondary" onClick={() => setGenerateOpen(true)}>Generate Fees</Button>
            </Can>
          </div>
        )}
      />

      <Card variant="flat" className="dashboard-filter-card">
        <CardContent className="dashboard-filters">
          <label className="field">
            <span>Merchant</span>
            <MerchantSelector
              value={filters.merchant_id}
              includeAllOption
              onChange={(merchant_id) => setFilters((current) => ({ ...current, merchant_id }))}
            />
          </label>
          <label className="field">
            <span>Pricing Plan</span>
            <SearchableSelect
              value={filters.pricing_plan_id}
              placeholder="All pricing plans"
              searchPlaceholder="Search pricing plans..."
              onChange={(pricing_plan_id) => setFilters((current) => ({ ...current, pricing_plan_id }))}
              options={[
                { label: 'All pricing plans', value: '' },
                ...((pricingPlansQuery.data?.data ?? []).map((plan: PricingPlan) => ({
                  label: plan.name,
                  value: String(plan.id),
                  keywords: [plan.code ?? '', plan.description ?? ''],
                }))),
              ]}
            />
          </label>
          <label className="field">
            <span>Status</span>
            <Select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="">All statuses</option>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </Select>
          </label>
        </CardContent>
      </Card>

      <Card className="table-card">
        <CardHeader>
          <CardTitle>Storage Fee Rules</CardTitle>
          <CardDescription>Rule values used by backend-side storage fee generation.</CardDescription>
        </CardHeader>
        <CardContent>
          {rulesQuery.isLoading ? <LoadingState title="Loading storage fee rules" /> : null}
          {rulesQuery.isError ? (
            <ErrorState
              title="Unable to load storage fee rules"
              message={getApiErrorMessage(rulesQuery.error)}
              onRetry={() => void rulesQuery.refetch()}
            />
          ) : null}
          {!rulesQuery.isLoading && !rulesQuery.isError && !rules.length ? (
            <EmptyState title="No storage fee rules" description="No storage fee rules matched the selected filters." />
          ) : null}
          {rules.length ? (
            <TableContainer>
              <Table variant="compact">
                <thead>
                  <tr>
                    <TableHead>Name</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Pricing Plan</TableHead>
                    <TableHead>Calculation Type</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Free Units</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule: StorageFeeRule) => (
                    <tr key={rule.id}>
                      <TableCell>{rule.name}</TableCell>
                      <TableCell>{rule.merchant_name ?? '-'}</TableCell>
                      <TableCell>{rule.pricing_plan_name ?? '-'}</TableCell>
                      <TableCell>{rule.calculation_type ?? rule.fee_type ?? '-'}</TableCell>
                      <TableCell>{rule.unit_price ?? rule.rate ?? '-'}</TableCell>
                      <TableCell>{rule.free_units ?? '-'}</TableCell>
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

      <CreateStorageFeeRuleDialog
        error={createMutation.error}
        isSubmitting={createMutation.isPending}
        onClose={() => setCreateOpen(false)}
        onSubmit={(values) => createMutation.mutate(values)}
        open={createOpen}
      />
      <GenerateStorageFeesDialog
        error={generateMutation.error}
        isSubmitting={generateMutation.isPending}
        onClose={() => setGenerateOpen(false)}
        onSubmit={(values) => generateMutation.mutate(values)}
        open={generateOpen}
      />
    </section>
  )
}
