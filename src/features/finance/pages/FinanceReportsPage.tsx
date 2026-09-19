import { useMemo, useState, type ReactNode } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import {
  getFinanceCompanyProfitSummary,
  getFinanceDailyCashReport,
  getFinanceDriverDiscrepanciesReport,
  getFinanceMerchantLedgerReport,
  getFinanceProfitLossReport,
  getFinanceReconciliationSummary,
  getFinanceWarehouseRevenueReport,
} from '../api/finance.api'
import type {
  FinanceDailyCashReport,
  FinanceDriverDiscrepanciesReport,
  FinanceMerchantLedgerReport,
  FinanceProfitLossReport,
  FinanceReportFilters,
  FinanceWarehouseRevenueReport,
} from '../types/finance.types'
import { getApiErrorMessage } from '../../../shared/api/api-error'
import { Can } from '../../../shared/auth/Can'
import { hasPermission } from '../../../shared/auth/permissions'
import { PERMISSIONS } from '../../../shared/auth/permission-keys'
import { MoneyDisplay } from '../../../shared/components/display/MoneyDisplay'
import {
  FilterButton,
  FilterPopover,
  FilterField,
  AppliedFilterChips,
  DateRangeFilter,
  type AppliedChip,
} from '../../../shared/components/filters'
import { DriverSelector } from '../../../shared/components/selectors/DriverSelector'
import { MerchantSelector } from '../../../shared/components/selectors/MerchantSelector'
import { TreasuryAccountSelector } from '../../../shared/components/selectors/TreasuryAccountSelector'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { ErrorState } from '../../../shared/components/states/ErrorState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { PageHeader } from '../../../shared/components/ui/PageHeader'
import { Select } from '../../../shared/components/ui/Select'
import { Skeleton } from '../../../shared/components/ui/Skeleton'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import { Table, TableCell, TableContainer, TableHead } from '../../../shared/components/ui/Table'
import { pickDisplayLabel } from '../../../shared/i18n/locale'
import { formatDate, formatMoney } from '../../../shared/utils/formatters'
import { useAuthStore } from '../../auth/store/auth.store'
import type { FinanceCompanyProfitSummary, FinanceReconciliationSummary } from '../../dashboard/types/dashboard.types'
import { inferStatAccent, type StatAccent } from '../../../shared/utils/statAccent'

type FinanceReportsFiltersState = {
  date_from: string
  date_to: string
  merchant_id: string
  driver_id: string
  treasury_account_id: string
}

type DatePreset = 'today' | 'this_week' | 'this_month' | 'last_month' | 'custom'

function toInputDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getPresetRange(preset: Exclude<DatePreset, 'custom'>) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(start)

  if (preset === 'this_week') {
    const day = start.getDay() || 7
    start.setDate(start.getDate() - day + 1)
  } else if (preset === 'this_month') {
    start.setDate(1)
  } else if (preset === 'last_month') {
    start.setMonth(start.getMonth() - 1, 1)
    end.setDate(0)
  }

  return { date_from: toInputDate(start), date_to: toInputDate(end) }
}

function getPreviousRange(dateFrom?: string, dateTo?: string) {
  if (!dateFrom || !dateTo) {
    return undefined
  }

  const start = new Date(`${dateFrom}T00:00:00`)
  const end = new Date(`${dateTo}T00:00:00`)
  const duration = end.getTime() - start.getTime()
  const previousEnd = new Date(start)
  previousEnd.setDate(previousEnd.getDate() - 1)
  const previousStart = new Date(previousEnd.getTime() - duration)

  return { date_from: toInputDate(previousStart), date_to: toInputDate(previousEnd) }
}

const thisMonthRange = getPresetRange('this_month')

const initialFilters: FinanceReportsFiltersState = {
  ...thisMonthRange,
  merchant_id: '',
  driver_id: '',
  treasury_account_id: '',
}

export function FinanceReportsPage() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const [appliedFilters, setAppliedFilters] = useState<FinanceReportsFiltersState>(initialFilters)
  const [draftFilters, setDraftFilters] = useState<FinanceReportsFiltersState>(initialFilters)
  const [appliedDatePreset, setAppliedDatePreset] = useState<DatePreset>('this_month')
  const [draftDatePreset, setDraftDatePreset] = useState<DatePreset>('this_month')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterError, setFilterError] = useState('')

  const params: FinanceReportFilters = useMemo(
    () => ({
      ...(appliedFilters.date_from ? { date_from: appliedFilters.date_from } : {}),
      ...(appliedFilters.date_to ? { date_to: appliedFilters.date_to } : {}),
      ...(appliedFilters.merchant_id ? { merchant_id: appliedFilters.merchant_id } : {}),
      ...(appliedFilters.driver_id ? { driver_id: appliedFilters.driver_id } : {}),
      ...(appliedFilters.treasury_account_id ? { treasury_account_id: appliedFilters.treasury_account_id } : {}),
    }),
    [appliedFilters],
  )
  const previousRange = useMemo(
    () => getPreviousRange(params.date_from, params.date_to),
    [params.date_from, params.date_to],
  )
  const previousParams = useMemo<FinanceReportFilters | undefined>(() => previousRange ? {
    ...params,
    ...previousRange,
  } : undefined, [params, previousRange])

  const [
    reconciliationQuery,
    companyProfitQuery,
    dailyCashQuery,
    merchantLedgerQuery,
    driverDiscrepanciesQuery,
    warehouseRevenueQuery,
    profitLossQuery,
    ,
    ,
    ,
  ] = useQueries({
    queries: [
      {
        queryKey: ['finance-reconciliation-summary', params],
        queryFn: () => getFinanceReconciliationSummary(params),
        enabled: hasPermission(user, PERMISSIONS.FINANCE_RECONCILIATION_VIEW),
      },
      {
        queryKey: ['finance-company-profit-summary', params],
        queryFn: () => getFinanceCompanyProfitSummary(params),
        enabled: hasPermission(user, PERMISSIONS.FINANCE_REPORTS_VIEW),
      },
      {
        queryKey: ['finance-reports', 'daily-cash', params],
        queryFn: () => getFinanceDailyCashReport(params),
        enabled: hasPermission(user, PERMISSIONS.FINANCE_REPORTS_DAILY_CASH),
      },
      {
        queryKey: ['finance-reports', 'merchant-ledger', params],
        queryFn: () => getFinanceMerchantLedgerReport(params),
        enabled: hasPermission(user, PERMISSIONS.FINANCE_REPORTS_MERCHANT_LEDGER),
      },
      {
        queryKey: ['finance-reports', 'driver-discrepancies', params],
        queryFn: () => getFinanceDriverDiscrepanciesReport(params),
        enabled: hasPermission(user, PERMISSIONS.FINANCE_REPORTS_DRIVER_DISCREPANCIES),
      },
      {
        queryKey: ['finance-reports', 'warehouse-revenue', params],
        queryFn: () => getFinanceWarehouseRevenueReport(params),
        enabled: hasPermission(user, PERMISSIONS.FINANCE_REPORTS_WAREHOUSE_REVENUE),
      },
      {
        queryKey: ['finance-reports', 'profit-loss', params],
        queryFn: () => getFinanceProfitLossReport(params),
        enabled: hasPermission(user, PERMISSIONS.FINANCE_REPORTS_PROFIT_LOSS),
      },
      {
        queryKey: ['finance-reconciliation-summary', 'previous-period', previousParams],
        queryFn: () => getFinanceReconciliationSummary(previousParams),
        enabled: Boolean(previousParams) && hasPermission(user, PERMISSIONS.FINANCE_RECONCILIATION_VIEW),
      },
      {
        queryKey: ['finance-reports', 'profit-loss', 'previous-period', previousParams],
        queryFn: () => getFinanceProfitLossReport(previousParams),
        enabled: Boolean(previousParams) && hasPermission(user, PERMISSIONS.FINANCE_REPORTS_PROFIT_LOSS),
      },
      {
        queryKey: ['finance-company-profit-summary', 'previous-period', previousParams],
        queryFn: () => getFinanceCompanyProfitSummary(previousParams),
        enabled: Boolean(previousParams) && hasPermission(user, PERMISSIONS.FINANCE_REPORTS_VIEW),
      },
    ],
  })

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (appliedDatePreset !== 'this_month') count += 1
    if (appliedFilters.merchant_id) count += 1
    if (appliedFilters.driver_id) count += 1
    if (appliedFilters.treasury_account_id) count += 1
    return count
  }, [appliedDatePreset, appliedFilters])

  const handleOpenChange = (open: boolean) => {
    setFiltersOpen(open)
    if (open) {
      setDraftFilters(appliedFilters)
      setDraftDatePreset(appliedDatePreset)
      setFilterError('')
    }
  }

  const updateDraftDatePreset = (preset: DatePreset) => {
    setDraftDatePreset(preset)
    if (preset !== 'custom') {
      const range = getPresetRange(preset)
      setDraftFilters((current) => ({ ...current, ...range }))
    }
  }

  const handleApply = () => {
    if (draftFilters.date_from && draftFilters.date_to && draftFilters.date_from > draftFilters.date_to) {
      setFilterError(t('Date From must not be later than Date To.', { defaultValue: 'Date From must not be later than Date To.' }))
      return
    }
    setFilterError('')
    setAppliedFilters(draftFilters)
    setAppliedDatePreset(draftDatePreset)
    setFiltersOpen(false)
  }

  const handleReset = () => {
    setDraftFilters(initialFilters)
    setAppliedFilters(initialFilters)
    setDraftDatePreset('this_month')
    setAppliedDatePreset('this_month')
    setFilterError('')
    setFiltersOpen(false)
  }

  const appliedChips = useMemo<AppliedChip[]>(() => {
    const chips: AppliedChip[] = []
    if (appliedDatePreset !== 'this_month') {
      chips.push({
        id: 'date_preset',
        label: t('Date Range', { defaultValue: 'Date Range' }),
        value: appliedDatePreset === 'custom'
          ? `${appliedFilters.date_from || ''} → ${appliedFilters.date_to || ''}`
          : appliedDatePreset,
      })
    }
    if (appliedFilters.merchant_id) {
      chips.push({
        id: 'merchant_id',
        label: t('Merchant'),
        value: appliedFilters.merchant_id,
      })
    }
    if (appliedFilters.driver_id) {
      chips.push({
        id: 'driver_id',
        label: t('Driver', { defaultValue: 'Driver' }),
        value: appliedFilters.driver_id,
      })
    }
    if (appliedFilters.treasury_account_id) {
      chips.push({
        id: 'treasury_account_id',
        label: t('Treasury Account', { defaultValue: 'Treasury Account' }),
        value: appliedFilters.treasury_account_id,
      })
    }
    return chips
  }, [appliedDatePreset, appliedFilters, t])

  const handleRemoveChip = (chipId: string) => {
    if (chipId === 'date_preset') {
      const range = getPresetRange('this_month')
      setAppliedDatePreset('this_month')
      setAppliedFilters((c) => ({ ...c, ...range }))
    } else {
      setAppliedFilters((c) => ({ ...c, [chipId]: '' }))
    }
  }

  const handleClearAllChips = () => {
    handleReset()
  }

  const currentReconciliation = reconciliationQuery.data?.data
  const currentProfitLoss = profitLossQuery.data?.data

  return (
    <section className="page-section report-surface" dir="auto">
      <div className="finance-page-header animate-fade-up">
        <PageHeader
          eyebrow="Admin Console"
          title={t('Finance Overview', { defaultValue: 'Finance Overview' })}
          description={t('Financial reports and analytics', { defaultValue: 'Financial reports and analytics' })}
          actions={(
            <FilterPopover
              title={t('Report filters', { defaultValue: 'Report filters' })}
              activeCount={activeFilterCount}
              open={filtersOpen}
              onOpenChange={handleOpenChange}
              onApply={handleApply}
              onReset={handleReset}
              trigger={<FilterButton activeCount={activeFilterCount} />}
            >
              <FilterField label={t('Date Range', { defaultValue: 'Date Range' })}>
                <Select value={draftDatePreset} onChange={(event) => updateDraftDatePreset(event.target.value as DatePreset)}>
                  <option value="today">{t('Today', { defaultValue: 'Today' })}</option>
                  <option value="this_week">{t('This Week', { defaultValue: 'This Week' })}</option>
                  <option value="this_month">{t('This Month', { defaultValue: 'This Month' })}</option>
                  <option value="last_month">{t('Last Month', { defaultValue: 'Last Month' })}</option>
                  <option value="custom">{t('Custom Range', { defaultValue: 'Custom Range' })}</option>
                </Select>
              </FilterField>
              <DateRangeFilter
                dateFrom={draftFilters.date_from}
                dateTo={draftFilters.date_to}
                onChange={({ date_from, date_to }) => {
                  setDraftDatePreset('custom')
                  setDraftFilters((current) => ({ ...current, date_from, date_to }))
                }}
                error={filterError}
              />
              <FilterField label={t('Merchant')}>
                <MerchantSelector
                  value={draftFilters.merchant_id}
                  includeAllOption
                  onChange={(merchant_id) => setDraftFilters((current) => ({ ...current, merchant_id }))}
                />
              </FilterField>
              <FilterField label={t('Driver', { defaultValue: 'Driver' })}>
                <DriverSelector
                  value={draftFilters.driver_id}
                  includeAllOption
                  onChange={(driver_id) => setDraftFilters((current) => ({ ...current, driver_id }))}
                />
              </FilterField>
              <FilterField label={t('Treasury Account', { defaultValue: 'Treasury Account' })}>
                <TreasuryAccountSelector
                  value={draftFilters.treasury_account_id}
                  includeAllOption
                  onChange={(treasury_account_id) => setDraftFilters((current) => ({ ...current, treasury_account_id }))}
                />
              </FilterField>
            </FilterPopover>
          )}
        />
      </div>

      <AppliedFilterChips
        chips={appliedChips}
        onRemove={handleRemoveChip}
        onClearAll={handleClearAllChips}
      />

      <CollapsibleReportSection
        title={t('Revenue & Profit', { defaultValue: 'Revenue & Profit' })}
        description={t('Company profitability, warehouse revenue, and profit and loss for the selected period.', {
          defaultValue: 'Company profitability, warehouse revenue, and profit and loss for the selected period.',
        })}
        summary={`${t('Revenue', { defaultValue: 'Revenue' })}: ${formatMoney(String(currentProfitLoss?.total_revenue ?? 0))} | ${t('Expenses', { defaultValue: 'Expenses' })}: ${formatMoney(String(currentProfitLoss?.paid_expenses ?? 0))}`}
      >
        <Can permission={PERMISSIONS.FINANCE_REPORTS_PROFIT_LOSS}>
          <ReportPanel
            title={t('Revenue', { defaultValue: 'Revenue' })}
            description={t('Total revenue for the selected period.', {
              defaultValue: 'Total revenue for the selected period.',
            })}
            loadingTitle={t('Loading profit and loss report', { defaultValue: 'Loading profit and loss report' })}
            errorTitle={t('Unable to load profit and loss report', { defaultValue: 'Unable to load profit and loss report' })}
            query={profitLossQuery}
            render={(report) => <ProfitLossReportView report={report} />}
          />
        </Can>
        <Can permission={PERMISSIONS.FINANCE_REPORTS_VIEW}>
          <ReportPanel
            title={t('Company Profit', { defaultValue: 'Company Profit' })}
            description={t('Shipping revenue, warehouse charges, paid expenses, and net company profit.', {
              defaultValue: 'Shipping revenue, warehouse charges, paid expenses, and net company profit.',
            })}
            loadingTitle={t('Loading company profit summary', { defaultValue: 'Loading company profit summary' })}
            errorTitle={t('Unable to load company profit summary', { defaultValue: 'Unable to load company profit summary' })}
            query={companyProfitQuery}
            render={(report) => <CompanyProfitReportView report={report} />}
          />
        </Can>
        <Can permission={PERMISSIONS.FINANCE_REPORTS_WAREHOUSE_REVENUE}>
          <ReportPanel
            title={t('Warehouse Revenue', { defaultValue: 'Warehouse Revenue' })}
            description={t('Storage, packaging, and fulfillment revenue grouped by type and merchant.', {
              defaultValue: 'Storage, packaging, and fulfillment revenue grouped by type and merchant.',
            })}
            loadingTitle={t('Loading warehouse revenue report', { defaultValue: 'Loading warehouse revenue report' })}
            errorTitle={t('Unable to load warehouse revenue report', { defaultValue: 'Unable to load warehouse revenue report' })}
            query={warehouseRevenueQuery}
            render={(report) => <WarehouseRevenueReportView report={report} />}
          />
        </Can>
      </CollapsibleReportSection>

      <CollapsibleReportSection
        title={t('Merchant Ledger', { defaultValue: 'Merchant Ledger' })}
        description={t('Reconciliation, merchant balances, and ledger movements.', {
          defaultValue: 'Reconciliation, merchant balances, and ledger movements.',
        })}
        summary={`${t('Merchant Payable', { defaultValue: 'Merchant Payable' })}: ${formatMoney(String(currentReconciliation?.total_merchant_payable ?? 0))} | ${t('Outstanding', { defaultValue: 'Outstanding' })}: ${formatMoney(String(currentReconciliation?.merchant_balance_remaining ?? 0))}`}
      >
        <Can permission={PERMISSIONS.FINANCE_RECONCILIATION_VIEW}>
          <ReportPanel
            title={t('Reconciliation')}
            description={t('Backend-owned COD, manifest, wallet, payout, and treasury reconciliation values.', {
              defaultValue: 'Backend-owned COD, manifest, wallet, payout, and treasury reconciliation values.',
            })}
            loadingTitle={t('Loading reconciliation summary', { defaultValue: 'Loading reconciliation summary' })}
            errorTitle={t('Unable to load reconciliation summary', { defaultValue: 'Unable to load reconciliation summary' })}
            query={reconciliationQuery}
            render={(report) => <ReconciliationReportView report={report} />}
          />
        </Can>
        <Can permission={PERMISSIONS.FINANCE_REPORTS_MERCHANT_LEDGER}>
          <ReportPanel
            title={t('Merchant Ledger Entries', { defaultValue: 'Merchant Ledger Entries' })}
            description={t('Ledger entries for the selected filters.', {
              defaultValue: 'Ledger entries for the selected filters.',
            })}
            loadingTitle={t('Loading merchant ledger report', { defaultValue: 'Loading merchant ledger report' })}
            errorTitle={t('Unable to load merchant ledger report', { defaultValue: 'Unable to load merchant ledger report' })}
            query={merchantLedgerQuery}
            render={(report) => <MerchantLedgerReportView report={report} />}
          />
        </Can>
      </CollapsibleReportSection>

      <CollapsibleReportSection
        title={t('Cash Operations', { defaultValue: 'Cash Operations' })}
        description={t('Daily treasury movement and driver closure discrepancies.', {
          defaultValue: 'Daily treasury movement and driver closure discrepancies.',
        })}
        summary={`${t('Cash In', { defaultValue: 'Cash In' })}: ${formatMoney(String(dailyCashQuery.data?.data.total_cash_in ?? 0))} | ${t('Cash Out', { defaultValue: 'Cash Out' })}: ${formatMoney(String(dailyCashQuery.data?.data.total_cash_out ?? 0))}`}
        defaultOpen={false}
      >
        <Can permission={PERMISSIONS.FINANCE_REPORTS_DAILY_CASH}>
          <ReportPanel
            title={t('Daily Cash', { defaultValue: 'Daily Cash' })}
            description={t('Treasury cash-in, cash-out, and current balances by treasury account.', {
              defaultValue: 'Treasury cash-in, cash-out, and current balances by treasury account.',
            })}
            loadingTitle={t('Loading daily cash report', { defaultValue: 'Loading daily cash report' })}
            errorTitle={t('Unable to load daily cash report', { defaultValue: 'Unable to load daily cash report' })}
            query={dailyCashQuery}
            render={(report) => <DailyCashReportView report={report} />}
          />
        </Can>
        <Can permission={PERMISSIONS.FINANCE_REPORTS_DRIVER_DISCREPANCIES}>
          <ReportPanel
            title={t('Driver Closures Summary', { defaultValue: 'Driver Closures Summary' })}
            description={t('Closed driver manifests with expected, received, and difference totals.', {
              defaultValue: 'Closed driver manifests with expected, received, and difference totals.',
            })}
            loadingTitle={t('Loading driver discrepancies report', { defaultValue: 'Loading driver discrepancies report' })}
            errorTitle={t('Unable to load driver discrepancies report', { defaultValue: 'Unable to load driver discrepancies report' })}
            query={driverDiscrepanciesQuery}
            render={(report) => <DriverDiscrepanciesReportView report={report} />}
          />
        </Can>
      </CollapsibleReportSection>
    </section>
  )
}

type ReportQuery<T> = {
  data?: { data: T }
  error: unknown
  isError: boolean
  isLoading: boolean
  refetch: () => unknown
}

function ReportPanel<T>({
  description,
  errorTitle,
  loadingTitle,
  query,
  render,
  title,
}: {
  description: string
  errorTitle: string
  loadingTitle: string
  query: ReportQuery<T>
  render: (report: T) => ReactNode
  title: string
}) {
  return (
    <Card className="finance-report-panel">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {query.isLoading ? <ReportPanelSkeleton label={loadingTitle} /> : null}
        {query.isError ? (
          <ErrorState
            title={errorTitle}
            message={getApiErrorMessage(query.error)}
            onRetry={() => void query.refetch()}
          />
        ) : null}
        {query.data ? render(query.data.data) : null}
      </CardContent>
    </Card>
  )
}

function ReportPanelSkeleton({ label }: { label: string }) {
  return (
    <div className="finance-report-skeleton" aria-label={label} aria-busy="true">
      <Skeleton className="finance-report-skeleton__stat" />
      <Skeleton className="finance-report-skeleton__line" />
      <Skeleton className="finance-report-skeleton__line finance-report-skeleton__line--short" />
    </div>
  )
}

function CollapsibleReportSection({
  children,
  defaultOpen = true,
  description,
  summary,
  title,
}: {
  children: ReactNode
  defaultOpen?: boolean
  description: string
  summary: string
  title: string
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className={`finance-report-section report-section${isOpen ? ' is-open' : ''}`}>
      <button
        type="button"
        className="finance-report-section__toggle report-section__header"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>
          <strong className="report-section__title">{title}</strong>
          <small>{isOpen ? description : summary}</small>
        </span>
        <ChevronDown
          className={`report-section__chevron${isOpen ? ' report-section__chevron--open' : ''}`}
          size={20}
          aria-hidden="true"
        />
      </button>
      <div className="finance-report-section__content">
        <div className="finance-report-section__content-inner report-section__content page-stack">{children}</div>
      </div>
    </section>
  )
}

function ReconciliationReportView({ report }: { report: FinanceReconciliationSummary }) {
  const { t } = useTranslation()
  return (
    <div className="stats-grid">
      <StatTile accent="warning" label={t('Merchant Payable', { defaultValue: 'Merchant Payable' })} value={<MoneyDisplay value={report.total_merchant_payable} />} />
      <StatTile accent="finance" label={t('Merchant Paid Out', { defaultValue: 'Merchant Paid Out' })} value={<MoneyDisplay value={report.total_merchant_paid_out} />} />
      <StatTile accent="warning" label={t('Balance Remaining', { defaultValue: 'Balance Remaining' })} value={<MoneyDisplay value={report.merchant_balance_remaining} />} />
      <StatTile accent="finance" label={t('Wallet Available Total', { defaultValue: 'Wallet Available Total' })} value={<MoneyDisplay value={report.wallet_available_total} />} />
    </div>
  )
}

function CompanyProfitReportView({ report }: { report: FinanceCompanyProfitSummary }) {
  const { t } = useTranslation()
  return (
    <div className="stats-grid">
      <StatTile accent="warning" label={t('Total Expenses', { defaultValue: 'Total Expenses' })} value={<MoneyDisplay value={report.total_expenses} />} />
      <StatTile accent="success" label={t('Net Company Profit', { defaultValue: 'Net Company Profit' })} value={<MoneyDisplay value={report.net_company_profit} />} />
      <StatTile accent="finance" label={t('COD Collected', { defaultValue: 'COD Collected' })} value={<MoneyDisplay value={report.total_cod_collected} />} />
    </div>
  )
}

function DailyCashReportView({ report }: { report: FinanceDailyCashReport }) {
  const { t } = useTranslation()
  return (
    <div className="page-stack">
      <div className="stats-grid">
        <StatTile accent="success" label={t('Total Cash In', { defaultValue: 'Total Cash In' })} value={<MoneyDisplay value={report.total_cash_in} />} />
        <StatTile accent="warning" label={t('Total Cash Out', { defaultValue: 'Total Cash Out' })} value={<MoneyDisplay value={report.total_cash_out} />} />
        <StatTile accent="finance" label={t('Net Cash', { defaultValue: 'Net Cash' })} value={<MoneyDisplay value={report.net_cash} />} />
      </div>

      {report.treasury_accounts.length ? (
        <TableContainer>
          <Table variant="compact">
            <thead>
              <tr>
                <TableHead>{t('Account', { defaultValue: 'Account' })}</TableHead>
                <TableHead>{t('Code', { defaultValue: 'Code' })}</TableHead>
                <TableHead>{t('Type', { defaultValue: 'Type' })}</TableHead>
                <TableHead>{t('Current Balance', { defaultValue: 'Current Balance' })}</TableHead>
              </tr>
            </thead>
            <tbody>
              {report.treasury_accounts.map((account) => (
                <tr key={account.id}>
                  <TableCell>{account.name}</TableCell>
                  <TableCell>{account.code}</TableCell>
                  <TableCell>
                    <StatusBadge value={account.type}>
                      {pickDisplayLabel(account.type, account.type_label)}
                    </StatusBadge>
                  </TableCell>
                  <TableCell><MoneyDisplay value={account.current_balance} /></TableCell>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      ) : (
        <EmptyState
          title={t('No treasury accounts returned', { defaultValue: 'No treasury accounts returned' })}
          description={t('The report did not include treasury account balances for the selected filters.', {
            defaultValue: 'The report did not include treasury account balances for the selected filters.',
          })}
        />
      )}
    </div>
  )
}

function MerchantLedgerReportView({ report }: { report: FinanceMerchantLedgerReport }) {
  const { t } = useTranslation()
  return (
    <div className="page-stack">
      {report.items.length ? (
        <TableContainer>
          <Table variant="compact">
            <thead>
              <tr>
                <TableHead>{t('Merchant')}</TableHead>
                <TableHead>{t('Transaction #', { defaultValue: 'Transaction #' })}</TableHead>
                <TableHead>{t('Type', { defaultValue: 'Type' })}</TableHead>
                <TableHead>{t('Direction', { defaultValue: 'Direction' })}</TableHead>
                <TableHead>{t('Amount', { defaultValue: 'Amount' })}</TableHead>
                <TableHead>{t('Balance After', { defaultValue: 'Balance After' })}</TableHead>
                <TableHead>{t('Status')}</TableHead>
                <TableHead>{t('Source', { defaultValue: 'Source' })}</TableHead>
                <TableHead>{t('Reference', { defaultValue: 'Reference' })}</TableHead>
                <TableHead>{t('Created', { defaultValue: 'Created' })}</TableHead>
              </tr>
            </thead>
            <tbody>
              {report.items.map((item) => (
                <tr key={item.id}>
                  <TableCell>{item.merchant_name}</TableCell>
                  <TableCell>{item.transaction_number}</TableCell>
                  <TableCell>
                    <StatusBadge value={item.transaction_type}>
                      {pickDisplayLabel(item.transaction_type, item.transaction_type_label)}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={item.direction}>
                      {pickDisplayLabel(item.direction, item.direction_label)}
                    </StatusBadge>
                  </TableCell>
                  <TableCell><MoneyDisplay value={item.amount} /></TableCell>
                  <TableCell><MoneyDisplay value={item.balance_after} /></TableCell>
                  <TableCell>
                    <StatusBadge value={item.status}>
                      {pickDisplayLabel(item.status, item.status_label)}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={item.source_type}>
                      {pickDisplayLabel(item.source_type ?? '-', item.source_type_label)}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>{item.reference_number ?? '-'}</TableCell>
                  <TableCell>{formatDate(item.created_at)}</TableCell>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      ) : (
        <EmptyState
          title={t('No merchant ledger entries', { defaultValue: 'No merchant ledger entries' })}
          description={t('The backend returned no merchant ledger entries for the selected filters.', {
            defaultValue: 'The backend returned no merchant ledger entries for the selected filters.',
          })}
        />
      )}
    </div>
  )
}

function DriverDiscrepanciesReportView({ report }: { report: FinanceDriverDiscrepanciesReport }) {
  const { t } = useTranslation()
  return (
    <div className="page-stack">
      <div className="stats-grid">
        <StatTile accent="drivers" label={t('Driver Closures Count', { defaultValue: 'Driver Closures Count' })} value={report.summary.closed_manifests} />
      </div>

      {report.items.length ? (
        <TableContainer>
          <Table variant="compact">
            <thead>
              <tr>
                <TableHead>{t('Manifest', { defaultValue: 'Manifest' })}</TableHead>
                <TableHead>{t('Date', { defaultValue: 'Date' })}</TableHead>
                <TableHead>{t('Driver', { defaultValue: 'Driver' })}</TableHead>
                <TableHead>{t('Total Shipments', { defaultValue: 'Total Shipments' })}</TableHead>
                <TableHead>{t('Expected COD', { defaultValue: 'Expected COD' })}</TableHead>
                <TableHead>{t('Actual Received', { defaultValue: 'Actual Received' })}</TableHead>
                <TableHead>{t('Difference', { defaultValue: 'Difference' })}</TableHead>
              </tr>
            </thead>
            <tbody>
              {report.items.map((item) => (
                <tr key={item.manifest_id}>
                  <TableCell>{item.manifest_number}</TableCell>
                  <TableCell>{formatDate(item.manifest_date)}</TableCell>
                  <TableCell>{item.driver_name}</TableCell>
                  <TableCell>{item.total_shipments}</TableCell>
                  <TableCell><MoneyDisplay value={item.expected_cod_amount} /></TableCell>
                  <TableCell><MoneyDisplay value={item.actual_received_amount} /></TableCell>
                  <TableCell><MoneyDisplay value={item.difference_amount} /></TableCell>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      ) : (
        <EmptyState
          title={t('No driver discrepancies', { defaultValue: 'No driver discrepancies' })}
          description={t('No closed manifest discrepancies matched the selected filters.', {
            defaultValue: 'No closed manifest discrepancies matched the selected filters.',
          })}
        />
      )}
    </div>
  )
}

function WarehouseRevenueReportView({ report }: { report: FinanceWarehouseRevenueReport }) {
  const { t } = useTranslation()
  return (
    <div className="page-stack">
      <div className="details-grid">
        <Card className="detail-card">
          <CardHeader>
            <CardTitle>{t('Revenue By Type', { defaultValue: 'Revenue By Type' })}</CardTitle>
          </CardHeader>
          <CardContent>
            {report.by_type.length ? (
              <TableContainer>
                <Table variant="compact">
                  <thead>
                    <tr>
                      <TableHead>{t('Transaction Type', { defaultValue: 'Transaction Type' })}</TableHead>
                      <TableHead>{t('Amount', { defaultValue: 'Amount' })}</TableHead>
                    </tr>
                  </thead>
                  <tbody>
                    {report.by_type.map((item) => (
                      <tr key={item.transaction_type}>
                        <TableCell>
                          <StatusBadge value={item.transaction_type}>
                            {pickDisplayLabel(item.transaction_type, item.transaction_type_label)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell><MoneyDisplay value={item.amount} /></TableCell>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableContainer>
            ) : (
              <EmptyState
                title={t('No revenue by type', { defaultValue: 'No revenue by type' })}
                description={t('The report did not include warehouse revenue grouped by transaction type.', {
                  defaultValue: 'The report did not include warehouse revenue grouped by transaction type.',
                })}
              />
            )}
          </CardContent>
        </Card>

        <Card className="detail-card">
          <CardHeader>
            <CardTitle>{t('Revenue By Merchant', { defaultValue: 'Revenue By Merchant' })}</CardTitle>
          </CardHeader>
          <CardContent>
            {report.by_merchant.length ? (
              <TableContainer>
                <Table variant="compact">
                  <thead>
                    <tr>
                      <TableHead>{t('Merchant')}</TableHead>
                      <TableHead>{t('Amount', { defaultValue: 'Amount' })}</TableHead>
                    </tr>
                  </thead>
                  <tbody>
                    {report.by_merchant.map((item) => (
                      <tr key={item.merchant_id}>
                        <TableCell>{item.merchant_name}</TableCell>
                        <TableCell><MoneyDisplay value={item.amount} /></TableCell>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableContainer>
            ) : (
              <EmptyState
                title={t('No revenue by merchant', { defaultValue: 'No revenue by merchant' })}
                description={t('The report did not include warehouse revenue grouped by merchant.', {
                  defaultValue: 'The report did not include warehouse revenue grouped by merchant.',
                })}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ProfitLossReportView({ report }: { report: FinanceProfitLossReport }) {
  const { t } = useTranslation()
  return (
    <div className="stats-grid">
      <StatTile accent="success" label={t('Total Revenue', { defaultValue: 'Total Revenue' })} value={<MoneyDisplay value={report.total_revenue} />} />
    </div>
  )
}

function StatTile({ accent, label, value }: { accent?: StatAccent; label: string; value: ReactNode }) {
  // Simple heuristic for gradient variant
  let variant = 'primary'
  const text = label.toLowerCase()
  if (text.includes('revenue') || text.includes('profit') || text.includes('available') || text.includes('collected')) {
    variant = 'success'
  }

  return (
    <Card variant="stat" className={`stat-card animate-fade-up stat-card--gradient-${variant}`} data-accent={accent ?? inferStatAccent(label)}>
      <CardHeader className="stat-card__header">
        <span className="eyebrow" style={{ opacity: 0.9 }}>{label}</span>
      </CardHeader>
      <CardContent className="stat-card__content">
        <CardTitle className="stat-card__value" style={{ marginTop: '0.5rem' }}>{value}</CardTitle>
      </CardContent>
    </Card>
  )
}
